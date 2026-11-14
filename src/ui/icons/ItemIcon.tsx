import type { IconName } from '../../domain/curriculum/types';

/**
 * Ilustrações de itens desenhadas em SVG (traço + mancha de cor deslocada,
 * estilo "risografia"). Dupla codificação: imagem + palavra + som.
 */
const paths: Record<IconName, JSX.Element> = {
  wave: <><path d="M20 38c-4-6-6-14-2-16s6 4 8 8M24 30l-6-12c-1-3 3-5 5-2l7 12M30 28l-7-14c-1-3 3-5 5-2l8 14M36 26l-5-10c-1-3 3-5 5-2l6 12c3 6 2 14-4 18-7 5-15 2-18-4" /><path d="M44 10c3 2 5 5 5 9M48 6c4 3 7 8 7 13" /></>,
  handshake: <><path d="M6 26l10-8 8 3 6-3 8 2 10 6M6 26l12 12c2 2 5 2 6 0M18 34l6 6c2 2 5 1 5-1M24 30l8 8c2 2 5 0 4-2M30 28l6 6c2 2 5 0 4-2l-6-8M48 26l-8 10" /></>,
  person: <><circle cx="32" cy="20" r="9" /><path d="M14 54c2-12 9-18 18-18s16 6 18 18" /></>,
  globe: <><circle cx="32" cy="32" r="20" /><path d="M12 32h40M32 12c-8 8-8 32 0 40M32 12c8 8 8 32 0 40M16 22h32M16 42h32" /></>,
  house: <><path d="M10 30L32 12l22 18M16 26v24h32V26M27 50V38h10v12" /></>,
  coffee: <><path d="M14 24h30v12c0 9-6 14-15 14s-15-5-15-14z" /><path d="M44 28h4c4 0 6 3 6 6s-3 6-7 6h-4M22 8c-2 3 2 5 0 9M30 8c-2 3 2 5 0 9M38 8c-2 3 2 5 0 9" /></>,
  water: <><path d="M20 12h24l-3 40H23z" /><path d="M21 26c4 2 8-2 11 0s7 2 11 0" /></>,
  bread: <><path d="M10 30c0-10 10-16 22-16s22 6 22 16c0 3-3 4-5 4v14H15V34c-2 0-5-1-5-4z" /><path d="M24 24l-2 6M33 22l-1 7M42 24l-1 6" /></>,
  apple: <><path d="M32 20c-6-5-20-4-20 12 0 12 8 22 14 22 3 0 4-2 6-2s3 2 6 2c6 0 14-10 14-22 0-16-14-17-20-12z" /><path d="M32 20c0-6 2-10 6-12M34 14c4-2 8-1 10 2-4 3-8 2-10-2z" /></>,
  sun: <><circle cx="32" cy="32" r="10" /><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6" /></>,
  moon: <><path d="M42 10a22 22 0 1 0 12 30A18 18 0 0 1 42 10z" /><path d="M20 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></>,
  clock: <><circle cx="32" cy="32" r="20" /><path d="M32 20v12l8 6" /></>,
  book: <><path d="M32 16c-6-4-14-4-22-2v34c8-2 16-2 22 2 6-4 14-4 22-2V14c-8-2-16-2-22 2zM32 16v34" /></>,
  phone: <><rect x="20" y="8" width="24" height="48" rx="5" /><path d="M28 48h8M28 13h8" /></>,
  car: <><path d="M10 40v-8l6-12h32l6 12v8z" /><circle cx="20" cy="42" r="5" /><circle cx="44" cy="42" r="5" /><path d="M16 30h32" /></>,
  bus: <><rect x="12" y="10" width="40" height="38" rx="6" /><path d="M12 32h40M12 22h40" /><circle cx="22" cy="40" r="2" /><circle cx="42" cy="40" r="2" /><path d="M18 48v6M46 48v6" /></>,
  heart: <><path d="M32 52S10 39 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 15-22 28-22 28z" /></>,
  family: <><circle cx="20" cy="18" r="6" /><circle cx="44" cy="18" r="6" /><circle cx="32" cy="34" r="5" /><path d="M8 50c1-10 6-16 12-16M56 50c-1-10-6-16-12-16M22 54c1-7 5-11 10-11s9 4 10 11" /></>,
  work: <><rect x="10" y="22" width="44" height="28" rx="4" /><path d="M24 22v-6h16v6M10 34h44M30 34v4h4v-4" /></>,
  money: <><rect x="8" y="18" width="48" height="28" rx="4" /><circle cx="32" cy="32" r="7" /><path d="M14 24v16M50 24v16" /></>,
  question: <><path d="M22 22c0-7 5-11 11-11s11 4 11 10c0 8-11 9-11 17" /><circle cx="33" cy="50" r="2.5" /></>,
  check: <><circle cx="32" cy="32" r="20" /><path d="M22 33l7 7 14-15" /></>,
  number: <><path d="M20 12l-4 40M38 12l-4 40M12 26h36M10 40h36" /></>,
  cat: <><path d="M14 54V26l6-14 8 10h8l8-10 6 14v28z" /><path d="M24 34v2M40 34v2M30 42l2 2 2-2M18 44H8M18 48H9M46 44h10M46 48h9" /></>,
  dog: <><path d="M16 22l-6 14 8 2M48 22l6 14-8 2" /><path d="M18 20h28v18c0 9-6 14-14 14s-14-5-14-14z" /><path d="M26 32v2M38 32v2M28 42c2 2 6 2 8 0" /></>,
  think: <><circle cx="26" cy="30" r="14" /><path d="M20 30h1M31 30h1M22 37c2 1 6 1 8 0" /><circle cx="46" cy="16" r="5" /><circle cx="42" cy="26" r="2.5" /></>,
  three: <><path d="M20 14h22l-12 14c8 0 14 4 14 11s-6 13-14 13c-6 0-10-3-12-7" /></>,
  ship: <><path d="M8 40h48l-6 12H14z" /><path d="M16 40V28h28l6 12M24 28V16h12v12M30 16v-6" /><path d="M6 56c4 0 6-2 10-2s6 2 10 2 6-2 10-2 6 2 10 2 6-2 10-2" /></>,
  sheep: <><path d="M16 38c-6 0-8-6-4-9-2-5 3-9 7-7 1-5 8-6 11-2 3-4 10-3 11 2 5-1 8 4 6 8 4 3 1 9-4 8H16z" /><path d="M20 38v12M28 38v12M38 38v12M46 38v12" /><circle cx="48" cy="26" r="5" /></>,
  bed: <><path d="M8 48V20M8 40h48v8M8 30h18v10M26 34h26c2 0 4 2 4 4v2" /></>,
  bad: <><circle cx="32" cy="32" r="20" /><path d="M24 26h1M39 26h1M22 44c6-6 14-6 20 0" /></>,
  hat: <><path d="M6 44c10 4 42 4 52 0" /><path d="M16 44c0-16 4-26 16-26s16 10 16 26M17 36h30" /></>,
  eat: <><path d="M18 10v18c0 3 2 5 4 5v21M14 10v12M22 10v12M42 10c-5 2-6 10-6 18h6v26" /></>,
  it: <><rect x="16" y="22" width="32" height="28" rx="3" /><path d="M16 30h32M32 22v28M24 22c-4-6 2-10 8 0 6-10 12-6 8 0" /></>,
};

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  label?: string;
}

export function ItemIcon({ name, size = 96, color = 'var(--tangerine)', label }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* mancha de cor deslocada, irregular */}
      <path d="M14 18c8-10 30-12 38-2s8 28-2 34-30 6-38-4-6-18 2-28z" fill={color} opacity="0.22" transform="translate(3 3)" />
      <g fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}
