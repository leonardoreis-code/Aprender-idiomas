/**
 * Efeitos sonoros sintetizados (WebAudio) — sem arquivos, latência ~0.
 * Recompensa imediata e previsível ao acertar; som neutro e curto ao errar.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export const setSfxEnabled = (on: boolean) => (enabled = on);

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Acerto: terça maior ascendente; combo sobe o tom (sensação de progresso). */
export function sfxCorrect(combo = 1) {
  const lift = Math.min(combo - 1, 6) * 40;
  tone(660 + lift, 0, 0.12, 'triangle');
  tone(880 + lift, 0.08, 0.18, 'triangle');
}

export function sfxWrong() {
  tone(220, 0, 0.18, 'sine', 0.08);
  tone(196, 0.1, 0.22, 'sine', 0.08);
}

export function sfxTap() {
  tone(520, 0, 0.05, 'sine', 0.05);
}

export function sfxComplete() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.1));
}
