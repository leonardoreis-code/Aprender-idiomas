import { recommendedTracks, stories, TRACKS, videoForLesson } from '../../content';
import { CheckIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

/** Mapa do curso: 3 trilhas + trilha base A1 (vocabulário com metrô). */
export function Course({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  const rec = recommendedTracks(state.profile.level, state.profile.goals);
  return (
    <main className="shell course" id="main">
      <h1 className="page-title">Curso</h1>
      <p className="muted">Cada aula tem vídeo, material escrito, prática "Pense em inglês" e conversa com a professora. Recomendadas para você estão marcadas.</p>
      {TRACKS.map((t) => {
        const done = t.lessons.filter((l) => state.lessons[l.id]?.practice).length;
        return (
          <section key={t.id} className="track" aria-labelledby={`t-${t.id}`}>
            <header className="track-head">
              <div>
                <h2 id={`t-${t.id}`}>{t.title} {rec.includes(t.id) && <span className="badge">recomendada</span>}</h2>
                <p className="muted">{t.desc}</p>
              </div>
              <div className="track-meta">
                <span className="cefr" style={{ borderColor: t.color }}>{t.level}</span>
                <small className="muted">{done}/{t.lessons.length} aulas</small>
              </div>
            </header>
            <ol className="lesson-list">
              {t.lessons.map((l) => {
                const p = state.lessons[l.id] ?? {};
                const parts = [p.video, p.article, p.practice, p.teacher].filter(Boolean).length;
                return (
                  <li key={l.id}>
                    <button className={`lesson-row ${p.practice ? 'done' : ''}`} onClick={() => go({ name: 'lesson', id: l.id })}>
                      <span className="lr-n" style={{ borderColor: t.color, background: p.practice ? t.color : undefined }}>{p.practice ? <CheckIcon size={16} /> : l.order}</span>
                      <span className="lr-body">
                        <strong>{l.title}</strong>
                        <small className="muted">{l.minutes} min · {l.drills.length} frases{videoForLesson(l.id) ? ' · vídeo' : ''}</small>
                      </span>
                      <span className="lr-parts" aria-label={`${parts} de 4 etapas`}>
                        {[0, 1, 2, 3].map((k) => <i key={k} className={k < parts ? 'on' : ''} />)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <section className="track">
        <header className="track-head">
          <div><h2>Vocabulário base</h2><p className="muted">12 lições A1 com palavras, pronúncia e pares mínimos (o mapa de metrô).</p></div>
          <button className="btn btn-ghost" onClick={() => go({ name: 'base' })}>Abrir</button>
        </header>
      </section>
      <section className="track">
        <header className="track-head">
          <div><h2>Histórias</h2><p className="muted">{stories.length} diálogos em que você participa falando.</p></div>
          <button className="btn btn-ghost" onClick={() => go({ name: 'stories' })}>Abrir</button>
        </header>
      </section>
    </main>
  );
}

export function StoriesList({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  return (
    <main className="shell" id="main">
      <h1 className="page-title">Histórias</h1>
      <p className="muted">Você é um personagem. Ouça, escolha a resposta e fale suas falas a partir do português.</p>
      <div className="story-grid">
        {stories.map((s) => (
          <button key={s.id} className={`tile story-tile ${state.storiesDone.includes(s.id) ? 'done' : ''}`} onClick={() => go({ name: 'story', id: s.id })}>
            <span className="ex-kicker">{{ zero: 'Do zero', fala: 'Destravar a fala', tech: 'Tech', b2: 'Rumo ao B2' }[s.track]} · {s.level}</span>
            <strong className="tile-title">{s.title}</strong>
            <span className="muted">{s.setting}</span>
            <span className="cast-dots" aria-hidden>{s.characters.map((c) => <i key={c.id} style={{ background: c.color }} />)}</span>
            {state.storiesDone.includes(s.id) && <span className="badge">concluída</span>}
          </button>
        ))}
      </div>
    </main>
  );
}
