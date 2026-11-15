import { allDrills, nextLesson, stories } from '../../content';
import { dayKey } from '../../domain/motivation/motivation';
import { questsFor } from '../../domain/motivation/quests';
import { checkpointSchedule, nextCheckpoint, phaseOf, PLAN_WEEKS, weekOf } from '../../domain/plan/sixMonths';
import { emptyDay } from '../../domain/progress/daily';
import { dueErrors } from '../../domain/coach/errorBank';
import { ERROR_CATEGORIES, errorProfile } from '../../domain/production/errors';
import { dueDrillCount } from '../../domain/production/ladder';
import { dueItemIds } from '../../domain/srs/scheduler';
import { ProgressRing } from '../components/Graphics';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { CheckIcon, Flame } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';
import { llmAvailable } from '../../infra/llm';

export function Dashboard({ go }: { go: (r: Route) => void }) {
  const { state } = useStore();
  const m = state.motivation;
  const todayKey = dayKey();
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
  // meta de fala: a do plano ou metade do tempo diário escolhido, o que for maior
  const speakTarget = Math.max(Math.round(phase.speakMin / 6), Math.round((state.profile.minutes ?? 15) / 2));
  const mayaTarget = Math.round(phase.mayaMin / 6);
  const spokenMin = Math.round(d.spokenSec / 60);
  const simToday = [...Object.values(state.sim.results), ...Object.values(state.meet.results)].some((r) => dayKey(new Date(r.at)) === todayKey);
  const noBaseline = state.checkpoints.length === 0;
  // um passo marcado não "desmarca" no mesmo dia (frases que vencem depois não apagam a revisão feita)
  const steps: { label: string; sub: string; done: boolean; go: Route }[] = [
    ...(noBaseline ? [{ label: 'Checkpoint de fala (8 min)', sub: 'Sua linha de base: sem ela não dá para provar evolução', done: false, go: { name: 'checkpoint' } as Route }] : []),
    {
      label: d.due > 0 ? `Revisão feita (${d.due} frases)` : dueProd ? `Revisar ${dueProd} frases vencidas` : 'Revisão em dia',
      sub: 'Primeiro o que está para ser esquecido',
      done: dueProd === 0 || d.due > 0,
      go: { name: 'practice' },
    },
    d.produced >= 12
      ? { label: 'Aula do dia feita', sub: `${d.produced} frases produzidas hoje`, done: true, go: next ? { name: 'lesson', id: next.id } : { name: 'practice', lessonId: 'erros' } }
      : next
        ? { label: `Aula: ${next.title}`, sub: 'Leitura curta e prática, terminando em voz alta', done: false, go: { name: 'lesson', id: next.id } }
        : { label: 'Treino dos meus erros', sub: 'Frases das estruturas em que você mais erra', done: false, go: { name: 'practice', lessonId: 'erros' } },
    { label: 'Fala livre de 1 minuto', sub: d.wpmN ? `${Math.round(d.wpmSum / d.wpmN)} palavras por minuto hoje` : 'Fale sem parar sobre a pergunta do dia', done: d.wpmN > 0, go: { name: 'monologue' } },
    { label: 'Uma reunião ao vivo', sub: simToday ? 'Feita hoje' : `Daily, planning, cliente, incidente (${mayaTarget} min)`, done: simToday || d.mayaSec >= mayaTarget * 60, go: { name: 'meetings' } },
  ];
  const doneSteps = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);
  const errDue = dueErrors(state.errorBank, Date.now(), 99).length;
  const topErr = errorProfile(state.errorLog.slice(0, 80))[0];
  const lastIndex = state.checkpoints.length ? state.checkpoints[state.checkpoints.length - 1].index : null;

  return (
    <main className="shell dash" id="main">
      <section className="dash-hero">
        <div>
          <span className="ex-kicker">{hello}{state.profile.name ? `, ${state.profile.name}` : ''}{start ? ` · semana ${Math.min(week, PLAN_WEEKS)} de ${PLAN_WEEKS}` : ''}</span>
          <h1 className="page-title">{nextStep ? 'Vamos destravar sua fala hoje' : 'Roteiro de hoje completo'}</h1>
          <div className="dash-stats">
            <span className="stat"><Flame lit={m.lastGoalDay === todayKey} /> {m.streak} {m.streak === 1 ? 'dia' : 'dias'}</span>
            {lastIndex !== null && <span className="stat">Índice de fala {lastIndex}</span>}
          </div>
        </div>
        <ProgressRing value={spokenMin} max={speakTarget} size={96} label={`Falando hoje: ${spokenMin} de ${speakTarget} minutos`}>
          <span style={{ fontSize: 16 }}>{spokenMin}<span className="muted" style={{ fontWeight: 600 }}>/{speakTarget}</span><br /><small className="muted" style={{ fontWeight: 600, fontSize: 11 }}>min falando</small></span>
        </ProgressRing>
      </section>

      {!noBaseline && cp?.status === 'due' && (
        <button className="cp-banner" onClick={() => go({ name: 'checkpoint' })}>
          <span><strong>Checkpoint da semana {cp.week} liberado</strong><br />Refaça o teste e veja a diferença em relação à linha de base.</span>
          <span className="tile-cta">Fazer agora →</span>
        </button>
      )}

      <div className="dash-grid">
        <section className="tile today" aria-labelledby="today-h">
          <span className="ex-kicker" id="today-h">Roteiro de hoje · {doneSteps}/{steps.length}</span>
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
          {nextStep ? (
            <button className="btn btn-primary btn-block today-go" onClick={() => go(nextStep.go)}>Continuar: {nextStep.label} →</button>
          ) : (
            <button className="btn btn-primary btn-block today-go" onClick={() => go({ name: 'meetings' })}>Quer mais? Outra reunião →</button>
          )}
          <button className="link-btn" onClick={() => go({ name: 'practice', lessonId: 'rapido' })}>Dia corrido? Faça só 5 frases (3 minutos)</button>
        </section>

        {(errDue > 0 || topErr) && (
          <button className="tile" onClick={() => go(errDue > 0 ? { name: 'errors' } : { name: 'practice', lessonId: 'erros' })}>
            <span className="ex-kicker">Seus erros reais</span>
            <strong className="tile-title">{errDue > 0 ? `${errDue} erro(s) seus para consertar` : `Seu erro nº 1: ${ERROR_CATEGORIES[topErr!.id]?.title ?? topErr!.id}`}</strong>
            <span className="muted">{errDue > 0 ? 'Trechos que você disse errado, de volta na hora certa para você dizer do jeito certo.' : 'Treino de 3 minutos só com frases dessa estrutura.'}</span>
          </button>
        )}

        <details className="dash-more">
          <summary>Outros treinos</summary>
          <div className="dash-grid">
            <button className="tile tile-teacher" onClick={() => go({ name: 'teacher' })}>
              <TeacherAvatar state="idle" size={72} />
              <span>
                <strong className="tile-title">Treinador ao vivo</strong>
                <span className="muted">O erro é marcado enquanto você fala, e você conserta a própria frase.</span>
              </span>
            </button>
            <button className="tile" onClick={() => go({ name: 'practice' })} disabled={!produced && !next}>
              <strong className="tile-title">{dueProd ? `${dueProd} frases esperando` : 'Treino personalizado'}</strong>
              <span className="muted">{automatic}/{total} frases já no degrau Falar.</span>
              <ProdBar produced={produced} automatic={automatic} total={total} />
            </button>
            <button className="tile" onClick={() => go({ name: 'lab' })}>
              <strong className="tile-title">Treinos de fala</strong>
              <span className="muted">Fluência 60·45·30, reconto, eco com atraso, sotaque e mais.</span>
            </button>
            {llmAvailable() && (
              <button className="tile" onClick={() => go({ name: 'mine' })}>
                <strong className="tile-title">{state.custom.length ? `${state.custom.length} frases do seu trabalho` : 'Treine o que você vai dizer amanhã'}</strong>
                <span className="muted">Escreva em português a sua daily ou resposta de entrevista: vira treino.</span>
              </button>
            )}
            {nextStory && (
              <button className="tile" onClick={() => go({ name: 'story', id: nextStory.id })}>
                <strong className="tile-title">História: {nextStory.title}</strong>
                <span className="muted">{nextStory.setting}</span>
              </button>
            )}
            {dueBase > 0 && (
              <button className="tile" onClick={() => go({ name: 'base' })}>
                <strong className="tile-title">{dueBase} palavras para revisar</strong>
                <span className="muted">Trilha A1 com repetição espaçada.</span>
              </button>
            )}
            <div className="tile quests" aria-labelledby="q-h">
              <span className="ex-kicker" id="q-h">Missões de hoje · {state.gems} gemas</span>
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
          </div>
        </details>
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
