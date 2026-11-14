import { useEffect, useRef, useState } from 'react';

export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

interface Props {
  state: AvatarState;
  /** Volume atual (0–1) da voz da professora — anima a boca. */
  level?: () => number;
  size?: number;
  sunglasses?: boolean;
}

/**
 * Maya — professora-avatar desenhada em SVG (personagem original).
 * Boca sincronizada ao volume da voz, piscadas aleatórias, inclinação de cabeça
 * ao ouvir e "pontinhos" ao pensar. Respeita prefers-reduced-motion.
 */
export function TeacherAvatar({ state, level, size = 220, sunglasses }: Props) {
  const [open, setOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const raf = useRef(0);
  const smooth = useRef(0);

  useEffect(() => {
    const tick = () => {
      const target = state === 'speaking' && level ? level() : 0;
      smooth.current += (target - smooth.current) * 0.35;
      setOpen(smooth.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [state, level]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  const mouthH = 2 + Math.min(open, 1) * 16;
  const tilt = state === 'listening' ? -4 : state === 'thinking' ? 3 : 0;
  const ring = state === 'speaking' ? 'var(--indigo)' : state === 'listening' ? 'var(--teal)' : 'var(--line)';

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label={`Professora Maya ${{ idle: 'aguardando', speaking: 'falando', listening: 'ouvindo você', thinking: 'pensando' }[state]}`}>
      <circle cx="110" cy="110" r="104" fill="var(--surface-2)" />
      <circle cx="110" cy="110" r="104" fill="none" stroke={ring} strokeWidth={state === 'idle' ? 3 : 6} style={{ transition: 'stroke .3s' }}>
        {state !== 'idle' && <animate attributeName="r" values="102;106;102" dur="1.6s" repeatCount="indefinite" />}
      </circle>
      <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '110px 150px', transition: 'transform .5s ease' }}>
        {/* ombros / blusa */}
        <path d="M40 214c6-38 34-58 70-58s64 20 70 58z" fill="var(--indigo)" />
        <path d="M92 158l18 22 18-22" fill="none" stroke="var(--paper)" strokeWidth="5" strokeLinejoin="round" />
        {/* pescoço */}
        <rect x="98" y="128" width="24" height="30" rx="10" fill="#b9825f" />
        {/* cabelo atrás */}
        <path d="M54 104c-6-46 22-74 56-74s64 26 58 74c-2 18-4 32-10 44-6-10-8-20-8-34H72c0 14-2 24-8 34-6-12-8-26-10-44z" fill="#2b1d1a" />
        {/* rosto */}
        <ellipse cx="110" cy="100" rx="44" ry="50" fill="#c98e69" />
        {/* franja assimétrica */}
        <path d="M66 92c4-30 22-48 46-48 20 0 36 12 42 30-18-2-40-10-52-22-6 18-18 32-36 40z" fill="#2b1d1a" />
        {/* brincos */}
        <circle cx="66" cy="112" r="4" fill="var(--ochre)" />
        <circle cx="154" cy="112" r="4" fill="var(--ochre)" />
        {/* sobrancelhas */}
        <path d={state === 'thinking' ? 'M82 80q10-8 20-2' : 'M82 82q10-6 20 0'} stroke="#2b1d1a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={state === 'listening' ? 'M118 78q10-6 20 2' : 'M118 82q10-6 20 0'} stroke="#2b1d1a" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* olhos */}
        {sunglasses ? (
          <g>
            <rect x="78" y="88" width="28" height="18" rx="7" fill="#1b2230" />
            <rect x="114" y="88" width="28" height="18" rx="7" fill="#1b2230" />
            <path d="M106 96h8" stroke="#1b2230" strokeWidth="4" />
          </g>
        ) : (
          <g fill="#1b2230">
            <ellipse cx="92" cy="97" rx="5" ry={blink ? 0.8 : 6} />
            <ellipse cx="128" cy="97" rx="5" ry={blink ? 0.8 : 6} />
            {!blink && <circle cx="94" cy="95" r="1.6" fill="#fff" />}
            {!blink && <circle cx="130" cy="95" r="1.6" fill="#fff" />}
          </g>
        )}
        {/* nariz */}
        <path d="M110 104q-4 10 2 12" stroke="#9a6648" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* bochechas */}
        <circle cx="84" cy="116" r="7" fill="#e07a6a" opacity=".35" />
        <circle cx="136" cy="116" r="7" fill="#e07a6a" opacity=".35" />
        {/* boca: abre com o volume */}
        {state === 'speaking' ? (
          <g>
            <rect x={100 - open * 3} y={124 - mouthH / 2 + 4} width={20 + open * 6} height={mouthH} rx={Math.min(10, mouthH / 2 + 2)} fill="#5a2320" />
            {mouthH > 7 && <rect x={103} y={124 - mouthH / 2 + 4} width={14} height={3} rx="1.5" fill="#fff" opacity=".9" />}
          </g>
        ) : (
          <path d={state === 'listening' ? 'M98 126q12 8 24 0' : 'M99 125q11 6 22 0'} stroke="#5a2320" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
      </g>
      {state === 'thinking' && (
        <g fill="var(--ink-3)">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={160 + i * 12} cy={44} r="4">
              <animate attributeName="opacity" values=".2;1;.2" dur="1.2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}
    </svg>
  );
}
