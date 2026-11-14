/** Correção tolerante de respostas (F-03). */

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "we're": 'we are',
  "they're": 'they are',
  "i'd": 'i would',
  "don't": 'do not',
  "doesn't": 'does not',
  "can't": 'cannot',
  "isn't": 'is not',
  "aren't": 'are not',
  "what's": 'what is',
  "where's": 'where is',
};

export function normalize(text: string): string {
  let t = text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?;:"“”()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  t = t
    .split(' ')
    .map((w) => CONTRACTIONS[w] ?? w)
    .join(' ');
  return t.replace(/\bcan not\b/g, 'cannot');
}

/** Distância de edição com transposição de letras adjacentes (OSA / Damerau). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

export type Verdict = 'correct' | 'almost' | 'wrong';

/**
 * "almost" = no máximo 1 erro de digitação por palavra com ≥5 letras e nenhuma
 * palavra faltando. Conta como acerto (com aviso) — feedback corretivo explícito.
 */
export function checkTyped(input: string, accepted: string[]): Verdict {
  const got = normalize(input);
  if (!got) return 'wrong';
  const targets = accepted.map(normalize);
  if (targets.includes(got)) return 'correct';
  for (const target of targets) {
    const gw = got.split(' ');
    const tw = target.split(' ');
    if (gw.length !== tw.length) continue;
    const ok = tw.every((w, i) => w === gw[i] || (w.length >= 5 && levenshtein(w, gw[i]) <= 1));
    if (ok) return 'almost';
  }
  return 'wrong';
}

/** Para exibição: palavras da resposta esperada marcadas como acertadas ou não. */
export function diffWords(input: string, target: string): { word: string; ok: boolean }[] {
  const got = new Set(normalize(input).split(' '));
  return target.split(/\s+/).map((word) => ({ word, ok: got.has(normalize(word)) }));
}
