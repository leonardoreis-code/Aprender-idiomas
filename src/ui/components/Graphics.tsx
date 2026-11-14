import { useMemo } from 'react';
import type { SoundFocus } from '../../domain/curriculum/types';

/** Anel de progresso da meta diária. */
export function ProgressRing({ value, max, size = 64, stroke = 7, children, label }: {
  value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode; label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div role="img" aria-label={label} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pct >= 1 ? 'var(--ok)' : 'var(--tangerine)'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.24 }}>{children}</div>
    </div>
  );
}

/**
 * Diagrama articulatório (corte lateral simplificado). Mostra posição da língua,
 * dentes e lábios para o som-alvo — instrução explícita de pronúncia.
 */
export function MouthDiagram({ mouth }: { mouth: NonNullable<SoundFocus['mouth']> }) {
  const tongue: Record<typeof mouth, string> = {
    th: 'M40 128 C 60 104, 96 96, 132 92 L 150 90 C 154 92, 154 98, 148 100 C 120 108, 80 120, 60 140 Z',
    'short-i': 'M40 128 C 60 96, 92 80, 118 84 C 128 86, 130 96, 122 102 C 100 116, 70 128, 58 140 Z',
    'long-i': 'M40 128 C 60 88, 92 70, 122 76 C 132 78, 134 90, 124 96 C 100 112, 70 126, 58 140 Z',
    ae: 'M40 132 C 64 120, 92 114, 120 116 C 130 117, 132 126, 122 130 C 100 136, 72 140, 58 146 Z',
    h: 'M40 130 C 62 110, 92 104, 118 106 C 128 107, 130 116, 120 120 C 100 128, 72 136, 58 144 Z',
    ed: 'M40 128 C 60 100, 96 84, 124 80 C 134 80, 136 90, 128 94 C 104 108, 72 126, 58 140 Z',
  };
  const jawOpen = mouth === 'ae' ? 10 : mouth === 'th' ? 2 : 4;
  const caption: Record<typeof mouth, string> = {
    th: 'Ponta da língua entre os dentes; o ar passa por cima.',
    'short-i': 'Língua alta mas relaxada; boca levemente aberta.',
    'long-i': 'Língua bem alta e tensa; lábios esticados.',
    ae: 'Mandíbula bem aberta; língua baixa e para a frente.',
    h: 'Boca aberta, só um sopro de ar da garganta.',
    ed: 'Língua toca atrás dos dentes e para — sem soltar "i".',
  };
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox="0 0 200 180" width="100%" style={{ maxWidth: 220 }} role="img" aria-label={caption[mouth]}>
        {/* palato e nariz */}
        <path d="M30 40 C 70 20, 130 20, 170 50 L 176 70" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 60 C 90 52, 120 54, 146 66" fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeDasharray="4 5" />
        {/* lábio superior + dentes de cima */}
        <path d="M176 70 C 186 74, 188 82, 178 86 L 160 86" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="3" />
        <rect x="148" y="78" width="10" height="14" rx="3" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
        {/* mandíbula, dentes de baixo, lábio inferior */}
        <g transform={`translate(0 ${jawOpen})`}>
          <rect x="146" y="100" width="10" height="13" rx="3" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
          <path d="M160 112 C 186 110, 186 126, 172 128 C 140 136, 90 150, 50 160" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* língua */}
        <path d={tongue[mouth]} fill="var(--tangerine)" opacity="0.85" stroke="var(--ink)" strokeWidth="2.5" />
        {/* fluxo de ar */}
        {(mouth === 'th' || mouth === 'h') && (
          <path d="M120 74 C 150 72, 170 80, 196 80" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.8s" repeatCount="indefinite" />
          </path>
        )}
      </svg>
      <figcaption style={{ fontSize: '.9rem', color: 'var(--ink-2)', marginTop: 4 }}>{caption[mouth]}</figcaption>
    </figure>
  );
}

/** Explosão de confete em SVG (formas geométricas, cores das linhas). */
export function Confetti({ seed = 1 }: { seed?: number }) {
  const pieces = useMemo(() => {
    let a = seed * 9973;
    const rand = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    const colors = ['var(--tangerine)', 'var(--teal)', 'var(--indigo)', 'var(--ochre)'];
    return Array.from({ length: 42 }, (_, i) => ({
      x: 50 + (rand() - 0.5) * 12,
      dx: (rand() - 0.5) * 110,
      dy: 30 + rand() * 70,
      rot: rand() * 720 - 360,
      color: colors[i % 4],
      shape: i % 3,
      delay: rand() * 0.25,
      size: 1.2 + rand() * 1.6,
    }));
  }, [seed]);
  return (
    <svg className="confetti" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <style>{`@keyframes cf{from{transform:translate(0,0) rotate(0)}to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <g key={i} style={{ transformOrigin: `${p.x}px 20px`, animation: `cf 1.8s ${p.delay}s cubic-bezier(.15,.7,.3,1) forwards`, ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, ['--r' as string]: `${p.rot}deg` }}>
          {p.shape === 0 && <rect x={p.x} y={20} width={p.size} height={p.size * 0.5} fill={p.color} />}
          {p.shape === 1 && <circle cx={p.x} cy={20} r={p.size * 0.45} fill={p.color} />}
          {p.shape === 2 && <path d={`M${p.x} 20l${p.size * 0.6} ${p.size}h-${p.size * 1.2}z`} fill={p.color} />}
        </g>
      ))}
    </svg>
  );
}

/** Ilustração da tela de conclusão: trem chegando à estação. */
export function TrainArrival() {
  return (
    <svg viewBox="0 0 240 110" width="240" aria-hidden className="pop-in">
      <path d="M0 92h240" stroke="var(--line)" strokeWidth="4" />
      <path d="M0 98h240" stroke="var(--line)" strokeWidth="2" strokeDasharray="6 8" />
      <g>
        <rect x="40" y="38" width="120" height="48" rx="14" fill="var(--teal)" stroke="var(--ink)" strokeWidth="3" />
        <path d="M160 46h18c10 0 16 8 16 18v8c0 8-6 14-14 14h-20z" fill="var(--teal)" stroke="var(--ink)" strokeWidth="3" />
        <rect x="54" y="48" width="22" height="18" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="86" y="48" width="22" height="18" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="118" y="48" width="22" height="18" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <path d="M172 56h10c4 0 8 4 8 8h-18z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="70" cy="88" r="7" fill="var(--ink)" /><circle cx="130" cy="88" r="7" fill="var(--ink)" /><circle cx="172" cy="88" r="7" fill="var(--ink)" />
        <path d="M40 74h154" stroke="var(--tangerine)" strokeWidth="4" />
      </g>
      <g transform="translate(206 20)">
        <path d="M0 0v72" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="0" cy="0" r="12" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <path d="M-5 0l3.5 3.5L6-4" stroke="var(--ok)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
