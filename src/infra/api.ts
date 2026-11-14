/** Cliente do backend (server/index.mjs). Tudo degrada com elegância se não houver servidor/chave. */

export interface Health {
  tts: boolean;
  stt: boolean;
  teacher: boolean;
  agentId?: string;
}

const FALLBACK_AGENT = 'agent_2001m7cr5kzdf2srmtvn4p87nxzr';
let healthP: Promise<Health> | null = null;

export function health(): Promise<Health> {
  healthP ??= fetch('/api/health')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .catch(() => ({ tts: false, stt: false, teacher: true, agentId: FALLBACK_AGENT }));
  return healthP;
}

export const ttsUrl = (text: string, voice = 'bella', lang: 'en' | 'pt' = 'en') =>
  `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}&lang=${lang}`;

export interface SttResult {
  text: string;
  words: { text: string; start: number; end: number; logprob?: number }[];
  language?: string;
}

export async function transcribe(audio: Blob): Promise<SttResult | null> {
  const h = await health();
  if (!h.stt) return null;
  const r = await fetch('/api/stt', { method: 'POST', headers: { 'content-type': audio.type || 'audio/webm' }, body: audio });
  if (!r.ok) return null;
  return r.json();
}

export async function teacherAuth(): Promise<{ signedUrl?: string; agentId?: string }> {
  try {
    const r = await fetch('/api/teacher');
    if (r.ok) return r.json();
  } catch {
    /* sem servidor */
  }
  return { agentId: FALLBACK_AGENT };
}
