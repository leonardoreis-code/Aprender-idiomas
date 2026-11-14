import type { Course } from '../../domain/curriculum/types';
import { dayKey, levelFor } from '../../domain/motivation/motivation';
import type { AppState } from '../../infra/storage';
import { MetroMap, type StationState } from '../components/MetroMap';
import { ProgressRing } from '../components/Graphics';
import { Flame, GearIcon, Logo, Snowflake, TargetIcon } from '../icons/ui';

interface Props {
  course: Course;
  state: AppState;
  dueCount: number;
  onOpenLesson: (id: string) => void;
  onReview: () => void;
  onSettings: () => void;
}

export function Home({ course, state, dueCount, onOpenLesson, onReview, onSettings }: Props) {
  const m = state.motivation;
  const today = m.xpByDay[dayKey()] ?? 0;
  const lvl = levelFor(m.xpTotal);
  const order = course.units.flatMap((u) => u.lessons.map((l) => l.id));
  const stateOf = (id: string): StationState => {
    if (state.lessonsDone.includes(id)) return 'done';
    const i = order.indexOf(id);
    return i === 0 || state.lessonsDone.includes(order[i - 1]) ? 'available' : 'locked';
  };
  const next = order.find((id) => stateOf(id) === 'available');
  const learned = Object.keys(state.cards).length;

  return (
    <>
      <a href="#main" className="skip">Pular para o conteúdo</a>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><Logo /> Fluente</div>
          <span className="stat" aria-label={`Sequência de ${m.streak} dias`} title="Sequência">
            <Flame lit={m.lastGoalDay === dayKey()} /> {m.streak}
          </span>
          {m.freezes > 0 && (
            <span className="stat" aria-label={`${m.freezes} proteção de sequência`} title="Proteções de sequência">
              <Snowflake /> {m.freezes}
            </span>
          )}
          <button className="icon-btn" onClick={onSettings} aria-label="Ajustes"><GearIcon /></button>
        </div>
      </header>

      <main className="shell" id="main">
        <section className="hero">
          <ProgressRing value={today} max={m.dailyGoal} size={84} label={`Meta do dia: ${today} de ${m.dailyGoal} XP`}>
            <span style={{ fontSize: 15 }}>{Math.min(today, m.dailyGoal)}<span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>/{m.dailyGoal}</span></span>
          </ProgressRing>
          <div>
            <h1>{today >= m.dailyGoal ? 'Meta batida hoje!' : today > 0 ? 'Continue de onde parou' : 'Bora praticar?'}</h1>
            <p>
              Nível {lvl.level} · {m.xpTotal} XP · {learned} itens na memória
            </p>
            <div aria-hidden style={{ height: 6, background: 'var(--surface-2)', borderRadius: 6, marginTop: 8, maxWidth: 260 }}>
              <div style={{ width: `${(lvl.into / lvl.span) * 100}%`, height: '100%', background: 'var(--indigo)', borderRadius: 6, transition: 'width .6s' }} />
            </div>
          </div>
        </section>

        <div className="card review-card">
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
            <circle cx="26" cy="26" r="24" fill="color-mix(in srgb, var(--teal) 18%, transparent)" />
            <path d="M15 27a11 11 0 1 0 3.5-8.1M15 14v6h6" fill="none" stroke="var(--teal)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="grow">
            <h2>{dueCount ? `${dueCount} para revisar` : 'Revisões em dia'}</h2>
            <p>{dueCount ? 'Revisar na hora certa fixa na memória de longo prazo.' : learned ? 'O algoritmo avisa quando for a hora de cada item.' : 'Complete uma lição para começar a revisar.'}</p>
          </div>
          <button className="btn btn-primary" onClick={onReview} disabled={!dueCount}>Revisar</button>
        </div>

        {next && (
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => onOpenLesson(next)}>
            <TargetIcon /> Próxima lição
          </button>
        )}

        {course.units.map((u) => (
          <section className="unit" key={u.id} aria-labelledby={`h-${u.id}`}>
            <div className="unit-head">
              <h2 id={`h-${u.id}`}>{u.title}</h2>
              <span className="cefr" style={{ background: u.color }}>{u.cefr}</span>
            </div>
            <MetroMap unit={u} stateOf={stateOf} onOpen={onOpenLesson} />
          </section>
        ))}

        <section className="card" style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: '1.1rem' }}>Próximas linhas</h2>
          <p style={{ color: 'var(--ink-2)', margin: '6px 0 0' }}>
            Unidades 5–12 (A1→A2): passado, viagens, compras, saúde, planos futuros, comparações, conversas por telefone e
            narrativas curtas. Veja o plano completo em <code>docs/PLANO-DE-AULAS.md</code>.
          </p>
        </section>
      </main>
    </>
  );
}
