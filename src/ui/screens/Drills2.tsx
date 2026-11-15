import { Fragment, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ASKS, QUICKS, TRANSFORMS } from '../../content/drills2';
import { spot } from '../../domain/coach/spotter';
import { checkAnswers, checkNumber, makeNumberItem, meanLatency, type NumberItem } from '../../domain/drills/check';
import { TRANSFORM_LABEL, type AskItem, type QuickItem, type TransformItem } from '../../domain/drills/types';
import { diffWords, normalize, type Verdict } from '../../domain/practice/answer';
import { shuffle } from '../../domain/practice/builder';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { isArtifact } from '../../infra/platform';
import { sfxComplete, sfxCorrect, sfxWrong } from '../../infra/sfx';
import { BackIcon, MicIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

/* ------------------------------------------------------------------ */
/* Peças comuns aos quatro treinos                                      */
/* ------------------------------------------------------------------ */
type Go = (r: Route) => void;

const MIC_NEEDED = 'Este treino precisa de microfone com reconhecimento de fala (Chrome, Edge ou o app do Claude).';
const MARK_STYLE = { background: 'var(--sticky)', color: '#3a2c00', padding: '0 4px', borderRadius: 4 };
const VERDICT_STYLE = { fontSize: '1.6rem', margin: 0 };
const FLAT = { margin: 0 };

/** Segundos no formato brasileiro: 1.8 vira "1,8". */
const secs = (n: number) => n.toFixed(1).replace('.', ',');
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** O ditado do artefato fica disponível um instante depois da carga: reavalia quando chegar. */
function useMicAvailable(): boolean {
  const [ok, setOk] = useState(liveAvailable);
  useEffect(() => {
    const refresh = () => setOk(liveAvailable());
    refresh();
    window.addEventListener('fluente:caps', refresh);
    return () => window.removeEventListener('fluente:caps', refresh);
  }, []);
  return ok;
}

function Listen({ text, label }: { text: string; label: string }) {
  return (
    <button type="button" className="icon-btn inline" onClick={() => void speak(text)} aria-label={label}>
      <SpeakerIcon size={16} />
    </button>
  );
}

const StopIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);

function Header({ go, title, children }: { go: Go; title: string; children: ReactNode }) {
  return (
    <>
      <button className="link-btn back" onClick={() => go({ name: 'lab' })} aria-label="Voltar para Falar"><BackIcon /> Falar</button>
      <h1 className="page-title">{title}</h1>
      <p className="muted">{children}</p>
    </>
  );
}

interface Answer {
  text: string;
  /** Duração da fala em ms; `null` quando a resposta foi digitada. */
  ms: number | null;
}

/**
 * Entrada de uma resposta: microfone com texto ao vivo ou campo de texto.
 * Monte com uma `key` por item para começar limpa a cada pergunta.
 */
