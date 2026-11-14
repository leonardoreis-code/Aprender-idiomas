import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../../domain/practice/types';
import { checkTyped } from '../../domain/practice/answer';
import { scoreSpeech, tipFor, type SpeechScore } from '../../domain/pronunciation/score';
import { speak } from '../../infra/audio';
import { listen, speechRecognitionSupported } from '../../infra/speech';
import { sfxTap } from '../../infra/sfx';
import { ItemIcon } from '../icons/ItemIcon';
import { BulbIcon, MicIcon, SpeakerIcon, TurtleIcon } from '../icons/ui';
import { MouthDiagram } from './Graphics';

export interface Result {
  correct: boolean;
  graded: boolean;
  hesitant?: boolean;
  /** Resposta correta a mostrar no feedback. */
  solution?: string;
  /** Tradução / transcrição complementar. */
  note?: string;
  speech?: SpeechScore;
  skipped?: boolean;
}

export interface ExProps<T extends Exercise['type']> {
  ex: Extract<Exercise, { type: T }>;
  onResult: (r: Result) => void;
  answered: boolean;
  slow: boolean;
  mic: boolean;
}

/* ---------- utilidades ---------- */

function PlayButtons({ text, slow, autoplay = true, variant = 0 }: { text: string; slow: boolean; autoplay?: boolean; variant?: number }) {
  useEffect(() => {
    if (autoplay) void speak(text, { slow, variant });
  }, [text, autoplay, slow, variant]);
  return (
    <div className="play-row">
      <button className="play" type="button" onClick={() => speak(text, { variant })} aria-label="Ouvir de novo (atalho: espaço)" data-hotkey="play">
        <SpeakerIcon size={38} />
      </button>
      <button className="play small" type="button" onClick={() => speak(text, { slow: true, variant })} aria-label="Ouvir devagar">
        <TurtleIcon size={28} />
      </button>
    </div>
  );
}

function CheckBar({ disabled, onCheck, label = 'Verificar' }: { disabled: boolean; onCheck: () => void; label?: string }) {
  return (
    <div className="footer" style={{ marginTop: 24, position: 'static', borderTop: 0, padding: '8px 0' }}>
      <button className="btn btn-primary btn-block" disabled={disabled} onClick={onCheck} type="button">
        {label}
      </button>
    </div>
  );
}

/** Hook de atalhos numéricos 1–9 para opções. */
function useNumberKeys(count: number, onPick: (i: number) => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) {
        e.preventDefault();
        onPick(n - 1);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [count, onPick, active]);
}

/** Enter verifica quando há algo selecionado. */
function useEnter(fn: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fn, active]);
}

/* ---------- Intro (apresentação) ---------- */

export function Intro({ ex, onResult, slow }: ExProps<'intro'>) {
  const { item } = ex;
  useEnter(() => onResult({ correct: true, graded: false }), true);
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">{item.kind === 'chunk' ? 'Nova expressão' : 'Nova palavra'}</p>
      <h1 id="ex-h" className="sr-only">Aprenda: {item.en}</h1>
      <div className="intro-card card pop-in">
        {item.icon && <ItemIcon name={item.icon} size={110} />}
        <div className="intro-word" lang="en">{item.en}</div>
        {item.ipa && <div className="ipa">{item.ipa}</div>}
        <div className="pt">{item.pt}</div>
        <PlayButtons text={item.en} slow={slow} />
        {item.tip && (
          <p className="tip"><BulbIcon /> <span>{item.tip}</span></p>
        )}
      </div>
      <CheckBar disabled={false} onCheck={() => onResult({ correct: true, graded: false })} label="Entendi" />
    </section>
  );
}

/* ---------- Sound intro ---------- */

