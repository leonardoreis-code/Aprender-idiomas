import { useEffect, useMemo, useRef, useState } from 'react';
import { DAY_TAGS, GLOSSARY, MISSIONS } from '../../content/missions';
import { GLOSSARY_EXTRA, MISSIONS_EXTRA } from '../../content/missions2';
import { repaired, type Issue } from '../../domain/coach/mediation';
import { spot } from '../../domain/coach/spotter';
import type { Drill } from '../../domain/curriculum/speaking';
import { dayKey } from '../../domain/motivation/motivation';
import { ERROR_CATEGORIES } from '../../domain/production/errors';
import { fill, goalsMet, initialSim, nextGoal, react, score, type Goal, type Mission, type SimState } from '../../domain/sim/engine';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { howToSay, llmAvailable, makeMission, simTurn } from '../../infra/llm';
import { isArtifact } from '../../infra/platform';
import { sfxComplete, sfxCorrect, sfxTap } from '../../infra/sfx';
import { BackIcon, BulbIcon, CheckIcon, MicIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

/** Todas as simulações: as 20 do app mais as criadas pelo aluno. */
export const allMissions = (custom: Mission[]) => [...custom, ...MISSIONS, ...MISSIONS_EXTRA];
const ALL_WORDS: Record<string, string> = { ...GLOSSARY_EXTRA, ...GLOSSARY };
const strip = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
/** Socorro de vocabulário: glossário local (PT sem acento → EN). */
function lookup(pt: string): string | null {
  const k = strip(pt);
  if (!k) return null;
  if (ALL_WORDS[k]) return ALL_WORDS[k];
  const hit = Object.keys(ALL_WORDS).find((key) => k.startsWith(key) || key.startsWith(k));
  return hit && Math.abs(hit.length - k.length) <= 3 ? ALL_WORDS[hit] : null;
}

const Stars = ({ n, size = 18 }: { n: number; size?: number }) => (
  <span role="img" aria-label={`${n} de 3 estrelas`} className="stars">
    {[0, 1, 2].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5 6.1 20.8l1.3-6.7L2.5 9.5l6.6-.8z" fill={i < n ? 'var(--ochre)' : 'var(--surface-2)'} stroke="var(--ink-3)" strokeWidth="1" /></svg>
    ))}
  </span>
);

