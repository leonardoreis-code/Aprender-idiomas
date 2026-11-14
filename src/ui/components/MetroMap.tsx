import type { Unit } from '../../domain/curriculum/types';

export type StationState = 'locked' | 'available' | 'done';

interface Props {
  unit: Unit;
  stateOf: (lessonId: string) => StationState;
  onOpen: (lessonId: string) => void;
}

/**
 * Unidade desenhada como uma linha de metrô sinuosa; lições são estações.
 * Visual do progresso = "goal gradient": ver a próxima estação perto motiva.
 */
export function MetroMap({ unit, stateOf, onOpen }: Props) {
  const rowH = 96;
  const h = unit.lessons.length * rowH + 20;
  const xs = [70, 230, 110];
  const pts = unit.lessons.map((_, i) => ({ x: xs[i % xs.length], y: 50 + i * rowH }));
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x} ${p.y - 40} L${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const my = (prev.y + p.y) / 2;
    return `${acc} C${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }, '');
  const doneCount = unit.lessons.filter((l) => stateOf(l.id) === 'done').length;
  const frac = doneCount / unit.lessons.length;

  return (
    <svg className="metro" viewBox={`0 0 340 ${h}`} role="list" aria-label={`Lições da unidade ${unit.title}`}>
      <path d={d} fill="none" stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={unit.color}
        strokeWidth="12"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - frac}
        style={{ transition: 'stroke-dashoffset .8s ease' }}
      />
      {unit.lessons.map((lesson, i) => {
        const p = pts[i];
        const st = stateOf(lesson.id);
        const locked = st === 'locked';
        const labelX = p.x > 170 ? p.x - 34 : p.x + 34;
        const anchor = p.x > 170 ? 'end' : 'start';
        const statusText = st === 'done' ? 'concluída' : st === 'available' ? 'disponível' : 'bloqueada';
        return (
          <g
            key={lesson.id}
            role="listitem"
            className="station"
            tabIndex={locked ? -1 : 0}
            aria-disabled={locked}
            aria-label={`${lesson.title} — ${statusText}`}
            onClick={() => !locked && onOpen(lesson.id)}
            onKeyDown={(e) => {
              if (!locked && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onOpen(lesson.id);
              }
            }}
          >
            {st === 'available' && (
              <circle cx={p.x} cy={p.y} r="30" fill="none" stroke={unit.color} strokeWidth="3" opacity="0.5">
                <animate attributeName="r" values="24;32;24" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              className="station-ring"
              cx={p.x}
              cy={p.y}
              r="22"
              fill={st === 'done' ? unit.color : 'var(--surface)'}
              stroke={locked ? 'var(--line)' : 'var(--ink)'}
              strokeWidth="4"
            />
            {st === 'done' && <path d={`M${p.x - 8} ${p.y}l5.5 5.5L${p.x + 9} ${p.y - 7}`} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />}
            {st === 'available' && <circle cx={p.x} cy={p.y} r="8" fill={unit.color} />}
            {locked && <path d={`M${p.x - 6} ${p.y - 1}h12v9h-12zM${p.x - 3.5} ${p.y - 1}v-3a3.5 3.5 0 0 1 7 0v3`} stroke="var(--ink-3)" strokeWidth="2.2" fill="none" />}
            <text x={labelX} y={p.y - 2} textAnchor={anchor} className="station-label" opacity={locked ? 0.55 : 1}>
              {lesson.title}
            </text>
            <text x={labelX} y={p.y + 17} textAnchor={anchor} className="station-sub">
              {`Lição ${i + 1} · ${lesson.items.length} itens${lesson.sound ? ' · pronúncia' : ''}`}
            </text>
            {/* área de toque generosa */}
            <rect x={Math.min(p.x, labelX) - 30} y={p.y - 34} width={250} height={68} fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}