export function SoundIntro({ ex, onResult }: ExProps<'sound-intro'>) {
  const { sound } = ex;
  useEnter(() => onResult({ correct: true, graded: false }), true);
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Laboratório de pronúncia</p>
      <h1 id="ex-h" className="ex-title">{sound.title}</h1>
      <div className="card sound-card">
        {sound.mouth && <MouthDiagram mouth={sound.mouth} />}
        <div>
          <p style={{ marginTop: 0 }}>{sound.howTo}</p>
          <div className="options">
            {sound.pairs.slice(0, 2).map((p) => (
              <div key={p.a} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="chip" type="button" onClick={() => speak(p.a)} lang="en">▶ {p.a} <span className="ipa">{p.ipaA}</span></button>
                <button className="chip" type="button" onClick={() => speak(p.b, { variant: 1 })} lang="en">▶ {p.b} <span className="ipa">{p.ipaB}</span></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CheckBar disabled={false} onCheck={() => onResult({ correct: true, graded: false })} label="Vamos treinar" />
    </section>
  );
}

/* ---------- Escolha (ouvir / traduzir / lacuna) ---------- */

function Choice({ options, answer, answered, onResult, note, columns }: {
  options: string[]; answer: string; answered: boolean; onResult: (r: Result) => void; note?: string; columns?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const check = () => {
    if (picked === null || answered) return;
    const ok = options[picked] === answer;
    onResult({ correct: ok, graded: true, solution: answer, note });
  };
  useNumberKeys(options.length, (i) => { if (!answered) { sfxTap(); setPicked(i); } }, !answered);
  useEnter(check, !answered && picked !== null);
  return (
    <>
      <div className={`options ${columns ? 'two' : ''}`} role="radiogroup" aria-label="Opções">
        {options.map((o, i) => {
          const state = answered ? (o === answer ? 'is-ok' : picked === i ? 'is-bad' : '') : '';
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={picked === i}
              className={`option ${state}`}
              disabled={answered}
              onClick={() => { sfxTap(); setPicked(i); }}
              lang="en"
            >
              <span className="kbd" aria-hidden>{i + 1}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {!answered && <CheckBar disabled={picked === null} onCheck={check} />}
    </>
  );
}

export function ListenChoose({ ex, onResult, answered, slow }: ExProps<'listen-choose'>) {
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Escuta</p>
      <h1 id="ex-h" className="ex-title">O que você ouviu?</h1>
      <PlayButtons text={ex.audio} slow={slow} />
      <Choice options={ex.options} answer={ex.answer} answered={answered} onResult={onResult} columns />
    </section>
  );
}

export function PtToEn({ ex, onResult, answered }: ExProps<'pt-to-en-choose'>) {
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Tradução</p>
      <h1 id="ex-h" className="ex-title">Como se diz <q>{ex.prompt}</q>?</h1>
      <Choice options={ex.options} answer={ex.answer} answered={answered} onResult={(r) => { onResult(r); if (r.correct) void speak(ex.answer); }} columns />
    </section>
  );
}

export function FillGap({ ex, onResult, answered }: ExProps<'fill-gap'>) {
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Complete</p>
      <h1 id="ex-h" className="ex-title">Complete a frase</h1>
      <p className="gap-sentence" lang="en">
        {ex.before}<span className="gap-slot" aria-label="lacuna">{answered ? ex.answer : ' '}</span>{ex.after}
      </p>
      <p className="pt" style={{ marginTop: -10, marginBottom: 18 }}>{ex.pt}</p>
      <Choice options={ex.options} answer={ex.answer} answered={answered} onResult={(r) => { onResult({ ...r, solution: ex.full }); void speak(ex.full); }} />
    </section>
  );
}

/* ---------- Pares ---------- */

export function MatchPairs({ ex, onResult, answered }: ExProps<'match-pairs'>) {
  const left = useMemo(() => ex.pairs.map((p) => p.en), [ex]);
  const right = useMemo(() => [...ex.pairs.map((p) => p.pt)].sort((a, b) => a.localeCompare(b)), [ex]);
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (!selL || !selR) return;
    const pair = ex.pairs.find((p) => p.en === selL);
    if (pair?.pt === selR) {
      sfxTap();
      const next = [...matched, selL];
      setMatched(next);
      void speak(selL);
      if (next.length === ex.pairs.length) {
        setTimeout(() => onResult({ correct: mistakes <= 1, hesitant: mistakes === 1, graded: true, note: mistakes ? `${mistakes} tentativa(s) errada(s)` : undefined }), 350);
      }
    } else {
      setWrong(selL + selR);
      setMistakes((m) => m + 1);
      setTimeout(() => setWrong(null), 450);
    }
    setSelL(null);
    setSelR(null);
  }, [selL, selR]); // eslint-disable-line react-hooks/exhaustive-deps

  const ptOf = (en: string) => ex.pairs.find((p) => p.en === en)?.pt;
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Combine</p>
      <h1 id="ex-h" className="ex-title">Toque nos pares</h1>
      <div className="pairs">
        <div className="options" aria-label="Inglês">
          {left.map((w) => (
            <button key={w} type="button" lang="en" disabled={answered || matched.includes(w)}
              className={`option ${matched.includes(w) ? 'gone is-ok' : ''} ${wrong?.startsWith(w) ? 'is-bad shake' : ''}`}
              aria-pressed={selL === w} onClick={() => { void speak(w); setSelL(w); }}>{w}</button>
          ))}
        </div>
        <div className="options" aria-label="Português">
          {right.map((w) => {
            const done = matched.some((m) => ptOf(m) === w);
            return (
              <button key={w} type="button" disabled={answered || done}
                className={`option ${done ? 'gone is-ok' : ''} ${wrong?.endsWith(w) ? 'is-bad shake' : ''}`}
                aria-pressed={selR === w} onClick={() => setSelR(w)}>{w}</button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Montar frase ---------- */

export function WordBank({ ex, onResult, answered }: ExProps<'word-bank'>) {
  const [chosen, setChosen] = useState<number[]>([]);
  const text = chosen.map((i) => ex.bank[i]).join(' ');
  const check = () => {
    if (!chosen.length || answered) return;
    const v = checkTyped(text, ex.accepted);
    onResult({ correct: v !== 'wrong', hesitant: v === 'almost', graded: true, solution: ex.accepted[0], note: ex.prompt });
    void speak(ex.accepted[0]);
  };
  useEnter(check, !answered && chosen.length > 0);
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Monte a frase</p>
      <h1 id="ex-h" className="ex-title">Escreva em inglês: <q>{ex.prompt}</q></h1>
      <div className="answer-line" aria-label="Sua resposta" aria-live="polite" lang="en">
        {chosen.map((i, pos) => (
          <button key={`${i}-${pos}`} className="chip pop-in" type="button" disabled={answered}
            onClick={() => setChosen(chosen.filter((_, p) => p !== pos))} aria-label={`Remover ${ex.bank[i]}`}>
            {ex.bank[i]}
          </button>
        ))}
      </div>
      <div className="bank" aria-label="Palavras disponíveis" lang="en">
        {ex.bank.map((w, i) => (
          <button key={`${w}-${i}`} type="button" className={`chip ${chosen.includes(i) ? 'used' : ''}`}
            disabled={answered || chosen.includes(i)} aria-hidden={chosen.includes(i)}
            onClick={() => { sfxTap(); setChosen([...chosen, i]); }}>{w}</button>
        ))}
      </div>
      {!answered && <CheckBar disabled={!chosen.length} onCheck={check} />}
    </section>
  );
}

/* ---------- Ditado ---------- */

export function Dictation({ ex, onResult, answered, slow }: ExProps<'dictation'>) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const check = () => {
    if (!value.trim() || answered) return;
    const v = checkTyped(value, ex.accepted);
    onResult({ correct: v !== 'wrong', hesitant: v === 'almost', graded: true, solution: ex.accepted[0], note: ex.pt });
  };
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Ditado</p>
      <h1 id="ex-h" className="ex-title">Escreva o que você ouvir</h1>
      <PlayButtons text={ex.audio} slow={slow} />
      <form onSubmit={(e) => { e.preventDefault(); check(); }}>
        <label htmlFor="dict" className="sr-only">Digite em inglês</label>
        <input id="dict" ref={ref} className="text-input" lang="en" autoComplete="off" autoCapitalize="off" spellCheck={false}
          value={value} onChange={(e) => setValue(e.target.value)} disabled={answered} placeholder="Digite em inglês…" />
        {!answered && <CheckBar disabled={!value.trim()} onCheck={check} />}
      </form>
    </section>
  );
}

/* ---------- Fala ---------- */

export function Speak({ ex, onResult, answered, slow, mic }: ExProps<'speak'>) {
  const [state, setState] = useState<'idle' | 'listening' | 'error'>('idle');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [tries, setTries] = useState(0);
  const supported = speechRecognitionSupported() && mic;

  const skip = () => onResult({ correct: true, graded: false, skipped: true, note: 'Exercício de fala pulado — sem penalidade.' });

  const record = async () => {
    setState('listening');
    try {
      const alts = await listen('en-US').result;
      const s = scoreSpeech(ex.text, alts);
      setScore(s);
      setState('idle');
      const n = tries + 1;
      setTries(n);
      if (s.verdict !== 'retry' || n >= 3) {
        const missed = s.words.filter((w) => !w.ok).map((w) => w.word);
        onResult({
          correct: s.verdict !== 'retry',
          hesitant: s.verdict === 'good' || n > 1,
          graded: true,
          speech: s,
          solution: ex.text,
          note: tipFor(missed) ?? ex.tip ?? undefined,
        });
      }
    } catch {
      setState('error');
    }
  };

  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Fale</p>
      <h1 id="ex-h" className="ex-title">Leia em voz alta</h1>
      <PlayButtons text={ex.text} slow={slow} />
      <p className="speak-target" lang="en">
        {score
          ? score.words.map((w, i) => <span key={i} className={w.ok ? 'word-ok' : 'word-miss'}>{w.word} </span>)
          : ex.text}
      </p>
      <p className="pt" style={{ textAlign: 'center' }}>{ex.pt}</p>
      {score && !answered && (
        <p className="score-meter" role="status">
          {score.score}/100 — {score.verdict === 'retry' ? 'quase! tente de novo, devagar.' : 'boa!'}
        </p>
      )}
      {ex.tip && !answered && <p className="tip"><BulbIcon /> <span>{ex.tip}</span></p>}
      {!answered && (
        supported ? (
          <>
            <button type="button" className={`mic ${state === 'listening' ? 'listening' : ''}`} onClick={record}
              disabled={state === 'listening'} aria-label={state === 'listening' ? 'Ouvindo…' : 'Gravar minha voz'}>
              <MicIcon size={44} />
            </button>
            <p role="status" style={{ textAlign: 'center', minHeight: 24, color: 'var(--ink-2)' }}>
              {state === 'listening' ? 'Ouvindo… fale agora' : state === 'error' ? 'Não consegui acessar o microfone.' : 'Toque no microfone e fale'}
            </p>
          </>
        ) : (
          <p className="tip"><BulbIcon /> <span>Seu navegador não reconhece fala (ou o microfone está desligado nos ajustes). Repita em voz alta — o shadowing já ajuda — e continue.</span></p>
        )
      )}
      {!answered && (
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="link-btn" onClick={skip}>Não posso falar agora</button>
        </div>
      )}
    </section>
  );
}

/* ---------- Pares mínimos (HVPT) ---------- */

export function MinimalPairEx({ ex, onResult, answered }: ExProps<'minimal-pair'>) {
  const word = ex.target === 'a' ? ex.pair.a : ex.pair.b;
  // varia a voz a cada exercício: treino fonético de alta variabilidade
  const variant = useMemo(() => Math.floor(Math.random() * 3), []);
  const opts = [ex.pair.a, ex.pair.b];
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => { void speak(word, { variant }); }, [word, variant]);
  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    onResult({ correct: opts[i] === word, graded: true, solution: word, note: `${ex.pair.contrast}: ${ex.pair.a} ${ex.pair.ipaA} · ${ex.pair.b} ${ex.pair.ipaB}` });
  };
  useNumberKeys(2, pick, !answered);
  return (
    <section aria-labelledby="ex-h">
      <p className="ex-kicker">Ouvido treinado · {ex.pair.contrast}</p>
      <h1 id="ex-h" className="ex-title">Qual palavra você ouviu?</h1>
      <div className="play-row">
        <button className="play" type="button" onClick={() => speak(word, { variant })} aria-label="Ouvir de novo" data-hotkey="play">
          <SpeakerIcon size={38} />
        </button>
      </div>
      <div className="options two" role="radiogroup">
        {opts.map((o, i) => (
          <button key={o} type="button" role="radio" aria-checked={picked === i} lang="en" disabled={answered}
            className={`option ${answered ? (o === word ? 'is-ok' : picked === i ? 'is-bad' : '') : ''}`}
            onClick={() => pick(i)} style={{ justifyContent: 'space-between' }}>
            <span><span className="kbd" aria-hidden>{i + 1}</span> {o}</span>
            <span className="ipa">{i === 0 ? ex.pair.ipaA : ex.pair.ipaB}</span>
          </button>
        ))}
      </div>
      {answered && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="chip" type="button" onClick={() => speak(ex.pair.a, { variant })}>▶ {ex.pair.a}</button>
          <button className="chip" type="button" onClick={() => speak(ex.pair.b, { variant })}>▶ {ex.pair.b}</button>
        </div>
      )}
    </section>
  );
}

export function ExerciseView(props: { ex: Exercise; onResult: (r: Result) => void; answered: boolean; slow: boolean; mic: boolean }) {
  const { ex } = props;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = props as any;
  switch (ex.type) {
    case 'intro': return <Intro {...p} />;
    case 'sound-intro': return <SoundIntro {...p} />;
    case 'listen-choose': return <ListenChoose {...p} />;
    case 'pt-to-en-choose': return <PtToEn {...p} />;
    case 'fill-gap': return <FillGap {...p} />;
    case 'match-pairs': return <MatchPairs {...p} />;
    case 'word-bank': return <WordBank {...p} />;
    case 'dictation': return <Dictation {...p} />;
    case 'speak': return <Speak {...p} />;
    case 'minimal-pair': return <MinimalPairEx {...p} />;
  }
}
