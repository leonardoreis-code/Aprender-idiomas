import { useEffect, useRef, useState } from 'react';
import type { TeacherSession, TeacherStatus } from '../../infra/teacher';
import { TeacherAvatar, type AvatarState } from '../components/TeacherAvatar';
import { BackIcon, MicIcon } from '../icons/ui';
import { teacherContext, useStore } from '../store';

export type TeacherModeId = 'conversation' | 'drill' | 'roleplay' | 'interview';

const MODES: { id: TeacherModeId; title: string; desc: string; context: string }[] = [
  { id: 'conversation', title: 'Conversa livre', desc: 'Fale do seu dia e do seu trabalho. A Maya corrige com naturalidade.', context: 'Mode: conversation.' },
  { id: 'drill', title: 'Treino PT → EN', desc: 'Ela fala uma frase em português, você responde em inglês.', context: 'Mode: drill. Give one Portuguese sentence at a time for the student to say in English.' },
  { id: 'roleplay', title: 'Daily standup', desc: 'Simule a daily: ela é sua gerente e faz perguntas.', context: 'Mode: roleplay. You are the engineering manager running a daily standup for a data team. Ask the student for yesterday, today and blockers, and ask follow-up questions.' },
  { id: 'interview', title: 'Entrevista técnica', desc: 'Vaga de dados: comportamental + técnica, com follow-ups.', context: 'Mode: interview. Interview the student for a Data Engineer role. Mix behavioral (STAR) and technical data questions.' },
];

interface Msg {
  role: 'user' | 'agent';
  text: string;
}

/** Aula ao vivo com a professora-avatar (ElevenLabs Conversational AI). */
export function TeacherRoom({ onBack, initialMode = 'conversation', lessonContext }: { onBack: () => void; initialMode?: TeacherModeId; lessonContext?: string }) {
  const store = useStore();
  const [mode, setMode] = useState<TeacherModeId>(initialMode);
  const [status, setStatus] = useState<TeacherStatus>('idle');
  const [speaking, setSpeaking] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [typed, setTyped] = useState('');
  const session = useRef<TeacherSession | null>(null);
  const startedAt = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => void end(), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  const start = async () => {
    setError(null);
    const m = MODES.find((x) => x.id === mode)!;
    try {
      // SDK de voz carregado só quando a aula começa (bundle inicial menor)
      const { startTeacher } = await import('../../infra/teacher');
      session.current = await startTeacher(
        {
          onStatus: (s, d) => {
            setStatus(s);
            if (s === 'error') setError(d ?? 'Falha na conexão.');
          },
          onMode: (md) => setSpeaking(md === 'speaking'),
          onMessage: (msg) => setMsgs((xs) => [...xs, msg]),
        },
        teacherContext(store.state, `${m.context} ${lessonContext ?? ''}`),
      );
      startedAt.current = Date.now();
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error && /permission|denied|NotAllowed/i.test(e.message + e.name) ? 'Permita o uso do microfone para conversar com a Maya.' : 'Não consegui conectar com a professora agora. Verifique sua internet e tente de novo.');
    }
  };

  const end = async () => {
    const s = session.current;
    session.current = null;
    if (!s) return;
    await s.end().catch(() => {});
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    if (secs > 5) {
      store.set((st) => ({ ...st, teacherSeconds: st.teacherSeconds + secs }));
      store.track('teacherMin', Math.floor(secs / 60));
      store.gainXp(Math.min(60, Math.round(secs / 6)));
    }
    setStatus('idle');
    setSpeaking(false);
  };

  const live = status === 'connected';
  const avatarState: AvatarState = status === 'connecting' ? 'thinking' : live ? (speaking ? 'speaking' : 'listening') : 'idle';
  const corrections = msgs.filter((m) => m.role === 'agent' && /you mean|try:|say:|instead|correct/i.test(m.text));

  return (
    <main className="shell teacher" id="main">
      <button className="link-btn back" onClick={() => { void end(); onBack(); }}><BackIcon /> Voltar</button>
      <div className="teacher-grid">
        <section className="teacher-stage card">
          <TeacherAvatar state={avatarState} level={() => session.current?.outputLevel() ?? 0} size={240} sunglasses={store.state.purchases.includes('teacher-theme')} />
          <h1 style={{ fontSize: '1.6rem' }}>Maya</h1>
          <p className="muted" role="status">
            {status === 'idle' && 'Pronta para a aula. Escolha o tipo e comece.'}
            {status === 'connecting' && 'Conectando…'}
            {live && (speaking ? 'Falando…' : muted ? 'Microfone mudo' : 'Ouvindo você — pode falar')}
            {status === 'error' && 'Conexão interrompida'}
          </p>
          {live && <InputMeter level={() => session.current?.inputLevel() ?? 0} />}
          {error && <p className="err-pill" role="alert">{error}</p>}
          {!live ? (
            <button className="btn btn-primary btn-block" onClick={start} disabled={status === 'connecting'}>
              <MicIcon /> {status === 'connecting' ? 'Conectando…' : 'Começar aula ao vivo'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { session.current?.setMuted(!muted); setMuted(!muted); }}>{muted ? 'Ativar mic' : 'Mudo'}</button>
              <button className="btn btn-bad" style={{ flex: 1 }} onClick={() => void end()}>Encerrar</button>
            </div>
          )}
          <p className="fine">Voz e correção em tempo real via ElevenLabs. Use fone para evitar eco.</p>
        </section>

        <section className="teacher-side">
          <fieldset className="mode-pick" disabled={live || status === 'connecting'}>
            <legend>Tipo de aula</legend>
            {MODES.map((m) => (
              <button key={m.id} type="button" className="option" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)}>
                <span><strong>{m.title}</strong><br /><small className="muted">{m.desc}</small></span>
              </button>
            ))}
          </fieldset>

          <div className="card transcript-box">
            <div className="row-between"><strong>Transcrição</strong><small className="muted">{msgs.length} falas</small></div>
            <div ref={logRef} className="log" aria-live="polite">
              {msgs.length === 0 && <p className="muted">A conversa aparece aqui em tempo real, com as correções da Maya destacadas.</p>}
              {msgs.map((m, i) => (
                <p key={i} className={`bubble ${m.role} ${m.role === 'agent' && corrections.includes(m) ? 'fix' : ''}`} lang="en">{m.text}</p>
              ))}
            </div>
            {live && (
              <form className="row" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) { session.current?.sendText(typed); setTyped(''); } }}>
                <input className="text-input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ou digite uma mensagem…" aria-label="Mensagem para a Maya" lang="en" />
                <button className="btn btn-primary">Enviar</button>
              </form>
            )}
          </div>
          {corrections.length > 0 && !live && (
            <div className="card">
              <strong>Correções desta aula</strong>
              {corrections.map((c, i) => <p key={i} className="err-pill" lang="en">{c.text}</p>)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InputMeter({ level }: { level: () => number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t = () => {
      setV(level());
      raf = requestAnimationFrame(t);
    };
    t();
    return () => cancelAnimationFrame(raf);
  }, [level]);
  return (
    <svg width="160" height="28" viewBox="0 0 160 28" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => {
        const h = 4 + Math.max(0, v * 24 - Math.abs(i - 7.5) * 1.6) * (0.6 + ((i * 37) % 10) / 25);
        return <rect key={i} x={i * 10 + 2} y={14 - h / 2} width="6" height={h} rx="3" fill="var(--teal)" />;
      })}
    </svg>
  );
}
