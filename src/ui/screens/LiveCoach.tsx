import { useEffect, useMemo, useRef, useState } from 'react';
import { PATTERN_FOLLOWUPS, SCENARIOS, type Scenario } from '../../content/coach';
import { findSpeakingLesson } from '../../content';
import { autonomy, LEVEL_LABEL, nextLevel, repaired, startLevel, type HelpLevel, type Issue, type RepairRecord } from '../../domain/coach/mediation';
import { applyFix, corrected, spot, type Spot } from '../../domain/coach/spotter';
import { ERROR_CATEGORIES } from '../../domain/production/errors';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { coachTurn, llmAvailable } from '../../infra/llm';
import { isArtifact } from '../../infra/platform';
import { sfxCorrect, sfxWrong } from '../../infra/sfx';
import { TeacherAvatar, type AvatarState } from '../components/TeacherAvatar';
import { BackIcon, BulbIcon, MicIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

type Phase = 'pick' | 'idle' | 'listening' | 'thinking' | 'repair' | 'after' | 'summary';
const MAX_TURNS = 8;
const REACTIONS = ['Got it.', 'Okay.', 'I see.', 'Nice.', 'All right.', 'Thanks.'];

/** Texto com os trechos problemáticos sublinhados. */
function Marked({ text, marks }: { text: string; marks: { start: number; end: number }[] }) {
  const out: React.ReactNode[] = [];
  let pos = 0;
  [...marks].sort((a, b) => a.start - b.start).forEach((m, i) => {
    if (m.start < pos) return;
    out.push(text.slice(pos, m.start));
    out.push(<mark key={i} className="live-miss">{text.slice(m.start, m.end)}</mark>);
    pos = m.end;
  });
  out.push(text.slice(pos));
  return <>{out}</>;
}

/**
 * Treinador ao vivo: transcreve enquanto você fala, marca o erro na hora
 * (regras locais, sem servidor) e conduz o conserto em degraus de ajuda.
 * Com o Claude disponível (artefato), a conversa é livre e ele acha erros
 * além das regras e sugere formas mais naturais.
 */
export function LiveCoach({ go, lessonId, scenarioId }: { go: (r: Route) => void; lessonId?: string; scenarioId?: string }) {
  const store = useStore();
  const lesson = lessonId ? findSpeakingLesson(lessonId) : undefined;
  const lessonScenario = useMemo<Scenario | null>(
    () =>
      lesson
        ? { id: `lesson-${lesson.id}`, title: lesson.title, desc: lesson.pattern.meaning, brief: `guided practice of the pattern "${lesson.pattern.frame}" (${lesson.pattern.meaning})`, questions: [lesson.speakingPrompt, ...PATTERN_FOLLOWUPS] }
        : null,
    [lesson],
  );
  const [scenario, setScenario] = useState<Scenario | null>(lessonScenario ?? SCENARIOS.find((s) => s.id === scenarioId) ?? null);
  const [phase, setPhase] = useState<Phase>(scenario ? 'idle' : 'pick');
  const [question, setQuestion] = useState<{ en: string; pt?: string } | null>(scenario ? scenario.questions[0] : null);
  const [qi, setQi] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [utterance, setUtterance] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [cur, setCur] = useState(0);
  const [level, setLevel] = useState<HelpLevel>(1);
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<{ from: string; to: string; why: string } | null>(null);
  const [typing, setTyping] = useState(!liveAvailable());
  const [typed, setTyped] = useState('');
  const [talking, setTalking] = useState(false);
  const [showPt, setShowPt] = useState(false);
  const session = useRef<LiveSession | null>(null);
  const nextReply = useRef<string | null>(null);
  const history = useRef<{ role: 'coach' | 'student'; text: string }[]>([]);
  const mouth = useRef(0);
  const startedAt = useRef(0);
  const typedAt = useRef(0);
  const stats = useRef({ turns: 0, words: 0, ms: 0, clean: 0, records: [] as RepairRecord[], fixes: [] as { wrong: string; fix: string; cat: string; level: number }[], upgrades: [] as { from: string; to: string }[] });
  const liveMarks = store.state.coach.liveMarks;
  const useAi = llmAvailable();
  const issue = issues[cur];

  const say = async (text: string) => {
    setTalking(true);
    try {
      await speak(text, { variant: 2, onLevel: (l) => (mouth.current = l) });
    } finally {
      setTalking(false);
    }
  };

  const ask = (q: { en: string; pt?: string }) => {
    setQuestion(q);
    setShowPt(false);
    setLiveText('');
    setUtterance('');
    setIssues([]);
    setUpgrade(null);
    setNote(null);
    setPhase('idle');
    history.current.push({ role: 'coach', text: q.en });
    void say(q.en);
  };

  const begin = (s: Scenario) => {
    setScenario(s);
    setQi(0);
    startedAt.current = Date.now();
    ask(s.questions[0]);
  };
  useEffect(() => {
    if (scenario && !startedAt.current) {
      startedAt.current = Date.now();
      history.current.push({ role: 'coach', text: scenario.questions[0].en });
    }
    return () => {
      session.current?.stop();
      stopAudio();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- ouvir ---------- */
  const listen = (onDone: (text: string, ms: number) => void) => {
    stopAudio();
    setLiveText('');
    setNote(null);
    const prev = phase;
    setPhase('listening');
    // chamado direto no clique: o ditado do artefato exige o gesto do usuário
    const s = startLive({ onText: setLiveText, silenceMs: 2600, maxMs: 75000 });
    session.current = s;
    void s.done.then(({ text, ms }) => {
      session.current = null;
      if (!text.trim()) {
        setNote('Não ouvi nada. Toque no microfone e tente de novo, ou responda digitando.');
        setPhase(prev === 'repair' ? 'repair' : 'idle');
        return;
      }
      onDone(text, ms);
    });
  };

  /* ---------- resposta ---------- */
  const onAnswer = async (text: string, ms: number) => {
    setUtterance(text);
    setLiveText('');
    const st = stats.current;
    st.turns++;
    st.words += text.trim().split(/\s+/).length;
    st.ms += ms;
    history.current.push({ role: 'student', text });
    store.logDay({ spokenSec: typing ? 0 : ms / 1000, spoken: typing ? 0 : 1 });
    if (!typing) store.track('spoken');

    const local: Issue[] = spot(text).map((s: Spot) => ({ source: 'rule' as const, ...s }));
    let all = local;
    nextReply.current = null;
    let up: typeof upgrade = null;
    if (useAi) {
      setPhase('thinking');
      const r = await coachTurn({
        scenario: scenario!.brief,
        level: store.state.profile.level === 'zero' ? 'A1-A2' : store.state.profile.level === 'fala' ? 'A2-B1, understands well but struggles to speak' : 'B1-B2',
        history: history.current,
        utterance: text,
        alreadyFound: local.map((l) => l.wrong),
        focus: lesson ? `${lesson.pattern.frame} (${lesson.pattern.meaning})` : undefined,
      });
      if (r) {
        const low = text.toLowerCase();
        const ai: Issue[] = r.errors.map((e) => {
          const at = low.indexOf(e.quote.toLowerCase().replace(/[.,!?]/g, '').trim());
          return { source: 'ai' as const, rule: `ai:${e.cat}`, cat: e.cat, wrong: e.quote, fix: e.fix, clue: e.clue, explain: e.explain, start: at >= 0 ? at : undefined, end: at >= 0 ? at + e.quote.replace(/[.,!?]/g, '').trim().length : undefined };
        });
        all = [...local, ...ai.filter((a) => !local.some((l) => a.start !== undefined && l.start !== undefined && a.start < l.end! && a.end! > l.start))].sort((a, b) => (a.start ?? 1e9) - (b.start ?? 1e9));
        nextReply.current = r.reply;
        up = r.upgrade;
      }
    }
    setUpgrade(up);
    if (up) st.upgrades.push({ from: up.from, to: up.to });
    if (all.length) store.set((s) => ({ ...s, errorLog: [all.map((i) => i.cat), ...s.errorLog].slice(0, 300) }));
    // trabalha no máximo 2 pontos por fala: mais do que isso vira aula, não conversa
    const work = all.slice(0, 2);
    setIssues(all);
    if (work.length) {
      setCur(0);
      setTries(0);
      setLevel(startLevel(store.state.repairs, work[0].rule, liveMarks));
      sfxWrong();
      setPhase('repair');
    } else {
      st.clean++;
      sfxCorrect(Math.min(st.clean, 6));
      setPhase('after');
    }
  };

  /* ---------- conserto em degraus ---------- */
  const record = (i: Issue, lvl: number) => {
    const rec: RepairRecord = { rule: i.rule, cat: i.cat, level: lvl, at: Date.now() };
    stats.current.records.push(rec);
    stats.current.fixes.push({ wrong: i.wrong, fix: i.fix, cat: i.cat, level: lvl });
    store.set((s) => ({
      ...s,
      repairs: [...s.repairs, rec].slice(-400),
      // precisou do modelo: a frase corrigida vai para o caderno
      notebook: lvl >= 4 ? [{ en: snippet(i), pt: `(do treinador) ${ERROR_CATEGORIES[i.cat]?.title ?? ''}`, at: Date.now() }, ...s.notebook.filter((n) => n.en !== i.fix)].slice(0, 80) : s.notebook,
    }));
    store.logDay({ repN: 1, repSelf: lvl <= 3 ? 1 : 0 });
  };
  /** Trecho corrigido com um pouco de contexto (para o caderno). */
  const snippet = (i: Issue) => {
    if (i.start === undefined || i.end === undefined) return i.fix;
    const fixedText = applyFix(utterance, { start: i.start, end: i.end, fix: i.fix });
    const before = fixedText.slice(0, i.start).trim().split(/\s+/).filter(Boolean).slice(-3);
    const after = fixedText.slice(i.start).trim().split(/\s+/).slice(0, i.fix.split(/\s+/).length + 3);
    return [...before, ...after].join(' ');
  };
  const advanceIssue = () => {
    const limit = Math.min(issues.length, 2);
    if (cur + 1 < limit) {
      const n = issues[cur + 1];
      setCur(cur + 1);
      setTries(0);
      setLevel(startLevel(store.state.repairs, n.rule, liveMarks));
      setNote(null);
      setPhase('repair');
    } else setPhase('after');
  };
  const onRepair = (text: string, ms: number) => {
    setLiveText('');
    stats.current.ms += ms;
    if (!typing) store.logDay({ spokenSec: ms / 1000, spoken: 1 });
    if (repaired(issue, text)) {
      sfxCorrect(3);
      record(issue, level);
      setNote(level <= 3 ? `Isso! Você mesmo consertou: “${issue.fix}”.` : `Agora sim: “${issue.fix}”.`);
      setTimeout(advanceIssue, 1500);
      setPhase('repair');
      return;
    }
    sfxWrong();
    setTries((t) => t + 1);
    const nl = nextLevel(level);
    if (nl) {
      setLevel(nl);
      setNote(`Ouvi: “${text}”. Ainda não. Vou te ajudar um pouco mais.`);
      setPhase('repair');
      if (nl === 4) void say(issue.fix);
    } else {
      record(issue, 5);
      setNote(`Tudo bem, seguimos. Guarde: “${issue.fix}”.`);
      setTimeout(advanceIssue, 1800);
      setPhase('repair');
    }
  };
  const moreHelp = () => {
    const nl = nextLevel(level);
    if (!nl) return;
    setLevel(nl);
    setNote(null);
    if (nl === 4) void say(issue.fix);
  };

  /* ---------- próxima pergunta ---------- */
  const next = () => {
    const st = stats.current;
    if (st.turns >= MAX_TURNS || (!useAi && qi + 1 >= scenario!.questions.length)) return finish();
    if (useAi && nextReply.current) return ask({ en: nextReply.current });
    const q = scenario!.questions[(qi + 1) % scenario!.questions.length];
    setQi(qi + 1);
    ask({ en: `${REACTIONS[st.turns % REACTIONS.length]} ${q.en}`, pt: q.pt });
  };
  const finish = () => {
    stopAudio();
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    store.logDay({ mayaSec: secs });
    store.set((s) => ({ ...s, teacherSeconds: s.teacherSeconds + secs, lessons: lesson ? { ...s.lessons, [lesson.id]: { ...s.lessons[lesson.id], teacher: true } } : s.lessons }));
    store.track('teacherMin', Math.floor(secs / 60));
    store.gainXp(Math.min(80, stats.current.turns * 8 + stats.current.records.filter((r) => r.level <= 3).length * 6));
    setPhase('summary');
  };

  const submitTyped = (onDone: (t: string, ms: number) => void) => {
    const t = typed.trim();
    if (!t) return;
    setTyped('');
    setLiveText('');
    onDone(t, typedAt.current ? Date.now() - typedAt.current : 4000);
    typedAt.current = 0;
  };

  /* ================= telas ================= */
  if (phase === 'pick')
    return (
      <main className="shell coach" id="main">
        <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
        <h1 className="page-title">Treinador ao vivo</h1>
        <p className="muted">Você fala, o texto aparece na hora e o erro é sublinhado enquanto você ainda está falando. Depois, em vez de receber a resposta pronta, você conserta a própria frase com a menor ajuda possível.</p>
        <div className="coach-pick">
          {SCENARIOS.map((s) => (
            <button key={s.id} className="tile" onClick={() => begin(s)}>
              <strong className="tile-title">{s.title}</strong>
              <span className="muted">{s.desc}</span>
            </button>
          ))}
        </div>
        <div className="setting">
          <div><strong id="lm">Marcar erros enquanto falo</strong><p>Desligado, você só recebe um aviso no fim da frase e precisa achar o erro sozinho (mais difícil, ensina mais).</p></div>
          <button className="switch" role="switch" aria-checked={liveMarks} aria-labelledby="lm" onClick={() => store.set((s) => ({ ...s, coach: { ...s.coach, liveMarks: !s.coach.liveMarks } }))} />
        </div>
        <p className="fine">
          {useAi ? 'Nesta versão o Claude conduz a conversa e procura erros além das regras.' : 'Nesta versão a correção é feita por regras no seu navegador (55 padrões de erro de brasileiros) e as perguntas seguem um roteiro. A conversa livre com IA funciona na versão artefato.'}
          {!isArtifact && <> Prefere uma ligação de voz contínua? <button className="link-btn" onClick={() => go({ name: 'teacher', mode: 'call' })}>Abrir a Maya (ElevenLabs)</button></>}
        </p>
      </main>
    );

  if (phase === 'summary') {
    const st = stats.current;
    const a = autonomy(st.records);
    const wpm = st.ms > 3000 ? Math.round(st.words / (st.ms / 60000)) : 0;
    return (
      <main className="shell coach" id="main">
        <h1 className="page-title" tabIndex={-1} ref={(el) => el?.focus()}>Sessão concluída</h1>
        <div className="cp-tiles">
          <div className="cp-tile"><span className="tag">Falas</span><b>{st.turns}</b><small className="muted">{st.clean} sem nenhum ajuste</small></div>
          <div className="cp-tile"><span className="tag">Ritmo</span><b>{wpm || '—'}</b><small className="muted">palavras por minuto</small></div>
          <div className="cp-tile"><span className="tag">Autocorreção</span><b>{a.n ? `${a.selfPct}%` : '—'}</b><small className="muted">{a.n ? `consertados sem ver a resposta, de ${a.n} erro(s)` : 'nenhum erro trabalhado'}</small></div>
        </div>
        {st.fixes.length > 0 && (
          <section className="card">
            <h2 className="card-h">O que você consertou</h2>
            <ul className="cp-key">
              {st.fixes.map((f, i) => (
                <li key={i} className={f.level <= 3 ? 'ok' : 'bad'}>
                  <span lang="en"><s className="word-miss">{f.wrong}</s> → <b>{f.fix}</b></span>
                  <small className="muted">{ERROR_CATEGORIES[f.cat]?.title ?? f.cat} · {f.level <= 3 ? `consertou sozinho (ajuda: ${LEVEL_LABEL[f.level as HelpLevel].toLowerCase()})` : f.level === 4 ? 'precisou do modelo' : 'não consertou desta vez'}</small>
                </li>
              ))}
            </ul>
          </section>
        )}
        {st.upgrades.length > 0 && (
          <section className="card">
            <h2 className="card-h">Jeitos mais naturais de dizer</h2>
            <ul className="cp-key">{st.upgrades.map((u, i) => <li key={i} className="ok"><span lang="en">{u.from} → <b>{u.to}</b></span></li>)}</ul>
          </section>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => go(lesson ? { name: 'lesson', id: lesson.id } : { name: 'evolution' })}>{lesson ? 'Voltar à aula' : 'Ver evolução'}</button>
          {st.fixes.length > 0 && <button className="btn btn-ghost" onClick={() => go({ name: 'practice', lessonId: 'erros' })}>Treinar esses pontos</button>}
          <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
        </div>
      </main>
    );
  }

  const avatar: AvatarState = talking ? 'speaking' : phase === 'listening' ? 'listening' : phase === 'thinking' ? 'thinking' : 'idle';
  const liveSpots = liveMarks ? spot(liveText) : [];
  const shownMarks = phase === 'repair' && issue && level >= 2 && issue.start !== undefined ? [{ start: issue.start, end: issue.end! }] : [];
  const handler = phase === 'repair' ? onRepair : (t: string, ms: number) => void onAnswer(t, ms);
  const canTalk = phase === 'idle' || phase === 'repair';

  return (
    <main className="shell coach" id="main">
      <div className="row-between">
        <button className="link-btn back" onClick={() => (stats.current.turns ? finish() : go(lesson ? { name: 'lesson', id: lesson.id } : { name: 'lab' }))}><BackIcon /> {stats.current.turns ? 'Encerrar' : 'Voltar'}</button>
        <small className="muted">{scenario?.title} · fala {Math.min(stats.current.turns + (phase === 'idle' || phase === 'listening' ? 1 : 0), MAX_TURNS)}/{MAX_TURNS}</small>
      </div>

      <section className="coach-q">
        <TeacherAvatar state={avatar} level={() => mouth.current} size={96} />
        <div>
          <p className="coach-question" lang="en">{question?.en} <button className="icon-btn inline" onClick={() => question && void say(question.en)} aria-label="Ouvir de novo"><SpeakerIcon size={16} /></button></p>
          {question?.pt && (showPt ? <p className="muted" style={{ margin: 0 }}>{question.pt}</p> : <button className="link-btn" style={{ minHeight: 28, padding: 0 }} onClick={() => setShowPt(true)}>ver tradução</button>)}
        </div>
      </section>

      {/* ---------- transcrição ao vivo ---------- */}
      <section className={`live-box ${phase === 'listening' ? 'on' : ''}`} aria-live="polite">
        <span className="tag">{phase === 'listening' ? 'Ouvindo — o texto aparece enquanto você fala' : utterance ? 'Você disse' : 'Sua resposta'}</span>
        <p className="live-text" lang="en">
          {phase === 'listening' || (typing && liveText) ? (
            liveText ? <Marked text={liveText} marks={liveSpots} /> : <span className="muted">…</span>
          ) : utterance ? (
            <Marked text={utterance} marks={shownMarks} />
          ) : (
            <span className="muted">Toque no microfone e responda em inglês.</span>
          )}
        </p>
        {phase === 'listening' && liveSpots.length > 0 && <small className="live-hint">{liveSpots.length === 1 ? 'Um trecho para rever.' : `${liveSpots.length} trechos para rever.`} Se perceber, corrija falando de novo.</small>}
      </section>

      {phase === 'thinking' && <p role="status" className="muted"><span className="spinner" aria-hidden /> Analisando sua fala…</p>}

      {/* ---------- conserto em degraus ---------- */}
      {phase === 'repair' && issue && (
        <section className="repair card" aria-live="assertive">
          <ol className="help-steps" aria-label={`Ajuda no degrau ${level} de 4: ${LEVEL_LABEL[level]}`}>
            {([1, 2, 3, 4] as HelpLevel[]).map((l) => <li key={l} className={l <= level ? 'on' : ''}>{LEVEL_LABEL[l]}</li>)}
          </ol>
          {level === 1 && <p><b>Quase.</b> Tem um ajuste nessa frase. Diga a frase de novo, com calma, e veja se você mesmo percebe.</p>}
          {level === 2 && <p><b>O ajuste está no trecho sublinhado{issue.start === undefined ? `: “${issue.wrong}”` : ''}.</b> Como você diria de outro jeito?</p>}
          {level === 3 && <p className="tip"><BulbIcon /> <span><b>Pista:</b> {issue.clue}</span></p>}
          {level === 4 && (
            <div className="better-box">
              <span className="tag">Forma correta — repita em voz alta</span>
              <p lang="en" style={{ margin: '4px 0', fontSize: '1.15rem' }}><s className="word-miss">{issue.wrong}</s> → <b>{issue.fix}</b> <button className="icon-btn inline" onClick={() => void say(issue.fix)} aria-label="Ouvir"><SpeakerIcon size={16} /></button></p>
              {issue.explain && <small>{issue.explain}</small>}
            </div>
          )}
          {note && <p role="status" className="repair-note">{note}</p>}
          <div className="row" style={{ justifyContent: 'center' }}>
            {level < 4 && <button className="btn btn-ghost" onClick={moreHelp}>Preciso de mais ajuda</button>}
            <button className="link-btn" onClick={() => { record(issue, 5); advanceIssue(); }}>Pular este ponto</button>
          </div>
          {tries > 0 && level < 4 && <small className="muted">Tentativa {tries + 1}.</small>}
        </section>
      )}

      {/* ---------- depois da fala ---------- */}
      {phase === 'after' && (
        <section className="card" aria-live="polite">
          {issues.length === 0 ? <p style={{ marginTop: 0 }}><b>Frase limpa.</b> Nenhum dos padrões de erro apareceu.</p> : (
            <>
              <span className="tag">Sua frase, ajustada</span>
              <p lang="en" style={{ margin: '4px 0 8px', fontWeight: 700 }}>{issues.filter((i) => i.source === 'ai').reduce((t, i) => t.replace(new RegExp(i.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), i.fix), corrected(utterance))} <button className="icon-btn inline" onClick={() => void say(corrected(utterance))} aria-label="Ouvir a frase ajustada"><SpeakerIcon size={16} /></button></p>
              {issues.length > 2 && <small className="muted">Também vale notar: {issues.slice(2).map((i) => `“${i.wrong}” → “${i.fix}”`).join('; ')}.</small>}
            </>
          )}
          {upgrade && (
            <p className="tip" style={{ marginTop: 10 }}><BulbIcon /> <span><b>Mais natural:</b> <span lang="en">“{upgrade.from}” → <b>“{upgrade.to}”</b></span>. {upgrade.why}</span></p>
          )}
          <button className="btn btn-primary btn-block" autoFocus onClick={next}>{stats.current.turns >= MAX_TURNS ? 'Ver resumo' : 'Próxima pergunta'}</button>
        </section>
      )}

      {/* ---------- controles de fala ---------- */}
      {(canTalk || phase === 'listening') && (
        <section className="coach-controls">
          {note && phase !== 'repair' && <p role="status" className="muted">{note}</p>}
          {typing ? (
            <form className="row" onSubmit={(e) => { e.preventDefault(); submitTyped(handler); }}>
              <input className="text-input" style={{ flex: 1 }} lang="en" autoComplete="off" autoCapitalize="off" value={typed} aria-label={phase === 'repair' ? 'Diga a frase de novo' : 'Sua resposta em inglês'}
                placeholder={phase === 'repair' ? 'Escreva a frase de novo…' : 'Responda em inglês…'}
                onChange={(e) => { if (!typedAt.current) typedAt.current = Date.now(); setTyped(e.target.value); if (phase !== 'repair') setLiveText(e.target.value); }} />
              <button className="btn btn-primary" disabled={!typed.trim()}>Enviar</button>
            </form>
          ) : (
            <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
              <button className={`mic ${phase === 'listening' ? 'listening' : ''}`} onClick={() => (phase === 'listening' ? session.current?.stop() : listen(handler))} aria-label={phase === 'listening' ? 'Terminei de falar' : phase === 'repair' ? 'Dizer a frase de novo' : 'Responder falando'}>
                {phase === 'listening' ? <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg> : <MicIcon size={44} />}
              </button>
              <span className="muted">{phase === 'listening' ? 'Toque para terminar (ou faça uma pausa)' : phase === 'repair' ? 'Diga a frase de novo' : 'Toque e responda'}</span>
            </div>
          )}
          {liveAvailable() && phase !== 'listening' && <button className="link-btn" onClick={() => setTyping(!typing)}>{typing ? 'Prefiro falar' : 'Não posso falar agora — digitar'}</button>}
        </section>
      )}
    </main>
  );
}
