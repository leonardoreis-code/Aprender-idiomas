import { useEffect, useMemo, useRef, useState } from 'react';
import type { Drill } from '../../domain/curriculum/speaking';
import { checkTyped, levenshtein, normalize } from '../../domain/practice/answer';
import { rng, shuffle } from '../../domain/practice/builder';
import { flashLimitMs, STAGES, type ProductionAttempt, type QueueItem, type Stage } from '../../domain/production/ladder';
import { detectErrors, ERROR_CATEGORIES } from '../../domain/production/errors';
import { analyzeAccent, ACCENT_RULES, type AccentReport } from '../../domain/pronunciation/accent';
import { speak, stopAudio } from '../../infra/audio';
import type { Recording } from '../../infra/recorder';
import { sfxComplete, sfxCorrect, sfxWrong, sfxTap } from '../../infra/sfx';
import { BulbIcon, CheckIcon, CloseIcon, SpeakerIcon, TurtleIcon, XIcon } from '../icons/ui';
import { MicButton, micAvailable } from '../components/Mic';
import { Confetti } from '../components/Graphics';
import { useStore } from '../store';
import { judgeCheckpoint, llmAvailable } from '../../infra/llm';

interface Props {
  title: string;
  queue: QueueItem[];
  /** Pool para distratores no "montar". */
  pool: Drill[];
  onExit: () => void;
  onDone?: (attempts: ProductionAttempt[]) => void;
}

interface Outcome {
  correct: boolean;
  hesitant: boolean;
  said?: string;
  errors: string[];
  accent?: AccentReport;
  recordingUrl?: string | null;
  spokenMs?: number;
  note?: string;
}

const accepted = (d: Drill) => [d.en, ...(d.alt ?? [])];
const stageXp = (s: Stage) => 8 + s * 4;

/**
 * Sessão "Pense em inglês": cada frase aparece no degrau em que o aluno está.
 * Feedback mostra a forma certa, a categoria do erro (com explicação em PT),
 * problemas de pronúncia e deixa ouvir a própria voz comparada à nativa.
 */
