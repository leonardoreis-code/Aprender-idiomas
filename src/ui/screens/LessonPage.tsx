import type { ArticleBlock, SpeakingLesson } from '../../domain/curriculum/speaking';
import { speak } from '../../infra/audio';
import { BackIcon, CheckIcon, SpeakerIcon } from '../icons/ui';
import { useStore } from '../store';
import { Pretest } from './Learning';
import type { Route } from '../router';

/**
 * Página da aula: 4 passos — vídeo-aula, material escrito, prática "Pense em
 * inglês" e conversa com a professora usando o padrão da aula.
 */
export function LessonPage({ lesson, hasVideo, go }: { lesson: SpeakingLesson; hasVideo: string | null; go: (r: Route) => void }) {
  const store = useStore();
  const p = store.state.lessons[lesson.id] ?? {};
  const markArticle = () => {
    if (!p.article) {
      store.set((s) => ({ ...s, lessons: { ...s.lessons, [lesson.id]: { ...s.lessons[lesson.id], article: true } } }));
      store.gainXp(10);
    }
  };
  const steps = [
    { key: 'video', done: !!p.video, label: 'Vídeo-aula', sub: hasVideo ? 'A Maya explica em 3 min' : 'Em breve para esta aula', action: hasVideo ? () => go({ name: 'video', id: hasVideo }) : undefined },
    { key: 'article', done: !!p.article, label: 'Material escrito', sub: 'Leia abaixo e ouça os exemplos', action: () => document.getElementById('article')?.scrollIntoView({ behavior: 'smooth' }) },
    { key: 'practice', done: !!p.practice, label: 'Pense em inglês', sub: `${lesson.drills.length} frases do português para o inglês`, action: () => go({ name: 'practice', lessonId: lesson.id }) },
    { key: 'teacher', done: !!p.teacher, label: 'Treinador ao vivo', sub: 'Use o padrão falando, com correção na hora', action: () => go({ name: 'teacher', lessonId: lesson.id }) },
  ];
  return (
    <main className="shell lesson-page" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'course' })}><BackIcon /> Curso</button>
      <header className="lesson-head">
        <span className="ex-kicker">{{ zero: 'Do zero', fala: 'Destravar a fala', tech: 'Inglês para tech', b2: 'Rumo ao B2' }[lesson.track]} · Aula {lesson.order} · {lesson.level} · {lesson.minutes} min</span>
        <h1 className="page-title">{lesson.title}</h1>
        <p className="muted">{lesson.goal}</p>
        <div className="pattern-card">
          <span className="ex-kicker">Padrão da aula</span>
          <p className="pattern" lang="en">{lesson.pattern.frame}</p>
          <p className="muted" style={{ margin: 0 }}>{lesson.pattern.meaning}</p>
        </div>
      </header>

      <Pretest lesson={lesson} />

      <ol className="steps">
        {steps.map((s, k) => (
          <li key={s.key}>
            <button className={`step ${s.done ? 'done' : ''}`} onClick={s.action} disabled={!s.action}>
              <span className="step-n">{s.done ? <CheckIcon size={18} /> : k + 1}</span>
              <span><strong>{s.label}</strong><br /><small className="muted">{s.sub}</small></span>
            </button>
          </li>
        ))}
      </ol>

      <article id="article" className="article">
        {lesson.article.map((b, k) => <Block key={k} b={b} />)}
        <div className="article-end">
          <button className="btn btn-primary" onClick={() => { markArticle(); go({ name: 'practice', lessonId: lesson.id }); }}>Li tudo — praticar agora</button>
        </div>
      </article>
    </main>
  );
}

function Block({ b }: { b: ArticleBlock }) {
  switch (b.type) {
    case 'h':
      return <h2>{b.text}</h2>;
    case 'p':
      return <p>{b.text}</p>;
    case 'tip':
      return <p className="tip">{b.text}</p>;
    case 'example':
      return (
        <div className="ex-block">
          <button className="icon-btn" onClick={() => speak(b.en)} aria-label={`Ouvir: ${b.en}`}><SpeakerIcon size={20} /></button>
          <div><p className="en" lang="en">{b.en}</p><p className="pt">{b.pt}</p>{b.note && <small className="muted">{b.note}</small>}</div>
        </div>
      );
    case 'compare':
      return (
        <div className="cmp-block">
          <div><span className="tag">Você pensa</span><p>{b.pt}</p></div>
          {b.wrong && <div className="wrong"><span className="tag">Sai assim</span><p lang="en"><s>{b.wrong}</s></p></div>}
          <div className="right"><span className="tag">Em inglês</span><p lang="en">{b.en} <button className="icon-btn inline" onClick={() => speak(b.en)} aria-label="Ouvir"><SpeakerIcon size={16} /></button></p></div>
          <p className="why">{b.explain}</p>
        </div>
      );
    case 'table':
      return (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabela">
          <table>
            <thead><tr>{b.head.map((h, k) => <th key={k}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
  }
}
