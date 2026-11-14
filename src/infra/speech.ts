/** Reconhecimento de fala (Web Speech API). Chrome/Edge/Safari; Firefox não suporta. */

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type Ctor = new () => RecognitionLike;

function ctor(): Ctor | null {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

import { caps, isArtifact } from './platform';

/** Num artefato o microfone só existe via capacidade `dictation`. */
export const speechRecognitionSupported = () => (isArtifact ? !!caps.dictation : typeof window !== 'undefined' && !!ctor());

export interface Listening {
  result: Promise<string[]>;
  stop: () => void;
}

/** Escuta uma frase e devolve as alternativas de transcrição. */
export function listen(lang = 'en-US', timeoutMs = 8000): Listening {
  if (isArtifact) return listenDictation(lang, timeoutMs);
  const C = ctor();
  if (!C) return { result: Promise.reject(new Error('unsupported')), stop: () => {} };
  const rec = new C();
  rec.lang = lang;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 5;
  let timer: ReturnType<typeof setTimeout>;
  const result = new Promise<string[]>((resolve, reject) => {
    let got: string[] = [];
    rec.onresult = (e) => {
      const first = e.results[0];
      got = Array.from({ length: first.length }, (_, i) => first[i].transcript);
    };
    rec.onerror = (e) => {
      clearTimeout(timer);
      if (e.error === 'no-speech') resolve([]);
      else reject(new Error(e.error));
    };
    rec.onend = () => {
      clearTimeout(timer);
      resolve(got);
    };
    rec.start();
    timer = setTimeout(() => rec.stop(), timeoutMs);
  });
  return { result, stop: () => rec.stop() };
}

/**
 * Ditado do runtime do artefato. IMPORTANTE: `start()` precisa ser chamado na
 * mesma pilha síncrona do clique — por isso nada é aguardado antes dele.
 */
function listenDictation(lang: string, timeoutMs: number): Listening {
  const d = caps.dictation;
  if (!d) return { result: Promise.reject(new Error('unsupported')), stop: () => {} };
  let text = '';
  let partial = '';
  let resolveFn!: (v: string[]) => void;
  let rejectFn!: (e: Error) => void;
  const result = new Promise<string[]>((res, rej) => {
    resolveFn = res;
    rejectFn = rej;
  });
  const offs: (() => void)[] = [];
  const finish = () => {
    clearTimeout(timer);
    offs.forEach((o) => o());
    const t = (text || partial).trim();
    resolveFn(t ? [t] : []);
  };
  offs.push(d.onFinal(({ text: t }) => (text = `${text} ${t}`.trim())));
  offs.push(d.onPartial(({ text: t }) => (partial = t)));
  let started = false;
  offs.push(
    d.onState(({ state }) => {
      if (state === 'listening' || state === 'starting') started = true;
      if (state === 'idle' && started) finish();
    }),
  );
  d.start({ language: lang.slice(0, 2) }).catch((e: { code?: string }) => {
    clearTimeout(timer);
    offs.forEach((o) => o());
    rejectFn(new Error(e?.code ?? 'dictation'));
  });
  const timer = setTimeout(() => void d.stop().catch(() => {}), timeoutMs);
  return { result, stop: () => void d.stop().catch(() => {}) };
}
