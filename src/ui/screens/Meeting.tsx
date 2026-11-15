import { useEffect, useMemo, useRef, useState } from 'react';
import { MEETINGS } from '../../content/meetings';
import type { Issue } from '../../domain/coach/mediation';
import { spot } from '../../domain/coach/spotter';
import { fillMeet, initialMeet, meetReact, meetScore, muteNudge, opening, pendingGoal, RECAST_GAP, speakerOf, type MeetState, type Said } from '../../domain/meeting/engine';
import type { Meeting, MeetingKind } from '../../domain/meeting/types';
import { goalsMet } from '../../domain/sim/engine';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { llmAvailable, meetingTurn } from '../../infra/llm';
import { isArtifact } from '../../infra/platform';
import { sfxComplete, sfxCorrect } from '../../infra/sfx';
import { AudioBars, MeetAvatar } from '../components/MeetAvatar';
import { BackIcon, CheckIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

const KIND: Record<MeetingKind, string> = {
  daily: 'Daily', planning: 'Planning', incident: 'Incidente', client: 'Cliente', interview: 'Entrevista', retro: 'Retro', 'one-on-one': '1:1',
};
/** Silêncio depois de uma pergunta até um colega cobrar (critério A5). */
const MUTE_AFTER_MS = 10_000;
const MAX_TURNS = 12;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------- ícones da barra ---------------------------- */
const Ico = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const MIC = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8';
const MIC_OFF = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 4.5 2.6M15 9.3V6a3 3 0 0 0-3-3M6 11a6 6 0 0 0 9.4 4.9M18 11a6 6 0 0 1-.6 2.6M12 17v4M8 21h8M4 4l16 16';
const CC = 'M4 6h16v12H4zM10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3';
const CHAT = 'M4 5h16v11H9l-5 4z';
const HAND = 'M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L3.6 13a1.5 1.5 0 0 1 2.5-1.6L8 14';
const KEYS = 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M7 14h10';
const LEAVE = 'M3 15c5-5 13-5 18 0l-2.5 2.5-3-1.5v-3a10 10 0 0 0-7 0v3l-3 1.5z';

/** Agente de voz em tempo real (ElevenLabs Conversational AI): reunião com 3 vozes, correção por reformulação e debrief. */
export const LIVE_CALL_URL = 'https://elevenlabs.io/app/talk-to?agent_id=agent_1301m7evr541fkatt83x0kzwn22y';

/* =============================== HUB =============================== */
export function MeetingsHub({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const { meet, profile } = store.state;
  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
      <h1 className="page-title">Reunião ao vivo</h1>
      <p className="muted">Uma call com 2 ou 3 colegas que conversam entre si, te chamam pelo nome, fazem perguntas diretas e reagem ao que você diz. Quando você erra, eles fazem o que uma pessoa faz: repetem a ideia já certa e seguem em frente. O detalhe do erro aparece só para você, no chat.</p>

      <section className="card stack live-call">
        <span className="ex-kicker">Voz em tempo real · recomendado</span>
        <h2 className="card-h" style={{ margin: 0 }}>Reunião por voz com a sua rotina de verdade</h2>
        <p style={{ margin: 0 }}>Uma call de verdade, falando e ouvindo sem apertar botão: você conta o que está fazendo nesta semana e a Priya, o Tom e o Josh fazem a daily, a planning, a call com cliente ou a entrevista <b>sobre o seu trabalho real</b>. Responde em menos de 1 segundo, você pode interromper, e quando você erra o colega repete a sua ideia do jeito certo e segue. Travou? Diga <i>coach</i>. No fim, a Maya repassa seus 3 erros e pede para você dizer certo.</p>
        <a className="btn btn-primary" href={LIVE_CALL_URL} target="_blank" rel="noopener noreferrer">Entrar na call por voz</a>
        <p className="fine" style={{ margin: 0 }}>Abre numa aba da ElevenLabs. Use fone de ouvido e libere o microfone. Depois da call, os erros que você cometeu ficam registrados na análise da conversa.</p>
      </section>

      <h2 className="card-h">Ou treine no app, passo a passo</h2>
      <section className="card stack">
        <label className="field">
          <span>Como te chamam na reunião</span>
          <input className="text-input" value={profile.name} placeholder="Seu nome" onChange={(e) => store.set((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))} />
        </label>
        <div className="setting" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <div><strong>Como corrigir</strong><p className="muted" style={{ margin: 0 }}>{meet.style === 'pessoa' ? 'O colega repete sua frase do jeito certo (no máximo 1 vez a cada 2 falas) e o chat explica.' : 'Ninguém corrige em voz alta; só o chat privado.'}</p></div>
          <div className="seg" role="group" aria-label="Como corrigir">
            <button aria-pressed={meet.style === 'pessoa'} onClick={() => store.set((s) => ({ ...s, meet: { ...s.meet, style: 'pessoa' } }))}>Como pessoa</button>
            <button aria-pressed={meet.style === 'chat'} onClick={() => store.set((s) => ({ ...s, meet: { ...s.meet, style: 'chat' } }))}>Só chat</button>
          </div>
        </div>
        {!isArtifact && liveAvailable() && (
          <label className="row-between" style={{ gap: 12 }}>
            <span><strong>Microfone abre sozinho na sua vez</strong><br /><small className="muted">Mãos livres, como numa call de verdade.</small></span>
            <input type="checkbox" checked={meet.autoMic} onChange={(e) => store.set((s) => ({ ...s, meet: { ...s.meet, autoMic: e.target.checked } }))} />
          </label>
        )}
      </section>

      <div className="meet-list">
        {MEETINGS.map((m, k) => {
          const r = meet.results[m.id];
          return (
            <button key={m.id} className="tile meet-card" onClick={() => go({ name: 'meeting', id: m.id })}>
              <div className="meet-card-faces" aria-hidden>
                {m.participants.map((p, i) => (
                  <span key={p.id} className="meet-card-face"><MeetAvatar look={p.look} seed={k + i} size={44} /></span>
                ))}
              </div>
              <span className="ex-kicker">{KIND[m.kind]} · {m.minutes} min · {m.participants.map((p) => p.name).join(', ')}</span>
              <strong className="tile-title">{m.title}</strong>
              <span className="muted">{m.setting}</span>
              {r && <small className="muted">{'★'.repeat(r.stars)}{'☆'.repeat(3 - r.stars)} · {r.plays}× feita</small>}
            </button>
          );
        })}
      </div>

      <section className="card stack">
        <h2 className="card-h">E numa reunião de verdade?</h2>
        <p style={{ margin: 0 }}>O app não entra no seu Google Meet, e isso é proposital: corrigir você em voz alta na frente do time te expõe, e um robô na sala gravaria seus colegas sem consentimento. Para a reunião real existe o <b>Copiloto</b>: aberto ao lado da call, com fone, ele ouve só você, nunca fala e mostra a correção em silêncio.</p>
        <button className="btn btn-primary" onClick={() => go({ name: 'copilot' })}>Abrir o copiloto de reunião</button>
      </section>
    </main>
  );
}

/* =============================== SALA =============================== */
interface Entry {
  by: string; // id do colega ou 'you'
  text: string;
  kind: Said['kind'] | 'you';
  issues?: Issue[];
}
interface Note {
  id: number;
  kind: 'fix' | 'recast' | 'goal' | 'info';
  title: string;
  body?: string;
}

export function MeetingRoom({ id, go }: { id: string; go: (r: Route) => void }) {
  const store = useStore();
  const meeting: Meeting = MEETINGS.find((m) => m.id === id) ?? MEETINGS[0];
  const ctx = store.state.sim.context;
  const you = store.state.profile.name.trim() || 'there';
  const style = store.state.meet.style;
  const useAi = llmAvailable();
  const autoMic = store.state.meet.autoMic && !isArtifact && liveAvailable();

  const [phase, setPhase] = useState<'lobby' | 'call' | 'summary'>('lobby');
  const [st, setStState] = useState<MeetState>(initialMeet);
  const stRef = useRef(st);
  const setSt = (v: MeetState) => { stRef.current = v; setStState(v); };
  const [feed, setFeed] = useState<Entry[]>([]);
  const feedRef = useRef<Entry[]>([]);
  const pushFeed = (e: Entry) => { feedRef.current = [...feedRef.current, e]; setFeed(feedRef.current); return feedRef.current.length - 1; };
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [caption, setCaption] = useState<{ by: string; text: string } | null>(null);
  const [captions, setCaptions] = useState(true);
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  const [yourTurn, setYourTurn] = useState(false);
  const [typing, setTyping] = useState(!liveAvailable());
  const [typed, setTyped] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [starter, setStarter] = useState<string | null>(null);
  const [helps, setHelps] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const alive = useRef(true);
  const playId = useRef(0);
  const session = useRef<LiveSession | null>(null);
  const muteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const stats = useRef({ words: 0, ms: 0, issues: 0 });
  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;

  useEffect(() => () => { alive.current = false; clearTimeout(muteTimer.current); session.current?.stop(); stopAudio(); }, []);
  useEffect(() => {
    if (phase !== 'call') return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const note = (n: Omit<Note, 'id'>) => {
    setNotes((ns) => [...ns, { ...n, id: Date.now() + Math.random() }]);
    if (!chatOpenRef.current) setUnread((u) => u + 1);
  };

  /* ---------- colegas falando, em fila ---------- */
  const play = async (lines: Said[]) => {
    const my = ++playId.current;
    clearTimeout(muteTimer.current);
    setYourTurn(false);
    for (const l of lines) {
      if (playId.current !== my || !alive.current) return;
      const p = speakerOf(meeting, l.by);
      setSpeaking(p.id);
      setCaption({ by: p.id, text: l.text });
      pushFeed({ by: p.id, text: l.text, kind: l.kind });
      const t0 = Date.now();
      await speak(l.text, { variant: p.voice, onLevel: (v) => alive.current && setLevel(v) });
      // sem áudio disponível: dá tempo de ler a legenda
      const min = 500 + l.text.split(/\s+/).length * 230;
      if (Date.now() - t0 < min / 2) await sleep(min - (Date.now() - t0));
      if (playId.current !== my || !alive.current) return;
      setLevel(0);
      await sleep(220);
    }
    if (playId.current !== my || !alive.current) return;
    setSpeaking(null);
    if (stRef.current.done) return finish();
    openTurn();
  };

  /** Microfone automático falhou (sem som / sem permissão): volta para o manual, sem laço. */
  const autoFails = useRef(0);
  const typingRef = useRef(typing);
  typingRef.current = typing;
  const openTurn = () => {
    setYourTurn(true);
    clearTimeout(muteTimer.current);
    if (autoMic && !typingRef.current && autoFails.current === 0) {
      listen();
      return;
    }
    muteTimer.current = setTimeout(() => {
      if (!alive.current || session.current || stRef.current.muteNudges >= 3 || typedRef.current) return;
      const m = muteNudge(meeting, stRef.current, you);
      setSt(m.state);
      void play([m.line]);
    }, MUTE_AFTER_MS);
  };

  /* ---------- sua fala ---------- */
  const listen = () => {
    // interromper quem está falando (critério A8)
    playId.current++;
    stopAudio();
    setSpeaking(null);
    setLevel(0);
    clearTimeout(muteTimer.current);
    setLive('');
    setListening(true);
    setStarter(null);
    // chamado direto no clique: o ditado do artefato exige o gesto do usuário
    const s = startLive({ silenceMs: 2400, maxMs: 60_000, onText: (t) => alive.current && setLive(t) });
    session.current = s;
    void s.done.then(({ text, ms, pauses }) => {
      session.current = null;
      if (!alive.current || finished.current) return;
      setListening(false);
      setLive('');
      if (text.trim() && ms > 4000) store.logDay({ pauses, pauseMin: ms / 60000 });
      if (!text.trim()) {
        autoFails.current++;
        note({ kind: 'info', title: 'Não ouvi nada', body: 'Confira o microfone e toque nele de novo, ou responda digitando.' });
        openTurn();
        return;
      }
      autoFails.current = 0;
      void onUtterance(text, ms, true);
    });
  };
  const stopListening = () => session.current?.stop();

  const typedRef = useRef('');
  typedRef.current = typed;
  const sendTyped = () => {
    const t = typed.trim();
    if (!t) return;
    setTyped('');
    void onUtterance(t, 4000, false);
  };

  const onUtterance = async (text: string, ms: number, spoken: boolean) => {
    clearTimeout(muteTimer.current);
    setYourTurn(false);
    setStarter(null);
    const local: Issue[] = spot(text).map((s) => ({ source: 'rule' as const, ...s }));
    stats.current.words += text.trim().split(/\s+/).length;
    stats.current.ms += ms;
    if (spoken) {
      store.logDay({ spokenSec: ms / 1000, spoken: 1 });
      store.track('spoken');
    }
    const myIndex = pushFeed({ by: 'you', text, kind: 'you', issues: local });
    const cur = stRef.current;
    const before = new Set(cur.met);
    let next: MeetState | null = null;
    let lines: Said[] = [];
    let recastLine: string | null = null;
    let all = local;

    if (useAi) {
      setBusy(true);
      const mayRecast = style === 'pessoa' && cur.turns + 1 - cur.lastRecast >= RECAST_GAP;
      const curTurn = meeting.agenda[Math.min(cur.turn, meeting.agenda.length - 1)];
      const metNow = new Set([...cur.met, ...goalsMet(meeting.goals, text)]);
      const nextItem = curTurn.wants.every((w) => metNow.has(w)) ? meeting.agenda[cur.turn + 1] : curTurn;
      const r = await meetingTurn({
        setting: meeting.setting,
        participants: meeting.participants.map((p) => ({ id: p.id, name: p.name, role: p.role })),
        learner: you,
        goals: meeting.goals.map((g) => ({ id: g.id, label: g.label, done: cur.met.includes(g.id) })),
        agendaNext: nextItem ? { by: nextItem.by, say: fillMeet(nextItem.say, ctx, you) } : null,
        history: feedRef.current.map((e) => ({ by: e.by === 'you' ? you : e.by, text: e.text })),
        utterance: text,
        alreadyFound: local.map((l) => l.wrong),
        mayRecast,
        turns: cur.turns + 1,
        context: `role ${ctx.role}, project ${ctx.project}, teammate ${ctx.teammate}, tool ${ctx.tool}`,
      });
      if (!alive.current || finished.current) return;
      setBusy(false);
      if (r) {
        const low = text.toLowerCase();
        const ai: Issue[] = r.errors.map((e) => {
          const q = e.quote.replace(/[.,!?]/g, '').trim();
          const at = low.indexOf(q.toLowerCase());
          return { source: 'ai', rule: `ai:${e.cat}`, cat: e.cat, wrong: e.quote, fix: e.fix, clue: e.clue, explain: e.explain, start: at >= 0 ? at : undefined, end: at >= 0 ? at + q.length : undefined };
        });
        all = [...local, ...ai];
        const met = [...new Set([...cur.met, ...goalsMet(meeting.goals, text), ...r.goalsMet])];
        const turns = cur.turns + 1;
        let turn = cur.turn;
        if (meeting.agenda[turn] && meeting.agenda[turn].wants.every((w) => met.includes(w))) turn++;
        next = {
          ...cur, met, turns, turn,
          done: r.done || turns >= MAX_TURNS,
          lastRecast: r.recast ? turns : cur.lastRecast,
          recasts: cur.recasts + (r.recast ? 1 : 0),
        };
        lines = r.lines.map((l, i) => ({ by: l.by, text: l.text, kind: r.recast && i === 0 ? 'recast' : 'before' }));
        if (r.recast) recastLine = r.lines[0].text;
      }
    }
    if (!next) {
      const step = meetReact(meeting, cur, text, ctx, you, style === 'pessoa' ? local : []);
      next = step.state;
      lines = step.lines;
      recastLine = step.lines.find((l) => l.kind === 'recast')?.text ?? null;
    }

    // chat privado: só você vê
    if (all.length) {
      feedRef.current = feedRef.current.map((e, k) => (k === myIndex ? { ...e, issues: all } : e));
      setFeed(feedRef.current);
      stats.current.issues += all.length;
      for (const i of all) note({ kind: 'fix', title: `${i.wrong} → ${i.fix}`, body: i.explain });
      store.set((s) => ({ ...s, errorLog: [all.map((i) => i.cat), ...s.errorLog].slice(0, 300) }));
      store.bankErrors(all, text);
    }
    if (recastLine) {
      const who = speakerOf(meeting, lines.find((l) => l.kind === 'recast')?.by ?? lines[0]?.by ?? meeting.participants[0].id);
      note({ kind: 'recast', title: `${who.name} repetiu sua ideia do jeito certo`, body: recastLine });
    }
    for (const g of meeting.goals) {
      if (next.met.includes(g.id) && !before.has(g.id)) {
        note({ kind: 'goal', title: g.label });
        sfxCorrect(next.met.length);
      }
    }
    setSt(next);
    await play(lines);
  };

  /* ---------- começar / terminar ---------- */
  const join = () => {
    startedAt.current = Date.now();
    setPhase('call');
    void play(opening(meeting, ctx, you));
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    playId.current++;
    clearTimeout(muteTimer.current);
    session.current?.stop();
    stopAudio();
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    const sc = meetScore(meeting, stRef.current.met, helps, stats.current.issues);
    store.logDay({ mayaSec: secs });
    store.track('teacherMin', Math.floor(secs / 60));
    store.set((s) => {
      const prev = s.meet.results[meeting.id];
      return { ...s, teacherSeconds: s.teacherSeconds + secs, meet: { ...s.meet, results: { ...s.meet.results, [meeting.id]: { stars: Math.max(prev?.stars ?? 0, sc.stars), plays: (prev?.plays ?? 0) + 1, at: Date.now() } } } };
    });
    store.gainXp(20 + sc.goals * 8 + sc.stars * 5);
    sfxComplete();
    setSpeaking(null);
    setPhase('summary');
  };

  const help = () => {
    const g = pendingGoal(meeting, stRef.current);
    if (!g) return;
    setStarter(`${g.label}: “${g.starter}”`);
    setHelps((h) => h + 1);
  };

  // espaço = apertar para falar (como "segurar para falar" nas calls)
  useEffect(() => {
    if (phase !== 'call') return;
    const h = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      if (session.current) stopListening();
      else if (!busy && !stRef.current.done) listen();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const liveSpots = useMemo(() => (listening ? spot(live) : []), [live, listening]);

  const again = () => {
    finished.current = false;
    stats.current = { words: 0, ms: 0, issues: 0 };
    feedRef.current = [];
    setFeed([]);
    setNotes([]);
    setUnread(0);
    setHelps(0);
    setElapsed(0);
    setSt(initialMeet());
    setPhase('lobby');
  };

  if (phase === 'summary') return <Summary meeting={meeting} st={st} feed={feed} notes={notes} helps={helps} secs={elapsed} words={stats.current.words} go={go} onAgain={again} />;

  const tiles = meeting.participants;
  const mm = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  if (phase === 'lobby') {
    return (
      <main className="meet-room meet-lobby" id="main">
        <button className="link-btn back meet-back" onClick={() => go({ name: 'meetings' })}><BackIcon /> Reuniões</button>
        <div className="meet-lobby-grid">
          <div className="meet-preview">
            <div className="meet-you-face" aria-hidden><span>{you.slice(0, 1).toUpperCase()}</span></div>
            <span className="meet-name">{you} (você)</span>
          </div>
          <div className="meet-lobby-info">
            <span className="ex-kicker">{KIND[meeting.kind]} · {meeting.minutes} min</span>
            <h1 className="page-title">{meeting.title}</h1>
            <p>{meeting.setting}</p>
            <p className="muted" style={{ margin: 0 }}>Já estão na sala: {meeting.participants.map((p) => `${p.name} (${p.role})`).join(', ')}.</p>
            <details className="meet-goals">
              <summary>O que você precisa conseguir dizer ({meeting.goals.length})</summary>
              <ul>{meeting.goals.map((g) => <li key={g.id}>{g.label} <small className="muted" lang="en">· {g.example}</small></li>)}</ul>
            </details>
            <p className="fine">{isArtifact ? 'Na sua vez, toque no microfone (ou aperte espaço) e fale. Ele fecha sozinho quando você para.' : autoMic ? 'O microfone abre sozinho quando chega a sua vez.' : 'Na sua vez, toque no microfone (ou aperte espaço) e fale.'} Use fone de ouvido para o microfone não ouvir os colegas.</p>
            <button className="btn btn-primary meet-join" onClick={join}>Participar agora</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`meet-room ${chatOpen ? 'chat-open' : ''}`} id="main">
      <header className="meet-top">
        <h1 className="meet-title">{meeting.title}</h1>
        <span className="meet-time" aria-label={`Tempo de reunião ${mm}`}>{mm}</span>
      </header>

      <div className="meet-stage">
        <div className={`meet-grid n${tiles.length + 1}`}>
          {tiles.map((p, k) => (
            <figure key={p.id} className={`meet-tile ${speaking === p.id ? 'is-speaking' : ''}`} aria-label={`${p.name}${speaking === p.id ? ', falando' : ''}`}>
              <MeetAvatar look={p.look} seed={k + meeting.id.length} level={speaking === p.id ? level : 0} speaking={speaking === p.id} />
              <figcaption className="meet-name"><AudioBars level={speaking === p.id ? level : 0} muted={speaking !== p.id} /> {p.name} <small>· {p.role}</small></figcaption>
            </figure>
          ))}
          <figure className={`meet-tile meet-you ${listening ? 'is-speaking' : ''}`} aria-label="Você">
            <div className="meet-you-face" aria-hidden><span>{you.slice(0, 1).toUpperCase()}</span></div>
            {listening && (
              <p className="meet-live" lang="en" aria-live="polite">{live ? markUp(live, liveSpots) : 'Pode falar…'}</p>
            )}
            <figcaption className="meet-name"><AudioBars level={listening ? 0.6 : 0} muted={!listening} /> {you} (você)</figcaption>
          </figure>
        </div>

        {captions && caption && speaking && (
          <p className="meet-caption" lang="en" aria-live="polite"><b>{speakerOf(meeting, caption.by).name}</b> {caption.text}</p>
        )}
        {busy && <p className="meet-caption muted" role="status">…</p>}
        {yourTurn && !listening && !busy && (
          <p className="meet-turn" role="status">{autoMic ? 'Sua vez.' : 'Sua vez: abra o microfone e responda.'}</p>
        )}
        {starter && <p className="meet-starter" lang="en">{starter}</p>}

        <aside className="meet-chat" aria-label="Chat do coach, só você vê" hidden={!chatOpen}>
          <div className="row-between"><strong>Coach · só você vê</strong><button className="link-btn" onClick={() => setChatOpen(false)}>Fechar</button></div>
          {notes.length === 0 && <p className="muted">As correções aparecem aqui, sem parar a reunião.</p>}
          <ol className="meet-notes">
            {[...notes].reverse().map((n) => (
              <li key={n.id} className={`meet-note ${n.kind}`}>
                <b lang={n.kind === 'fix' ? 'en' : undefined}>{n.kind === 'goal' && <CheckIcon size={14} />} {n.title}</b>
                {n.body && <small lang={n.kind === 'recast' ? 'en' : undefined}>{n.body}</small>}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {typing && (
        <form className="meet-type" onSubmit={(e) => { e.preventDefault(); sendTyped(); }}>
          <input className="text-input" lang="en" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Responda em inglês (digitado não conta como fala)" aria-label="Sua resposta digitada" disabled={busy} />
          <button className="btn btn-primary" disabled={!typed.trim() || busy}>Enviar</button>
        </form>
      )}

      <nav className="meet-bar" aria-label="Controles da reunião">
        {liveAvailable() && (
          <button className={`meet-btn meet-mic ${listening ? 'on' : 'off'}`} onClick={() => (listening ? stopListening() : listen())} disabled={busy || st.done} aria-label={listening ? 'Terminei de falar (espaço)' : 'Abrir microfone e falar (espaço)'} aria-pressed={listening}>
            <Ico d={listening ? MIC : MIC_OFF} />
          </button>
        )}
        <button className="meet-btn" onClick={() => setTyping(!typing)} aria-pressed={typing} aria-label="Responder digitando"><Ico d={KEYS} /></button>
        <button className="meet-btn" onClick={() => setCaptions(!captions)} aria-pressed={captions} aria-label="Legendas"><Ico d={CC} /></button>
        <button className="meet-btn" onClick={help} disabled={!yourTurn && !listening} aria-label="Travei: me dá um começo de frase"><Ico d={HAND} /></button>
        <button className="meet-btn" onClick={() => { setChatOpen(!chatOpen); setUnread(0); }} aria-pressed={chatOpen} aria-label={`Chat do coach${unread ? `, ${unread} novas` : ''}`}>
          <Ico d={CHAT} />{unread > 0 && <span className="meet-badge">{unread}</span>}
        </button>
        <button className="meet-btn leave" onClick={finish} aria-label="Sair da reunião"><Ico d={LEAVE} /></button>
      </nav>
    </main>
  );
}

function markUp(text: string, marks: { start: number; end: number }[]) {
  const out: React.ReactNode[] = [];
  let pos = 0;
  [...marks].sort((a, b) => a.start - b.start).forEach((m, i) => {
    if (m.start < pos) return;
    out.push(text.slice(pos, m.start), <mark key={i} className="live-miss">{text.slice(m.start, m.end)}</mark>);
    pos = m.end;
  });
  out.push(text.slice(pos));
  return out;
}

/* =============================== RESUMO =============================== */
function Summary({ meeting, st, feed, notes, helps, secs, words, go, onAgain }: { meeting: Meeting; st: MeetState; feed: Entry[]; notes: Note[]; helps: number; secs: number; words: number; go: (r: Route) => void; onAgain: () => void }) {
  const issues = feed.flatMap((e) => e.issues ?? []);
  const sc = meetScore(meeting, st.met, helps, issues.length);
  const yours = feed.filter((e) => e.by === 'you');
  const recasts = notes.filter((n) => n.kind === 'recast');
  return (
    <main className="shell" id="main">
      <h1 className="page-title" tabIndex={-1} ref={(el) => el?.focus()}>{sc.goals === sc.total ? 'Você deu conta da reunião' : `${sc.goals} de ${sc.total} objetivos`}</h1>
      <p className="muted">{meeting.title} · {Math.max(1, Math.round(secs / 60))} min · {yours.length} falas suas · {words} palavras</p>
      <p aria-label={`${sc.stars} de 3 estrelas`} style={{ fontSize: 28, margin: 0, color: 'var(--sticky)' }}>{'★'.repeat(sc.stars)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(3 - sc.stars)}</span></p>

      <section className="card">
        <h2 className="card-h">Objetivos</h2>
        <ul className="meet-goal-list">
          {meeting.goals.map((g) => (
            <li key={g.id} className={st.met.includes(g.id) ? 'ok' : 'miss'}>
              <b>{st.met.includes(g.id) ? '✓' : '○'} {g.label}</b>
              {!st.met.includes(g.id) && <small lang="en"> Um jeito de dizer: {g.example}</small>}
            </li>
          ))}
        </ul>
      </section>

      {recasts.length > 0 && (
        <section className="card">
          <h2 className="card-h">Quando os colegas repetiram do jeito certo</h2>
          <p className="muted" style={{ marginTop: 0 }}>Numa reunião real é assim que a correção chega: ninguém explica a regra, a pessoa só devolve a frase certa. Perceber isso é metade do aprendizado.</p>
          {recasts.map((n) => <p key={n.id} lang="en" style={{ margin: '6px 0' }}>“{n.body}”</p>)}
        </section>
      )}

      <section className="card">
        <h2 className="card-h">Ajustes ({issues.length})</h2>
        {issues.length === 0 ? <p className="muted">Nenhum erro detectado. Lembre: o detector não pega tudo.</p> : (
          <ul className="meet-goal-list">
            {issues.map((i, k) => (
              <li key={k}><span lang="en"><s>{i.wrong}</s> → <b>{i.fix}</b></span><br /><small className="muted">{i.explain}</small></li>
            ))}
          </ul>
        )}
        {issues.length > 0 && <p className="fine">Esses trechos entraram no seu banco de erros e voltam com repetição espaçada.</p>}
      </section>

      <details className="card">
        <summary><strong>Transcrição</strong></summary>
        {feed.map((e, k) => (
          <p key={k} style={{ margin: '6px 0' }} lang="en"><b>{e.by === 'you' ? 'Você' : speakerOf(meeting, e.by).name}:</b> {e.issues?.length ? markUp(e.text, e.issues.filter((i): i is Issue & { start: number; end: number } => i.start !== undefined && i.end !== undefined)) : e.text}</p>
        ))}
      </details>

      <div className="row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        {issues.length > 0 && <button className="btn btn-primary" onClick={() => go({ name: 'errors' })}>Consertar esses erros agora</button>}
        <button className="btn btn-ghost" onClick={onAgain}>Repetir esta reunião</button>
        <button className="btn btn-ghost" onClick={() => go({ name: 'meetings' })}>Outras reuniões</button>
      </div>
    </main>
  );
}
