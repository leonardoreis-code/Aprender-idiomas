import { useEffect, useRef, useState } from 'react';
import type { Slide, VideoLesson } from '../../domain/curriculum/speaking';
import { speak, stopAudio } from '../../infra/audio';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { BackIcon } from '../icons/ui';
import { useStore } from '../store';

const ROLE_COLOR: Record<string, string> = { subject: 'var(--indigo)', verb: 'var(--tangerine)', object: 'var(--teal)', time: 'var(--ochre)', aux: '#8a4fd8', other: 'var(--ink-3)' };
const ROLE_PT: Record<string, string> = { subject: 'sujeito', verb: 'verbo', object: 'complemento', time: 'tempo', aux: 'auxiliar', other: '' };

/**
 * Vídeo-aula: slides animados + professora-avatar narrando com a boca
 * sincronizada à voz (ElevenLabs via backend, ou voz do sistema).
 * Tem legenda sempre visível, pausa, voltar/avançar e quiz interativo.
 */
export function VideoPlayer({ video, onBack, onPractice }: { video: VideoLesson; onBack: () => void; onPractice?: () => void }) {
  const store = useStore();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [talking, setTalking] = useState(false);
  const [quiz, setQuiz] = useState<number | null>(null);
  const level = useRef(0);
  const run = useRef(0);
  const slide = video.slides[i];
  const last = i === video.slides.length - 1;

  const narrate = async (k: number) => {
    const my = ++run.current;
    setTalking(true);
    try {
      await speak(video.slides[k].narration, { lang: 'pt', onLevel: (l) => (level.current = l) });
    } finally {
      if (my === run.current) setTalking(false);
    }
    if (my !== run.current) return;
    const v = video.slides[k].visual;
    if (v.kind === 'example') await speak(v.en, { onLevel: (l) => (level.current = l) });
    if (my !== run.current) return;
    // avança sozinho, exceto no quiz (espera a resposta)
    if (v.kind !== 'quiz' && k < video.slides.length - 1) setTimeout(() => my === run.current && go(k + 1, true), 700);
    else setPlaying(false);
  };

  const go = (k: number, autoplay = playing) => {
    run.current++;
    stopAudio();
    setQuiz(null);
    setI(k);
    if (autoplay) {
      setPlaying(true);
      void narrate(k);
    }
  };

  useEffect(() => () => { run.current++; stopAudio(); }, []);

  const toggle = () => {
    if (playing) {
      run.current++;
      stopAudio();
      setPlaying(false);
      setTalking(false);
    } else {
      setPlaying(true);
      void narrate(i);
    }
  };

  const finish = () => {
    if (!store.state.videosDone.includes(video.id)) {
      store.set((s) => ({ ...s, videosDone: [...s.videosDone, video.id], lessons: video.lessonId ? { ...s.lessons, [video.lessonId]: { ...s.lessons[video.lessonId], video: true } } : s.lessons }));
      store.gainXp(20);
    }
    onPractice ? onPractice() : onBack();
  };

  return (
    <main className="shell video" id="main">
      <button className="link-btn back" onClick={() => { run.current++; stopAudio(); onBack(); }}><BackIcon /> Voltar</button>
      <h1 className="page-title">{video.title}</h1>
      <div className="video-frame">
        <div className="video-slide" key={i}>
          <SlideView slide={slide} quiz={quiz} onQuiz={setQuiz} />
        </div>
        <div className="video-avatar">
          <TeacherAvatar state={talking ? 'speaking' : 'idle'} level={() => level.current} size={120} />
        </div>
        <div className="video-progress" aria-hidden>
          {video.slides.map((_, k) => <span key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} />)}
        </div>
      </div>
      <p className="caption" aria-live="polite">{slide.narration}</p>
      <div className="video-controls">
        <button className="btn btn-ghost" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} aria-label="Slide anterior">‹</button>
        <button className="btn btn-primary" onClick={toggle} style={{ minWidth: 150 }}>{playing ? 'Pausar' : i === 0 ? '▶ Assistir aula' : '▶ Continuar'}</button>
        {!last ? (
          <button className="btn btn-ghost" onClick={() => go(i + 1)} aria-label="Próximo slide">›</button>
        ) : (
          <button className="btn btn-ok" onClick={finish} disabled={slide.visual.kind === 'quiz' && quiz === null}>{onPractice ? 'Ir para a prática' : 'Concluir'}</button>
        )}
      </div>
      <p className="fine">Slide {i + 1} de {video.slides.length}. Narração por voz da ElevenLabs quando o servidor tem a chave; senão, voz do sistema.</p>
    </main>
  );
}

function SlideView({ slide, quiz, onQuiz }: { slide: Slide; quiz: number | null; onQuiz: (n: number) => void }) {
  const v = slide.visual;
  switch (v.kind) {
    case 'title':
      return <div className="sv-title"><h2>{v.title}</h2>{v.subtitle && <p>{v.subtitle}</p>}</div>;
    case 'bullets':
      return <div className="sv-bullets"><h2>{v.title}</h2><ul>{v.bullets.map((b, k) => <li key={k} style={{ animationDelay: `${k * 0.25}s` }}>{b}</li>)}</ul></div>;
    case 'example':
      return (
        <div className="sv-example">
          <p className="en" lang="en">{v.highlight ? v.en.split(v.highlight).flatMap((part, k, arr) => (k < arr.length - 1 ? [part, <mark key={k}>{v.highlight}</mark>] : [part])) : v.en}</p>
          <p className="pt">{v.pt}</p>
          <button className="chip" onClick={() => speak(v.en)}>▶ ouvir</button>
        </div>
      );
    case 'compare':
      return (
        <div className="sv-compare">
          <div><span className="tag">Português</span><p>{v.pt}</p></div>
          {v.wrong && <div className="wrong"><span className="tag">Erro comum</span><p lang="en"><s>{v.wrong}</s></p></div>}
          <div className="right"><span className="tag">Inglês natural</span><p lang="en">{v.en}</p></div>
        </div>
      );
    case 'formula':
      return (
        <div className="sv-formula">
          <div className="parts">
            {v.parts.map((p, k) => (
              <span key={k} style={{ borderColor: ROLE_COLOR[p.role], animationDelay: `${k * 0.2}s` }}>
                <b lang="en">{p.text}</b>
                <small style={{ color: ROLE_COLOR[p.role] }}>{ROLE_PT[p.role]}</small>
              </span>
            ))}
          </div>
          {v.caption && <p>{v.caption}</p>}
        </div>
      );
    case 'quiz':
      return (
        <div className="sv-quiz">
          <h2>{v.question}</h2>
          <div className="options">
            {v.options.map((o, k) => (
              <button key={k} className={`option ${quiz !== null ? (k === v.answer ? 'is-ok' : quiz === k ? 'is-bad' : '') : ''}`} disabled={quiz !== null} onClick={() => onQuiz(k)} lang="en">{o}</button>
            ))}
          </div>
          {quiz !== null && <p role="status">{quiz === v.answer ? 'Isso!' : `Resposta: ${v.options[v.answer]}`}</p>}
        </div>
      );
  }
}
