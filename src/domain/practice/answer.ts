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
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "they've": 'they have',
  "i'll": 'i will',
  "we'll": 'we will',
  "you'll": 'you will',
  "didn't": 'did not',
  "won't": 'will not',
  "haven't": 'have not',
  "hasn't": 'has not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "couldn't": 'could not',
  "shouldn't": 'should not',
  "wouldn't": 'would not',
  "there's": 'there is',
  "that's": 'that is',
};

/** Reconhecedores de fala escrevem "3 years"; o alvo diz "three years". */
const NUMBER_WORDS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
  '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven', '12': 'twelve',
};

const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** 0–99 por extenso: o reconhecedor de fala escreve "20", o alvo pode dizer "twenty". */
function upTo99(n: number): string {
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
}

export function normalize(text: string): string {
  let t = text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\ba\.m\./g, 'am')
    .replace(/\bp\.m\./g, 'pm')
    .replace(/%/g, ' percent')
    .replace(/(\d):00\b/g, '$1')
    .replace(/(\d):(\d\d)\b/g, '$1 $2')
    .replace(/([a-z0-9])-(?=[a-z0-9])/g, '$1 ')
    .replace(/[.,!?;:"“”()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  t = t
    .split(' ')
    .map((w) => CONTRACTIONS[w] ?? NUMBER_WORDS[w] ?? (/^\d{1,2}$/.test(w) ? upTo99(+w) : w))
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

/** Pares que diferem por 1 letra mas são OUTRA palavra: isso é erro, não digitação. */
const CONFUSABLE = new Set([
  'there|three', 'where|were', 'bought|brought', 'after|alter', 'think|thing', 'quite|quiet', 'loose|lose',
  'whole|while', 'these|those', 'desert|dessert', 'advice|advise', 'affect|effect', 'accept|except',
  'through|though', 'thought|though', 'write|white', 'world|words', 'form|from', 'then|than', 'could|would',
  'could|should', 'would|should', 'their|there', 'cloud|could', 'worse|worst', 'later|latter', 'start|stars',
]);
export function isConfusable(a: string, b: string): boolean {
  return CONFUSABLE.has(`${a}|${b}`) || CONFUSABLE.has(`${b}|${a}`);
}
/** Erro de digitação: mesma primeira letra, 1 edição, e não vira outra palavra conhecida. */
const isTypo = (target: string, got: string) =>
  target.length >= 5 && got[0] === target[0] && levenshtein(target, got) <= 1 && !isInflection(target, got) && !isConfusable(target, got);

/** "work" × "works" ou "like" × "liked" é erro de gramática, não de digitação. */
export function isInflection(a: string, b: string): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.startsWith(short) && ['s', 'd', 'es', 'ed'].includes(long.slice(short.length))) return true;
  // mesma raiz, terminações verbais diferentes: "studies" × "studied", "works" × "worked"
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const ENDS = ['', 's', 'd', 'es', 'ed', 'ies', 'ied', 'ing', 'y'];
  return i >= 3 && a !== b && ENDS.includes(a.slice(i)) && ENDS.includes(b.slice(i));
}

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
    const ok = tw.every((w, i) => w === gw[i] || isTypo(w, gw[i]));
    if (ok) return 'almost';
  }
  return 'wrong';
}

/** Para exibição: palavras da resposta esperada marcadas como acertadas ou não. */
export function diffWords(input: string, target: string): { word: string; ok: boolean }[] {
  const got = new Set(normalize(input).split(' '));
  return target.split(/\s+/).map((word) => ({ word, ok: got.has(normalize(word)) }));
}
