/**
 * Escuta AO VIVO: entrega o texto palavra a palavra enquanto a pessoa fala
 * (resultados parciais), para o treinador marcar erros em tempo real.
 * - Artefato: capacidade `dictation` (onPartial / onFinal).
 * - Navegador comum: Web Speech API contínua com resultados intermediários.
 * Encerra sozinha depois de um silêncio, ou quando `stop()` é chamado.
 * IMPORTANTE: chame `startLive` direto no clique (o ditado exige o gesto).
 */
import { caps, isArtifact } from './platform';

/* eslint-disable @typescript-eslint/no-explicit-any */
const webCtor = (): any => (typeof window === 'undefined' ? null : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null);

export const liveAvailable = () => (isArtifact ? !!caps.dictation : !!webCtor());

export interface LiveSession {
  stop: () => void;
  done: Promise<{ text: string; ms: number }>;
}

export function startLive(opts: { onText: (text: string) => void; silenceMs?: number; maxMs?: number; lang?: string }): LiveSession {
  const silenceMs = opts.silenceMs ?? 2600;
  const maxMs = opts.maxMs ?? 60000;
  const started = Date.now();
  let finals = '';
  let partial = '';
  let ended = false;
  let silence: ReturnType<typeof setTimeout> | undefined;
  let resolve!: (v: { text: string; ms: number }) => void;
  const done = new Promise<{ text: string; ms: number }>((r) => (resolve = r));
  const full = () => `${finals} ${partial}`.replace(/\s+/g, ' ').trim();
  let lastSpeech = started;
  let stopImpl: () => void = () => {};

  const finish = () => {
    if (ended) return;
    ended = true;
    clearTimeout(silence);
    clearTimeout(hard);
    resolve({ text: full(), ms: Math.max(500, lastSpeech - started) });
  };
  const bump = () => {
    lastSpeech = Date.now();
    opts.onText(full());
    clearTimeout(silence);
    if (full()) silence = setTimeout(() => stopImpl(), silenceMs);
  };
  const hard = setTimeout(() => stopImpl(), maxMs);

  if (isArtifact) {
    const d = caps.dictation;
    if (!d) {
      finish();
      return { stop: () => {}, done };
    }
    let began = false;
    const offs = [
      d.onPartial(({ text }) => {
        partial = text;
        bump();
      }),
      d.onFinal(({ text }) => {
        finals = `${finals} ${text}`.trim();
        partial = '';
        bump();
      }),
      d.onState(({ state }) => {
        if (state === 'listening' || state === 'starting') began = true;
        if (state === 'idle' && began) {
          offs.forEach((o) => o());
          finish();
        }
      }),
    ];
    stopImpl = () => void d.stop().catch(() => finish());
    d.start({ language: (opts.lang ?? 'en').slice(0, 2) }).catch(() => {
      offs.forEach((o) => o());
      finish();
    });
  } else {
    const C = webCtor();
    if (!C) {
      finish();
      return { stop: () => {}, done };
    }
    const rec = new C();
    rec.lang = opts.lang ?? 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let f = '';
      let p = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) f += ` ${t}`;
        else p += ` ${t}`;
      }
      finals = f.trim();
      partial = p.trim();
      bump();
    };
    rec.onerror = () => finish();
    rec.onend = () => finish();
    stopImpl = () => {
      try {
        rec.stop();
      } catch {
        finish();
      }
    };
    try {
      rec.start();
    } catch {
      finish();
    }
  }
  return { stop: () => stopImpl(), done };
}
