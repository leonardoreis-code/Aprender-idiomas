import { useState } from 'react';

/**
 * Gráficos em SVG (sem biblioteca). Regras: um eixo só, linha de 2px, marcadores
 * de 8px com anel na cor da superfície, texto sempre em tokens de tinta (nunca na
 * cor da série), grade discreta, tooltip no hover/foco e tabela equivalente.
 */
const W = 340;
const PAD = { l: 34, r: 34, t: 16, b: 26 };

export interface Point {
  label: string;
  value: number | null;
  note?: string;
}

function niceRange(values: number[], lo?: number, hi?: number): [number, number] {
  if (!values.length) return [lo ?? 0, hi ?? 1];
  let min = lo ?? Math.min(...values);
  let max = hi ?? Math.max(...values);
  if (max - min < 1e-9) {
    max = min + (Math.abs(min) || 1) * 0.5;
    min = lo ?? Math.max(0, min - (Math.abs(min) || 1) * 0.5);
  }
  const pad = (max - min) * 0.12;
  // com base em zero, o topo vira um número redondo (ticks 0 · meio · topo legíveis)
  if (lo === 0 && hi === undefined) return [0, niceCeil(max + pad)];
  return [lo ?? Math.max(0, min - pad), hi ?? max + pad];
}

/** Arredonda para cima até um valor cujo meio também é redondo (2, 4, 5, 10, 20, 50…). */
export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const step = [1, 2, 4, 5, 10].find((s) => m <= s) ?? 10;
  return step * p;
}

const fmt = (v: number) => (Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, ''));

