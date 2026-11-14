/**
 * Audio (F-06). Prioridade:
 *   1. mp3 pré-gerado pela ElevenLabs (public/audio/manifest.json, várias vozes → HVPT)
 *   2. Web Speech API (speechSynthesis) como fallback offline/sem créditos
 */

type Manifest = Record<string, string[]>;

let manifest: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;
let current: HTMLAudioElement | null = null;

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

export function hasRecordedAudio(text: string): boolean {
  return !!manifest?.[audioKey(text)]?.length;
}

export interface PlayOptions {
  slow?: boolean;
  /** Índice de voz — varia entre falantes para treino de alta variabilidade. */
  variant?: number;
}

export function stopAudio() {
  current?.pause();
  current = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export async function playFile(path: string, slow = false): Promise<void> {
  stopAudio();
  const el = new Audio(`${import.meta.env.BASE_URL}${path}`);
  el.playbackRate = slow ? 0.8 : 1;
  (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  current = el;
  await new Promise<void>((resolve) => {
    el.onended = () => resolve();
    el.onerror = () => resolve();
    el.play().catch(() => resolve());
  });
}

export async function speak(text: string, opts: PlayOptions = {}): Promise<void> {
  const m = await loadManifest();
  const files = m[audioKey(text)];
  if (files?.length) {
    const file = files[(opts.variant ?? 0) % files.length];
    return playFile(file, opts.slow);
  }
  return synth(text, opts);
}

let cachedVoices: SpeechSynthesisVoice[] = [];
function englishVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
  return cachedVoices;
}

function synth(text: string, opts: PlayOptions): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  stopAudio();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = opts.slow ? 0.7 : 0.95;
    const voices = englishVoices();
    if (voices.length) u.voice = voices[(opts.variant ?? 0) % voices.length];
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}
