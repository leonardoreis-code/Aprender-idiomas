import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { STORIES } from '../../content/coach';
import { GLOSSARY } from '../../content/missions';
import { scoreFree } from '../../domain/assessment/checkpoint';
import { spot, type Spot } from '../../domain/coach/spotter';
import { dayKey } from '../../domain/motivation/motivation';
import { PLAN_WEEKS } from '../../domain/plan/sixMonths';
import { checkTyped, normalize } from '../../domain/practice/answer';
import { ERROR_CATEGORIES } from '../../domain/production/errors';
import { analyzeAccent, type WordResult } from '../../domain/pronunciation/accent';
import { nextAction, REVIEW_RULES, weekReview, type ReviewAction, type WeekReview } from '../../domain/review/weekly';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { sfxComplete, sfxCorrect, sfxWrong } from '../../infra/sfx';
import type { AppState } from '../../infra/storage';
import { BackIcon, CheckIcon, MicIcon, SpeakerIcon, TurtleIcon, XIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

type Go = (r: Route) => void;

const NO_MIC = 'Este navegador não tem microfone com reconhecimento de fala. Use Chrome, Edge ou o app do Claude.';
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** select e textarea não herdam fonte nem cor do tema por padrão. */
const FIELD_STYLE = { fontFamily: 'inherit', color: 'inherit' } as const;

/* ------------------------------------------------------------------ */
/* Escuta ao vivo compartilhada pelas telas                             */
/* ------------------------------------------------------------------ */
/**
 * Uma sessão de escuta por vez. `start` precisa ser chamado direto no clique
 * (o ditado exige o gesto). Para a escuta e o áudio quando a tela sai.
 */
function useLive(onDone: (text: string, ms: number) => void) {
  const sess = useRef<LiveSession | null>(null);
  const dropped = useRef<LiveSession | null>(null);
  const alive = useRef(true);
  const cb = useRef(onDone);
  cb.current = onDone;
  const [on, setOn] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sess.current?.stop();
      stopAudio();
    };
  }, []);

  const start = (opts: { silenceMs: number; maxMs: number }) => {
    if (sess.current) return;
    stopAudio();
    setText('');
    setOn(true);
    const s = startLive({
      ...opts,
      onText: (t) => {
        if (alive.current && sess.current === s) setText(t);
      },
    });
    sess.current = s;
    void s.done.then((r) => {
      if (sess.current === s) sess.current = null;
      if (!alive.current || dropped.current === s) return;
      setOn(false);
      cb.current(r.text.trim(), Math.max(r.ms, 500));
    });
  };
  /** Encerra e entrega o que foi ouvido. */
  const stop = () => sess.current?.stop();
  /** Encerra e descarta (troca de frase, de história, resposta digitada). */
  const cancel = () => {
    const s = sess.current;
    if (!s) return;
    dropped.current = s;
    sess.current = null;
    s.stop();
    setOn(false);
    setText('');
  };
  return { on, text, start, stop, cancel };
}

function MicButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className={`mic ${on ? 'listening' : ''}`} onClick={onClick} aria-pressed={on} aria-label={on ? 'Parar de gravar' : label}>
      {on ? <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg> : <MicIcon size={44} />}
    </button>
  );
}

/** Palavras do alvo, certas e erradas, com resumo para leitor de tela. */
function Words({ words }: { words: WordResult[] }) {
  const miss = words.filter((w) => !w.ok);
  return (
    <>
      <p className="live-text" lang="en" aria-hidden>
        {words.map((w, j) => (
          <Fragment key={j}>
            <span className={w.ok ? 'word-ok' : 'word-miss'} title={w.ok ? undefined : w.heard ? `Ouvi: ${w.heard}` : 'Não ouvi esta palavra'}>{w.word}</span>{' '}
          </Fragment>
        ))}
      </p>
      <p className="sr-only">
        {miss.length ? <>Palavras para repetir: <span lang="en">{miss.map((w) => w.word).join(', ')}</span></> : 'Todas as palavras foram reconhecidas.'}
      </p>
    </>
  );
}

