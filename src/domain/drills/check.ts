/**
 * Correção dos treinos curtos de fala (funções puras, sem React).
 * - `checkAnswers`: frase dita ou digitada contra a lista de respostas aceitas.
 * - `makeNumberItem` / `checkNumber`: números em voz alta. O reconhecimento de fala
 *   costuma devolver dígitos ("37%", "$24.99", "7:45") mesmo quando a pessoa disse
 *   por extenso, então a conferência aceita as duas formas.
 * - `meanLatency`: média do tempo de reação, em segundos.
 */
import { checkTyped } from '../practice/answer';
import { rng } from '../practice/builder';

export function checkAnswers(said: string, answers: string[]): 'correct' | 'almost' | 'wrong' {
  return checkTyped(said, answers);
}

/* ------------------------------------------------------------------ */
/* Números por extenso                                                  */
/* ------------------------------------------------------------------ */
export interface NumberItem {
  /** Como aparece na tela ("1,250", "37%", "$24.99", "7:45", "March 3rd"). */
  display: string;
  kind: 'integer' | 'percent' | 'price' | 'year' | 'time' | 'decimal' | 'date';
  /** Formas faladas corretas (a primeira é a que o app mostra e fala). */
  spoken: string[];
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
const MONTHS: { name: string; days: number }[] = [
  { name: 'January', days: 31 }, { name: 'February', days: 28 }, { name: 'March', days: 31 }, { name: 'April', days: 30 },
  { name: 'May', days: 31 }, { name: 'June', days: 30 }, { name: 'July', days: 31 }, { name: 'August', days: 31 },
  { name: 'September', days: 30 }, { name: 'October', days: 31 }, { name: 'November', days: 30 }, { name: 'December', days: 31 },
];
/** Pares que brasileiros mais confundem ao ouvir e ao falar (-teen × -ty). */
const HARD_PAIRS = [13, 30, 14, 40, 15, 50, 16, 60, 17, 70, 18, 80, 19, 90];
const TRICKY_DAYS = [1, 2, 3, 5, 8, 9, 12, 13, 20, 21, 22, 23, 30, 31];
const COMMON_CENTS = [99, 99, 50, 95, 25, 75, 49, 90, 15, 30];
const ROUND_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const under100 = (n: number): string => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));

/** Inteiro por extenso no padrão americano (sem "and"): 1250 → "one thousand two hundred fifty". */
export function numberWords(n: number): string {
  if (n < 100) return under100(n);
  if (n < 1000) {
    const r = n % 100;
    return `${ONES[Math.floor(n / 100)]} hundred${r ? ` ${under100(r)}` : ''}`;
  }
  const r = n % 1000;
  return `${numberWords(Math.floor(n / 1000))} thousand${r ? ` ${numberWords(r)}` : ''}`;
}

/** Ordinal por extenso (dias do mês): 3 → "third", 21 → "twenty-first". */
export function ordinalWords(n: number): string {
  if (n < 20) return ORDINALS[n];
  const tens = TENS[Math.floor(n / 10)];
  return n % 10 ? `${tens}-${ORDINALS[n % 10]}` : `${tens.slice(0, -1)}ieth`;
}

const ordinalSuffix = (n: number): string => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th');
const withCommas = (n: number): string => (n >= 1000 ? `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}` : String(n));

function integerSpoken(n: number): string[] {
  const forms = [numberWords(n)];
  // 1,500 → "fifteen hundred"
  if (n >= 1100 && n % 100 === 0 && n % 1000 !== 0) forms.push(`${under100(n / 100)} hundred`);
  if (n >= 100 && n < 200) forms.push(forms[0].replace(/^one hundred/, 'a hundred'));
  if (n >= 1000 && n < 2000) forms.push(forms[0].replace(/^one thousand/, 'a thousand'));
  return forms;
}

