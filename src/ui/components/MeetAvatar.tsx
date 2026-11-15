import type { Look } from '../../domain/meeting/types';

const SKIN = ['#f3d2b8', '#e3b48f', '#c98d63', '#9a6440', '#6b4128'];
const HAIR = ['#1f1a17', '#4a2f1d', '#8a5a2b', '#c9a15a', '#8c8c8c'];
/** Fundos de "home office": parede + um detalhe (estante, janela, quadro, planta). */
const WALLS = ['#3b4655', '#4d3f3a', '#33493f', '#463c55', '#3f4a4f'];

/**
 * Participante da videochamada. `level` (0–1) abre a boca enquanto a voz toca;
 * `speaking` acende o contorno como no Meet. Tudo em SVG, sem imagem externa.
 */
export function MeetAvatar({ look, seed = 0, level = 0, speaking = false, size = 160 }: { look: Look; seed?: number; level?: number; speaking?: boolean; size?: number }) {
  const skin = SKIN[look.skin % SKIN.length];
  const hair = HAIR[look.hairColor % HAIR.length];
  const wall = WALLS[seed % WALLS.length];
  const mouth = 1.5 + Math.min(1, level) * 7;
  const prop = seed % 4;
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden style={{ display: 'block', width: '100%', height: '100%', maxHeight: size > 100 ? undefined : size * 1.4 }}>
      <rect width="200" height="150" fill={wall} />
      {/* detalhe do fundo */}
      {prop === 0 && (
        <g opacity=".55">
          <rect x="12" y="22" width="44" height="62" fill="none" stroke="#e8e1d4" strokeWidth="2" />
          <line x1="12" y1="44" x2="56" y2="44" stroke="#e8e1d4" strokeWidth="2" />
          <line x1="12" y1="64" x2="56" y2="64" stroke="#e8e1d4" strokeWidth="2" />
          <rect x="17" y="30" width="6" height="14" fill="#d98c5f" /><rect x="25" y="33" width="5" height="11" fill="#7fb3a3" /><rect x="40" y="50" width="12" height="14" fill="#c9b47a" />
        </g>
      )}
      {prop === 1 && (
        <g opacity=".5">
          <rect x="140" y="16" width="48" height="40" rx="2" fill="#a8c4d6" />
          <line x1="164" y1="16" x2="164" y2="56" stroke={wall} strokeWidth="3" /><line x1="140" y1="36" x2="188" y2="36" stroke={wall} strokeWidth="3" />
        </g>
      )}
      {prop === 2 && <rect x="148" y="20" width="34" height="26" rx="1" fill="none" stroke="#e8e1d4" strokeWidth="3" opacity=".45" />}
      {prop === 3 && (
        <g opacity=".6">
          <path d="M22 96 q6 -30 4 -46 M22 96 q-10 -22 -18 -30 M22 96 q14 -16 22 -20" stroke="#6fae7d" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="12" y="94" width="20" height="16" rx="3" fill="#b9714f" />
        </g>
      )}
      {/* corpo */}
      <path d={`M48 150 q4 -34 52 -38 q48 4 52 38 z`} fill={look.shirt} />
      <path d="M88 113 l12 12 l12 -12" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
      <rect x="92" y="96" width="16" height="18" fill={skin} />
      {/* cabelo de trás */}
      {look.hair === 1 && <path d="M62 70 q-4 40 10 52 h56 q14 -12 10 -52 z" fill={hair} />}
      {look.hair === 5 && <path d="M128 52 q20 6 16 30 q-6 -10 -14 -12 z" fill={hair} />}
      {/* rosto */}
      <ellipse cx="100" cy="70" rx="29" ry="33" fill={skin} />
      <ellipse cx="71" cy="72" rx="4" ry="7" fill={skin} /><ellipse cx="129" cy="72" rx="4" ry="7" fill={skin} />
      {/* cabelo da frente */}
      {look.hair === 0 && <path d="M70 62 q2 -30 30 -30 q30 0 30 30 q-8 -14 -30 -14 q-20 0 -30 14 z" fill={hair} />}
      {look.hair === 1 && <path d="M70 66 q0 -34 30 -34 q30 0 30 34 q-12 -22 -32 -20 q-16 2 -28 20 z" fill={hair} />}
      {look.hair === 2 && (
        <>
          <circle cx="100" cy="30" r="11" fill={hair} />
          <path d="M71 62 q2 -28 29 -28 q27 0 29 28 q-10 -16 -29 -16 q-19 0 -29 16 z" fill={hair} />
        </>
      )}
      {look.hair === 3 && <path d="M72 58 q4 -22 28 -24 q24 2 28 24 q-12 -10 -28 -10 q-16 0 -28 10 z" fill={hair} opacity=".35" />}
      {look.hair === 4 && (
        <g fill={hair}>
          {[74, 84, 94, 104, 114, 124].map((x, i) => <circle key={x} cx={x} cy={42 + (i % 2) * 4} r="10" />)}
          <circle cx="70" cy="56" r="8" /><circle cx="130" cy="56" r="8" />
        </g>
      )}
      {look.hair === 5 && <path d="M70 64 q0 -32 30 -32 q30 0 30 32 q-10 -18 -30 -18 q-20 0 -30 18 z" fill={hair} />}
      {/* rosto: olhos piscam, boca acompanha a voz */}
      <g className="meet-eyes">
        <ellipse cx="89" cy="70" rx="3" ry="3.4" fill="#1d1d1f" />
        <ellipse cx="111" cy="70" rx="3" ry="3.4" fill="#1d1d1f" />
      </g>
      <path d="M83 62 q6 -3 11 0 M106 62 q5 -3 11 0" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {look.glasses && (
        <g fill="none" stroke="#1d1d1f" strokeWidth="2">
          <rect x="80" y="63" width="17" height="13" rx="4" /><rect x="103" y="63" width="17" height="13" rx="4" /><path d="M97 69 h6" />
        </g>
      )}
      {look.beard && <path d="M74 80 q4 26 26 26 q22 0 26 -26 q-6 12 -26 12 q-20 0 -26 -12 z" fill={hair} opacity=".85" />}
      <ellipse cx="100" cy="88" rx="7" ry={mouth} fill="#7a2f2a" />
      {speaking && <rect x="2" y="2" width="196" height="146" rx="10" fill="none" stroke="#7fb8ff" strokeWidth="4" />}
    </svg>
  );
}

/** Três barrinhas de áudio do canto do vídeo (como nas videochamadas). */
export function AudioBars({ level, muted }: { level: number; muted?: boolean }) {
  if (muted) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#c5221f" />
        <path d="M12 6a2.5 2.5 0 0 0-2.5 2.5v3.5a2.5 2.5 0 0 0 5 0V8.5A2.5 2.5 0 0 0 12 6zM8 12a4 4 0 0 0 8 0M12 16v2M7 6l10 12" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  const h = (k: number) => 4 + Math.min(1, level * (1 + k * 0.4)) * 12;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#1a73e8" />
      {[0, 1, 2].map((k) => <rect key={k} x={7 + k * 4} y={12 - h(k === 1 ? 1 : 0) / 2} width="2.4" height={h(k === 1 ? 1 : 0)} rx="1.2" fill="#fff" />)}
    </svg>
  );
}