function AnswerBox({ typing, setTyping, onAnswer, micLabel, inputLabel, placeholder, silenceMs = 2000, validate }: {
  typing: boolean;
  setTyping: (v: boolean) => void;
  onAnswer: (a: Answer) => void;
  micLabel: string;
  inputLabel: string;
  placeholder: string;
  silenceMs?: number;
  /** Mensagem de erro para uma resposta digitada que não deve ser conferida. */
  validate?: (text: string) => string | null;
}) {
  const mic = useMicAvailable();
  const typed = typing || !mic;
  const id = useId();
  const [on, setOn] = useState(false);
  const [live, setLive] = useState('');
  const [val, setVal] = useState('');
  const [missed, setMissed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sess = useRef<LiveSession | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sess.current?.stop();
      sess.current = null;
    };
  }, []);

  const toggle = () => {
    if (sess.current) return sess.current.stop();
    stopAudio();
    setLive('');
    setMissed(false);
    setOn(true);
    // direto no clique (o ditado do artefato exige o gesto)
    const s = startLive({ onText: (t) => { if (alive.current) setLive(t); }, silenceMs, maxMs: 20000 });
    sess.current = s;
    void s.done.then(({ text, ms }) => {
      if (sess.current === s) sess.current = null;
      if (!alive.current) return;
      setOn(false);
      const said = text.trim();
      if (!said) return setMissed(true);
      onAnswer({ text: said, ms });
    });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = val.trim();
    if (!text) return;
    const problem = validate?.(text) ?? null;
    setErr(problem);
    if (!problem) onAnswer({ text, ms: null });
  };

  return (
    <div className="stack" style={{ justifyItems: 'center', textAlign: 'center' }}>
      {typed ? (
        <form className="stack" style={{ width: '100%' }} onSubmit={submit}>
          <label className="sr-only" htmlFor={id}>{inputLabel}</label>
          <input id={id} className="text-input" lang="en" autoFocus autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            value={val} onChange={(e) => { setVal(e.target.value); setErr(null); }} placeholder={placeholder} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} />
          {err && <p id={`${id}-err`} className="tip" role="alert" style={FLAT}>{err}</p>}
          <button type="submit" className="btn btn-primary" disabled={!val.trim()}>Conferir</button>
        </form>
      ) : (
        <>
          <button type="button" className={`mic ${on ? 'listening' : ''}`} onClick={toggle} autoFocus aria-pressed={on} aria-label={on ? 'Parar de ouvir' : micLabel}>
            {on ? <StopIcon /> : <MicIcon size={44} />}
          </button>
          <span className="muted" role="status">
            {on ? 'Ouvindo. Toque de novo quando terminar.' : missed ? 'Não ouvi nada. Toque no microfone e tente de novo.' : 'Toque no microfone e fale em inglês.'}
          </span>
          {on && <p className="live-text small" lang="en">{live || '…'}</p>}
        </>
      )}
      {!on && mic && (
        <button type="button" className="link-btn" onClick={() => { setErr(null); setTyping(!typed); }} aria-label={typed ? 'Falar a resposta' : 'Digitar a resposta'}>
          {typed ? 'Falar' : 'Digitar'}
        </button>
      )}
    </div>
  );
}

/** Sorteia `n` itens; com `group`, alterna os grupos para a sessão sair misturada. */
function pickSession<T>(pool: readonly T[], n: number, group?: (item: T) => string): T[] {
  const mixed = shuffle(pool, Math.random);
  if (!group) return mixed.slice(0, n);
  const by = new Map<string, T[]>();
  for (const it of mixed) by.set(group(it), [...(by.get(group(it)) ?? []), it]);
  const lists = shuffle([...by.values()], Math.random);
  const out: T[] = [];
  for (let i = 0; out.length < n && lists.some((l) => l.length > i); i++) {
    for (const l of lists) if (i < l.length && out.length < n) out.push(l[i]);
  }
  return shuffle(out, Math.random);
}

/** A resposta aceita mais parecida com o que foi dito (em empate, a canônica). */
function closest(said: string, answers: string[]): string {
  let best = answers[0];
  let score = -1;
  for (const ans of answers) {
    const d = diffWords(said, ans);
    const s = d.filter((w) => w.ok).length / Math.max(1, d.length);
    if (s > score) {
      score = s;
      best = ans;
    }
  }
  return best;
}

const firstWord = (text: string) => normalize(text).split(' ')[0];

const VERDICT_TEXT: Record<Verdict, string> = { correct: 'Certo', almost: 'Quase', wrong: 'Ainda não' };

