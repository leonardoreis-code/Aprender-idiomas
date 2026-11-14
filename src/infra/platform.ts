/**
 * Detecta se o app roda como Artefato do claude.ai e expõe as capacidades do
 * runtime (ditado, voz, Claude). Num artefato não há microfone direto nem
 * conexões externas: fala → `dictation`, áudio → `tts`, professora → `sample`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Unsub = () => void;
export interface DictationCap {
  start(opts?: { language?: string }): Promise<void>;
  stop(): Promise<void>;
  onPartial(h: (e: { text: string }) => void): Unsub;
  onFinal(h: (e: { text: string }) => void): Unsub;
  onState(h: (e: { state: string; reason?: string }) => void): Unsub;
}
export interface TtsCap {
  speak(text: string, opts?: { voice?: string; rate?: number; language?: string }): Promise<void>;
  stop(): void;
  onState(h: (e: { state: string; reason?: string }) => void): Unsub;
}
export type SampleCap = ((input: any, opts?: any) => Promise<{ text: string }>) & { json?: (input: any, opts?: any) => Promise<any> };

const w = typeof window !== 'undefined' ? (window as any) : {};
export const isArtifact = !!w.claude?.use;

export const caps: { dictation: DictationCap | null; tts: TtsCap | null; sample: SampleCap | null; ready: boolean } = {
  dictation: null,
  tts: null,
  sample: null,
  ready: !isArtifact,
};

const use = (name: string) => (isArtifact ? Promise.resolve(w.claude.use(name)).catch(() => null) : Promise.resolve(null));

export const capsReady: Promise<void> = isArtifact
  ? Promise.all([use('dictation'), use('tts'), use('sample')]).then(([d, t, s]) => {
      caps.dictation = d;
      caps.tts = t;
      caps.sample = s;
      caps.ready = true;
      window.dispatchEvent(new Event('fluente:caps'));
    })
  : Promise.resolve();
