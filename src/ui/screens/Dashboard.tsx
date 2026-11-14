import { allDrills, nextLesson, stories, TRACKS } from '../../content';
import { dayKey, levelFor } from '../../domain/motivation/motivation';
import { questsFor } from '../../domain/motivation/quests';
import { dueDrillCount } from '../../domain/production/ladder';
import { dueItemIds } from '../../domain/srs/scheduler';
import { ProgressRing } from '../components/Graphics';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { Flame } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

export function Dashboard({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  const m = state.motivation;
  const today = m.xpByDay[dayKey()] ?? 0;
  const lvl = levelFor(m.xpTotal);
  const next = nextLesson(state.profile.level, state.profile.goals, state.lessons);
  const dueProd = dueDrillCount(state.production);
  const dueBase = dueItemIds(state.cards).length;
  const quests = questsFor(dayKey());
  const qp: { progress: Partial<Record<string, number>>; claimed: string[] } = state.quests.day === dayKey() ? state.quests : { progress: {}, claimed: [] };
  const produced = Object.keys(state.production).length;
  const automatic = Object.values(state.production).filter((p) => p.stage >= 3).length;
  const nextStory = stories.find((s) => !state.storiesDone.includes(s.id) && (state.profile.level === 'zero' ? s.track === 'zero' : s.track !== 'zero'));
  const hello = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <main className="shell dash" id="main">
      <section className="dash-hero">
        <div>
          <span className="ex-kicker">{hello}{state.profile.name ? `, ${state.profile.name}` : ''}</span>
          <h1 className="page-title">{today >= m.dailyGoal ? 'Meta batida. Quer ir além?' : 'Vamos destravar sua fala hoje'}</h1>
          <div className="dash-stats">
            <span className="stat"><Flame lit={m.lastGoalDay === dayKey()} /> {m.streak} {m.streak === 1 ? 'dia' : 'dias'}</span>
            <span className="stat"><Gem /> {state.gems}</span>
            <span className="stat">Nível {lvl.level}</span>
          </div>
        </div>
        <ProgressRing value={today} max={m.dailyGoal} size={96} label={`Meta do dia: ${today} de ${m.dailyGoal} XP`}>
          <span style={{ fontSize: 16 }}>{Math.min(today, m.dailyGoal)}<span className="muted" style={{ fontWeight: 600 }}>/{m.dailyGoal}</span></span>
        </ProgressRing>
      </section>

      <div className="dash-grid">
        {next && (
          <button className="tile tile-main" onClick={() => go({ name: 'lesson', id: next.id })}>
            <span className="ex-kicker">Próxima aula · {TRACKS.find((t) => t.id === next.track)?.title}</span>
            <strong className="tile-title">{next.title}</strong>
            <span className="muted">{next.goal}</span>
            <span className="tile-cta">Começar · {next.minutes} min →</span>
          </button>
        )}

        <button className="tile" onClick={() => go({ name: 'practice' })} disabled={!produced && !next}>
          <span className="ex-kicker">Pense em inglês</span>
          <strong className="tile-title">{dueProd ? `${dueProd} frases esperando` : 'Treino personalizado'}</strong>
          <span className="muted">Português → inglês, do montar ao falar rápido. {automatic}/{allDrills.length} frases já automáticas.</span>
          <ProdBar produced={produced} automatic={automatic} total={allDrills.length} />
        </button>

        <button className="tile tile-teacher" onClick={() => go({ name: 'teacher' })}>
          <TeacherAvatar state="idle" size={84} />
          <span>
            <span className="ex-kicker">Aula ao vivo</span>
            <strong className="tile-title">Conversar com a Maya</strong>
            <span className="muted">Ela ouve, corrige sua gramática na hora e pede para você repetir.</span>
          </span>
        </button>

        <div className="tile quests" aria-labelledby="q-h">
          <span className="ex-kicker" id="q-h">Missões de hoje</span>
          {quests.map((q) => {
            const v = Math.min(qp.progress[q.metric] ?? 0, q.target);
            const done = qp.claimed.includes(q.id);
            return (
              <div key={q.id} className={`quest ${done ? 'done' : ''}`}>
                <div className="row-between"><span>{q.title}</span><small className="muted">{done ? 'feito' : `+${q.gems}`} <Gem size={14} /></small></div>
                <div className="qbar" role="progressbar" aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={v} aria-label={q.title}><span style={{ width: `${(v / q.target) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>

        {nextStory && (
          <button className="tile" onClick={() => go({ name: 'story', id: nextStory.id })}>
            <span className="ex-kicker">História interativa</span>
            <strong className="tile-title">{nextStory.title}</strong>
            <span className="muted">{nextStory.setting}</span>
          </button>
        )}

        <button className="tile" onClick={() => go({ name: 'accent' })}>
          <span className="ex-kicker">Laboratório de sotaque</span>
          <strong className="tile-title">Onde sua pronúncia trava</strong>
          <span className="muted">Grave, compare com a voz nativa e veja os padrões do português que aparecem na sua fala.</span>
        </button>

        {dueBase > 0 && (
          <button className="tile" onClick={() => go({ name: 'base' })}>
            <span className="ex-kicker">Vocabulário base</span>
            <strong className="tile-title">{dueBase} palavras para revisar</strong>
            <span className="muted">Trilha A1 com repetição espaçada.</span>
          </button>
        )}
      </div>
    </main>
  );
}

function ProdBar({ produced, automatic, total }: { produced: number; automatic: number; total: number }) {
  return (
    <svg viewBox="0 0 200 10" width="100%" height="10" aria-hidden style={{ marginTop: 8 }}>
      <rect width="200" height="10" rx="5" fill="var(--surface-2)" />
      <rect width={(produced / total) * 200} height="10" rx="5" fill="color-mix(in srgb, var(--indigo) 35%, transparent)" />
      <rect width={(automatic / total) * 200} height="10" rx="5" fill="var(--indigo)" />
    </svg>
  );
}

export function Gem({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M6 3h12l4 6-10 12L2 9z" fill="var(--teal)" />
      <path d="M2 9h20M9 3l3 18 3-18" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".6" />
    </svg>
  );
}