export function ProductionSession({ title, queue: initial, pool, onExit, onDone }: Props) {
  const store = useStore();
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempts, setAttempts] = useState<ProductionAttempt[]>([]);
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const started = useRef(Date.now());
  const xp = useRef(0);
  const retried = useRef(new Set<string>());
  const item = queue[idx];

  useEffect(() => {
    started.current = Date.now();
  }, [idx]);

  const [judging, setJudging] = useState(false);
  /** Resposta diferente da lista? Com o Claude disponível, um avaliador decide se ela também está certa. */
  const resolve = async (first: Outcome) => {
    let o = first;
    if (!o.correct && o.said && item.stage >= 2 && llmAvailable() && o.said.trim().split(/\s+/).length >= 3) {
      setJudging(true);
      const j = await judgeCheckpoint([{ id: item.drill.id, pt: item.drill.pt, said: o.said, refs: [item.drill.en, ...(item.drill.alt ?? [])] }], []);
      setJudging(false);
      if (j?.accepted.includes(item.drill.id)) o = { ...o, correct: true, hesitant: true, errors: [], note: 'Sua forma também está correta. A mais comum é a de cima: vale treinar as duas.' };
    }
    finalize(o);
  };
  const finalize = (o: Outcome) => {
    const a: ProductionAttempt = { drillId: item.drill.id, stage: item.stage, correct: o.correct, hesitant: o.hesitant, ms: Date.now() - started.current, errors: o.errors, words: item.drill.en.split(/\s+/).length, spokenMs: o.spokenMs, due: item.reason === 'due' };
    setAttempts((x) => [...x, a]);
    store.track('produced');
    if (item.stage >= 3 && o.said) store.track('spoken');
    if (item.stage === 4 && o.correct && !o.hesitant) store.track('perfectFlash');
    if (o.accent?.rules.length) store.recordAccent(o.accent.rules.map((r) => r.id));
    if (o.correct) {
      const c = combo + 1;
      setCombo(c);
      xp.current += stageXp(item.stage) + Math.min(c - 1, 5) * 2;
      sfxCorrect(c);
    } else {
      setCombo(0);
      sfxWrong();
      // errou: a mesma frase volta no fim, um degrau abaixo
      if (!retried.current.has(item.drill.id)) {
        retried.current.add(item.drill.id);
        setQueue((q) => [...q, { ...item, stage: Math.max(0, item.stage - 1) as Stage, reason: 'weak' }]);
      }
    }
    setOutcome(o);
    if (o.correct) void speak(item.drill.en);
  };

  const next = () => {
    stopAudio();
    setOutcome(null);
    if (idx + 1 >= queue.length) {
      const all = attempts;
      store.recordProduction(all);
      store.gainXp(xp.current);
      onDone?.(all);
      sfxComplete();
      setFinished(true);
      return;
    }
    setIdx(idx + 1);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && outcome && !e.repeat) {
        e.preventDefault();
        next();
      }
      if (e.key === 'Escape') onExit();
    };
    const t = setTimeout(() => window.addEventListener('keydown', h), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', h);
    };
  });

  if (finished) return <Summary attempts={attempts} xp={xp.current} onExit={onExit} />;
  if (!item) return null;
  const stageInfo = STAGES[item.stage];

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={() => { stopAudio(); onExit(); }} aria-label="Sair (Esc)"><CloseIcon /></button>
        <div className="progress" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={idx}>
          <span style={{ width: `${Math.max(((idx + (outcome ? 1 : 0)) / queue.length) * 100, 3)}%` }} />
        </div>
        <div className="combo" aria-live="polite">{combo >= 2 ? `×${combo}` : ''}</div>
      </header>

      <main className="stage" id="main" key={`${item.drill.id}-${idx}`}>
        <div className="ladder" aria-label={`Degrau ${item.stage + 1} de 5: ${stageInfo.label}`}>
          {STAGES.map((s) => (
            <span key={s.id} className={`rung ${s.id <= item.stage ? 'on' : ''} ${s.id === item.stage ? 'cur' : ''}`} title={s.label} />
          ))}
          <span className="ex-kicker" style={{ marginLeft: 8 }}>{stageInfo.label} · {stageInfo.desc}</span>
        </div>
        <h1 className="ex-title pt-prompt">
          <span className="sr-only">Diga em inglês: </span>
          {item.drill.pt}
        </h1>
        {item.stage === 0 && <StageBuild drill={item.drill} pool={pool} done={!!outcome || judging} onResolve={resolve} />}
        {item.stage === 1 && <StageChunks drill={item.drill} done={!!outcome || judging} onResolve={resolve} />}
        {item.stage === 2 && <StageType drill={item.drill} done={!!outcome || judging} onResolve={resolve} />}
        {item.stage >= 3 && <StageSpeak drill={item.drill} flash={item.stage === 4} done={!!outcome || judging} onResolve={resolve} />}
      </main>

      {judging && <p role="status" className="muted" style={{ padding: '0 16px' }}><span className="spinner" aria-hidden /> Verificando se a sua forma também está certa…</p>}
      {outcome && <Feedback drill={item.drill} o={outcome} onNext={next} onSave={() => store.set((s) => ({ ...s, notebook: [{ en: item.drill.en, pt: item.drill.pt, at: Date.now() }, ...s.notebook.filter((n) => n.en !== item.drill.en)] }))} />}
    </div>
  );
}

