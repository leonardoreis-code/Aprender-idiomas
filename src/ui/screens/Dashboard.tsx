import { allDrills, nextLesson, stories, TRACKS } from '../../content';
import { dayKey, levelFor } from '../../domain/motivation/motivation';
import { questsFor } from '../../domain/motivation/quests';
import { checkpointSchedule, nextCheckpoint, phaseOf, PLAN_WEEKS, weekOf } from '../../domain/plan/sixMonths';
import { emptyDay } from '../../domain/progress/daily';
import { dueDrillCount } from '../../domain/production/ladder';
import { dueItemIds } from '../../domain/srs/scheduler';
import { ProgressRing } from '../components/Graphics';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { CheckIcon, Flame } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

export function Dashboard({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  const m = state.motivation;
  const todayKey = dayKey();
  const today = m.xpByDay[todayKey] ?? 0;
  const lvl = levelFor(m.xpTotal);
  const next = nextLesson(state.profile.level, state.profile.goals, state.lessons);
  const dueProd = dueDrillCount(state.production);
  const dueBase = dueItemIds(state.cards).length;
  const quests = questsFor(todayKey);
  const qp: { progress: Partial<Record<string, number>>; claimed: string[] } = state.quests.day === todayKey ? state.quests : { progress: {}, claimed: [] };
  const total = allDrills.length + state.custom.length;
  const produced = Object.keys(state.production).length;
  const automatic = Object.values(state.production).filter((p) => p.stage >= 3).length;
  const nextStory = stories.find((s) => !state.storiesDone.includes(s.id) && (state.profile.level === 'zero' ? s.track === 'zero' : s.track !== 'zero'));
  const hello = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  // plano de 6 meses
  const start = state.plan.startDay;
  const week = weekOf(start, todayKey);
  const phase = phaseOf(Math.min(Math.max(week, 1), PLAN_WEEKS));
  const cp = nextCheckpoint(checkpointSchedule(start, state.checkpoints.map((c) => c.week), todayKey));
  const d = state.daily[todayKey] ?? emptyDay();
  const speakTarget = Math.round(phase.speakMin / 6);
  const mayaTarget = Math.round(phase.mayaMin / 6);
  const steps: { label: string; sub: string; done: boolean; go: Route }[] = [
    { label: dueProd ? `Revisar ${dueProd} frases vencidas` : 'Revisão em dia', sub: 'Primeiro o que está para ser esquecido', done: dueProd === 0 && (d.produced > 0 || produced === 0), go: { name: 'practice' } },
    next
      ? { label: `Aula: ${next.title}`, sub: 'Vídeo, leitura e prática na escada', done: d.produced >= 12, go: { name: 'lesson', id: next.id } }
      : { label: 'Treino dos meus erros', sub: 'Frases das estruturas em que você mais erra', done: d.produced >= 12, go: { name: 'practice', lessonId: 'erros' } },
    { label: 'Fala livre de 1 minuto', sub: d.wpmN ? `${Math.round(d.wpmSum / d.wpmN)} palavras por minuto hoje` : 'Fale sem parar sobre a pergunta do dia', done: d.wpmN > 0, go: { name: 'monologue' } },
    { label: `Conversa com a Maya (${mayaTarget} min)`, sub: `${Math.round(d.mayaSec / 60)} min hoje`, done: d.mayaSec >= mayaTarget * 60, go: { name: 'teacher' } },
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  return (
    <main className="shell dash" id="main">
      <section className="dash-hero">
        <div>
          <span className="ex-kicker">{hello}{state.profile.name ? `, ${state.profile.name}` : ''}{start ? ` · semana ${Math.min(week, PLAN_WEEKS)} de ${PLAN_WEEKS}` : ''}</span>
          <h1 className="page-title">{doneSteps === steps.length ? 'Roteiro de hoje completo' : 'Vamos destravar sua fala hoje'}</h1>
          <div className="dash-stats">
            <span className="stat"><Flame lit={m.lastGoalDay === todayKey} /> {m.streak} {m.streak === 1 ? 'dia' : 'dias'}</span>
            <span className="stat"><Gem /> {state.gems}</span>
            <span className="stat">Nível {lvl.level}</span>
          </div>
        </div>
        <ProgressRing value={today} max={m.dailyGoal} size={96} label={`Meta do dia: ${today} de ${m.dailyGoal} XP`}>
          <span style={{ fontSize: 16 }}>{Math.min(today, m.dailyGoal)}<span className="muted" style={{ fontWeight: 600 }}>/{m.dailyGoal}</span></span>
        </ProgressRing>
      </section>

      {cp?.status === 'due' && (
        <button className="cp-banner" onClick={() => go({ name: 'checkpoint' })}>
          <span>
            <strong>{state.checkpoints.length === 0 ? 'Comece pelo checkpoint de fala (8 min)' : `Checkpoint da semana ${cp.week} liberado`}</strong>
            <br />{state.checkpoints.length === 0 ? 'Ele registra sua linha de base e inicia o plano de 6 meses. Sem ele não dá para provar evolução.' : 'Refaça o teste e veja a diferença em relação à linha de base.'}
          </span>
          <span className="tile-cta">Fazer agora →</span>
        </button>
      )}

      <div className="dash-grid">
        <section className="tile today" aria-labelledby="today-h">
          <div className="row-between">
            <span className="ex-kicker" id="today-h">Roteiro de hoje · {doneSteps}/{steps.length}</span>
            <small className="muted">Falando hoje: <b>{Math.round(d.spokenSec / 60)}</b>/{speakTarget} min</small>
          </div>
          <ol className="today-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <button className={`today-step ${s.done ? 'done' : ''}`} onClick={() => go(s.go)}>
                  <span className="step-n">{s.done ? <CheckIcon size={16} /> : i + 1}</span>
                  <span><strong>{s.label}</strong><br /><small className="muted">{s.sub}</small></span>
                </button>
              </li>
            ))}
          </ol>
        </section>

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
          <span className="muted">Português → inglês, do montar ao falar rápido. {automatic}/{total} frases já automáticas.</span>
          <ProdBar produced={produced} automatic={automatic} total={total} />
        </button>

        <button className="tile tile-teacher" onClick={() => go({ name: 'teacher' })}>
          <TeacherAvatar state="idle" size={84} />
          <span>
            <span className="ex-kicker">Aula ao vivo</span>
            <strong className="tile-title">Conversar com a Maya</strong>
            <span className="muted">Ela ouve, corrige sua gramática na hora e pede para você repetir.</span>
          </span>
        </button>

        <button className="tile" onClick={() => go({ name: 'evolution' })}>
          <span className="ex-kicker">Prova de aprendizado</span>
          <strong className="tile-title">{state.checkpoints.length ? `Índice de fala: ${state.checkpoints[state.checkpoints.length - 1].index}` : 'Sua evolução'}</strong>
          <span className="muted">{state.checkpoints.length > 1 ? `Linha de base: ${state.checkpoints[0].index}. ` : ''}Checkpoints de fala, retenção e minutos falando por semana.</span>
        </button>

        <button className="tile" onClick={() => go({ name: 'mine' })}>
          <span className="ex-kicker">Minhas frases</span>
          <strong className="tile-title">{state.custom.length ? `${state.custom.length} frases do seu trabalho` : 'Treine o que você vai dizer amanhã'}</strong>
          <span className="muted">Escreva em português a sua daily ou resposta de entrevista: vira treino na escada.</span>
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