function SentenceFeedback({ said, verdict, answers, spoken }: { said: string; verdict: Verdict; answers: string[]; spoken: boolean }) {
  const target = verdict === 'correct' ? answers.find((x) => normalize(x) === normalize(said)) ?? answers[0] : closest(said, answers);
  // referência: a primeira forma listada com o mesmo sujeito (não troca "He" por "She")
  const canonical = answers.find((x) => firstWord(x) === firstWord(target)) ?? answers[0];
  const marks = verdict === 'wrong' ? spot(said) : [];
  const others = answers.filter((x) => x !== target && x !== canonical).slice(0, 2);
  return (
    <>
      <p className={`echo-big ${verdict === 'wrong' ? 'bad' : 'ok'}`} style={VERDICT_STYLE}>{VERDICT_TEXT[verdict]}</p>
      {verdict === 'almost' && <p className="muted" style={FLAT}>Uma palavra saiu um pouco diferente. Compare com a forma correta.</p>}
      <p style={FLAT}>
        <span className="tag">Forma correta</span>{' '}
        <b lang="en">
          {verdict === 'correct'
            ? target
            : diffWords(said, target).map((w, i) => (
              <Fragment key={i}>{i > 0 && ' '}<span className={w.ok ? 'word-ok' : 'word-miss'}>{w.word}</span></Fragment>
            ))}
        </b>{' '}
        <Listen text={target} label="Ouvir a forma correta" />
      </p>
      {target !== canonical && (
        <p className="muted" style={FLAT}>
          <span className="tag">Forma de referência</span> <span lang="en">{canonical}</span>{' '}
          <Listen text={canonical} label="Ouvir a forma de referência" />
        </p>
      )}
      {verdict !== 'correct' && (
        <p className="muted" style={FLAT}>
          <span className="tag">{spoken ? 'Você disse' : 'Você escreveu'}</span> <span lang="en">{said}</span>
        </p>
      )}
      {marks.map((m, i) => (
        <p key={i} className="err-pill" lang="en"><s>{m.wrong}</s> → <b>{m.fix}</b> <small lang="pt-BR">· {m.explain}</small></p>
      ))}
      {others.length > 0 && <p className="fine">Também vale: <span lang="en">{others.join(' · ')}</span></p>}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sessão de frases (base de "Transforme" e "Faça a pergunta")          */
/* ------------------------------------------------------------------ */
const SESSION = 10;

function SentenceDrill<T extends { id: string; answers: string[] }>({ go, title, intro, newSession, prompt, micLabel, inputLabel, placeholder, unit }: {
  go: Go;
  title: string;
  intro: string;
  newSession: () => T[];
  prompt: (item: T) => ReactNode;
  micLabel: string;
  inputLabel: string;
  placeholder: string;
  /** Nome do item no singular e no plural: ["frase", "frases"]. */
  unit: [string, string];
}) {
  const store = useStore();
  const [queue, setQueue] = useState<T[]>(newSession);
  const [size, setSize] = useState(queue.length);
  const [pos, setPos] = useState(0);
  const [out, setOut] = useState<{ said: string; verdict: Verdict; spoken: boolean } | null>(null);
  const [typing, setTyping] = useState(() => !liveAvailable());
  const [firstOk, setFirstOk] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => () => stopAudio(), []);

  const item = queue[pos];
  const isRetry = pos >= size;
  const back = queue.length - size;

  const answer = ({ text, ms }: Answer) => {
    const verdict = checkAnswers(text, item.answers);
    setOut({ said: text, verdict, spoken: ms !== null });
    if (ms !== null) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1 });
      store.track('spoken');
    }
    if (verdict === 'wrong') {
      sfxWrong();
      // volta uma única vez, no fim da fila
      if (!isRetry) setQueue((q) => [...q, item]);
    } else {
      sfxCorrect(1);
      if (isRetry) setFixed((n) => n + 1);
      else setFirstOk((n) => n + 1);
    }
  };
  const next = () => {
    stopAudio();
    if (pos + 1 >= queue.length) {
      sfxComplete();
      store.gainXp(Math.min(30, 10 + firstOk * 2));
      setDone(true);
    } else {
      setPos(pos + 1);
      setOut(null);
    }
  };
  const restart = () => {
    const fresh = newSession();
    setQueue(fresh);
    setSize(fresh.length);
    setPos(0);
    setOut(null);
    setFirstOk(0);
    setFixed(0);
    setDone(false);
  };

  return (
    <main className="shell" id="main">
      <Header go={go} title={title}>{intro}</Header>
      <section className="card stack">
        {!done && (
          <>
            <div className="row-between">
              <span className="ex-kicker">
                {isRetry ? `De volta: ${pos - size + 1} de ${back}` : `${unit[0]} ${pos + 1} de ${size}`}
              </span>
              <span className="muted">{firstOk} de primeira</span>
            </div>
            {prompt(item)}
            {!out && (
              <AnswerBox key={pos} typing={typing} setTyping={setTyping} onAnswer={answer} micLabel={micLabel} inputLabel={inputLabel} placeholder={placeholder} />
            )}
          </>
        )}
        <div aria-live="polite">
          {!done && out && (
            <div className="stack">
              <SentenceFeedback said={out.said} verdict={out.verdict} answers={item.answers} spoken={out.spoken} />
              {out.verdict === 'wrong' && !isRetry && <p className="fine">Essa volta mais uma vez no fim da sessão.</p>}
              <div className="row">
                <button className="btn btn-primary" autoFocus onClick={next}>{pos + 1 >= queue.length ? 'Ver resultado' : 'Próxima'}</button>
              </div>
            </div>
          )}
          {done && (
            <div className="stack">
              <h2 className="card-h" style={FLAT}>{firstOk} de {size} certas de primeira</h2>
              <div className="cp-tiles">
                <div className="cp-tile"><span className="tag">De primeira</span><b>{firstOk}</b><small className="muted">de {size} {unit[1]}</small></div>
                <div className="cp-tile"><span className="tag">Na segunda chance</span><b>{fixed}</b><small className="muted">{back === 0 ? 'nenhuma precisou voltar' : `de ${back} que voltaram`}</small></div>
              </div>
              <p className="muted" style={FLAT}>
                {firstOk === size
                  ? 'Sessão limpa. O próximo passo é dizer essas formas sem pensar: repita amanhã e repare se sai mais rápido.'
                  : firstOk >= size * 0.7
                    ? 'Boa sessão. As que voltaram são as que ainda pedem atenção: elas costumam sair certas na próxima vez.'
                    : 'Essas estruturas ainda estão em construção, e isso é normal. Refazer a sessão logo em seguida ajuda a fixar a forma.'}
              </p>
              <div className="row">
                <button className="btn btn-primary" autoFocus onClick={restart}>De novo</button>
                <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Transforme: dizer a variação pedida                                  */
/* ------------------------------------------------------------------ */
export function TransformDrill({ go }: { go: (r: Route) => void }) {
  return (
    <SentenceDrill<TransformItem>
      go={go}
      title="Transforme"
      intro="Você vê uma frase simples e diz a variação pedida: negativa, pergunta, passado, ele ou ela, futuro ou present perfect. São 10 frases por sessão, e as que saírem erradas voltam uma vez no fim."
      newSession={() => pickSession(TRANSFORMS, SESSION, (t) => t.kind)}
      unit={['Frase', 'frases']}
      micLabel="Dizer a frase transformada"
      inputLabel="Frase transformada, em inglês"
      placeholder="Digite a frase em inglês…"
      prompt={(it) => (
        <>
          <p className="pt-prompt" lang="en" style={FLAT}>
            {it.base} <Listen text={it.base} label="Ouvir a frase" />
          </p>
          {it.pt && <p className="muted" style={FLAT}>{it.pt}</p>}
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{TRANSFORM_LABEL[it.kind]}</p>
        </>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Faça a pergunta: da resposta para a pergunta                         */
/* ------------------------------------------------------------------ */
function Highlighted({ text, focus }: { text: string; focus: string }) {
  const i = focus ? text.indexOf(focus) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark style={MARK_STYLE}>{focus}</mark>{text.slice(i + focus.length)}</>;
}

export function AskDrill({ go }: { go: (r: Route) => void }) {
  return (
    <SentenceDrill<AskItem>
      go={go}
      title="Faça a pergunta"
      intro="Você vê uma resposta com um trecho destacado e faz a pergunta que leva a esse trecho. Quem sabe perguntar mantém a conversa andando. São 10 por sessão, e as que saírem erradas voltam uma vez no fim."
      newSession={() => pickSession(ASKS, SESSION)}
      unit={['Pergunta', 'perguntas']}
      micLabel="Dizer a pergunta"
      inputLabel="Pergunta, em inglês"
      placeholder="Digite a pergunta em inglês…"
      prompt={(it) => (
        <>
          <span className="tag">A resposta é</span>
          <p className="pt-prompt" lang="en" style={FLAT}>
            <Highlighted text={it.statement} focus={it.focus} /> <Listen text={it.statement} label="Ouvir a resposta" />
          </p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{it.pt}</p>
        </>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Resposta rápida: ouvir a pergunta e começar a falar logo             */
/* ------------------------------------------------------------------ */
const QUICK_N = 8;
/** Respostas medidas necessárias para a média valer como melhor marca. */
const QUICK_MIN = 4;
/** Em conversa real, começar a responder em até uns 2 s soa natural. */
const NATURAL_MS = 2000;
const QUICK_BEST = 'quick.latency';

export function QuickResponse({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const mic = useMicAvailable();
  const [items, setItems] = useState<QuickItem[]>(() => pickSession(QUICKS, QUICK_N));
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<'ready' | 'playing' | 'tap' | 'listen' | 'result' | 'end'>('ready');
  const [live, setLive] = useState('');
  const [res, setRes] = useState<{ said: string; lat: number | null; counted: boolean } | null>(null);
  /** Latências em ms: só a primeira resposta medida de cada pergunta. */
  const [lats, setLats] = useState<number[]>([]);
  const [summary, setSummary] = useState<{ mean: number; best: number | null; record: boolean } | null>(null);
  const sess = useRef<LiveSession | null>(null);
  const alive = useRef(true);
  const audioEnd = useRef(0);
  const measured = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sess.current?.stop();
      sess.current = null;
      stopAudio();
    };
  }, []);
  const item = items[idx];

  const listen = () => {
    let first = 0;
    setLive('');
    setStage('listen');
    const s = startLive({
      onText: (t) => {
        // primeira palavra reconhecida: é aqui que a latência para de contar
        if (!first && t.trim()) first = Date.now();
        if (alive.current) setLive(t);
      },
      silenceMs: 2500,
      maxMs: 25000,
    });
    sess.current = s;
    void s.done.then(({ text, ms }) => {
      if (sess.current === s) sess.current = null;
      if (!alive.current) return;
      const said = text.trim();
      const lat = said && first ? Math.max(0, first - audioEnd.current) : null;
      const counted = lat !== null && !measured.current;
      if (said) {
        const seg = Math.round((lat ?? 0) / 10) / 100;
        store.logDay({ spokenSec: ms / 1000, spoken: 1, ...(counted ? { latSum: seg, latN: 1 } : {}) });
        store.track('spoken');
        sfxCorrect(1);
      }
      if (counted && lat !== null) {
        measured.current = true;
        setLats((l) => [...l, lat]);
      }
      setRes({ said, lat, counted });
      setStage('result');
    });
  };
  /** Fala a pergunta sem mostrar o texto e, quando o áudio termina, abre o microfone. */
  const ask = async (question: QuickItem, variant: number) => {
    setRes(null);
    setLive('');
    setStage('playing');
    try {
      await speak(question.en, { variant });
    } catch {
      /* sem áudio: segue para a resposta */
    }
    if (!alive.current) return;
    audioEnd.current = Date.now();
    // no artefato o ditado só abre com um toque: mostra o microfone
    if (isArtifact) setStage('tap');
    else listen();
  };
  const finish = () => {
    const mean = meanLatency(lats);
    const prev = store.state.bests[QUICK_BEST];
    const record = lats.length >= QUICK_MIN && (prev === undefined || mean < prev);
    if (record) store.set((s) => ({ ...s, bests: { ...s.bests, [QUICK_BEST]: mean } }));
    sfxComplete();
    store.gainXp(Math.min(30, 10 + lats.length * 2));
    setSummary({ mean, best: record ? mean : prev ?? null, record });
    setStage('end');
  };
  const next = () => {
    stopAudio();
    measured.current = false;
    if (idx + 1 >= items.length) return finish();
    setIdx(idx + 1);
    void ask(items[idx + 1], idx + 1);
  };
  const restart = () => {
    measured.current = false;
    setItems(pickSession(QUICKS, QUICK_N));
    setIdx(0);
    setLats([]);
    setRes(null);
    setSummary(null);
    setStage('ready');
  };
  const short = !!res && res.said !== '' && wordCount(res.said) < 4;

  return (
    <main className="shell" id="main">
      <Header go={go} title="Resposta rápida">
        Você ouve uma pergunta, sem ver o texto, e responde em voz alta com uma frase completa. O app mede quanto tempo você leva para começar a falar. São {QUICK_N} perguntas.
      </Header>
      {!mic ? <p className="tip">{MIC_NEEDED}</p> : (
        <section className="card stack" style={{ textAlign: 'center' }}>
          {stage !== 'end' && <span className="ex-kicker">Pergunta {idx + 1} de {items.length}</span>}
          {stage === 'ready' && (
            <>
              <p className="muted" style={FLAT}>
                {isArtifact
                  ? 'Ao tocar, você ouve a pergunta. Quando ela terminar, toque no microfone e responda na hora.'
                  : 'Ao tocar, você ouve a pergunta. Quando ela terminar, o microfone abre sozinho: responda na hora.'}
              </p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primary" autoFocus onClick={() => void ask(item, idx)}>Estou pronto</button>
              </div>
            </>
          )}
          {stage === 'playing' && <p role="status" className="echo-big">Ouça…</p>}
          {stage === 'tap' && (
            <>
              <button type="button" className="mic" autoFocus onClick={listen} aria-label="Responder agora"><MicIcon size={44} /></button>
              <span className="muted" role="status">Toque e responda agora</span>
            </>
          )}
          {stage === 'listen' && (
            <>
              <button type="button" className="mic listening" autoFocus onClick={() => sess.current?.stop()} aria-label="Encerrar a resposta"><StopIcon /></button>
              <span className="muted" role="status">{live ? 'Ouvindo. Toque quando terminar.' : 'Sua vez: responda agora'}</span>
              {live && <p className="live-text small" lang="en" style={{ margin: '0 auto' }}>{live}</p>}
            </>
          )}
          <div aria-live="polite">
            {stage === 'result' && res && (
              <div className="stack">
                {res.lat !== null ? (
                  <div>
                    <p className={`echo-big ${res.lat <= NATURAL_MS ? 'ok' : ''}`}>{secs(res.lat / 1000)} s</p>
                    <span className="muted">
                      até a primeira palavra{res.counted ? '' : ' (nova tentativa: não entra na média)'}
                    </span>
                  </div>
                ) : (
                  <p className="tip" style={FLAT}>Não ouvi a sua resposta. Tente de novo e fale assim que a pergunta terminar.</p>
                )}
                <p style={FLAT}>
                  <span className="tag">Pergunta</span> <b lang="en">{item.en}</b> <Listen text={item.en} label="Ouvir a pergunta de novo" />
                </p>
                <p className="muted" style={FLAT}>{item.pt}</p>
                {res.said && <p className="muted" style={FLAT}><span className="tag">Você disse</span> <span lang="en">{res.said}</span></p>}
                {(short || !res.said) && (
                  <p className="tip" style={FLAT}>
                    <span>{short ? 'Responda com uma frase completa, não só com uma ou duas palavras. ' : ''}Você pode começar assim: <b lang="en">{item.starter}</b></span>
                  </p>
                )}
                <div className="row" style={{ justifyContent: 'center' }}>
                  {(short || !res.said) && <button className="btn btn-ghost" onClick={() => void ask(item, idx + 1)}>Tentar de novo</button>}
                  <button className="btn btn-primary" autoFocus onClick={next}>{idx + 1 >= items.length ? 'Ver resultado' : 'Próxima pergunta'}</button>
                </div>
              </div>
            )}
            {stage === 'end' && summary && (
              <div className="stack" style={{ textAlign: 'left' }}>
                <h2 className="card-h" style={FLAT}>
                  {lats.length ? `Você levou em média ${secs(summary.mean)} s para começar a falar` : 'Nenhuma resposta foi medida'}
                </h2>
                <div className="cp-tiles">
                  <div className="cp-tile"><span className="tag">Latência média</span><b>{lats.length ? `${secs(summary.mean)} s` : 'sem medida'}</b><small className="muted">{lats.length} de {items.length} respostas medidas</small></div>
                  <div className="cp-tile"><span className="tag">Melhor marca</span><b>{summary.best !== null ? `${secs(summary.best)} s` : 'ainda não há'}</b><small className="muted">{summary.record ? 'novo recorde nesta sessão' : 'menor média já registrada'}</small></div>
                </div>
                <p className="muted" style={FLAT}>
                  Em conversa real, começar a responder em até uns 2 segundos soa natural.{' '}
                  {!lats.length
                    ? 'Refaça a sessão respondendo em voz alta logo depois de cada pergunta.'
                    : summary.mean * 1000 <= NATURAL_MS
                      ? 'Você está dentro desse ritmo: agora tente respostas mais longas sem perder a largada.'
                      : 'Acima disso a outra pessoa percebe a pausa. Comece com um bloco pronto (Well, I usually…) e monte o resto enquanto fala.'}
                </p>
                {lats.length > 0 && lats.length < QUICK_MIN && <p className="fine">A melhor marca só é atualizada com pelo menos {QUICK_MIN} respostas medidas.</p>}
                <div className="row">
                  <button className="btn btn-primary" autoFocus onClick={restart}>De novo</button>
                  <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Números em voz alta                                                  */
/* ------------------------------------------------------------------ */
const NUMBERS_N = 10;
const NUMBERS_BEST = 'numbers.streak';
const KIND_PT: Record<NumberItem['kind'], string> = {
  integer: 'Número', percent: 'Porcentagem', price: 'Preço', year: 'Ano', time: 'Hora', decimal: 'Decimal', date: 'Data',
};

function numberSession(seed: number): NumberItem[] {
  const out: NumberItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < NUMBERS_N && i < NUMBERS_N * 20; i++) {
    const it = makeNumberItem(seed + i);
    if (seen.has(it.display)) continue;
    seen.add(it.display);
    out.push(it);
  }
  return out;
}

export function NumbersDrill({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const [seed, setSeed] = useState(() => Date.now());
  const items = useMemo(() => numberSession(seed), [seed]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(() => !liveAvailable());
  const [out, setOut] = useState<{ said: string; ok: boolean; spoken: boolean } | null>(null);
  const [right, setRight] = useState(0);
  /** Sequência atual: continua de uma sessão para a outra enquanto não houver erro. */
  const [streak, setStreak] = useState(0);
  const [startBest, setStartBest] = useState(() => store.state.bests[NUMBERS_BEST] ?? 0);
  const [done, setDone] = useState(false);
  useEffect(() => () => stopAudio(), []);

  const item = items[idx];
  const best = store.state.bests[NUMBERS_BEST] ?? 0;

  const answer = ({ text, ms }: Answer) => {
    const ok = checkNumber(item, text);
    setOut({ said: text, ok, spoken: ms !== null });
    if (ms !== null) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1 });
      store.track('spoken');
    }
    if (ok) {
      const run = streak + 1;
      sfxCorrect(run);
      setRight((n) => n + 1);
      setStreak(run);
      // o recorde é salvo na hora, para não se perder se a pessoa sair no meio
      store.set((s) => ((s.bests[NUMBERS_BEST] ?? 0) >= run ? s : { ...s, bests: { ...s.bests, [NUMBERS_BEST]: run } }));
    } else {
      sfxWrong();
      setStreak(0);
    }
  };
  const next = () => {
    stopAudio();
    if (idx + 1 >= items.length) {
      sfxComplete();
      store.gainXp(Math.min(30, 10 + right * 2));
      setDone(true);
    } else {
      setIdx(idx + 1);
      setOut(null);
    }
  };
  const restart = () => {
    setSeed(Date.now());
    setIdx(0);
    setOut(null);
    setRight(0);
    setStartBest(best);
    setDone(false);
  };

  return (
    <main className="shell" id="main">
      <Header go={go} title="Números em voz alta">
        Número é onde a fala costuma travar, porque a cabeça quer dizer em português. Diga em inglês o que aparece na tela: quantidades, porcentagens, preços, anos, horas e datas. São {NUMBERS_N} por sessão.
      </Header>
      <section className="card stack" style={{ textAlign: 'center' }}>
        {!done && (
          <>
            <div className="row-between">
              <span className="ex-kicker">{idx + 1} de {items.length} · {KIND_PT[item.kind]}</span>
              <span className="muted">Sequência: <b>{streak}</b> · Recorde: <b>{best}</b></span>
            </div>
            <p className="echo-big" lang="en">{item.display}</p>
            {!out && (
              <AnswerBox key={`${seed}:${idx}`} typing={typing} setTyping={setTyping} onAnswer={answer} silenceMs={1600}
                micLabel={`Dizer em inglês: ${KIND_PT[item.kind].toLowerCase()}`} inputLabel="Como se diz, por extenso, em inglês" placeholder="Escreva por extenso em inglês…"
                validate={(t) => (/\d/.test(t) ? 'Escreva por extenso, com palavras: os dígitos já estão na tela.' : null)} />
            )}
          </>
        )}
        <div aria-live="polite">
          {!done && out && (
            <div className="stack">
              <p className={`echo-big ${out.ok ? 'ok' : 'bad'}`} style={VERDICT_STYLE}>{out.ok ? 'Certo' : 'Ainda não'}</p>
              <p style={FLAT}>
                <span className="tag">Como se diz</span> <b lang="en">{item.spoken[0]}</b> <Listen text={item.spoken[0]} label="Ouvir como se diz" />
              </p>
              {item.spoken.length > 1 && <p className="fine">Também se diz: <span lang="en">{item.spoken.slice(1, 3).join(' · ')}</span></p>}
              <p className="muted" style={FLAT}><span className="tag">{out.spoken ? 'Você disse' : 'Você escreveu'}</span> <span lang="en">{out.said}</span></p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primary" autoFocus onClick={next}>{idx + 1 >= items.length ? 'Ver resultado' : 'Próximo'}</button>
              </div>
            </div>
          )}
          {done && (
            <div className="stack" style={{ textAlign: 'left' }}>
              <h2 className="card-h" style={FLAT}>{right} de {items.length} números certos</h2>
              <div className="cp-tiles">
                <div className="cp-tile"><span className="tag">Acertos</span><b>{right}</b><small className="muted">de {items.length} números</small></div>
                <div className="cp-tile"><span className="tag">Sequência atual</span><b>{streak}</b><small className="muted">continua na próxima sessão</small></div>
                <div className="cp-tile"><span className="tag">Recorde</span><b>{best}</b><small className="muted">{best > startBest ? 'novo recorde de acertos seguidos' : 'acertos seguidos'}</small></div>
              </div>
              <p className="muted" style={FLAT}>
                {right === items.length
                  ? 'Todos certos. Repita em outro dia: número só fica automático com repetição espaçada.'
                  : 'Repare nos que falharam: os pares como thirteen e thirty mudam a sílaba forte (thirTEEN, THIRty), e é ela que o ouvinte usa para entender.'}
              </p>
              <div className="row">
                <button className="btn btn-primary" autoFocus onClick={restart}>De novo</button>
                <button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
