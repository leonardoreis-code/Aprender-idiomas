import { levenshtein, normalize } from '../practice/answer';

/** Pronunciation bounded context (F-05). */

export interface SpeechScore {
  score: number; // 0–100
  words: { word: string; ok: boolean }[];
  verdict: 'great' | 'good' | 'retry';
}

/**
 * Compara o melhor transcrito do reconhecedor com o alvo, palavra a palavra.
 * Mede inteligibilidade (o reconhecedor entendeu?) — não "sotaque nativo",
 * alinhado a Derwing & Munro.
 */
export function scoreSpeech(target: string, alternatives: string[]): SpeechScore {
  const tw = normalize(target).split(' ');
  let best: SpeechScore = { score: 0, words: tw.map((word) => ({ word, ok: false })), verdict: 'retry' };
  for (const alt of alternatives) {
    const got = normalize(alt).split(' ');
    const pool = [...got];
    const words = tw.map((word) => {
      const idx = pool.findIndex((g) => g === word || (word.length >= 5 && levenshtein(g, word) <= 1));
      if (idx >= 0) pool.splice(idx, 1);
      return { word, ok: idx >= 0 };
    });
    const hit = words.filter((w) => w.ok).length / tw.length;
    const charSim = 1 - levenshtein(normalize(alt), normalize(target)) / Math.max(normalize(target).length, 1);
    const score = Math.round(100 * Math.max(0, 0.7 * hit + 0.3 * charSim));
    if (score > best.score) best = { score, words, verdict: score >= 85 ? 'great' : score >= 60 ? 'good' : 'retry' };
  }
  return best;
}

/** Dica específica para PT-BR com base nas palavras que falharam. */
export function tipFor(missed: string[]): string | null {
  const w = missed.join(' ');
  if (/th/.test(w)) return 'Para o TH, ponha a língua entre os dentes e sopre. Não use T, F ou S.';
  if (/(ee|ea)/.test(w)) return 'Esse som de "i" é longo: estique os lábios como num sorriso.';
  if (/\b\w+(k|g|d|t|b|p)\b/.test(w)) return 'Termine na consoante, sem acrescentar "i" no final.';
  if (/\bh/.test(w)) return 'O H inicial é só um sopro, como o "r" de "rato" bem leve.';
  return null;
}