function yearSpoken(y: number): string[] {
  const hi = Math.floor(y / 100);
  const lo = y % 100;
  if (lo === 0) return y % 1000 === 0 ? [numberWords(y)] : [`${under100(hi)} hundred`];
  if (y >= 2000 && y < 2010) return [numberWords(y), `twenty oh ${ONES[lo]}`];
  if (lo < 10) return [`${under100(hi)} oh ${ONES[lo]}`];
  const pair = `${under100(hi)} ${under100(lo)}`;
  return y >= 2000 ? [pair, numberWords(y)] : [pair];
}

function timeSpoken(h: number, m: number): string[] {
  const hour = ONES[h];
  const next = ONES[(h % 12) + 1];
  if (m === 0) return [`${hour} o'clock`, hour];
  const plain = m < 10 ? `${hour} oh ${ONES[m]}` : `${hour} ${under100(m)}`;
  if (m === 15) return [plain, `a quarter past ${hour}`, `quarter past ${hour}`, `a quarter after ${hour}`, `quarter after ${hour}`];
  if (m === 30) return [plain, `half past ${hour}`];
  if (m === 45) return [plain, `a quarter to ${next}`, `quarter to ${next}`];
  if (m % 5 !== 0) return [plain];
  return m < 30 ? [plain, `${under100(m)} past ${hour}`, `${under100(m)} after ${hour}`] : [plain, `${under100(60 - m)} to ${next}`];
}

/** Ciclo de tipos: seeds consecutivas passam por todos (inteiros aparecem em dobro). */
const KIND_CYCLE: NumberItem['kind'][] = ['integer', 'percent', 'price', 'year', 'integer', 'time', 'decimal', 'date'];