/* ---------------------- Degrau 0: montar com blocos ---------------------- */
function StageBuild({ drill, pool, done, onResolve }: { drill: Drill; pool: Drill[]; done: boolean; onResolve: (o: Outcome) => void }) {
  const bank = useMemo(() => {
    const r = rng(drill.id.length * 97 + drill.en.length);
    const own = drill.chunks.map((c) => c.en);
    const distract = shuffle(pool.filter((p) => p.id !== drill.id).flatMap((p) => p.chunks.map((c) => c.en)), r)
      .filter((c) => !own.includes(c))
      .slice(0, 2);
    return shuffle([...own, ...distract], r);
  }, [drill, pool]);
  const [picked, setPicked] = useState<number[]>([]);
  const text = picked.map((i) => bank[i]).join(' ');
  const check = () => {
    const v = checkTyped(text, accepted(drill));
    onResolve({ correct: v !== 'wrong', hesitant: v === 'almost', said: text, errors: v === 'wrong' ? detectErrors(text, accepted(drill)) : [] });
  };
  return (
    <section>
      <div className="chunk-map" aria-label="Blocos de sentido">
        {drill.chunks.map((c, i) => (
          <span key={i} className={`chunk c${i % 5}`}>{c.pt}</span>
        ))}
      </div>
      <p className="hint-line">Os blocos acima já estão na <b>ordem do inglês</b>. Monte a frase:</p>
      <div className="answer-line" aria-live="polite" lang="en">
        {picked.map((i, pos) => (
          <button key={pos} className={`chip pop-in c-chip c${drill.chunks.findIndex((c) => c.en === bank[i]) % 5}`} type="button" disabled={done} onClick={() => setPicked(picked.filter((_, p) => p !== pos))}>{bank[i]}</button>
        ))}
      </div>
      <div className="bank" lang="en">
        {bank.map((w, i) => (
          <button key={i} type="button" className={`chip ${picked.includes(i) ? 'used' : ''}`} disabled={done || picked.includes(i)} onClick={() => { sfxTap(); setPicked([...picked, i]); }}>{w}</button>
        ))}
      </div>
      {!done && <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={!picked.length} onClick={check}>Verificar</button>}
    </section>
  );
}

/* ---------------------- Degrau 1: bloco a bloco ---------------------- */
function StageChunks({ drill, done, onResolve }: { drill: Drill; done: boolean; onResolve: (o: Outcome) => void }) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [got, setGot] = useState<{ text: string; ok: boolean }[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [i]);
  const chunk = drill.chunks[i];
  const submit = () => {
    if (!val.trim()) return;
    const a = normalize(val);
    const b = normalize(chunk.en);
    const ok = a === b || (b.length > 4 && levenshtein(a, b) <= 1);
    const list = [...got, { text: val, ok }];
    setGot(list);
    setVal('');
    if (ok) sfxTap();
    if (i + 1 < drill.chunks.length) setI(i + 1);
    else {
      const wrong = list.filter((x) => !x.ok).length;
      const said = list.map((x) => x.text).join(' ');
      onResolve({ correct: wrong <= 1, hesitant: wrong === 1, said, errors: wrong ? detectErrors(said, accepted(drill)) : [], note: wrong ? `${wrong} bloco(s) diferente(s) do esperado.` : undefined });
    }
  };
  return (
    <section>
      <div className="chunk-map">
        {drill.chunks.map((c, k) => (
          <span key={k} className={`chunk c${k % 5} ${k === i && !done ? 'focus' : ''} ${k < got.length ? 'past' : ''}`}>
            {c.pt}
            {k < got.length && <small lang="en" className={got[k].ok ? 'ok' : 'bad'}>{got[k].ok ? c.en : `${got[k].text} → ${c.en}`}</small>}
          </span>
        ))}
      </div>
      {!done && (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ marginTop: 16 }}>
          <label htmlFor="chunk-in" className="hint-line">Como fica <q>{chunk.pt}</q> em inglês?</label>
          <input id="chunk-in" ref={ref} className="text-input" lang="en" autoComplete="off" autoCapitalize="off" spellCheck={false} value={val} onChange={(e) => setVal(e.target.value)} />
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={!val.trim()}>{i + 1 < drill.chunks.length ? 'Próximo bloco' : 'Fechar a frase'}</button>
        </form>
      )}
    </section>
  );
}

/* ---------------------- Degrau 2: escrever ---------------------- */
function StageType({ drill, done, onResolve }: { drill: Drill; done: boolean; onResolve: (o: Outcome) => void }) {
  const [val, setVal] = useState('');
  const [hint, setHint] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const hintText = drill.en.split(' ').map((w) => (hint >= 2 ? w : w[0] + w.slice(1).replace(/[a-z]/gi, '_'))).join(' ');
  const check = () => {
    const v = checkTyped(val, accepted(drill));
    onResolve({ correct: v !== 'wrong', hesitant: v === 'almost' || hint > 0, said: val, errors: v === 'wrong' ? detectErrors(val, accepted(drill)) : [] });
  };
  return (
    <section>
      <form onSubmit={(e) => { e.preventDefault(); if (val.trim()) check(); }}>
        <label htmlFor="type-in" className="sr-only">Escreva em inglês</label>
        <input id="type-in" ref={ref} className="text-input" lang="en" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Escreva em inglês…" value={val} onChange={(e) => setVal(e.target.value)} disabled={done} />
        {hint > 0 && <p className="hint-line mono" lang="en">{hintText}</p>}
        {!done && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setHint((h) => Math.min(2, h + 1))} disabled={hint >= 2}>
              <BulbIcon /> {hint ? 'Mais ajuda' : 'Travei — dica'}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!val.trim()}>Verificar</button>
          </div>
        )}
        {drill.hint && hint > 0 && <p className="tip" style={{ marginTop: 12 }}><BulbIcon /> <span>{drill.hint}</span></p>}
      </form>
    </section>
  );
}

