import { useEffect, useRef, useState } from 'react';
import type { Story, StoryLine } from '../../domain/curriculum/speaking';
import { checkTyped } from '../../domain/practice/answer';
import { detectErrors, ERROR_CATEGORIES } from '../../domain/production/errors';
import { speak, stopAudio } from '../../infra/audio';
import type { Recording } from '../../infra/recorder';
import { sfxComplete, sfxCorrect, sfxWrong } from '../../infra/sfx';
import { MicButton, micAvailable } from '../components/Mic';
import { BackIcon } from '../icons/ui';
import { useStore } from '../store';

/** História interativa: você é um personagem e precisa ouvir, escolher e FALAR. */
export function StoryPlayer({ story, onBack }: { story: Story; onBack: () => void }) {
  const store = useStore();
  const [pos, setPos] = useState(0);
  const [log, setLog] = useState<{ line: StoryLine; result?: { ok: boolean; text?: string; feedback?: string } }[]>([]);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const endRef = useRef<HTMLDivElement>(null);
  const line = story.lines[pos];
  const done = pos >= story.lines.length;
  const who = (id: string) => story.characters.find((c) => c.id === id);
  const voiceOf = (id: string) => Math.max(0, story.characters.findIndex((c) => c.id === id)) % 3;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log, pos]);
  useEffect(() => {
    if (line?.type === 'line') void speak(line.en, { variant: voiceOf(line.speaker) });
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    stopAudio();
  }, []);
  useEffect(() => {
    if (!done) return;
    sfxComplete();
    if (!store.state.storiesDone.includes(story.id)) store.set((s) => ({ ...s, storiesDone: [...s.storiesDone, story.id] }));
    store.track('stories');
    store.gainXp(15 + score.ok * 3);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (result?: { ok: boolean; text?: string; feedback?: string }) => {
    setLog((l) => [...l, { line, result }]);
    if (result) {
      setScore((s) => ({ ok: s.ok + (result.ok ? 1 : 0), total: s.total + 1 }));
      result.ok ? sfxCorrect() : sfxWrong();
    }
    setPos((p) => p + 1);
  };

  return (
    <main className="shell story" id="main">
      <button className="link-btn back" onClick={onBack}><BackIcon /> Histórias</button>
      <header className="story-head">
        <h1 className="page-title">{story.title}</h1>
        <p className="muted">{story.setting}</p>
        <div className="cast">{story.characters.map((c) => <span key={c.id} className="cast-item"><Face color={c.color} /> {c.name} <small className="muted">· {c.role}</small></span>)}</div>
      </header>

      <div className="chat">
        {log.map((e, k) => <LogEntry key={k} e={e} who={who} />)}
        {!done && line.type === 'line' && (
          <div className="bubble-row">
            <Face color={who(line.speaker)?.color ?? '#888'} />
            <div className="bubble agent pop-in">
              <b>{who(line.speaker)?.name}</b>
              <p lang="en">{line.en}</p>
              <details><summary>tradução</summary><p>{line.pt}</p></details>
              <div className="row">
                <button className="chip" onClick={() => speak(line.en, { variant: voiceOf(line.speaker) })}>▶ ouvir</button>
                <button className="btn btn-primary" autoFocus onClick={() => advance()}>Continuar</button>
              </div>
            </div>
          </div>
        )}
        {!done && line.type === 'choice' && (
          <div className="card pop-in">
            <p className="ex-kicker">Sua vez · escolha</p>
            <p><strong>{line.prompt}</strong></p>
            <div className="options">
              {line.options.map((o, k) => (
                <button key={k} className="option" lang="en" onClick={() => advance({ ok: o.correct, text: o.en, feedback: o.feedback })}>{o.en}</button>
              ))}
            </div>
          </div>
        )}
        {!done && line.type === 'speak' && <SpeakTurn key={pos} line={line} onDone={advance} />}
        {!done && line.type === 'check' && (
          <div className="card pop-in">
            <p className="ex-kicker">Entendeu?</p>
            <p><strong>{line.question}</strong></p>
            <div className="options">
              {line.options.map((o, k) => <button key={k} className="option" onClick={() => advance({ ok: k === line.answer, text: o, feedback: k === line.answer ? 'Isso.' : `Resposta: ${line.options[line.answer]}` })}>{o}</button>)}
            </div>
          </div>
        )}
        {done && (
          <div className="card pop-in" style={{ textAlign: 'center' }}>
            <h2>Fim da história</h2>
            <p>{score.ok} de {score.total} interações certas.</p>
            <button className="btn btn-primary" onClick={onBack}>Voltar às histórias</button>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </main>
  );
}

function SpeakTurn({ line, onDone }: { line: Extract<StoryLine, { type: 'speak' }>; onDone: (r: { ok: boolean; text?: string; feedback?: string }) => void }) {
  const store = useStore();
  const [typing, setTyping] = useState(!micAvailable());
  const [val, setVal] = useState('');
  const evaluate = (said: string, spoken: boolean) => {
    const v = checkTyped(said, [line.en, ...(line.alt ?? [])]);
    const errors = v === 'wrong' ? detectErrors(said, [line.en, ...(line.alt ?? [])]) : [];
    if (errors.length) store.set((s) => ({ ...s, errorLog: [errors, ...s.errorLog].slice(0, 300) }));
    if (spoken) store.track('spoken');
    onDone({ ok: v !== 'wrong', text: said || '(sem resposta)', feedback: v === 'wrong' ? `Natural: "${line.en}". ${errors.map((e) => ERROR_CATEGORIES[e]?.explain).filter(Boolean).join(' ')}` : v === 'almost' ? `Quase: "${line.en}"` : 'Perfeito!' });
    void speak(line.en);
  };
  return (
    <div className="card pop-in speak-turn">
      <p className="ex-kicker">Sua fala · diga em inglês</p>
      <p className="pt-prompt">{line.pt}</p>
      {typing ? (
        <form onSubmit={(e) => { e.preventDefault(); if (val.trim()) evaluate(val, false); }} className="row">
          <input className="text-input" autoFocus lang="en" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Digite em inglês…" aria-label="Sua resposta em inglês" />
          <button className="btn btn-primary">Enviar</button>
        </form>
      ) : (
        <MicButton onResult={(r: Recording) => evaluate(r.text, true)} />
      )}
      <button className="link-btn" onClick={() => setTyping(!typing)}>{typing ? 'Prefiro falar' : 'Digitar em vez de falar'}</button>
    </div>
  );
}

function LogEntry({ e, who }: { e: { line: StoryLine; result?: { ok: boolean; text?: string; feedback?: string } }; who: (id: string) => { name: string; color: string } | undefined }) {
  const l = e.line;
  if (l.type === 'line')
    return (
      <div className="bubble-row faded"><Face color={who(l.speaker)?.color ?? '#888'} /><div className="bubble agent"><b>{who(l.speaker)?.name}</b><p lang="en">{l.en}</p></div></div>
    );
  if (l.type === 'check') return <p className={`log-check ${e.result?.ok ? 'ok' : 'bad'}`}>{e.result?.ok ? '✓' : '✗'} {l.question} — {e.result?.feedback}</p>;
  return (
    <div className="bubble-row me">
      <div className={`bubble user ${e.result?.ok ? 'ok' : 'bad'}`}>
        <b>Você</b>
        <p lang="en">{e.result?.text}</p>
        {e.result?.feedback && <small>{e.result.feedback}</small>}
      </div>
    </div>
  );
}

function Face({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="face">
      <circle cx="18" cy="18" r="17" fill={color} />
      <circle cx="13" cy="15" r="2" fill="#fff" />
      <circle cx="23" cy="15" r="2" fill="#fff" />
      <path d="M12 23q6 5 12 0" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