/** Gera um número para dizer em voz alta. Determinístico: a mesma seed dá o mesmo item. */
export function makeNumberItem(seed: number): NumberItem {
  const s = Number.isFinite(seed) ? Math.floor(Math.abs(seed)) : 0;
  const kind = KIND_CYCLE[s % KIND_CYCLE.length];
  const rand = rng(s);
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const roll = rand();

  switch (kind) {
    case 'integer': {
      let n: number;
      if (roll < 0.35) n = pick(HARD_PAIRS);
      else if (roll < 0.55) n = int(21, 99);
      else if (roll < 0.8) n = int(1, 9) * 100 + (rand() < 0.5 ? pick(HARD_PAIRS) : int(0, 99));
      else n = int(1000, 9999);
      return { display: withCommas(n), kind, spoken: integerSpoken(n) };
    }
    case 'percent': {
      if (roll < 0.3) {
        const n = int(1, 99);
        return { display: `${n}.5%`, kind, spoken: [`${under100(n)} point five percent`, `${under100(n)} and a half percent`] };
      }
      const n = roll < 0.6 ? pick(HARD_PAIRS) : int(1, 100);
      return { display: `${n}%`, kind, spoken: integerSpoken(n).map((w) => `${w} percent`) };
    }
    case 'price': {
      const dollars = int(2, 99);
      const cents = roll < 0.6 ? pick(COMMON_CENTS) : int(10, 99);
      const d = under100(dollars);
      const c = under100(cents);
      return { display: `$${dollars}.${cents}`, kind, spoken: [`${d} dollars and ${c} cents`, `${d} ${c}`, `${d} dollars ${c}`] };
    }
    case 'year': {
      const y = roll < 0.3 ? int(1950, 1999) : roll < 0.5 ? int(2000, 2009) : int(2010, 2035);
      return { display: String(y), kind, spoken: yearSpoken(y) };
    }
    case 'time': {
      const h = int(1, 12);
      const m = roll < 0.65 ? pick(ROUND_MINUTES) : int(11, 59);
      return { display: `${h}:${String(m).padStart(2, '0')}`, kind, spoken: timeSpoken(h, m) };
    }
    case 'decimal': {
      const whole = int(0, 20);
      const digits = roll < 0.6 ? [int(1, 9)] : [int(1, 9), int(1, 9)];
      const tail = `point ${digits.map((d) => ONES[d]).join(' ')}`;
      const spoken = [`${under100(whole)} ${tail}`];
      if (whole === 0) spoken.push(tail, `oh ${tail}`);
      return { display: `${whole}.${digits.join('')}`, kind, spoken };
    }
    case 'date': {
      const month = pick(MONTHS);
      const tricky = TRICKY_DAYS.filter((d) => d <= month.days);
      const day = roll < 0.6 ? pick(tricky) : int(1, month.days);
      const ord = ordinalWords(day);
      return {
        display: `${month.name} ${day}${ordinalSuffix(day)}`,
        kind,
        spoken: [`${month.name} ${ord}`, `${month.name} the ${ord}`, `the ${ord} of ${month.name}`, `${ord} of ${month.name}`],
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Conferência de números                                               */
/* ------------------------------------------------------------------ */
const dropThousandCommas = (text: string): string => text.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');

/**
 * Forma comparável de um número falado: minúsculas, hífen vira espaço, sem "and",
 * sem vírgula de milhar, e dígitos soltos convertidos em palavras
 * ("7:45" → "seven forty five", "March 3rd" → "march third", "37%" → "thirty seven percent").
 */
export function spokenForm(text: string): string {
  const t = dropThousandCommas(text.toLowerCase())
    .replace(/[’‘`´']/g, '')
    .replace(/%/g, ' percent ')
    .replace(/\bper cent\b/g, 'percent')
    .replace(/(\d):(?=\d)/g, '$1 ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/[^a-z0-9. ]+/g, ' ');
  const out: string[] = [];
  for (const tok of t.split(/\s+/)) {
    if (!tok) continue;
    const ord = /^(\d{1,2})(st|nd|rd|th)$/.exec(tok);
    if (ord && +ord[1] >= 1 && +ord[1] <= 31) out.push(ordinalWords(+ord[1]));
    else if (tok === '00') continue;
    else if (/^0\d$/.test(tok)) out.push('oh', ONES[+tok[1]]);
    else if (/^\d{1,6}$/.test(tok)) out.push(numberWords(+tok));
    else if (/^\d*\.\d+$/.test(tok)) {
      const [whole, frac] = tok.split('.');
      if (whole) out.push(numberWords(+whole));
      out.push('point', ...[...frac].map((d) => ONES[+d]));
    } else out.push(tok.replace(/\./g, ' '));
  }
  return out
    .join(' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter((w) => w && w !== 'and')
    .join(' ');
}

/** Sequência de dígitos dita (mantém o ponto decimal): "$24.99" → "24.99", "24 99" → "2499", "7:45" → "745". */
function digitSignature(text: string): string {
  return (dropThousandCommas(text).match(/\d+(?:\.\d+)?/g) ?? []).join('');
}

function expectedSignatures(item: NumberItem): string[] {
  const sig = digitSignature(item.display);
  if (item.kind === 'price') return [sig, sig.replace('.', '')];
  if (item.kind === 'time') {
    const [h, m] = item.display.split(':');
    return m === '00' ? [h + m, `${h}.${m}`, h] : [h + m, `${h}.${m}`];
  }
  return [sig];
}

/**
 * Confere um número dito em voz alta. Aceita a forma por extenso ("thirty-seven percent")
 * e a saída em dígitos do reconhecimento de fala ("37%", "37 percent", "$24.99", "24 99", "745").
 */
export function checkNumber(item: NumberItem, said: string): boolean {
  const got = spokenForm(said);
  if (!got) return false;
  if (item.spoken.some((s) => spokenForm(s) === got)) return true;

  const sig = digitSignature(said);
  if (!sig) return false;
  const low = said.toLowerCase();
  // em dígitos, a unidade ainda precisa ter sido dita
  if (item.kind === 'percent' && !/%|per ?cent/.test(low)) return false;
  if (item.kind === 'date' && !low.includes(item.display.split(' ')[0].toLowerCase())) return false;
  return expectedSignatures(item).includes(sig);
}

/** Média de latências em milissegundos, devolvida em segundos com 1 casa decimal. */
export function meanLatency(ms: number[]): number {
  if (!ms.length) return 0;
  return Math.round(ms.reduce((a, b) => a + b, 0) / ms.length / 100) / 10;
}
