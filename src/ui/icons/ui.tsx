/** Ícones de interface (SVG inline, traço consistente). */
type P = { size?: number; className?: string };
const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const SpeakerIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
);
export const TurtleIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 15c0-4 3-7 7-7s7 3 7 7z" /><path d="M18 13h2a2 2 0 0 0 0-4h-1M6 15l-1 3M15 15l1 3M8 11l3 4 3-4" /></svg>
);
export const MicIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>
);
export const CloseIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const GearIcon = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
);
export const CheckIcon = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const XIcon = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="M7 7l10 10M17 7L7 17" /></svg>
);
export const BackIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M15 5l-7 7 7 7" /></svg>
);
export const BulbIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" /></svg>
);
export const TargetIcon = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>
);

/** Chama da sequência — desenho próprio, duas camadas. */
export const Flame = ({ size = 24, lit = true }: { size?: number; lit?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill={lit ? 'var(--tangerine)' : 'var(--line)'} />
    <path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5.8-2.4 1.6-3 .1 1 .6 1.5 1.1 1.5 0-1.6-.3-2.6.3-4z" fill={lit ? '#ffd27a' : 'var(--surface-2)'} />
  </svg>
);

export const Snowflake = ({ size = 20 }: P) => (
  <svg {...base(size)} stroke="var(--indigo)"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" /></svg>
);

/** Marca do app: duas linhas de metrô se cruzando numa estação. */
export const Logo = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <path d="M3 22c6 0 8-12 14-12s8 6 12 6" stroke="var(--tangerine)" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M6 5c0 8 6 10 10 11s8 4 8 12" stroke="var(--teal)" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="16" cy="15.5" r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
  </svg>
);