/* ---------------------- Degraus 3 e 4: falar / relâmpago ---------------------- */
function StageSpeak({ drill, flash, done, onResolve }: { drill: Drill; flash: boolean; done: boolean; onResolve: (o: Outcome) => void }) {
  const limit = flashLimitMs(drill.en);
  const [left, setLeft] = useState(limit);
  const [typing, setTyping] = useState(!micAvailable());
  const [val, setVal] = useState('');
  const t0 = useRef(Date.now());
  useEffect(() => {
    if (!flash || done) return;
    const id = setInterval(() => setLeft(Math.max(0, limit - (Date.now() - t0.current))), 100);
    return () => clearInterval(id);
  }, [flash, done, limit]);

  const fromRecording = (r: Recording) => {
    const said = r.text;
    const v = said ? checkTyped(said, accepted(drill)) : 'wrong';
    const accent = said ? analyzeAccent(drill.en, said) : undefined;
    const late = flash && Date.now() - t0.current > limit + 1500;
    onResolve({
      correct: v !== 'wrong' || (accent?.score ?? 0) >= 85,
      hesitant: v === 'almost' || late || (accent?.score ?? 100) < 100,
      said: said || '(não ouvi nada)',
      errors: v === 'wrong' && said ? detectErrors(said, accepted(drill)) : [],
      accent,
      recordingUrl: r.url,
      spokenMs: said ? r.durationMs : undefined,
      note: late ? 'Certo, mas passou do tempo. Na próxima, tente começar a falar antes de montar tudo na cabeça.' : r.source === 'scribe' ? 'Análise feita com ElevenLabs Scribe.' : undefined,
    });
  };

  return (
    <section>
      {flash && !done && (
        <div className="flash-bar" aria-label={`Tempo restante: ${Math.ceil(left / 1000)} segundos`}>
          <span style={{ width: `${(left / limit) * 100}%`, background: left < limit * 0.3 ? 'var(--bad)' : 'var(--tangerine)' }} />
        </div>
      )}
      {!done && !typing && <MicButton onResult={fromRecording} maxMs={flash ? limit + 2500 : 12000} label="Falar a frase em inglês" />}
      {!done && typing && (
        <form onSubmit={(e) => { e.preventDefault(); const v = checkTyped(val, accepted(drill)); onResolve({ correct: v !== 'wrong', hesitant: true, said: val, errors: v === 'wrong' ? detectErrors(val, accepted(drill)) : [], note: 'Respondido digitando: conta, mas não sobe de degrau. Fale quando puder.' }); }}>
          <input className="text-input" lang="en" autoFocus autoComplete="off" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Digite em inglês…" aria-label="Digite em inglês" />
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!val.trim()}>Verificar</button>
        </form>
      )}
      {!done && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button type="button" className="link-btn" onClick={() => setTyping(!typing)}>{typing ? 'Prefiro falar' : 'Não posso falar agora — digitar'}</button>
        </div>
      )}
    </section>
  );
}

