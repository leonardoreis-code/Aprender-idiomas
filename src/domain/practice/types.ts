import type { Item, MinimalPair, Sentence, SoundFocus } from '../curriculum/types';

interface Base {
  /** Chave única dentro da sessão. */
  key: string;
  /** Itens cuja memória é exercitada (para FSRS). */
  itemIds: string[];
}

export type Exercise =
  | (Base & { type: 'intro'; item: Item })
  | (Base & { type: 'sound-intro'; sound: SoundFocus })
  | (Base & { type: 'listen-choose'; audio: string; options: string[]; answer: string })
  | (Base & { type: 'pt-to-en-choose'; prompt: string; options: string[]; answer: string })
  | (Base & { type: 'match-pairs'; pairs: { en: string; pt: string }[] })
  | (Base & { type: 'word-bank'; prompt: string; bank: string[]; answer: string; accepted: string[] })
  | (Base & { type: 'dictation'; audio: string; accepted: string[]; pt: string })
  | (Base & { type: 'fill-gap'; before: string; after: string; options: string[]; answer: string; pt: string; full: string })
  | (Base & { type: 'speak'; text: string; pt: string; tip?: string })
  | (Base & { type: 'minimal-pair'; pair: MinimalPair; target: 'a' | 'b' });

export type ExerciseType = Exercise['type'];

export interface Attempt {
  exerciseKey: string;
  itemIds: string[];
  correct: boolean;
  /** Acertou com tolerância (typo) ou usou ajuda. */
  hesitant: boolean;
  /** Exercício de produção (digitar/falar) vs reconhecimento. */
  production: boolean;
  ms: number;
}

export const PRODUCTION_TYPES: ExerciseType[] = ['word-bank', 'dictation', 'speak'];
export const isGraded = (e: Exercise) => e.type !== 'intro' && e.type !== 'sound-intro';
export type { Sentence };
