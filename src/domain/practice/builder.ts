import type { Item, Lesson, Sentence } from '../curriculum/types';
import type { Exercise } from './types';

/** PRNG determinístico (mulberry32) — builder testável (F-02). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function options(answer: string, pool: string[], rand: () => number, n = 4): string[] {
  const distractors = shuffle(
    [...new Set(pool.filter((p) => p.toLowerCase() !== answer.toLowerCase()))],
    rand,
  ).slice(0, n - 1);
  return shuffle([answer, ...distractors], rand);
}

const tokens = (s: string) => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);

function wordBank(s: Sentence, others: Sentence[], rand: () => number, key: string, itemIds: string[]): Exercise {
  const words = tokens(s.en);
  const own = new Set(words.map((w) => w.toLowerCase()));
  const extra = shuffle(
    others.flatMap((o) => tokens(o.en)).filter((w) => !own.has(w.toLowerCase())),
    rand,
  ).slice(0, Math.min(3, Math.max(2, Math.ceil(words.length / 2))));
  return {
    key,
    itemIds,
    type: 'word-bank',
    prompt: s.pt,
    bank: shuffle([...words, ...[...new Set(extra)]], rand),
    answer: words.join(' '),
    accepted: [s.en, ...(s.alt ?? [])],
  };
}

/** Itens do curso cujo texto aparece na frase — liga frases ao FSRS. */
export function itemsInSentence(s: Sentence, items: Item[]): string[] {
  const t = ` ${s.en.toLowerCase().replace(/[.,!?]/g, '')} `;
  return items.filter((i) => t.includes(` ${i.en.toLowerCase()} `)).map((i) => i.id);
}

/**
 * Sequência de uma lição: apresentação intercalada com recuperação imediata,
 * depois produção crescente (reconhecer → montar → digitar → falar).
 */
export function buildLesson(lesson: Lesson, pool: Item[], seed = 1): Exercise[] {
  const rand = rng(seed);
  const out: Exercise[] = [];
  const items = lesson.items;
  const enPool = [...items, ...pool].map((i) => i.en);
  let k = 0;
  const key = (t: string) => `${lesson.id}:${t}:${k++}`;

  items.forEach((item, idx) => {
    out.push({ key: key('intro'), itemIds: [item.id], type: 'intro', item });
    // Recupera o item anterior logo após apresentar o próximo (espaçamento curto).
    const prev = items[idx - 1];
    if (prev) {
      out.push(
        idx % 2 === 1
          ? { key: key('lc'), itemIds: [prev.id], type: 'listen-choose', audio: prev.en, options: options(prev.en, enPool, rand), answer: prev.en }
          : { key: key('pe'), itemIds: [prev.id], type: 'pt-to-en-choose', prompt: prev.pt, options: options(prev.en, enPool, rand), answer: prev.en },
      );
    }
  });
  const last = items[items.length - 1];
  out.push({ key: key('pe'), itemIds: [last.id], type: 'pt-to-en-choose', prompt: last.pt, options: options(last.en, enPool, rand), answer: last.en });

  if (lesson.sound) out.push({ key: key('snd'), itemIds: [], type: 'sound-intro', sound: lesson.sound });

  const pairItems = shuffle(items, rand).slice(0, 5);
  out.push({ key: key('mp'), itemIds: pairItems.map((i) => i.id), type: 'match-pairs', pairs: pairItems.map((i) => ({ en: i.en, pt: i.pt })) });

  const sentences = shuffle(lesson.sentences, rand);
  const [s1, s2, s3, s4] = [sentences[0], sentences[1] ?? sentences[0], sentences[2] ?? sentences[0], sentences[3] ?? sentences[1] ?? sentences[0]];
  const ids = (s: Sentence) => itemsInSentence(s, items);

  out.push(wordBank(s1, lesson.sentences, rand, key('wb'), ids(s1)));

  const gapped = lesson.sentences.find((s) => s.gap && s !== s1);
  if (gapped?.gap) {
    const [before, ...rest] = gapped.en.split(gapped.gap);
    out.push({
      key: key('fg'),
      itemIds: ids(gapped),
      type: 'fill-gap',
      before,
      after: rest.join(gapped.gap),
      answer: gapped.gap,
      options: options(gapped.gap, lesson.sentences.flatMap((s) => tokens(s.en)), rand, 3),
      pt: gapped.pt,
      full: gapped.en,
    });
  }

  out.push(wordBank(s2, lesson.sentences, rand, key('wb'), ids(s2)));
  out.push({ key: key('dc'), itemIds: ids(s3), type: 'dictation', audio: s3.en, accepted: [s3.en, ...(s3.alt ?? [])], pt: s3.pt });

  const chunk = items.find((i) => i.kind === 'chunk') ?? items[0];
  out.push({ key: key('sp'), itemIds: [chunk.id], type: 'speak', text: chunk.en, pt: chunk.pt, tip: chunk.tip });

  if (lesson.sound) {
    shuffle(lesson.sound.pairs, rand).forEach((pair) => {
      out.push({ key: key('mnp'), itemIds: [], type: 'minimal-pair', pair, target: rand() < 0.5 ? 'a' : 'b' });
    });
  }

  out.push({ key: key('sp'), itemIds: ids(s4), type: 'speak', text: s4.en, pt: s4.pt });
  return out;
}

/**
 * Revisão: um exercício por item vencido, tipos intercalados (interleaving) e
 * ordem embaralhada, priorizando produção para itens mais estáveis.
 */
export function buildReview(due: Item[], pool: Item[], seed = 7, max = 15): Exercise[] {
  const rand = rng(seed);
  const enPool = pool.map((i) => i.en);
  const kinds = ['listen-choose', 'pt-to-en-choose', 'dictation', 'speak'] as const;
  return shuffle(due, rand)
    .slice(0, max)
    .map((item, i): Exercise => {
      const type = kinds[(i + Math.floor(rand() * 4)) % kinds.length];
      const key = `review:${item.id}:${i}`;
      const base = { key, itemIds: [item.id] };
      switch (type) {
        case 'listen-choose':
          return { ...base, type, audio: item.en, options: options(item.en, enPool, rand), answer: item.en };
        case 'pt-to-en-choose':
          return { ...base, type, prompt: item.pt, options: options(item.en, enPool, rand), answer: item.en };
        case 'dictation':
          return { ...base, type, audio: item.en, accepted: [item.en], pt: item.pt };
        case 'speak':
          return { ...base, type, text: item.en, pt: item.pt, tip: item.tip };
      }
    });
}