export function LineChart({ points, unit = '', yMin, yMax, height = 150, title, lowerIsBetter }: {
  points: Point[];
  unit?: string;
  yMin?: number;
  yMax?: number;
  height?: number;
  title: string;
  lowerIsBetter?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const data = points.map((p, i) => ({ ...p, i })).filter((p): p is Point & { i: number; value: number } => p.value !== null);
  const [lo, hi] = niceRange(data.map((d) => d.value), yMin, yMax);
  const n = Math.max(points.length - 1, 1);
  const x = (i: number) => PAD.l + (i / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (height - PAD.t - PAD.b);
  const path = data.map((d, k) => `${k ? 'L' : 'M'}${x(d.i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ');
  const last = data[data.length - 1];
  const act = active !== null ? data.find((d) => d.i === active) : undefined;
  const ticks = [lo, (lo + hi) / 2, hi];

  if (data.length === 0) return <p className="chart-empty">Sem dados ainda. {title} aparece aqui depois da primeira medição.</p>;

  return (
    <figure className="chart">
      <div className="chart-plot" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${fmt(d.value)}${unit}`).join(', ')}`}>
          {ticks.map((t, k) => (
            <g key={k}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)">{fmt(t)}</text>
            </g>
          ))}
          {act && <line x1={x(act.i)} x2={x(act.i)} y1={PAD.t} y2={height - PAD.b} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />}
          <path d={path} fill="none" stroke="var(--viz-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d) => (
            <circle key={d.i} cx={x(d.i)} cy={y(d.value)} r={act?.i === d.i ? 6 : 4} fill="var(--viz-1)" stroke="var(--surface)" strokeWidth="2" />
          ))}
          {last && !act && (
            <text x={Math.min(x(last.i) + 8, W - 2)} y={y(last.value) + 4} fontSize="11" fontWeight="700" fill="var(--ink)" textAnchor={x(last.i) + 8 > W - 28 ? 'end' : 'start'} dy={x(last.i) + 8 > W - 28 ? -10 : 0}>
              {fmt(last.value)}{unit}
            </text>
          )}
          <text x={x(0)} y={height - 8} fontSize="10" fill="var(--ink-3)" textAnchor="start">{points[0].label}</text>
          {points.length > 1 && <text x={x(points.length - 1)} y={height - 8} fontSize="10" fill="var(--ink-3)" textAnchor="end">{points[points.length - 1].label}</text>}
          {/* alvos de hover maiores que o marcador */}
          {data.map((d) => (
            <rect key={d.i} x={x(d.i) - (W - PAD.l - PAD.r) / n / 2} y={0} width={(W - PAD.l - PAD.r) / n} height={height} fill="transparent" tabIndex={0}
              aria-label={`${d.label}: ${fmt(d.value)}${unit}`} onMouseEnter={() => setActive(d.i)} onFocus={() => setActive(d.i)} onBlur={() => setActive(null)} />
          ))}
        </svg>
        {act && (
          <div className="chart-tip" style={{ left: `${(x(act.i) / W) * 100}%`, top: `${(y(act.value) / height) * 100}%` }} role="status">
            <b>{fmt(act.value)}{unit}</b>
            <span>{act.label}{act.note ? ` · ${act.note}` : ''}</span>
          </div>
        )}
      </div>
      {lowerIsBetter !== undefined && <figcaption>{lowerIsBetter ? 'Quanto menor, melhor.' : 'Quanto maior, melhor.'}</figcaption>}
    </figure>
  );
}

export interface StackDatum {
  label: string;
  a: number;
  b: number;
}

/** Barras empilhadas de duas séries, com legenda, meta opcional e tooltip. */
export function StackedBars({ data, names, unit = '', target, height = 170, title }: {
  data: StackDatum[];
  names: [string, string];
  unit?: string;
  target?: number;
  height?: number;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeil(Math.max(1, target ?? 0, ...data.map((d) => d.a + d.b)) * 1.05);
  const band = (W - PAD.l - PAD.r) / data.length;
  const bw = Math.min(22, band * 0.6);
  const y = (v: number) => PAD.t + (1 - v / max) * (height - PAD.t - PAD.b);
  const base = height - PAD.b;
  const topRounded = (cx: number, y0: number, y1: number) => {
    const r = Math.min(4, (y0 - y1) / 2, bw / 2);
    const xl = cx - bw / 2;
    const xr = cx + bw / 2;
    return `M${xl} ${y0}V${y1 + r}Q${xl} ${y1} ${xl + r} ${y1}H${xr - r}Q${xr} ${y1} ${xr} ${y1 + r}V${y0}Z`;
  };
  const act = active !== null ? data[active] : undefined;
  return (
    <figure className="chart">
      <div className="chart-legend" aria-hidden>
        <span><i style={{ background: 'var(--viz-1)' }} />{names[0]}</span>
        <span><i style={{ background: 'var(--viz-2)' }} />{names[1]}</span>
        {target !== undefined && <span><i className="dash" />meta da semana</span>}
      </div>
      <div className="chart-plot" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`${title}: ${data.map((d) => `${d.label}: ${names[0]} ${fmt(d.a)}, ${names[1]} ${fmt(d.b)}`).join('; ')}`}>
          {[0, max / 2, max].map((t, k) => (
            <g key={k}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)">{fmt(Math.round(t))}</text>
            </g>
          ))}
          {target !== undefined && (
            <g>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={W - PAD.r + 4} y={y(target) + 4} fontSize="10" fill="var(--ink-2)">{fmt(target)}</text>
            </g>
          )}
          {data.map((d, i) => {
            const cx = PAD.l + band * (i + 0.5);
            const ya = y(d.a);
            const yb = y(d.a + d.b);
            const onlyA = d.b <= 0;
            return (
              <g key={i} opacity={active === null || active === i ? 1 : 0.55}>
                {d.a > 0 && (onlyA ? <path d={topRounded(cx, base, ya)} fill="var(--viz-1)" /> : <rect x={cx - bw / 2} y={ya} width={bw} height={base - ya} fill="var(--viz-1)" />)}
                {d.b > 0 && <path d={topRounded(cx, ya - (d.a > 0 ? 2 : 0), yb - (d.a > 0 ? 2 : 0))} fill="var(--viz-2)" />}
                {(i === 0 || i === data.length - 1 || active === i) && <text x={cx} y={height - 8} fontSize="10" fill="var(--ink-3)" textAnchor="middle">{d.label}</text>}
                <rect x={cx - band / 2} y={0} width={band} height={height} fill="transparent" tabIndex={0}
                  aria-label={`${d.label}: ${names[0]} ${fmt(d.a)}${unit}, ${names[1]} ${fmt(d.b)}${unit}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} />
              </g>
            );
          })}
        </svg>
        {act && active !== null && (
          <div className="chart-tip" style={{ left: `${((PAD.l + band * (active + 0.5)) / W) * 100}%`, top: `${(y(act.a + act.b) / height) * 100}%` }} role="status">
            <b>{fmt(act.a + act.b)}{unit}</b>
            <span>semana de {act.label}</span>
            <span>{names[0]}: {fmt(act.a)} · {names[1]}: {fmt(act.b)}</span>
          </div>
        )}
      </div>
    </figure>
  );
}

/** Tabela equivalente a um gráfico (acessibilidade e conferência). */
export function DataTable({ head, rows, summary = 'Ver como tabela' }: { head: string[]; rows: (string | number)[][]; summary?: string }) {
  return (
    <details className="chart-table">
      <summary>{summary}</summary>
      <div className="table-wrap">
        <table>
          <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}
