/**
 * Gravação de voz: grava o áudio (para ouvir sua própria voz e para análise de
 * sotaque via ElevenLabs Scribe) e, em paralelo, usa o reconhecimento do navegador
 * para ter texto ao vivo. Funciona com um dos dois se o outro faltar.
 */
import { listen, speechRecognitionSupported } from './speech';
import { transcribe } from './api';

export interface Recording {
  blob: Blob | null;
  url: string | null;
  /** Melhor texto: Scribe (se houver chave) senão Web Speech. */
  text: string;
  alternatives: string[];
  source: 'scribe' | 'browser' | 'none';
  /** Só o tempo de fala (não inclui a transcrição). */
  durationMs: number;
  /** Instante em que a gravação começou. */
  startedAt: number;
}

export interface ActiveRecording {
  stop: () => void;
  done: Promise<Recording>;
  level: () => number;
}

import { isArtifact } from './platform';

export const canRecord = () => !isArtifact && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export async function startRecording(opts: { maxMs?: number; useScribe?: boolean } = {}): Promise<ActiveRecording> {
  const maxMs = opts.maxMs ?? 12000;
  const started = Date.now();
  if (isArtifact) return dictationRecording(maxMs, started);
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  let analyser: AnalyserNode | null = null;
  let ctx: AudioContext | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start();
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
  } catch {
    stream = null;
  }

  const browser = speechRecognitionSupported() ? listen('en-US', maxMs) : null;
  const buf = new Uint8Array(512);
  const level = () => {
    if (!analyser) return 0;
    analyser.getByteTimeDomainData(buf);
    let s = 0;
    for (const v of buf) s += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(s / buf.length) * 5);
  };

  let resolveStop!: () => void;
  const stopped = new Promise<void>((r) => (resolveStop = r));
  const timer = setTimeout(() => resolveStop(), maxMs);

  const done = (async (): Promise<Recording> => {
    await stopped;
    const stoppedAt = Date.now();
    clearTimeout(timer);
    browser?.stop();
    let blob: Blob | null = null;
    if (recorder && recorder.state !== 'inactive') {
      const ended = new Promise((r) => (recorder!.onstop = r));
      recorder.stop();
      await ended;
      blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    }
    stream?.getTracks().forEach((t) => t.stop());
    void ctx?.close();
    const alternatives = browser ? await browser.result.catch(() => [] as string[]) : [];
    let text = alternatives[0] ?? '';
    let source: Recording['source'] = text ? 'browser' : 'none';
    if (blob && opts.useScribe !== false && blob.size > 2000) {
      const r = await transcribe(blob).catch(() => null);
      if (r?.text) {
        text = r.text;
        source = 'scribe';
      }
    }
    return { blob, url: blob ? URL.createObjectURL(blob) : null, text, alternatives: text ? [text, ...alternatives] : alternatives, source, durationMs: stoppedAt - started, startedAt: started };
  })();

  return { stop: () => resolveStop(), done, level };
}

/** Artefato: sem gravação de áudio; só o texto do ditado (iniciado de forma síncrona no clique). */
function dictationRecording(maxMs: number, started: number): ActiveRecording {
  const l = listen('en-US', maxMs);
  let t = 0;
  return {
    stop: l.stop,
    level: () => 0.25 + 0.25 * Math.abs(Math.sin((t += 0.18))),
    done: l.result
      .catch(() => [] as string[])
      .then((alts) => ({ blob: null, url: null, text: alts[0] ?? '', alternatives: alts, source: alts.length ? 'browser' : 'none', durationMs: Date.now() - started, startedAt: started }) as Recording),
  };
}