function Bar({ label, value, target, unit }: { label: string; value: number; target: number; unit?: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="goal">
      <div className="row-between">
        <span>{label}</span>
        <b>{value}{unit && ` ${unit}`} <span className="muted">/ {target}{unit && ` ${unit}`}</span></b>
      </div>
      <div className="qbar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(value, target)}>
        <span style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--ok)' : 'var(--viz-1)' }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revisão da semana                                                    */
/* ------------------------------------------------------------------ */
const VERDICTS: Record<WeekReview['verdict'], { label: string; desc: string; color: string }> = {
  'sem-plano': { label: 'Plano ainda não iniciado', desc: '', color: 'inherit' },
  adiantado: { label: 'Adiantado', desc: 'Você falou mais do que a meta pedia até este ponto da semana.', color: 'var(--ok)' },
  'no-ritmo': { label: 'No ritmo', desc: 'Seus minutos falando acompanham a meta proporcional aos dias que já passaram.', color: 'var(--ok)' },
  atrasado: { label: 'Atrasado', desc: 'Seus minutos falando estão abaixo de 70% do que a meta pedia até hoje.', color: 'var(--bad)' },
  parado: { label: 'Parado', desc: 'Nenhuma prática registrada nesta semana do plano.', color: 'var(--bad)' },
};

const REVIEW_ACTIONS: { id: ReviewAction; label: string; route: Route }[] = [
  { id: 'erros', label: 'Treinar meus erros', route: { name: 'practice', lessonId: 'erros' } },
  { id: 'simulacao', label: 'Fazer uma simulação', route: { name: 'missions' } },
  { id: 'pratica', label: 'Praticar frases', route: { name: 'practice' } },
  { id: 'checkpoint', label: 'Fazer um checkpoint', route: { name: 'checkpoint' } },
];

export function WeeklyReview({ go }: { go: Go }) {
  const { state } = useStore();
  const r = weekReview(state, dayKey());
  const started = r.verdict !== 'sem-plano';
  const v = VERDICTS[r.verdict];
  const main = nextAction(r);
  // sem plano, o botão do checkpoint já está no cartão de cima
  const actions = REVIEW_ACTIONS.filter((a) => started || a.id !== 'checkpoint').sort((a, b) => Number(b.id === main) - Number(a.id === main));
  const hasData = r.activeDays > 0 || r.auto > 0 || r.topErrors.length > 0;
  const pctTile = (x: number | null) => (x === null ? <span style={{ fontSize: '1.15rem' }}>sem dados</span> : `${x}%`);

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'evolution' })}><BackIcon /> Evolução</button>
      <h1 className="page-title">Revisão da semana</h1>
      <p className="muted">O que o plano pedia para esta semana, o que foi medido na sua prática e o que fazer em seguida.</p>

      <div className="stack">
        <section className="card stack" aria-live="polite">
          <span className="ex-kicker">
            {!started ? 'Plano de 6 meses' : r.week > PLAN_WEEKS ? `Plano concluído · semana ${r.week} · ${r.phaseTitle}` : `Semana ${r.week} de ${PLAN_WEEKS} · ${r.phaseTitle}`}
          </span>
          <p className="pt-prompt" style={{ margin: 0, color: v.color }}>{v.label}</p>
          {started ? (
            <p className="muted" style={{ margin: 0 }}>{v.desc}</p>
          ) : (
            <>
              <p style={{ margin: 0 }}>O plano começa no primeiro checkpoint de fala. Ele leva cerca de 8 minutos, registra a sua linha de base e marca o dia 1 das {PLAN_WEEKS} semanas. A partir dele, esta página compara cada semana com a meta da fase.</p>
              <div className="row">
                <button className="btn btn-primary" onClick={() => go({ name: 'checkpoint' })}>Fazer o primeiro checkpoint</button>
              </div>
            </>
          )}
        </section>

        {started ? (
          <section className="card">
            <h2 className="card-h">Metas desta semana</h2>
            <div className="plan-goals">
              <Bar label="Minutos falando" value={r.speakMin} target={r.speakTarget} unit="min" />
              <Bar label="Conversa (treinador ou Maya)" value={r.talkMin} target={r.talkTarget} unit="min" />
              <Bar label="Dias ativos" value={r.activeDays} target={REVIEW_RULES.activeDaysGoal} />
              <Bar label="Frases automáticas (degrau Falar ou acima)" value={r.auto} target={r.autoTarget} />
            </div>
          </section>
        ) : hasData ? (
          <section className="card">
            <h2 className="card-h">Seus últimos 7 dias</h2>
            <div className="cp-tiles">
              <div className="cp-tile"><span className="tag">Falando</span><b>{r.speakMin}</b><small className="muted">minutos · a fase 1 pede {r.speakTarget} por semana</small></div>
              <div className="cp-tile"><span className="tag">Conversa</span><b>{r.talkMin}</b><small className="muted">minutos · a fase 1 pede {r.talkTarget} por semana</small></div>
              <div className="cp-tile"><span className="tag">Dias ativos</span><b>{r.activeDays}</b><small className="muted">de 7</small></div>
              <div className="cp-tile"><span className="tag">Frases automáticas</span><b>{r.auto}</b><small className="muted">no degrau Falar ou acima</small></div>
            </div>
          </section>
        ) : null}

        {(started || hasData) && (
          <section className="card">
            <h2 className="card-h">Qualidade da prática</h2>
            <div className="cp-tiles">
              <div className="cp-tile">
                <span className="tag">Retenção</span>
                <b>{pctTile(r.retention)}</b>
                <small className="muted">frases vencidas certas de primeira nos últimos 7 dias · meta 85%</small>
              </div>
              <div className="cp-tile">
                <span className="tag">Autocorreção</span>
                <b>{pctTile(r.selfRepair)}</b>
                <small className="muted">erros consertados sem ver a resposta nos últimos 7 dias</small>
              </div>
            </div>
            {(r.retention === null || r.selfRepair === null) && (
              <p className="fine">Sem dados: a retenção precisa de pelo menos 3 revisões de frases vencidas e a autocorreção de 3 erros trabalhados com o treinador ao vivo.</p>
            )}
          </section>
        )}

        {(started || hasData) && (
          <section className="card">
            <h2 className="card-h">Erros mais frequentes</h2>
            {r.topErrors.length === 0 ? (
              <p className="muted">Nenhum erro registrado ainda. Eles aparecem aqui depois das primeiras práticas.</p>
            ) : (
              <>
                <ol className="cp-key">
                  {r.topErrors.map((e) => {
                    const c = ERROR_CATEGORIES[e.id];
                    return (
                      <li key={e.id} className="bad">
                        <span><b>{c?.title ?? e.id}</b> <small className="muted">· {plural(e.count, 'vez', 'vezes')} nas últimas práticas</small></span>
                        {c && <span className="muted">{c.explain}</span>}
                      </li>
                    );
                  })}
                </ol>
                <button className="btn btn-ghost" onClick={() => go({ name: 'practice', lessonId: 'erros' })}>Treinar esses erros</button>
              </>
            )}
          </section>
        )}

        <section className="card stack">
          <h2 className="card-h">O que fazer agora</h2>
          <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 8 }}>
            {r.suggestions.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="tip"><span><b>Foco da próxima semana:</b> {r.focus}</span></p>
          <div className="row">
            {actions.map((a) => (
              <button key={a.id} className={`btn ${a.id === main ? 'btn-primary' : 'btn-ghost'}`} onClick={() => go(a.route)}>{a.label}</button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Shadowing: ouvir lendo e repetir logo em seguida                     */
/* ------------------------------------------------------------------ */
const SHADOW_PASS = 80;
const splitSentences = (text: string) => (text.match(/[^.!?]+[.!?]+/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
const shadowKey = (id: string) => `shadow.best.${id}`;

export function Shadowing({ go }: { go: Go }) {
  const store = useStore();
  const mic = liveAvailable();
  const [k, setK] = useState(() => new Date().getDate() % STORIES.length);
  const story = STORIES[k];
  const sentences = useMemo(() => splitSentences(story.text), [story]);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<(number | undefined)[]>([]);
  const [fullScore, setFullScore] = useState<number | null>(null);
  const [res, setRes] = useState<{ score: number; words: WordResult[]; said: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playId = useRef(0);
  const isFull = i >= sentences.length;
  const target = isFull ? story.text : sentences[i];

  const live = useLive((said, ms) => {
    const a = analyzeAccent(target, said);
    setRes({ score: a.score, words: a.words, said });
    if (said) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1 });
      store.track('spoken');
    }
    if (isFull) setFullScore((p) => Math.max(p ?? 0, a.score));
    else setScores((s) => { const n = [...s]; n[i] = Math.max(n[i] ?? 0, a.score); return n; });
    if (a.score >= SHADOW_PASS) sfxCorrect(1);
    else sfxWrong();
  });

  const halt = () => {
    playId.current++;
    setPlaying(false);
    live.cancel();
    stopAudio();
  };
  const play = async (text: string, slow = false) => {
    live.cancel();
    const id = ++playId.current;
    setPlaying(true);
    try {
      await speak(text, { slow: slow || store.state.settings.slowAudio });
    } catch {
      /* sem áudio disponível: o texto continua na tela */
    } finally {
      if (playId.current === id) setPlaying(false);
    }
  };
  const record = () => {
    if (live.on) return live.stop();
    playId.current++;
    setPlaying(false);
    setRes(null);
    // direto no clique (o ditado exige o gesto)
    live.start(isFull ? { silenceMs: 3500, maxMs: 90000 } : { silenceMs: 2200, maxMs: 20000 });
  };
  const next = () => {
    halt();
    setRes(null);
    const n = i + 1;
    setI(n);
    if (n < sentences.length) void play(sentences[n]);
  };
  const finish = () => {
    halt();
    setEnded(true);
    sfxComplete();
    if (fullScore !== null || scores.some((s) => s !== undefined)) store.gainXp(20);
    if (fullScore !== null) {
      const key = shadowKey(story.id);
      store.set((s) => ({ ...s, bests: { ...s.bests, [key]: Math.max(s.bests[key] ?? 0, fullScore) } }));
    }
  };
  const reset = (n: number) => {
    halt();
    setK(n);
    setI(0);
    setScores([]);
    setFullScore(null);
    setRes(null);
    setEnded(false);
  };

  const spoken = scores.filter((s): s is number => s !== undefined);
  const avg = spoken.length ? Math.round(spoken.reduce((a, b) => a + b, 0) / spoken.length) : null;
  const best = store.state.bests[shadowKey(story.id)];

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Shadowing</h1>
      <p className="muted">Ouça uma frase acompanhando o texto e repita logo em seguida, imitando o ritmo e a entonação. No fim, diga o texto inteiro de uma vez.</p>
      {!mic && <p className="tip"><span>{NO_MIC} Sem ele você ainda pode ouvir e repetir em voz alta, mas sem nota.</span></p>}

      <section className="card stack" style={{ marginTop: 12 }}>
        <div>
          <label htmlFor="shadow-story" className="tag">História</label>
          <select id="shadow-story" className="text-input" style={FIELD_STYLE} value={k} onChange={(e) => reset(Number(e.target.value))}>
            {STORIES.map((s, n) => <option key={s.id} value={n}>{s.title} · {s.level}</option>)}
          </select>
        </div>

        {ended ? (
          <div className="stack" aria-live="polite">
            <h2 className="card-h">Resultado</h2>
            <div className="cp-tiles">
              <div className="cp-tile"><span className="tag">Texto inteiro</span><b>{fullScore !== null ? `${fullScore}%` : 'sem nota'}</b><small className="muted">das palavras reconhecidas de uma vez</small></div>
              <div className="cp-tile"><span className="tag">Frase a frase</span><b>{avg !== null ? `${avg}%` : 'sem nota'}</b><small className="muted">média de {plural(spoken.length, 'frase falada', 'frases faladas')} em {sentences.length}</small></div>
              {best !== undefined && <div className="cp-tile"><span className="tag">Recorde</span><b>{best}%</b><small className="muted">texto inteiro desta história</small></div>}
            </div>
            <p className="fine">A nota é a parte das palavras do texto que o reconhecimento de fala entendeu. Ela mede se você foi entendido, não se o sotaque é nativo.</p>
            <div className="row">
              <button className="btn btn-primary" onClick={() => reset((k + 1) % STORIES.length)}>Próxima história</button>
              <button className="btn btn-ghost" onClick={() => reset(k)}>Repetir esta</button>
              <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
            </div>
          </div>
        ) : (
          <>
            <span className="ex-kicker">{isFull ? 'Agora o texto inteiro, de uma vez' : `Frase ${i + 1} de ${sentences.length}`}</span>
            <p className={isFull ? undefined : 'pt-prompt'} lang="en" style={{ margin: 0 }}>{target}</p>
            <div className="row">
              <button className="btn btn-primary" onClick={() => void play(target)}><SpeakerIcon /> {playing ? 'Tocando…' : isFull ? 'Ouvir o texto' : 'Ouvir a frase'}</button>
              <button className="btn btn-ghost" onClick={() => void play(target, true)}><TurtleIcon /> Ouvir devagar</button>
            </div>
            {mic && (
              <div className="timed">
                <MicButton on={live.on} onClick={record} label={isFull ? 'Repetir o texto inteiro' : 'Repetir a frase'} />
                <span className="muted">{live.on ? 'Gravando. Toque para parar.' : res ? 'Toque para tentar de novo' : isFull ? 'Toque e diga o texto inteiro' : 'Toque e repita a frase'}</span>
                {live.on && <p className="live-text small" lang="en">{live.text || '…'}</p>}
              </div>
            )}
            <div aria-live="polite">
              {res && !live.on && (
                <div className="stack">
                  <p style={{ margin: 0 }}>
                    <b style={{ fontSize: '1.4rem', color: res.score >= SHADOW_PASS ? 'var(--ok)' : 'var(--bad)' }}>{res.score}%</b>{' '}
                    <span className="muted">das palavras reconhecidas. {res.score >= SHADOW_PASS ? 'Pode seguir.' : 'Ouça devagar e repita mais uma vez.'}</span>
                  </p>
                  <Words words={res.words} />
                  <p className="muted" style={{ margin: 0 }}><span className="tag">Você disse</span> <span lang="en">{res.said || '(não ouvi nada)'}</span></p>
                </div>
              )}
            </div>
            <div className="row">
              {isFull ? (
                <button className={`btn ${fullScore !== null || !mic ? 'btn-primary' : 'btn-ghost'}`} onClick={finish} disabled={live.on}>Ver resultado</button>
              ) : (
                <button className={`btn ${res || !mic ? 'btn-primary' : 'btn-ghost'}`} onClick={next} disabled={live.on}>{i + 1 < sentences.length ? 'Próxima frase' : 'Agora o texto inteiro'}</button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Vocabulário de trabalho: PT → EN com caixas de Leitner                */
/* ------------------------------------------------------------------ */
/** As chaves do glossário não têm acento (servem para busca); aqui volta a grafia correta. */
const PT_LABEL: Record<string, string> = {
  reuniao: 'reunião', implantacao: 'implantação', relatorio: 'relatório', estagiario: 'estagiário', promocao: 'promoção', ferias: 'férias',
  duvida: 'dúvida', sugestao: 'sugestão', opiniao: 'opinião', orcamento: 'orçamento', dependencia: 'dependência', garcom: 'garçom',
  cardapio: 'cardápio', portao: 'portão', 'com licenca': 'com licença', entao: 'então', alias: 'aliás', aindaassim: 'ainda assim',
};
interface VocabItem { key: string; pt: string; en: string }
const VOCAB: VocabItem[] = Object.entries(GLOSSARY).map(([key, en]) => ({ key, en, pt: PT_LABEL[key] ?? key }));
const VOCAB_SESSION = 12;
const DAY_MS = 86_400_000;
/** Dias até a próxima revisão, por caixa (0 a 4). */
const BOX_DAYS = [0, 1, 3, 7, 14];
const BOX_CAPTION = ['volta na próxima sessão', 'volta em 1 dia', 'volta em 3 dias', 'volta em 7 dias', 'volta em 14 dias'];
const boxKey = (k: string) => `vocab.box.${k}`;
const dueKey = (k: string) => `vocab.due.${k}`;
const clampBox = (b: number) => Math.max(0, Math.min(BOX_DAYS.length - 1, Math.round(b)));

/** Vencidos primeiro (os mais antigos na frente), depois novos; se sobrar espaço, os que vencem antes. */
function buildVocabSession(bests: Record<string, number>, now: number): VocabItem[] {
  const due = (v: VocabItem) => bests[dueKey(v.key)] ?? 0;
  const seen = VOCAB.filter((v) => bests[boxKey(v.key)] !== undefined).sort((a, b) => due(a) - due(b));
  const fresh = VOCAB.filter((v) => bests[boxKey(v.key)] === undefined);
  return [...seen.filter((v) => due(v) <= now), ...fresh, ...seen.filter((v) => due(v) > now)].slice(0, VOCAB_SESSION);
}

const bare = (s: string) => normalize(s).replace(/^(to|a|an|the) /, '');
/** Aceita qualquer opção separada por " / ", sem o "to " inicial; na fala, basta a opção aparecer no que foi dito. */
function vocabCorrect(en: string, input: string, spoken: boolean): boolean {
  const got = bare(input);
  if (!got) return false;
  const options = en.split(' / ').map(bare);
  if (options.includes(got) || checkTyped(got, options) !== 'wrong') return true;
  return spoken && options.some((o) => ` ${normalize(input)} `.includes(` ${o} `));
}
const sayable = (en: string) => en.replace(/ \/ /g, ', ');

export function WorkVocab({ go }: { go: Go }) {
  const store = useStore();
  const bests = store.state.bests;
  const mic = liveAvailable();
  const [queue, setQueue] = useState(() => buildVocabSession(bests, Date.now()));
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<{ ok: boolean; said: string; box: number } | null>(null);
  const [right, setRight] = useState(0);
  const [note, setNote] = useState('');
  const item: VocabItem | undefined = queue[idx];

  const live = useLive((said, ms) => {
    if (!said) {
      setNote('Não ouvi nada. Tente de novo ou digite a resposta.');
      return;
    }
    store.logDay({ spokenSec: ms / 1000 });
    answer(said, true);
  });

  function answer(input: string, spoken: boolean) {
    if (!item || res) return;
    live.cancel();
    setNote('');
    const ok = vocabCorrect(item.en, input, spoken);
    const box = ok ? clampBox((bests[boxKey(item.key)] ?? 0) + 1) : 0;
    const due = Date.now() + BOX_DAYS[box] * DAY_MS;
    store.set((s) => ({ ...s, bests: { ...s.bests, [boxKey(item.key)]: box, [dueKey(item.key)]: due } }));
    setRes({ ok, said: input.trim(), box });
    if (ok) {
      setRight((n) => n + 1);
      sfxCorrect(1);
    } else sfxWrong();
    void speak(sayable(item.en)).catch(() => {});
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (typed.trim()) answer(typed, false);
  };
  const next = () => {
    stopAudio();
    setRes(null);
    setTyped('');
    setNote('');
    if (idx + 1 >= queue.length) {
      sfxComplete();
      store.gainXp(5 + right);
    }
    setIdx(idx + 1);
  };
  const restart = () => {
    setQueue(buildVocabSession(bests, Date.now()));
    setIdx(0);
    setRight(0);
    setRes(null);
    setTyped('');
  };

  const counts = useMemo(() => {
    const boxes = BOX_DAYS.map(() => 0);
    let fresh = 0;
    for (const v of VOCAB) {
      const b = bests[boxKey(v.key)];
      if (b === undefined) fresh++;
      else boxes[clampBox(b)]++;
    }
    return { boxes, fresh };
  }, [bests]);
  const isNew = item ? bests[boxKey(item.key)] === undefined : false;

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Vocabulário de trabalho</h1>
      <p className="muted">Você vê o termo em português e responde em inglês, falando ou digitando, sem parar para pensar. Acertou, o termo sobe de caixa e demora mais para voltar. Errou, volta para a caixa 1.</p>

      <div className="stack">
        <section className="card stack">
          {!item ? (
            <div className="stack" aria-live="polite">
              <h2 className="card-h">Sessão concluída: {right} de {queue.length} certos</h2>
              <p className="muted" style={{ margin: 0 }}>
                {right === queue.length ? 'Todos os termos subiram de caixa.' : `${plural(queue.length - right, 'termo voltou', 'termos voltaram')} para a caixa 1 e ${queue.length - right === 1 ? 'abre' : 'abrem'} a próxima sessão.`}
              </p>
              <div className="row">
                <button className="btn btn-primary" onClick={restart}>Nova sessão</button>
                <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
              </div>
            </div>
          ) : (
            <>
              <span className="ex-kicker">Termo {idx + 1} de {queue.length} · {isNew && !res ? 'novo' : `caixa ${(res ? res.box : clampBox(bests[boxKey(item.key)] ?? 0)) + 1}`}</span>
              <p className="pt-prompt" lang="pt-BR" style={{ margin: 0 }}>{item.pt}</p>
              {!res && (
                <>
                  {mic ? (
                    <div className="timed">
                      <MicButton on={live.on} onClick={() => (live.on ? live.stop() : (setNote(''), live.start({ silenceMs: 1500, maxMs: 8000 })))} label="Falar a resposta em inglês" />
                      <span className="muted">{live.on ? 'Ouvindo…' : 'Toque e fale em inglês, ou digite abaixo'}</span>
                      {live.on && <p className="live-text small" lang="en">{live.text || '…'}</p>}
                    </div>
                  ) : (
                    <p className="fine">{NO_MIC} Aqui dá para responder digitando.</p>
                  )}
                  <form className="stack" onSubmit={submit}>
                    <label htmlFor="vocab-in" className="tag">Em inglês</label>
                    <input id="vocab-in" key={idx} className="text-input" lang="en" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} />
                    <div className="row">
                      <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>Conferir</button>
                      <button type="button" className="btn btn-ghost" onClick={() => answer('', false)}>Não sei</button>
                    </div>
                  </form>
                </>
              )}
              <div aria-live="polite">
                {note && !res && <p className="muted" style={{ margin: 0 }}>{note}</p>}
                {res && (
                  <div className="stack">
                    <p style={{ margin: 0 }}><b style={{ fontSize: '1.2rem', color: res.ok ? 'var(--ok)' : 'var(--bad)' }}>{res.ok ? 'Certo' : res.said ? 'Ainda não' : 'Esta é a resposta'}</b></p>
                    <p style={{ margin: 0 }}>
                      <span className="tag">Em inglês</span> <b lang="en">{item.en}</b>{' '}
                      <button className="icon-btn inline" onClick={() => void speak(sayable(item.en)).catch(() => {})} aria-label="Ouvir a resposta"><SpeakerIcon size={16} /></button>
                    </p>
                    {!res.ok && res.said && <p className="muted" style={{ margin: 0 }}><span className="tag">Você</span> <span lang="en">{res.said}</span></p>}
                    <p className="fine">{res.ok ? `Subiu para a caixa ${res.box + 1}: ${BOX_CAPTION[res.box]}.` : 'Foi para a caixa 1: aparece de novo na próxima sessão.'}</p>
                    <div className="row">
                      <button className="btn btn-primary" autoFocus onClick={next}>{idx + 1 >= queue.length ? 'Ver resumo' : 'Próximo termo'}</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2 className="card-h">Suas caixas</h2>
          <div className="cp-tiles">
            {counts.boxes.map((n, b) => (
              <div className="cp-tile" key={b}><span className="tag">Caixa {b + 1}</span><b>{n}</b><small className="muted">{BOX_CAPTION[b]}</small></div>
            ))}
            <div className="cp-tile"><span className="tag">Novos</span><b>{counts.fresh}</b><small className="muted">ainda não vistos</small></div>
          </div>
          <p className="fine">{VOCAB.length} termos no total. Cada sessão tem até {VOCAB_SESSION}: primeiro os vencidos, depois os novos.</p>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Histórias STAR para entrevista                                       */
/* ------------------------------------------------------------------ */
type Star = AppState['starStories'][number];
type StarKey = 's' | 't' | 'a' | 'r';
const STAR_FIELDS: { key: StarKey; title: string; cue: string; hint: string; min: number; max: number; rows: number }[] = [
  { key: 's', title: 'Situation', cue: 'o contexto', hint: 'O contexto: onde você trabalhava, qual era o projeto e qual era o problema. Duas ou três frases, no passado.', min: 20, max: 40, rows: 4 },
  { key: 't', title: 'Task', cue: 'a sua responsabilidade', hint: 'A sua parte: o que cabia a você resolver ou entregar, e até quando.', min: 10, max: 25, rows: 3 },
  { key: 'a', title: 'Action', cue: 'o que você fez', hint: 'O que você fez, passo a passo, sempre com "I" e não "we". É a parte mais longa.', min: 60, max: 90, rows: 7 },
  { key: 'r', title: 'Result', cue: 'o resultado em números', hint: 'O resultado, de preferência com um número (tempo, custo, erros), e o que você aprendeu.', min: 20, max: 35, rows: 4 },
];
const REHEARSE_SEC = 90;
const blankStar = (): Star => ({ id: `star-${Date.now().toString(36)}`, title: '', s: '', t: '', a: '', r: '', at: 0 });
const starWords = (st: Star) => STAR_FIELDS.reduce((n, f) => n + wordCount(st[f.key]), 0);

const STAR_STOP = new Set(['that', 'this', 'with', 'from', 'have', 'were', 'they', 'them', 'their', 'there', 'then', 'than', 'when', 'what', 'which', 'would', 'could', 'should', 'about', 'into', 'because', 'also', 'very', 'some', 'been', 'will', 'your', 'just', 'more', 'most', 'only', 'over', 'after', 'before', 'while', 'where', 'each', 'other', 'these', 'those', 'does', 'cannot']);
const stem = (w: string) => (w.length > 5 ? w.slice(0, 5) : w);
const keywords = (text: string) => [...new Set(normalize(text).split(' ').filter((w) => w.length >= 4 && !STAR_STOP.has(w)).map(stem))];

interface PartCheck { key: StarKey; ok: boolean | null; hits: number; total: number }
/**
 * Heurística simples: uma parte "aparece" quando a fala traz palavras-chave do campo
 * (de preferência as que só existem nele). Campo vazio não é avaliado.
 */
function starCoverage(story: Star, said: string): PartCheck[] {
  const heard = new Set(normalize(said).split(' ').map(stem));
  const per = STAR_FIELDS.map((f) => keywords(story[f.key]));
  return STAR_FIELDS.map((f, i) => {
    const others = new Set(per.flatMap((ks, j) => (j === i ? [] : ks)));
    const own = per[i].filter((w) => !others.has(w));
    const keys = own.length >= 2 ? own : per[i];
    if (!keys.length) return { key: f.key, ok: null, hits: 0, total: 0 };
    const hits = keys.filter((w) => heard.has(w)).length;
    const need = Math.min(keys.length, Math.max(2, Math.ceil(keys.length * 0.3)));
    return { key: f.key, ok: hits >= need, hits, total: keys.length };
  });
}

function Marks({ marks }: { marks: Spot[] }) {
  return (
    <>
      {marks.map((m, j) => (
        <p key={`${m.rule}-${j}`} className="err-pill" lang="en"><s>{m.wrong}</s> → <b>{m.fix}</b> <small lang="pt-BR">· {m.explain}</small></p>
      ))}
    </>
  );
}

function StarField({ f, value, onChange }: { f: (typeof STAR_FIELDS)[number]; value: string; onChange: (v: string) => void }) {
  const marks = useMemo(() => spot(value), [value]);
  const n = wordCount(value);
  const id = `star-${f.key}`;
  return (
    <div>
      <div className="row-between">
        <label htmlFor={id}><b lang="en">{f.title}</b></label>
        <small className="muted">{plural(n, 'palavra', 'palavras')} · ideal de {f.min} a {f.max}</small>
      </div>
      <p className="fine" id={`${id}-hint`} style={{ margin: '2px 0 6px' }}>{f.hint}</p>
      <textarea id={id} className="text-input" style={FIELD_STYLE} lang="en" rows={f.rows} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={`${id}-hint`} />
      <div aria-live="polite"><Marks marks={marks} /></div>
    </div>
  );
}

function StarEditor({ initial, onSave, onDelete, onCancel }: { initial: Star; onSave: (st: Star, then: 'list' | 'rehearse') => void; onDelete?: () => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [confirmDel, setConfirmDel] = useState(false);
  const after = useRef<'list' | 'rehearse'>('list');
  const total = starWords(draft);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim(), at: Date.now() }, after.current);
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <label htmlFor="star-title" className="tag">Título</label>
        <input id="star-title" className="text-input" required maxLength={80} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Migração do pipeline de pedidos" />
      </div>
      {STAR_FIELDS.map((f) => <StarField key={f.key} f={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />)}
      <p className="muted" style={{ margin: 0 }}>Total: {plural(total, 'palavra', 'palavras')}. Para caber em {REHEARSE_SEC} segundos, mire em 150 a 190.</p>
      <div className="row">
        <button type="submit" className="btn btn-primary" onClick={() => (after.current = 'list')}>Salvar</button>
        <button type="submit" className="btn btn-ghost" onClick={() => (after.current = 'rehearse')}>Salvar e ensaiar em {REHEARSE_SEC} segundos</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
      {onDelete && (
        <div className="row">
          {confirmDel ? (
            <>
              <span className="muted">Excluir esta história de vez?</span>
              <button type="button" className="btn btn-ghost" style={{ color: 'var(--bad)' }} onClick={onDelete}>Sim, excluir</button>
              <button type="button" className="btn btn-ghost" autoFocus onClick={() => setConfirmDel(false)}>Manter</button>
            </>
          ) : (
            <button type="button" className="link-btn" onClick={() => setConfirmDel(true)}>Excluir história</button>
          )}
        </div>
      )}
    </form>
  );
}

function StarRehearsal({ story, onEdit, onBack }: { story: Star; onEdit: () => void; onBack: () => void }) {
  const store = useStore();
  const [left, setLeft] = useState(REHEARSE_SEC);
  const [res, setRes] = useState<{ said: string; ms: number; wpm: number; words: number; parts: PartCheck[]; marks: Spot[] } | null>(null);
  const t0 = useRef(0);

  const live = useLive((said, ms) => {
    const free = scoreFree(story.title, said, ms);
    const parts = starCoverage(story, said);
    const marks = spot(said);
    setRes({ said, ms, wpm: free.wpm, words: free.words, parts, marks });
    if (free.words < 5) return;
    const hit = parts.filter((p) => p.ok).length;
    store.logDay({ spokenSec: ms / 1000, spoken: 1 });
    store.track('spoken');
    store.gainXp(10 + hit * 3);
    const cats = marks.map((m) => m.cat);
    if (cats.length) store.set((s) => ({ ...s, errorLog: [cats, ...s.errorLog].slice(0, 300) }));
    if (hit === parts.filter((p) => p.ok !== null).length) sfxComplete();
    else sfxCorrect(1);
  });

  useEffect(() => {
    if (!live.on) return;
    const id = setInterval(() => setLeft(Math.max(0, REHEARSE_SEC - Math.floor((Date.now() - t0.current) / 1000))), 250);
    return () => clearInterval(id);
  }, [live.on]);

  const toggle = () => {
    if (live.on) return live.stop();
    t0.current = Date.now();
    setLeft(REHEARSE_SEC);
    setRes(null);
    // direto no clique (o ditado exige o gesto)
    live.start({ maxMs: REHEARSE_SEC * 1000, silenceMs: 6000 });
  };
  const pct = (left / REHEARSE_SEC) * 100;

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <section className="card stack">
        <span className="ex-kicker">{story.title}</span>
        <p className="muted" style={{ margin: 0 }}>Conte a história sem ler. Na tela ficam só as quatro partes, na ordem, como apoio.</p>
        <div className="cp-tiles">
          {STAR_FIELDS.map((f) => (
            <div className="cp-tile" key={f.key}><b lang="en" aria-hidden>{f.title[0]}</b><span lang="en">{f.title}</span><small className="muted">{f.cue}</small></div>
          ))}
        </div>
        {liveAvailable() ? (
          <div className="timed">
            <MicButton on={live.on} onClick={toggle} label={`Ensaiar por ${REHEARSE_SEC} segundos`} />
            <div className="qbar" style={{ width: 'min(240px, 100%)' }} aria-hidden>
              <span style={{ width: `${pct}%`, background: pct < 25 ? 'var(--bad)' : 'var(--viz-1)', transition: 'none' }} />
            </div>
            <span className="muted" role="timer">{live.on ? `${left} segundos restantes. Toque para encerrar.` : res ? 'Toque para ensaiar de novo' : `Toque e conte a história em até ${REHEARSE_SEC} segundos`}</span>
            {live.on && <p className="live-text small" lang="en">{live.text || '…'}</p>}
          </div>
        ) : (
          <p className="tip"><span>{NO_MIC}</span></p>
        )}
      </section>

      <div aria-live="polite">
        {res && !live.on && (
          <section className="card stack">
            {res.words < 5 ? (
              <p style={{ margin: 0 }}>Não ouvi fala suficiente para medir. Toque no microfone e tente de novo.</p>
            ) : (
              <>
                <h2 className="card-h">{res.wpm} palavras por minuto</h2>
                <div className="cp-tiles">
                  <div className="cp-tile"><span className="tag">Ritmo</span><b>{res.wpm}</b><small className="muted">palavras por minuto</small></div>
                  <div className="cp-tile"><span className="tag">Volume</span><b>{res.words}</b><small className="muted">palavras em {Math.round(res.ms / 1000)}s</small></div>
                  <div className="cp-tile"><span className="tag">Partes</span><b>{res.parts.filter((p) => p.ok).length} de {res.parts.filter((p) => p.ok !== null).length}</b><small className="muted">apareceram na fala</small></div>
                </div>
                <ul className="cp-cats">
                  {res.parts.map((p) => {
                    const f = STAR_FIELDS.find((x) => x.key === p.key)!;
                    return (
                      <li key={p.key} className={p.ok === null ? undefined : p.ok ? 'ok' : 'bad'}>
                        <span className="cp-mark" aria-hidden>{p.ok === null ? '·' : p.ok ? <CheckIcon size={16} /> : <XIcon size={16} />}</span>
                        <span><span lang="en">{f.title}</span>: {p.ok === null ? 'campo vazio na história' : p.ok ? 'apareceu' : 'não apareceu'}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="fine">As partes são conferidas pelas palavras-chave que você escreveu em cada campo. Se você contou com outras palavras, pode ter dito a parte mesmo sem a marca.</p>
                <div>
                  <span className="tag">Você disse</span>
                  <p lang="en" style={{ margin: '4px 0' }}>{res.said}</p>
                  <Marks marks={res.marks} />
                </div>
                <details>
                  <summary>Comparar com o texto escrito</summary>
                  {STAR_FIELDS.map((f) => <p key={f.key} lang="en"><b>{f.title}:</b> {story[f.key] || '(vazio)'}</p>)}
                </details>
              </>
            )}
            <div className="row">
              <button className="btn btn-ghost" onClick={onEdit}>Editar a história</button>
              <button className="btn btn-ghost" onClick={onBack}>Todas as histórias</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

type StarView = { name: 'list' } | { name: 'edit'; id: string | null } | { name: 'rehearse'; id: string };

export function StarBuilder({ go }: { go: Go }) {
  const store = useStore();
  const stories = store.state.starStories;
  const [view, setView] = useState<StarView>({ name: 'list' });
  const current = view.name !== 'list' && view.id ? stories.find((s) => s.id === view.id) : undefined;
  const list = () => setView({ name: 'list' });

  const save = (st: Star, then: 'list' | 'rehearse') => {
    store.set((s) => ({ ...s, starStories: [st, ...s.starStories.filter((x) => x.id !== st.id)] }));
    store.toast({ title: 'História salva', kind: 'info' });
    setView(then === 'rehearse' ? { name: 'rehearse', id: st.id } : { name: 'list' });
  };
  const remove = (id: string) => {
    store.set((s) => ({ ...s, starStories: s.starStories.filter((x) => x.id !== id) }));
    list();
  };

  if (view.name === 'rehearse' && current) {
    return (
      <main className="shell" id="main">
        <button className="link-btn back" onClick={list}><BackIcon /> Histórias STAR</button>
        <h1 className="page-title">Ensaio em {REHEARSE_SEC} segundos</h1>
        <StarRehearsal key={current.id} story={current} onEdit={() => setView({ name: 'edit', id: current.id })} onBack={list} />
      </main>
    );
  }

  if (view.name === 'edit') {
    return (
      <main className="shell" id="main">
        <button className="link-btn back" onClick={list}><BackIcon /> Histórias STAR</button>
        <h1 className="page-title">{current ? 'Editar história' : 'Nova história STAR'}</h1>
        <p className="muted">Escreva em inglês, com frases curtas e no passado. Os erros típicos aparecem abaixo de cada campo enquanto você escreve.</p>
        <StarEditor key={current?.id ?? 'new'} initial={current ?? blankStar()} onSave={save} onCancel={list} onDelete={current ? () => remove(current.id) : undefined} />
      </main>
    );
  }

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Histórias STAR</h1>
      <p className="muted">Perguntas de entrevista do tipo <span lang="en">"Tell me about a time when..."</span> pedem uma história em quatro partes: <span lang="en">Situation, Task, Action, Result</span>. Escreva as suas uma vez, corrija os erros típicos e ensaie até caber em {REHEARSE_SEC} segundos.</p>
      <section className="card stack">
        <div className="row-between">
          <h2 className="card-h" style={{ margin: 0 }}>{stories.length ? plural(stories.length, 'história', 'histórias') : 'Nenhuma história ainda'}</h2>
          <button className="btn btn-primary" onClick={() => setView({ name: 'edit', id: null })}>{stories.length ? 'Nova história' : 'Criar a primeira história'}</button>
        </div>
        {stories.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Comece por três: um problema difícil que você resolveu, um conflito ou desacordo no time e um erro seu com o que aprendeu. Elas cobrem a maior parte das perguntas comportamentais.</p>
        ) : (
          <ul className="notebook">
            {stories.map((st) => (
              <li key={st.id} style={{ flexWrap: 'wrap' }}>
                <span>
                  <b>{st.title}</b>
                  <br />
                  <small className="muted">{plural(starWords(st), 'palavra', 'palavras')} · salva em {new Date(st.at).toLocaleDateString('pt-BR')}</small>
                </span>
                <button className="btn btn-ghost" onClick={() => setView({ name: 'edit', id: st.id })} aria-label={`Editar ${st.title}`}>Editar</button>
                <button className="btn btn-primary" onClick={() => setView({ name: 'rehearse', id: st.id })} aria-label={`Ensaiar ${st.title} em ${REHEARSE_SEC} segundos`}>Ensaiar em {REHEARSE_SEC} segundos</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
