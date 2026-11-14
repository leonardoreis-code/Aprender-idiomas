/**
 * Audio (F-06). Prioridade:
 *   1. mp3 pré-gerado (public/audio/manifest.json)
 *   2. ElevenLabs sob demanda via backend (/api/tts, com cache)
 *   3. Web Speech API (speechSynthesis) como fallback
 * `onLevel` recebe o volume (0–1) a cada quadro — usado na boca do avatar.
 */
import { health, ttsUrl } from './api';
import { caps, isArtifact } from './platform';

type Manifest = Record<string, string[]>;
let manifest: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;
let current: HTMLAudioElement | null = null;
let stopLevel: (() => void) | null = null;
let ctx: AudioContext | null = null;

export const audioKey = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();

export function loadManifest(): Promise<Manifest> {
  if (manifest) return Promise.resolve(manifest);
  manifestPromise ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m: Manifest) => (manifest = m));
  return manifestPromise;
}

export interface PlayOptions {
  slow?: boolean;
  /** Índice de voz — varia falantes (treino de alta variabilidade). */
  variant?: number;
  lang?: 'en' | 'pt';
  onLevel?: (level: number) => void;
}

export function stopAudio() {
  current?.pause();
  current = null;
  stopLevel?.();
  stopLevel = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  try {
    caps.tts?.stop();
  } catch {
    /* ignore */
  }
}

function attachLevel(el: HTMLAudioElement, onLevel: (l: number) => void) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const src = ctx.createMediaElementSource(el);
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    src.connect(an).connect(ctx.destination);
    const data = new Uint8Array(an.fftSize);
    let raf = 0;
    const tick = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
      raf = requestAnimationFrame(tick);
    };
    tick();
    stopLevel = () => {
      cancelAnimationFrame(raf);
      onLevel(0);
    };
  } catch {
    /* sem WebAudio: segue sem boca animada */
  }
}

export async function playFile(path: string, opts: PlayOptions = {}): Promise<void> {
  stopAudio();
  const el = new Audio(path.startsWith('/') || path.startsWith('http') ? path : `${import.meta.env.BASE_URL}${path}`);
  el.crossOrigin = 'anonymous';
  el.playbackRate = opts.slow ? 0.8 : 1;
  (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  current = el;
  if (opts.onLevel) attachLevel(el, opts.onLevel);
  await new Promise<void>((resolve, reject) => {
    el.onended = () => resolve();
    el.onerror = () => reject(new Error('audio'));
    el.play().catch(reject);
  }).finally(() => {
    stopLevel?.();
    stopLevel = null;
  });
}

const VOICE_NAMES = ['bella', 'daniel', 'matilda'];

export async function speak(text: string, opts: PlayOptions = {}): Promise<void> {
  const lang = opts.lang ?? 'en';
  if (lang === 'en') {
    const m = await loadManifest();
    const files = m[audioKey(text)];
    if (files?.length) {
      try {
        return await playFile(files[(opts.variant ?? 0) % files.length], opts);
      } catch {
        /* cai para o próximo */
      }
    }
  }
  if (isArtifact && caps.tts) {
    try {
      return await artifactTts(text, opts);
    } catch {
      /* sem gesto do usuário ou limite: cai para a voz do sistema */
    }
  }
  const h = await health();
  if (h.tts) {
    try {
      const voice = lang === 'pt' ? 'matilda' : VOICE_NAMES[(opts.variant ?? 0) % VOICE_NAMES.length];
      return await playFile(ttsUrl(text, voice, lang), opts);
    } catch {
      /* fallback */
    }
  }
  return synth(text, opts);
}

let cachedVoices: SpeechSynthesisVoice[] = [];
function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices.filter((v) => v.lang.toLowerCase().startsWith(lang));
}

function synth(text: string, opts: PlayOptions): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  stopAudio();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const lang = opts.lang === 'pt' ? 'pt-BR' : 'en-US';
    u.lang = lang;
    u.rate = opts.slow ? 0.7 : 0.95;
    const voices = voicesFor(lang.slice(0, 2));
    if (voices.length) u.voice = voices[(opts.variant ?? 0) % voices.length];
    // sem acesso ao áudio: simula a boca pelas fronteiras de palavra
    let pulse: ReturnType<typeof setInterval> | null = null;
    if (opts.onLevel) {
      let on = false;
      pulse = setInterval(() => opts.onLevel!((on = !on) ? 0.55 + Math.random() * 0.35 : 0.1), 110);
    }
    const end = () => {
      if (pulse) clearInterval(pulse);
      opts.onLevel?.(0);
      resolve();
    };
    u.onend = end;
    u.onerror = end;
    window.speechSynthesis.speak(u);
  });
}

const TTS_VOICES = ['buttery', 'glassy', 'rounded'];

/** Voz do Claude (runtime do artefato). Sem acesso ao áudio: a boca do avatar pulsa enquanto fala. */
async function artifactTts(text: string, opts: PlayOptions): Promise<void> {
  const t = caps.tts!;
  try {
    t.stop();
  } catch {
    /* ignore */
  }
  let pulse: ReturnType<typeof setInterval> | null = null;
  if (opts.onLevel) {
    let k = 0;
    pulse = setInterval(() => opts.onLevel!(0.25 + 0.6 * Math.abs(Math.sin((k += 0.9)))), 90);
  }
  try {
    await t.speak(text, {
      voice: opts.lang === 'pt' ? 'airy' : TTS_VOICES[(opts.variant ?? 0) % TTS_VOICES.length],
      rate: opts.slow ? 0.75 : 1,
      language: opts.lang === 'pt' ? 'pt-BR' : 'en',
    });
  } finally {
    if (pulse) clearInterval(pulse);
    opts.onLevel?.(0);
  }
}
