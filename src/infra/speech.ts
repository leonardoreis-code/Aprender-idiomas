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

export const speechRecognitionSupported = () => typeof window !== 'undefined' && !!ctor();

export interface Listening {
  result: Promise<string[]>;
  stop: () => void;
}

/** Escuta uma frase e devolve as alternativas de transcrição. */
export function listen(lang = 'en-US', timeoutMs = 8000): Listening {
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
