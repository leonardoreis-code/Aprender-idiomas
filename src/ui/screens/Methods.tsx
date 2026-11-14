import { useEffect, useMemo, useRef, useState } from 'react';
import { allDrills } from '../../content';
import { retellCoverage, STORIES } from '../../content/coach';
import { spot } from '../../domain/coach/spotter';
import { scoreFree } from '../../domain/assessment/checkpoint';
import { analyzeAccent } from '../../domain/pronunciation/accent';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { isArtifact } from '../../infra/platform';
import { sfxComplete, sfxCorrect, sfxWrong } from '../../infra/sfx';
import { BackIcon, MicIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';
import { FREE_PROMPTS } from './Extras';

/* ------------------------------------------------------------------ */
/* Tela "Falar": todos os treinos de fala num lugar só                  */
/* ------------------------------------------------------------------ */
export function Lab({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  const items: { title: string; what: string; why: string; route: Route; tag: string }[] = [
    { tag: 'Tempo real', title: 'Treinador ao vivo', what: 'Fale e veja o erro ser marcado enquanto fala. Conserte a própria frase com ajuda em degraus.', why: 'Autocorreção guiada: quem conserta o próprio erro retém mais do que quem só ouve a resposta.', route: { name: 'teacher' } },
    { tag: 'Fluência', title: 'Fluência 60 · 45 · 30', what: 'Conte a mesma coisa três vezes, com cada vez menos tempo.', why: 'Técnica 4/3/2: repetir o mesmo conteúdo sob pressão de tempo automatiza a fala.', route: { name: 'fluency' } },
    { tag: 'Entendo → falo', title: 'Reconto', what: 'Ouça uma história curta e reconte com as suas palavras.', why: 'Usa o que você já tem (compreensão) como rampa para o que falta (produção).', route: { name: 'retell' } },
    { tag: 'Memória de frase', title: 'Eco com atraso', what: 'Ouça uma frase, espere 3 segundos e repita sem ver o texto.', why: 'Frases longas só se repetem com a gramática processada: treina pensar em blocos.', route: { name: 'echo' } },
    { tag: 'Diário', title: 'Fala livre de 1 minuto', what: 'Uma pergunta por dia, sem roteiro, com palavras por minuto.', why: 'Mantém a fala saindo e mede o ritmo todo dia.', route: { name: 'monologue' } },
    { tag: 'Pronúncia', title: 'Laboratório de sotaque', what: 'Descubra quais sons do português aparecem no seu inglês.', why: 'Foco em ser entendido, não em soar nativo.', route: { name: 'accent' } },
    { tag: 'Seu trabalho', title: 'Minhas frases', what: 'Transforme o que você vai dizer amanhã em treino.', why: 'Praticar o que você realmente usa transfere mais rápido para a vida real.', route: { name: 'mine' } },
  ];
  return (
    <main className="shell" id="main">
      <h1 className="page-title">Falar</h1>
      <p className="muted">Sete formas de treinar a fala, cada uma atacando uma parte diferente do problema. {state.coach.echoBest > 0 && <>Seu recorde no eco: <b>{state.coach.echoBest} palavras</b>.</>}</p>
      <div className="lab-grid">
        {items.map((it, i) => (
          <button key={it.title} className={`tile ${i === 0 ? 'tile-main' : ''}`} onClick={() => go(it.route)}>
            <span className="ex-kicker">{it.tag}</span>
            <strong className="tile-title">{it.title}</strong>
            <span>{it.what}</span>
            <small className="muted">{it.why}</small>
          </button>
        ))}
      </div>
      {!isArtifact && <p className="fine">Também existe a ligação de voz contínua com a Maya (ElevenLabs): <button className="link-btn" onClick={() => go({ name: 'teacher', mode: 'call' })}>abrir</button>.</p>}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Gravador ao vivo com contagem regressiva (usado pelos treinos)       */
/* ------------------------------------------------------------------ */
function TimedTalk({ seconds, onDone, showLive = true }: { seconds: number; onDone: (text: string, ms: number) => void; showLive?: boolean }) {
  const [on, setOn] = useState(false);
  const [left, setLeft] = useState(seconds);
  const [text, setText] = useState('');
  const sess = useRef<LiveSession | null>(null);
  const t0 = useRef(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setLeft(Math.max(0, seconds - Math.floor((Date.now() - t0.current) / 1000))), 250);
    return () => clearInterval(id);
  }, [on, seconds]);
  useEffect(() => () => sess.current?.stop(), []);
  const start = () => {
    stopAudio();
    setText('');
    setLeft(seconds);
    t0.current = Date.now();
    setOn(true);
    // direto no clique (o ditado do artefato exige o gesto)
    const s = startLive({ onText: setText, silenceMs: 7000, maxMs: seconds * 1000 });
    sess.current = s;
    void s.done.then((r) => {
      sess.current = null;
      setOn(false);
      onDone(r.text, Math.max(r.ms, 1000));
    });
  };
  if (!liveAvailable()) return <p className="tip">Este treino precisa de microfone com reconhecimento de fala (Chrome, Edge ou o app do Claude).</p>;
  const pct = left / seconds;
  return (
    <div className="timed">
      <button className={`mic ${on ? 'listening' : ''}`} onClick={() => (on ? sess.current?.stop() : start())} aria-label={on ? 'Parar' : `Falar por ${seconds} segundos`}>
        {on ? <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg> : <MicIcon size={44} />}
      </button>
      <svg width="120" height="14" viewBox="0 0 120 14" role="img" aria-label={`${left} segundos restantes`}>
        <rect width="120" height="8" y="3" rx="4" fill="var(--surface-2)" />
        <rect width={120 * pct} height="8" y="3" rx="4" fill={pct < 0.25 ? 'var(--bad)' : 'var(--viz-1)'} />
      </svg>
      <span className="muted" role="status">{on ? `${left}s — continue falando` : `Toque e fale por ${seconds} segundos`}</span>
      {showLive && on && <p className="live-text small" lang="en">{text || '…'}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fluência 60·45·30 (técnica 4/3/2 em versão curta)                    */
/* ------------------------------------------------------------------ */
const ROUNDS = [60, 45, 30];
export function Fluency({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const [k, setK] = useState(() => new Date().getDate() % FREE_PROMPTS.length);
  const [results, setResults] = useState<{ wpm: number; words: number; ms: number; text: string }[]>([]);
  const round = results.length;
  const p = FREE_PROMPTS[k];
  const done = (text: string, ms: number) => {
    const r = scoreFree(p.en, text, ms);
    const all = [...results, { wpm: r.wpm, words: r.words, ms, text }];
    setResults(all);
    if (r.words >= 5) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1, ...(round === 0 ? { wpmSum: r.wpm, wpmN: 1 } : {}) });
      store.track('spoken');
    }
    if (all.length === ROUNDS.length) {
      sfxComplete();
      store.gainXp(30);
    } else sfxCorrect(all.length);
  };
  const max = Math.max(1, ...results.map((r) => r.wpm));
  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Fluência 60 · 45 · 30</h1>
      <p className="muted">Responda a mesma pergunta três vezes: em 60, depois 45, depois 30 segundos. Mesmo conteúdo, menos tempo. Aqui ninguém corrige gramática: o objetivo é a fala sair mais rápido e com menos pausas.</p>
      <section className="card stack">
        <div className="row-between">
          <span className="ex-kicker">Tema {round > 0 ? '(o mesmo nas três rodadas)' : ''}</span>
          {round === 0 && <button className="link-btn" onClick={() => setK((k + 1) % FREE_PROMPTS.length)}>Trocar tema</button>}
        </div>
        <p className="pt-prompt" lang="en" style={{ margin: 0 }}>{p.en}</p>
        <p className="muted" style={{ margin: 0 }}>{p.pt}</p>
        <ol className="rounds">
          {ROUNDS.map((s, i) => (
            <li key={s} className={i < round ? 'done' : i === round ? 'cur' : ''}>
              <b>{s}s</b>
              <span>{results[i] ? `${results[i].wpm} palavras/min · ${results[i].words} palavras` : i === round ? 'agora' : 'depois'}</span>
              {results[i] && <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden><rect width={(results[i].wpm / max) * 100} height="8" rx="4" fill="var(--viz-1)" /></svg>}
            </li>
          ))}
        </ol>
        {round < ROUNDS.length ? (
          <TimedTalk key={round} seconds={ROUNDS[round]} onDone={done} />
        ) : (
          <div aria-live="polite">
            <p style={{ fontSize: '1.1rem' }}>
              {results[2].wpm > results[0].wpm
                ? <>Seu ritmo foi de <b>{results[0].wpm}</b> para <b>{results[2].wpm}</b> palavras por minuto ({Math.round(((results[2].wpm - results[0].wpm) / Math.max(results[0].wpm, 1)) * 100)}% mais rápido) dizendo a mesma coisa.</>
                : <>Seu ritmo ficou em <b>{results[2].wpm}</b> palavras por minuto na última rodada. Repita amanhã com o mesmo tema: o ganho costuma aparecer na segunda sessão.</>}
            </p>
            <p className="fine">O ganho dentro da sessão é esperado. O que importa é a primeira rodada de amanhã ser mais rápida que a primeira de hoje: esse número entra no seu gráfico de palavras por minuto.</p>
            <div className="row">
              <button className="btn btn-primary" onClick={() => { setResults([]); setK((k + 1) % FREE_PROMPTS.length); }}>Outro tema</button>
              <button className="btn btn-ghost" onClick={() => go({ name: 'evolution' })}>Ver evolução</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Reconto: ouvir → recontar                                            */
/* ------------------------------------------------------------------ */
export function Retell({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const [k, setK] = useState(() => new Date().getDate() % STORIES.length);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [attempts, setAttempts] = useState<{ text: string; ms: number }[]>([]);
  const story = STORIES[k];
  const last = attempts[attempts.length - 1];
  const cov = last ? retellCoverage(story, last.text) : null;
  const prevCov = attempts.length > 1 ? retellCoverage(story, attempts[attempts.length - 2].text) : null;
  const marks = last ? spot(last.text) : [];
  useEffect(() => () => stopAudio(), []);
  const play = async () => {
    setPlaying(true);
    await speak(story.text, { variant: plays });
    setPlaying(false);
    setPlays((n) => n + 1);
  };
  const done = (text: string, ms: number) => {
    setAttempts((a) => [...a, { text, ms }]);
    const c = retellCoverage(story, text).filter((x) => x.ok).length;
    if (text.trim().split(/\s+/).length >= 5) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1 });
      store.track('spoken');
      store.gainXp(10 + c * 3);
      const cats = spot(text).map((s) => s.cat);
      if (cats.length) store.set((s) => ({ ...s, errorLog: [cats, ...s.errorLog].slice(0, 300) }));
    }
    c >= story.ideas.length - 1 ? sfxComplete() : sfxCorrect(1);
  };
  const reset = (n: number) => { stopAudio(); setK(n); setPlays(0); setAttempts([]); };
  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Reconto</h1>
      <p className="muted">Você entende bem: use isso. Ouça a história (sem texto), depois conte o que aconteceu com as suas palavras. Não precisa repetir igual.</p>
      <section className="card stack">
        <div className="row-between">
          <span className="ex-kicker">{story.title} · {story.level}</span>
          <button className="link-btn" onClick={() => reset((k + 1) % STORIES.length)}>Outra história</button>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={play} disabled={playing || plays >= 2}><SpeakerIcon /> {playing ? 'Tocando…' : plays === 0 ? 'Ouvir a história' : plays === 1 ? 'Ouvir mais uma vez' : 'Já ouviu 2 vezes'}</button>
          {plays > 0 && !playing && <span className="muted">Agora reconte em até 60 segundos.</span>}
        </div>
        {plays > 0 && !playing && <TimedTalk key={attempts.length} seconds={60} onDone={done} />}
      </section>

      {cov && last && (
        <section className="card stack" aria-live="polite">
          <h2 className="card-h">{cov.filter((c) => c.ok).length} de {cov.length} ideias no seu reconto{prevCov && <span className="badge" style={{ marginLeft: 8 }}>antes: {prevCov.filter((c) => c.ok).length}</span>}</h2>
          <ul className="cp-cats">
            {cov.map((c) => <li key={c.label} className={c.ok ? 'ok' : 'bad'}><span className="cp-mark" aria-hidden>{c.ok ? '✓' : '✗'}</span><span>{c.label}<span className="sr-only">: {c.ok ? 'presente' : 'faltou'}</span></span></li>)}
          </ul>
          <div>
            <span className="tag">Você disse</span>
            <p lang="en" style={{ margin: '4px 0' }}>
              {marks.length === 0 ? last.text : marks.reduce<React.ReactNode[]>((acc, m, i) => [...acc, last.text.slice(i ? marks[i - 1].end : 0, m.start), <mark key={i} className="live-miss" title={m.fix}>{last.text.slice(m.start, m.end)}</mark>], []).concat(last.text.slice(marks[marks.length - 1].end))}
            </p>
            {marks.map((m, i) => <p key={i} className="err-pill" lang="en"><s>{m.wrong}</s> → <b>{m.fix}</b> <small lang="pt-BR">· {m.explain}</small></p>)}
          </div>
          <details>
            <summary>Ver o texto original</summary>
            <p lang="en">{story.text}</p>
          </details>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => reset((k + 1) % STORIES.length)}>Próxima história</button>
          </div>
          <p className="fine">Para recontar de novo, use o microfone acima. A segunda vez costuma trazer mais ideias e menos pausas: tente antes de trocar.</p>
        </section>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Eco com atraso (imitação eliciada)                                   */
/* ------------------------------------------------------------------ */
const TRIALS = 8;
const DELAY = 3;
export function DelayedEcho({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const pool = useMemo(() => {
    const seen = allDrills.filter((d) => store.state.production[d.id]);
    const base = (seen.length >= 20 ? seen : allDrills).map((d) => ({ en: d.en, n: d.en.split(/\s+/).length }));
    return base.filter((d) => d.n >= 3 && d.n <= 14);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [len, setLen] = useState(5);
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [stage, setStage] = useState<'ready' | 'playing' | 'wait' | 'speak' | 'result' | 'end'>('ready');
  const [count, setCount] = useState(DELAY);
  const [live, setLive] = useState('');
  const [res, setRes] = useState<{ score: number; said: string; ok: boolean } | null>(null);
  const [best, setBest] = useState(0);
  const used = useRef(new Set<string>());
  const sess = useRef<LiveSession | null>(null);
  useEffect(() => () => { sess.current?.stop(); stopAudio(); }, []);

  const pick = (n: number) => {
    const cands = pool.filter((d) => !used.current.has(d.en)).sort((a, b) => Math.abs(a.n - n) - Math.abs(b.n - n));
    const c = cands[Math.floor(Math.random() * Math.min(4, cands.length))] ?? pool[0];
    used.current.add(c.en);
    return c.en;
  };
  const playTrial = async () => {
    const t = pick(len);
    setTarget(t);
    setRes(null);
    setLive('');
    setStage('playing');
    await speak(t, { variant: trial });
    setStage('wait');
    setCount(DELAY);
    for (let c = DELAY; c > 0; c--) {
      setCount(c);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setStage('speak');
  };
  const record = () => {
    if (sess.current) return sess.current.stop();
    const s = startLive({ onText: setLive, silenceMs: 2200, maxMs: 15000 });
    sess.current = s;
    void s.done.then(({ text, ms }) => {
      sess.current = null;
      const a = analyzeAccent(target!, text);
      const ok = a.score >= 85;
      setRes({ score: a.score, said: text, ok });
      const n = target!.split(/\s+/).length;
      if (ok) {
        sfxCorrect(2);
        setBest((b) => Math.max(b, n));
        setLen((l) => Math.min(14, Math.max(l, n) + 1));
      } else {
        sfxWrong();
        setLen((l) => Math.max(3, l - 1));
      }
      if (text) {
        store.logDay({ spokenSec: ms / 1000, spoken: 1 });
        store.track('spoken');
      }
      setStage('result');
    });
  };
  const next = () => {
    if (trial + 1 >= TRIALS) {
      sfxComplete();
      store.gainXp(20);
      store.set((s) => ({ ...s, coach: { ...s.coach, echoBest: Math.max(s.coach.echoBest, best) } }));
      setStage('end');
    } else {
      setTrial(trial + 1);
      setStage('ready');
    }
  };

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Eco com atraso</h1>
      <p className="muted">Você ouve uma frase uma única vez, sem texto. Espera {DELAY} segundos. Depois repete. Com o atraso não dá para papagaiar o som: você precisa entender e reconstruir a frase. Acertou, a próxima fica mais longa.</p>
      {!liveAvailable() ? <p className="tip">Este treino precisa de microfone com reconhecimento de fala.</p> : stage === 'end' ? (
        <section className="card stack" aria-live="polite">
          <h2 className="card-h">Maior frase repetida: {best || '—'} palavras</h2>
          <p className="muted">Recorde anterior: {store.state.coach.echoBest} palavras. Esse número cresce quando você passa a guardar a frase em blocos de sentido, não palavra por palavra.</p>
          <div className="row"><button className="btn btn-primary" onClick={() => { setTrial(0); setBest(0); setLen(5); setStage('ready'); }}>De novo</button><button className="btn btn-ghost" onClick={() => go({ name: 'lab' })}>Outros treinos</button></div>
        </section>
      ) : (
        <section className="card stack" style={{ textAlign: 'center' }}>
          <span className="ex-kicker">Frase {trial + 1} de {TRIALS} · cerca de {len} palavras</span>
          {stage === 'ready' && <button className="btn btn-primary" onClick={playTrial}><SpeakerIcon /> Ouvir a frase</button>}
          {stage === 'playing' && <p role="status" className="echo-big">Ouça…</p>}
          {stage === 'wait' && <p role="status" className="echo-big" aria-label={`Espere ${count} segundos`}>{count}</p>}
          {(stage === 'speak' || stage === 'result') && (
            <>
              {stage === 'speak' && (
                <>
                  <button className={`mic ${sess.current ? 'listening' : ''}`} onClick={record} aria-label="Repetir a frase"><MicIcon size={44} /></button>
                  <span className="muted">{live ? '' : 'Agora repita'}</span>
                  {live && <p className="live-text small" lang="en">{live}</p>}
                </>
              )}
              {stage === 'result' && res && (
                <div aria-live="polite" className="stack">
                  <p className={`echo-big ${res.ok ? 'ok' : 'bad'}`}>{res.score}%</p>
                  <p lang="en" style={{ margin: 0 }}><span className="tag">Frase</span> <b>{target}</b> <button className="icon-btn inline" onClick={() => speak(target!)} aria-label="Ouvir de novo"><SpeakerIcon size={16} /></button></p>
                  <p lang="en" style={{ margin: 0 }} className="muted"><span className="tag">Você</span> {res.said || '(não ouvi)'}</p>
                  <button className="btn btn-primary" autoFocus onClick={next}>{trial + 1 >= TRIALS ? 'Ver resultado' : res.ok ? 'Próxima, mais longa' : 'Próxima, mais curta'}</button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