/* ---------------------- Feedback ---------------------- */
function Feedback({ drill, o, onNext, onSave }: { drill: Drill; o: Outcome; onNext: () => void; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const ok = o.correct;
  return (
    <footer className={`footer ${ok ? 'ok' : 'bad'} pop-in`} aria-live="assertive">
      <div className="footer-inner" style={{ alignItems: 'flex-start' }}>
        <div className="msg" style={{ alignItems: 'flex-start' }}>
          <span className="fb-icon" style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }}>{ok ? <CheckIcon size={28} /> : <XIcon size={28} />}</span>
          <div style={{ minWidth: 0 }}>
            <strong>{ok ? (o.hesitant ? 'Quase perfeito!' : 'Isso! Você pensou em inglês.') : 'Forma natural:'}</strong>
            <small lang="en" style={{ display: 'block', fontWeight: 700, fontSize: '1.1rem' }}>{drill.en}</small>
            {o.said && !ok && <small style={{ display: 'block' }}>Você disse: <span lang="en">{o.said}</span></small>}
            {o.accent && o.accent.words.some((w) => !w.ok) && (
              <small style={{ display: 'block', marginTop: 4 }} lang="en">
                {o.accent.words.map((w, i) => <span key={i} className={w.ok ? 'word-ok' : 'word-miss'} title={w.heard ? `ouvi: ${w.heard}` : 'não ouvi'}>{w.word} </span>)}
              </small>
            )}
            {o.errors.map((e) => ERROR_CATEGORIES[e] && (
              <small key={e} className="err-pill"><b>{ERROR_CATEGORIES[e].title}:</b> {ERROR_CATEGORIES[e].explain}</small>
            ))}
            {o.accent?.rules.map((r) => ACCENT_RULES[r.id] && (
              <small key={r.id} className="err-pill accent"><b>Pronúncia · {ACCENT_RULES[r.id].title}</b> ({r.words.join(', ')}): {ACCENT_RULES[r.id].howTo}</small>
            ))}
            {o.note && <small style={{ display: 'block', marginTop: 4 }}>{o.note}</small>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button type="button" className="chip" onClick={() => speak(drill.en)}><SpeakerIcon size={18} /> Nativo</button>
              <button type="button" className="chip" onClick={() => speak(drill.en, { slow: true })}><TurtleIcon size={18} /> Devagar</button>
              {o.recordingUrl && <button type="button" className="chip" onClick={() => new Audio(o.recordingUrl!).play()}>▶ Minha voz</button>}
              <button type="button" className="chip" disabled={saved} onClick={() => { onSave(); setSaved(true); }}>{saved ? 'Salvo no caderno' : '+ Caderno'}</button>
            </div>
          </div>
        </div>
        <button className={`btn ${ok ? 'btn-ok' : 'btn-bad'}`} onClick={onNext} autoFocus>Continuar</button>
      </div>
    </footer>
  );
}

/* ---------------------- Resumo ---------------------- */
function Summary({ attempts, xp, onExit }: { attempts: ProductionAttempt[]; xp: number; onExit: () => void }) {
  const ok = attempts.filter((a) => a.correct).length;
  const ups = attempts.filter((a) => a.correct && !a.hesitant).length;
  const errs = new Map<string, number>();
  attempts.forEach((a) => a.errors.forEach((e) => errs.set(e, (errs.get(e) ?? 0) + 1)));
  return (
    <main className="complete" id="main">
      <Confetti seed={xp + 3} />
      <div style={{ maxWidth: 480, width: '100%', position: 'relative' }}>
        <h1 tabIndex={-1} ref={(el) => el?.focus()}>Sessão concluída</h1>
        <p style={{ color: 'var(--ink-2)' }}>Cada frase que você produziu sozinho fortalece o caminho português → inglês direto, sem tradução palavra por palavra.</p>
        <div className="stats">
          <div className="stat-box" style={{ borderColor: 'var(--tangerine)' }}><span style={{ color: 'var(--tangerine)' }}>XP</span><b>+{xp}</b></div>
          <div className="stat-box" style={{ borderColor: 'var(--teal)' }}><span style={{ color: 'var(--teal)' }}>Acertos</span><b>{ok}/{attempts.length}</b></div>
          <div className="stat-box" style={{ borderColor: 'var(--indigo)' }}><span style={{ color: 'var(--indigo)' }}>Subiram</span><b>{ups}</b></div>
        </div>
        {errs.size > 0 && (
          <div className="card" style={{ textAlign: 'left' }}>
            <strong>Onde você mais tropeçou</strong>
            {[...errs.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => (
              <p key={id} style={{ margin: '6px 0 0' }}><b>{ERROR_CATEGORIES[id]?.title ?? id}</b> · {n}× — {ERROR_CATEGORIES[id]?.explain}</p>
            ))}
          </div>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onExit}>Continuar</button>
      </div>
    </main>
  );
}