const CharFace = ({ m, on, size = 44 }: { m: Mission; on?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden className="char-face">
    {on && <circle cx="22" cy="22" r="21" fill="none" stroke={m.character.color} strokeWidth="2" opacity=".5"><animate attributeName="r" values="19;21.5;19" dur="1.2s" repeatCount="indefinite" /></circle>}
    <circle cx="22" cy="22" r="18" fill={m.character.color} />
    <text x="22" y="28" textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff" fontFamily="var(--font-display)">{m.character.name[0]}</text>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Lista de simulações + "o que tem no seu dia hoje"                    */
/* ------------------------------------------------------------------ */
export function MissionsHub({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const sim = store.state.sim;
  const today = dayKey();
  const tags = sim.today.day === today ? sim.today.tags : [];
  const ctx = sim.context;
  const setCtx = (k: keyof typeof ctx, v: string) => store.set((s) => ({ ...s, sim: { ...s.sim, context: { ...s.sim.context, [k]: v.slice(0, 60) } } }));
  const toggle = (id: string) => store.set((s) => ({ ...s, sim: { ...s.sim, today: { day: today, tags: tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id] } } }));
  const [desc, setDesc] = useState('');
  const [making, setMaking] = useState(false);
  const [makeErr, setMakeErr] = useState<string | null>(null);
  const create = async () => {
    setMaking(true);
    setMakeErr(null);
    const m = await makeMission(desc.trim(), `role ${ctx.role}, project ${ctx.project}, teammate ${ctx.teammate}, tool ${ctx.tool}`);
    setMaking(false);
    if (!m) return setMakeErr('Não consegui montar a simulação agora. Tente descrever em uma ou duas frases.');
    store.set((s) => ({ ...s, sim: { ...s.sim, custom: [m, ...s.sim.custom].slice(0, 10) } }));
    setDesc('');
    go({ name: 'mission', id: m.id });
  };
  const list = useMemo(() => allMissions(sim.custom).sort((a, b) => Number(b.tags.some((t) => tags.includes(t))) - Number(a.tags.some((t) => tags.includes(t)))), [tags, sim.custom]);
  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Simulações do dia a dia</h1>
      <p className="muted">Conversas com começo, meio e fim, como as que você tem de verdade. O personagem reage ao que você diz, e os objetivos acendem enquanto você fala.</p>

      <section className="card stack">
        <strong>O que tem no seu dia hoje?</strong>
        <div className="chips" role="group" aria-label="Compromissos de hoje">
          {DAY_TAGS.map((t) => <button key={t.id} className="chip" aria-pressed={tags.includes(t.id)} onClick={() => toggle(t.id)}>{t.label}</button>)}
        </div>
        <details>
          <summary>Seu contexto real (deixa as conversas com a sua cara)</summary>
          <div className="ctx-grid">
            {([['role', 'Seu cargo, em inglês', 'data engineer'], ['project', 'Seu projeto atual', 'the orders pipeline'], ['teammate', 'Nome de um colega', 'Tom'], ['tool', 'Ferramenta que você usa', 'Airflow']] as const).map(([k, label, ph]) => (
              <label key={k}>{label}<input className="text-input" value={ctx[k]} placeholder={ph} onChange={(e) => setCtx(k, e.target.value)} /></label>
            ))}
          </div>
        </details>
      </section>

      <section className="card stack">
        <strong>Ensaiar uma situação real sua</strong>
        {llmAvailable() ? (
          <>
            <label htmlFor="mk" className="muted">Descreva em português o que vai acontecer: com quem, sobre o quê e o que você precisa conseguir.</label>
            <textarea id="mk" className="text-input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Amanhã tenho uma reunião com o time da Índia para explicar por que o relatório de vendas atrasou e combinar a nova data." />
            {makeErr && <p className="err-pill" role="alert">{makeErr}</p>}
            <button className="btn btn-primary" disabled={desc.trim().length < 15 || making} onClick={create}>{making ? 'Montando a simulação…' : 'Criar simulação'}</button>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>Criar uma simulação a partir da sua agenda usa o Claude e só funciona na versão artefato. Aqui, use o contexto real acima: ele entra nas falas das simulações prontas.</p>
        )}
      </section>

      <div className="mission-grid">
        {list.map((m) => {
          const r = sim.results[m.id];
          const forToday = m.tags.some((t) => tags.includes(t));
          return (
            <button key={m.id} className={`tile mission-tile ${forToday ? 'today' : ''}`} onClick={() => go({ name: 'mission', id: m.id })}>
              <span className="row-between"><span className="ex-kicker">{m.id.startsWith('meu-') ? 'Criada por você' : m.area === 'trabalho' ? 'Trabalho' : 'Dia a dia'}{forToday ? ' · para hoje' : ''}</span>{r ? <Stars n={r.stars} /> : <small className="muted">nova</small>}</span>
              <span className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><CharFace m={m} /><span style={{ display: 'grid', gap: 2 }}><strong className="tile-title">{m.title}</strong><small className="muted">com {m.character.name}, {m.character.role}</small></span></span>
              <span className="muted">{m.setting}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Conversa                                                             */
/* ------------------------------------------------------------------ */
interface FeedIssue extends Issue { revealed: boolean; fixed: boolean }
interface Bubble { role: 'char' | 'you'; text: string; issues: FeedIssue[] }
const MAX_TURNS = 9;

export function MissionPlayer({ id, go }: { id: string; go: (r: Route) => void }) {
  const store = useStore();
  const mission = allMissions(store.state.sim.custom).find((m) => m.id === id) ?? MISSIONS[0];
  const ctx = store.state.sim.context;
  const useAi = llmAvailable();
  const played = !!store.state.sim.results[mission.id];
  const [phase, setPhase] = useState<'brief' | 'talk' | 'debrief'>('brief');
  const [hideGoals, setHideGoals] = useState(false);
  const [sim, setSim] = useState<SimState>(initialSim);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [live, setLive] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [charOn, setCharOn] = useState(false);
  const [starter, setStarter] = useState<Goal | null>(null);
  const [helps, setHelps] = useState(0);
  const [typing, setTyping] = useState(!liveAvailable());
  const [typed, setTyped] = useState('');
  const [wpm, setWpm] = useState(0);
  const [repairAt, setRepairState] = useState<{ b: number; i: number } | null>(null);
  const repairRef = useRef<{ b: number; i: number } | null>(null);
  const setRepairAt = (v: { b: number; i: number } | null) => { repairRef.current = v; setRepairState(v); };
  const bubblesRef = useRef<Bubble[]>([]);
  const [ask, setAsk] = useState<{ open: boolean; q: string; a: string | null; loading: boolean }>({ open: false, q: '', a: null, loading: false });
  const [added, setAdded] = useState(false);
  bubblesRef.current = bubbles;
  const handsFree = store.state.sim.handsFree && !isArtifact && liveAvailable();
  const session = useRef<LiveSession | null>(null);
  const simRef = useRef(sim);
  simRef.current = sim;
  const lastChange = useRef(0);
  const firstWord = useRef(0);
  const startedAt = useRef(0);
  const stat = useRef({ words: 0, ms: 0, helps: 0 });
  const alive = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const typedAt = useRef(0);

  useEffect(() => () => { alive.current = false; session.current?.stop(); stopAudio(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [bubbles, live, starter]);

  // travou? depois de 3,5 s sem palavra nova aparece um começo de frase
  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => {
      if (!starter && Date.now() - lastChange.current > 3500) {
        const g = nextGoal(mission, simRef.current);
        if (g) { setStarter(g); stat.current.helps++; setHelps((h) => h + 1); }
      }
    }, 500);
    return () => clearInterval(id);
  }, [listening, starter, mission]);

  const liveMet = useMemo(() => [...new Set([...sim.met, ...goalsMet(mission.goals, live)])], [sim.met, live, mission]);
  const liveSpots = useMemo(() => (listening || (typing && live) ? spot(live) : []), [live, listening, typing]);
  const prevMet = useRef(0);
  useEffect(() => {
    if (liveMet.length > prevMet.current) sfxCorrect(liveMet.length);
    prevMet.current = liveMet.length;
  }, [liveMet.length]);

  const listen = () => {
    stopAudio();
    setCharOn(false);
    setLive('');
    setWpm(0);
    lastChange.current = Date.now();
    firstWord.current = 0;
    setListening(true);
    // chamado direto no clique quando no artefato (o ditado exige o gesto)
    const s = startLive({
      silenceMs: 3200,
      maxMs: 60000,
      onText: (t) => {
        setLive(t);
        lastChange.current = Date.now();
        const n = t.trim().split(/\s+/).filter(Boolean).length;
        if (n && !firstWord.current) firstWord.current = Date.now();
        if (n >= 4) setWpm(Math.round(n / Math.max((Date.now() - firstWord.current) / 60000, 0.05)));
      },
    });
    session.current = s;
    void s.done.then(({ text, ms, pauses }) => {
      session.current = null;
      if (!alive.current) return;
      if (text.trim() && ms > 4000) store.logDay({ pauses, pauseMin: ms / 60000 });
      setListening(false);
      setLive('');
      if (!text.trim()) return;
      if (repairRef.current) onRepair(text, ms);
      else void onAnswer(text, ms, true);
    });
  };

  const charSay = async (line: string, thenEnd = false) => {
    bubblesRef.current = [...bubblesRef.current, { role: 'char', text: line, issues: [] }];
    setBubbles(bubblesRef.current);
    setCharOn(true);
    await speak(line, { variant: mission.character.voice });
    if (!alive.current) return;
    setCharOn(false);
    if (thenEnd) return finish();
    if (handsFree && !simRef.current.done) listen();
  };

  const start = () => {
    startedAt.current = Date.now();
    setPhase('talk');
    void charSay(fill(mission.beats[0].say, ctx));
  };

  const onAnswer = async (text: string, ms: number, spoken: boolean) => {
    setStarter(null);
    const local: FeedIssue[] = spot(text).map((s) => ({ source: 'rule' as const, ...s, revealed: false, fixed: false }));
    stat.current.words += text.trim().split(/\s+/).length;
    stat.current.ms += ms;
    store.logDay({ spokenSec: spoken ? ms / 1000 : 0, spoken: spoken ? 1 : 0 });
    if (spoken) store.track('spoken');
    const myIndex = bubblesRef.current.length;
    bubblesRef.current = [...bubblesRef.current, { role: 'you', text, issues: local }];
    setBubbles(bubblesRef.current);
    const cur = simRef.current;
    let step = react(mission, cur, text, ctx);
    if (useAi) {
      setBusy(true);
      const history = bubblesRef.current.map((b) => ({ role: b.role === 'char' ? ('character' as const) : ('student' as const), text: b.text }));
      const r = await simTurn({
        setting: mission.setting,
        character: `${mission.character.name}, ${mission.character.role}`,
        goals: mission.goals.map((g) => ({ id: g.id, label: g.label, done: cur.met.includes(g.id) })),
        history,
        utterance: text,
        alreadyFound: local.map((l) => l.wrong),
        turns: cur.turns + 1,
        context: `role ${ctx.role}, project ${ctx.project}, teammate ${ctx.teammate}, tool ${ctx.tool}`,
      });
      if (!alive.current) return;
      setBusy(false);
      if (r) {
        const met = [...new Set([...cur.met, ...goalsMet(mission.goals, text), ...r.goalsMet])];
        const turns = cur.turns + 1;
        const done = r.done || turns >= MAX_TURNS;
        step = { state: { ...cur, met, turns, done }, line: r.reply, kind: done ? 'close' : 'next' };
        if (r.errors.length) {
          const low = text.toLowerCase();
          const ai: FeedIssue[] = r.errors.map((e) => {
            const at = low.indexOf(e.quote.toLowerCase().replace(/[.,!?]/g, '').trim());
            return { source: 'ai', rule: `ai:${e.cat}`, cat: e.cat, wrong: e.quote, fix: e.fix, clue: e.clue, explain: e.explain, start: at >= 0 ? at : undefined, end: at >= 0 ? at + e.quote.replace(/[.,!?]/g, '').trim().length : undefined, revealed: false, fixed: false };
          });
          setBubbles((b) => b.map((x, k) => (k === myIndex ? { ...x, issues: [...x.issues, ...ai] } : x)));
          local.push(...ai);
        }
      }
    }
    if (local.length) {
      store.set((s) => ({ ...s, errorLog: [local.map((i) => i.cat), ...s.errorLog].slice(0, 300) }));
      store.bankErrors(local, text);
    }
    setSim(step.state);
    simRef.current = step.state;
    await charSay(step.line, step.state.done);
  };

  /* conserto opcional de um erro, sem parar a conversa */
  const onRepair = (text: string, ms: number) => {
    const t = repairRef.current!;
    setRepairAt(null);
    const issue = bubblesRef.current[t.b]?.issues[t.i];
    if (!issue) return;
    const ok = repaired(issue, text);
    store.logDay({ spokenSec: ms / 1000, spoken: 1, ...(ok ? { repN: 1, repSelf: issue.revealed ? 0 : 1 } : {}) });
    if (ok) {
      sfxCorrect(3);
      store.set((s) => ({ ...s, repairs: [...s.repairs, { rule: issue.rule, cat: issue.cat, level: issue.revealed ? 4 : 3, at: Date.now() }].slice(-400) }));
      setBubbles((b) => b.map((x, k) => (k === t.b ? { ...x, issues: x.issues.map((y, j) => (j === t.i ? { ...y, fixed: true, revealed: true } : y)) } : x)));
    } else setBubbles((b) => b.map((x, k) => (k === t.b ? { ...x, issues: x.issues.map((y, j) => (j === t.i ? { ...y, revealed: true } : y)) } : x)));
  };
  const reveal = (b: number, i: number) => setBubbles((bs) => bs.map((x, k) => (k === b ? { ...x, issues: x.issues.map((y, j) => (j === i ? { ...y, revealed: true } : y)) } : x)));

  const issuesCount = bubbles.reduce((a, b) => a + b.issues.length, 0);
  const finish = () => {
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    const sc = score(mission, simRef.current.met, stat.current.helps, bubblesRef.current.reduce((a, b) => a + b.issues.length, 0));
    store.logDay({ mayaSec: secs });
    store.track('teacherMin', Math.floor(secs / 60));
    store.set((s) => {
      const prev = s.sim.results[mission.id];
      return { ...s, teacherSeconds: s.teacherSeconds + secs, sim: { ...s.sim, results: { ...s.sim.results, [mission.id]: { stars: Math.max(prev?.stars ?? 0, sc.stars), plays: (prev?.plays ?? 0) + 1, at: Date.now() } } } };
    });
    store.gainXp(20 + sc.goals * 8 + sc.stars * 5);
    sfxComplete();
    setPhase('debrief');
  };

  const stuck = () => {
    const g = nextGoal(mission, simRef.current);
    if (g && !starter) { setStarter(g); stat.current.helps++; setHelps((h) => h + 1); }
  };
  const askWord = async () => {
    const q = ask.q.trim();
    if (!q) return;
    stat.current.helps++;
    setHelps((h) => h + 1);
    const hit = lookup(q);
    if (hit) return setAsk({ ...ask, a: hit, loading: false });
    setAsk({ ...ask, loading: true, a: null });
    const a = await howToSay(q, mission.setting);
    setAsk((x) => ({ ...x, loading: false, a: a ?? 'Não encontrei. Tente explicar com outras palavras em inglês: isso também é uma boa estratégia.' }));
  };
  const addDrills = () => {
    store.set((s) => {
      const have = new Set(s.custom.map((d) => d.en));
      const fresh: Drill[] = mission.goals.filter((g) => !have.has(g.example)).map((g, k) => ({ id: `mine-d${String(s.custom.length + k + 1).padStart(3, '0')}`, pt: g.pt, en: g.example, chunks: [{ pt: g.pt.replace(/[.!?]+$/, ''), en: g.example.replace(/[.!?]+$/, '') }], hint: g.label }));
      return { ...s, custom: [...s.custom, ...fresh] };
    });
    setAdded(true);
  };

  /* ================= briefing ================= */
  if (phase === 'brief')
    return (
      <main className="shell mission" id="main">
        <button className="link-btn back" onClick={() => go({ name: 'missions' })}><BackIcon /> Simulações</button>
        <span className="ex-kicker">{mission.area === 'trabalho' ? 'Trabalho' : 'Dia a dia'} · simulação</span>
        <h1 className="page-title">{mission.title}</h1>
        <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><CharFace m={mission} size={56} /><p style={{ margin: 0 }}><b>{mission.character.name}</b>, {mission.character.role}.<br /><span className="muted">{mission.setting}</span></p></div>
        <section className="card">
          <strong>Seus objetivos na conversa</strong>
          <ol className="outline">{mission.goals.map((g) => <li key={g.id}>{g.label}</li>)}</ol>
          <p className="fine">Eles acendem sozinhos quando você consegue. Travou? Fique em silêncio 3 segundos ou toque em "Travei" para ganhar um começo de frase. Não entendeu? Peça para repetir em inglês, como faria de verdade.</p>
        </section>
        {played && <label className="cp-mode"><input type="checkbox" checked={hideGoals} onChange={(e) => setHideGoals(e.target.checked)} /> Modo real: esconder os objetivos durante a conversa</label>}
        {!isArtifact && liveAvailable() && (
          <label className="cp-mode"><input type="checkbox" checked={store.state.sim.handsFree} onChange={(e) => store.set((s) => ({ ...s, sim: { ...s.sim, handsFree: e.target.checked } }))} /> Conversa contínua: o microfone abre sozinho depois que {mission.character.name} fala (use fone de ouvido)</label>
        )}
        <button className="btn btn-primary" onClick={start}>Começar a conversa</button>
        <p className="fine">{useAi ? `${mission.character.name} é interpretado pelo Claude e reage livremente ao que você disser.` : `Nesta versão ${mission.character.name} segue um roteiro que reage aos objetivos. A versão artefato tem conversa livre com IA.`}</p>
      </main>
    );

  /* ================= debrief ================= */
  if (phase === 'debrief') {
    const sc = score(mission, sim.met, helps, issuesCount);
    const all = bubbles.flatMap((b) => b.issues);
    const rate = stat.current.ms > 3000 ? Math.round(stat.current.words / (stat.current.ms / 60000)) : 0;
    return (
      <main className="shell mission" id="main">
        <span className="ex-kicker">{mission.title}</span>
        <h1 className="page-title" tabIndex={-1} ref={(el) => el?.focus()}>{sc.goals === sc.total ? 'Você resolveu a situação' : `${sc.goals} de ${sc.total} objetivos`}</h1>
        <Stars n={sc.stars} size={34} />
        <div className="cp-tiles" style={{ marginTop: 12 }}>
          <div className="cp-tile"><span className="tag">Objetivos</span><b>{sc.goals}/{sc.total}</b><small className="muted">o que você conseguiu fazer</small></div>
          <div className="cp-tile"><span className="tag">Ajudas</span><b>{helps}</b><small className="muted">começos de frase e palavras</small></div>
          <div className="cp-tile"><span className="tag">Ritmo</span><b>{rate || '—'}</b><small className="muted">palavras por minuto</small></div>
        </div>
        <section className="card">
          <h2 className="card-h">Frases que resolvem esta situação</h2>
          <ul className="cp-key">
            {mission.goals.map((g) => {
              const ok = sim.met.includes(g.id);
              return (
                <li key={g.id} className={ok ? 'ok' : 'bad'}>
                  <span>{ok ? '✓' : '✗'} {g.label}</span>
                  <span lang="en"><b>{g.example}</b> <button className="icon-btn inline" onClick={() => speak(g.example)} aria-label={`Ouvir: ${g.example}`}><SpeakerIcon size={16} /></button></span>
                </li>
              );
            })}
          </ul>
          <button className="btn btn-ghost" onClick={addDrills} disabled={added}>{added ? 'Adicionadas ao seu treino' : 'Adicionar essas frases ao meu treino'}</button>
        </section>
        {all.length > 0 && (
          <section className="card">
            <h2 className="card-h">Ajustes de gramática</h2>
            <ul className="cp-key">
              {all.map((i, k) => <li key={k} className={i.fixed ? 'ok' : 'bad'}><span lang="en"><s className="word-miss">{i.wrong}</s> → <b>{i.fix}</b></span><small className="muted">{ERROR_CATEGORIES[i.cat]?.title ?? i.cat}{i.fixed ? ' · você consertou na hora' : ''}{i.explain ? ` · ${i.explain}` : ''}</small></li>)}
            </ul>
          </section>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => { setSim(initialSim()); simRef.current = initialSim(); setBubbles([]); setHelps(0); stat.current = { words: 0, ms: 0, helps: 0 }; setAdded(false); setHideGoals(true); setPhase('brief'); }}>Repetir no modo real</button>
          <button className="btn btn-ghost" onClick={() => go({ name: 'missions' })}>Outra simulação</button>
          {all.length > 0 && <button className="btn btn-ghost" onClick={() => go({ name: 'practice', lessonId: 'erros' })}>Treinar meus erros</button>}
        </div>
      </main>
    );
  }

  /* ================= conversa ================= */
  const canTalk = !busy && !sim.done;
  const send = (text: string) => {
    const ms = typedAt.current ? Date.now() - typedAt.current : 4000;
    typedAt.current = 0;
    setTyped('');
    setLive('');
    if (repairRef.current) onRepair(text, ms);
    else void onAnswer(text, ms, false);
  };
  return (
    <main className="shell mission talk" id="main">
      <div className="row-between">
        <button className="link-btn back" onClick={() => (sim.turns ? finish() : go({ name: 'missions' }))}><BackIcon /> {sim.turns ? 'Encerrar' : 'Voltar'}</button>
        <small className="muted">{mission.title}</small>
      </div>

      {/* objetivos ao vivo */}
      <ul className={`goal-hud ${hideGoals ? 'hidden-goals' : ''}`} aria-label="Objetivos da conversa" aria-live="polite">
        {mission.goals.map((g) => {
          const ok = liveMet.includes(g.id);
          return <li key={g.id} className={ok ? 'ok' : ''}><span className="goal-dot" aria-hidden>{ok ? <CheckIcon size={13} /> : ''}</span><span>{hideGoals && !ok ? 'Objetivo oculto' : g.label}<span className="sr-only">{ok ? ': cumprido' : ''}</span></span></li>;
        })}
      </ul>

      <div className="chat sim-chat">
        {bubbles.map((b, k) =>
          b.role === 'char' ? (
            <div key={k} className="bubble-row"><CharFace m={mission} on={charOn && k === bubbles.length - 1} size={36} /><div className="bubble agent"><b>{mission.character.name}</b><p lang="en">{b.text}</p><button className="link-btn mini" onClick={() => speak(b.text, { variant: mission.character.voice, slow: true })}>ouvir devagar</button></div></div>
          ) : (
            <div key={k} className="bubble-row me">
              <div className="bubble user-sim">
                <p lang="en">{b.issues.filter((i) => i.start !== undefined).length ? markUp(b.text, b.issues) : b.text}</p>
                {b.issues.map((i, j) => (
                  <div key={j} className={`feed ${i.fixed ? 'fixed' : ''}`}>
                    {i.fixed ? <span><CheckIcon size={14} /> Consertado: <b lang="en">{i.fix}</b></span> : i.revealed ? <span lang="en"><s>{i.wrong}</s> → <b>{i.fix}</b></span> : <span><BulbIcon size={14} /> {i.clue}</span>}
                    {!i.fixed && (
                      <span className="feed-actions">
                        {!i.revealed && <button className="link-btn mini" onClick={() => reveal(k, j)}>ver correção</button>}
                        {i.source === 'rule' && <button className="link-btn mini" onClick={() => { store.reportFp(i.rule); setBubbles((bs) => bs.map((x, kk) => (kk === k ? { ...x, issues: x.issues.filter((_, jj) => jj !== j) } : x))); }}>não era erro</button>}
                        {i.revealed && <button className="link-btn mini" onClick={() => speak(i.fix)}>ouvir</button>}
                        {canTalk && !listening && <button className="link-btn mini" onClick={() => { setRepairAt({ b: k, i: j }); if (!typing) listen(); }}>dizer de novo</button>}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
        {busy && <p role="status" className="muted"><span className="spinner" aria-hidden /> {mission.character.name} está pensando…</p>}
        {(listening || (typing && live)) && (
          <div className="bubble-row me"><div className="bubble user-sim live-bubble" aria-live="polite"><p lang="en">{live ? markUp(live, liveSpots.map((s) => ({ ...s }))) : '…'}</p>{wpm > 0 && <small>{wpm} palavras/min{wpm < 70 ? ' · pode ir sem pressa, só não pare' : ''}</small>}</div></div>
        )}
        {starter && !sim.done && (
          <p className="tip starter" role="status"><BulbIcon /> <span>Tente começar com: <b lang="en">{starter.starter}</b> <button className="link-btn mini" onClick={() => speak(starter.example)}>ouvir um exemplo</button></span></p>
        )}
        <div ref={endRef} className="sim-end" />
      </div>

      {/* controles */}
      {!sim.done && (
        <section className="sim-controls">
          {repairAt && <p className="muted" role="status">Diga de novo a frase com o ajuste. <button className="link-btn mini" onClick={() => setRepairAt(null)}>cancelar</button></p>}
          {typing ? (
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (typed.trim() && canTalk) send(typed.trim()); }}>
              <input className="text-input" style={{ flex: 1 }} lang="en" autoComplete="off" autoCapitalize="off" value={typed} disabled={!canTalk} aria-label="Sua fala em inglês" placeholder="Responda em inglês…"
                onChange={(e) => { if (!typedAt.current) typedAt.current = Date.now(); setTyped(e.target.value); if (!repairAt) setLive(e.target.value); }} />
              <button className="btn btn-primary" disabled={!typed.trim() || !canTalk}>Enviar</button>
            </form>
          ) : (
            <button className={`mic ${listening ? 'listening' : ''}`} disabled={!canTalk && !listening} onClick={() => (listening ? session.current?.stop() : listen())} aria-label={listening ? 'Terminei de falar' : 'Falar'}>
              {listening ? <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg> : <MicIcon size={44} />}
            </button>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="chip" onClick={() => { sfxTap(); stuck(); }} disabled={!!starter}>Travei</button>
            <button className="chip" onClick={() => setAsk({ open: !ask.open, q: '', a: null, loading: false })} aria-expanded={ask.open}>Como se diz…?</button>
            {liveAvailable() && !listening && <button className="chip" onClick={() => setTyping(!typing)}>{typing ? 'Falar' : 'Digitar'}</button>}
          </div>
          {ask.open && (
            <form className="ask-box" onSubmit={(e) => { e.preventDefault(); void askWord(); }}>
              <label htmlFor="ask-in" className="sr-only">Palavra ou expressão em português</label>
              <input id="ask-in" className="text-input" autoFocus value={ask.q} onChange={(e) => setAsk({ ...ask, q: e.target.value, a: null })} placeholder="Palavra em português: prazo, remarcar…" />
              <button className="btn btn-ghost" disabled={!ask.q.trim() || ask.loading}>{ask.loading ? '…' : 'Ver'}</button>
              {ask.a && <p role="status" lang="en"><b>{ask.a}</b> <button type="button" className="icon-btn inline" onClick={() => speak(ask.a!.split(' / ')[0].replace(/^to /, ''))} aria-label="Ouvir"><SpeakerIcon size={16} /></button></p>}
            </form>
          )}
        </section>
      )}
    </main>
  );
}

/** Texto com os trechos problemáticos sublinhados. */
function markUp(text: string, marks: { start?: number; end?: number }[]) {
  const ms = marks.filter((m): m is { start: number; end: number } => m.start !== undefined && m.end !== undefined).sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let pos = 0;
  ms.forEach((m, i) => {
    if (m.start < pos) return;
    out.push(text.slice(pos, m.start), <mark key={i} className="live-miss">{text.slice(m.start, m.end)}</mark>);
    pos = m.end;
  });
  out.push(text.slice(pos));
  return out;
}
