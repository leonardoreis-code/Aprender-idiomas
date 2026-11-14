/**
 * Detector de erros típicos de brasileiros ao produzir inglês (heurístico,
 * sem LLM). Alimenta o "Mapa de erros" do aluno e o contexto do professor IA.
 */
import { normalize } from '../practice/answer';

export interface ErrorCategory {
  id: string;
  title: string;
  /** Explicação curta em PT exibida no feedback. */
  explain: string;
}

export const ERROR_CATEGORIES: Record<string, ErrorCategory> = {
  'missing-subject': { id: 'missing-subject', title: 'Sujeito faltando', explain: 'Em inglês toda frase tem sujeito. "Está chovendo" → "It\'s raining".' },
  'do-support': { id: 'do-support', title: 'Do / does / did', explain: 'Perguntas e negativas no presente e passado precisam do auxiliar do/does/did.' },
  'third-person': { id: 'third-person', title: '-s da 3ª pessoa', explain: 'Com he, she e it o verbo ganha -s no presente: "she works".' },
  'past-tense': { id: 'past-tense', title: 'Tempo passado', explain: 'Ação terminada no passado: use o passado (worked, went, did).' },
  'perfect': { id: 'perfect', title: 'Present perfect', explain: '"Faz X tempo que…" vira "I have been … for X" / "I have … for X".' },
  'word-order': { id: 'word-order', title: 'Ordem das palavras', explain: 'Adjetivo antes do substantivo e advérbio de frequência antes do verbo.' },
  'article': { id: 'article', title: 'Artigos', explain: 'Confira a / an / the: o inglês usa artigo em lugares diferentes do português.' },
  'preposition': { id: 'preposition', title: 'Preposições', explain: 'in / on / at / to / for não batem 1-para-1 com o português.' },
  'there-is': { id: 'there-is', title: '"Tem" = there is', explain: '"Tem um bug" = "There is a bug", não "Have a bug".' },
  'missing-word': { id: 'missing-word', title: 'Palavra faltando', explain: 'Faltou uma parte da frase.' },
  'vocabulary': { id: 'vocabulary', title: 'Vocabulário', explain: 'Palavra diferente da esperada. Veja a forma natural.' },
};

const PRONOUN_START = /^(it|there|i|you|he|she|we|they)\b/;
const VERB_START = /^(is|are|was|were|has|have|will|can|does|do|did|be|seems?|looks?)\b/;
const IRREGULAR_PAST: Record<string, string> = {
  went: 'go', had: 'have', did: 'do', made: 'make', got: 'get', saw: 'see', said: 'say', took: 'take', came: 'come',
  knew: 'know', thought: 'think', told: 'tell', found: 'find', gave: 'give', left: 'leave', felt: 'feel', met: 'meet',
  wrote: 'write', ran: 'run', sent: 'send', built: 'build', spent: 'spend', paid: 'pay', bought: 'buy', began: 'begin',
};
const PREPS = new Set(['in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about']);
const ARTICLES = new Set(['a', 'an', 'the']);

/** Retorna categorias (ids) de erro detectadas entre a resposta e o alvo mais próximo. */
export function detectErrors(input: string, targets: string[]): string[] {
  const got = normalize(input);
  if (!got) return ['missing-word'];
  const target = closest(got, targets.map(normalize));
  if (got === target) return [];
  const g = got.split(' ');
  const t = target.split(' ');
  const gs = new Set(g);
  const out = new Set<string>();

  if (PRONOUN_START.test(target) && !PRONOUN_START.test(got) && VERB_START.test(got)) out.add('missing-subject');
  if (/^there (is|are|was|were)\b/.test(target) && /\b(have|has)\b/.test(got) && !gs.has('there')) out.add('there-is');
  if (t.some((w) => ['do', 'does', 'did', "don't", "doesn't", "didn't"].includes(w) || w === 'not') && !g.some((w) => ['do', 'does', 'did'].includes(w))) {
    if (t.some((w) => ['do', 'does', 'did'].includes(w))) out.add('do-support');
  }
  // 3ª pessoa: alvo tem "he/she/it X-s" e resposta tem o verbo sem -s
  for (let i = 0; i < t.length - 1; i++) {
    if (['he', 'she', 'it'].includes(t[i]) && /[^s]s$/.test(t[i + 1]) && gs.has(t[i + 1].replace(/e?s$/, ''))) out.add('third-person');
  }
  // passado
  for (const w of t) {
    const base = IRREGULAR_PAST[w] ?? (w.endsWith('ed') && w.length > 4 ? w.replace(/e?d$/, '') : null);
    if (base && !gs.has(w) && (gs.has(base) || gs.has(base + 'e'))) out.add('past-tense');
  }
  if ((t.includes('been') || (t.includes('have') && t.includes('for'))) && !g.includes('been') && !g.includes('have') && !g.includes("i've")) out.add('perfect');
  // ordem: mesmas palavras, ordem diferente
  if (g.length === t.length && [...g].sort().join() === [...t].sort().join()) out.add('word-order');
  // artigos e preposições divergentes
  const diff = (set: Set<string>) => {
    const a = g.filter((w) => set.has(w)).join();
    const b = t.filter((w) => set.has(w)).join();
    return a !== b;
  };
  if (!out.size && diff(ARTICLES)) out.add('article');
  if (!out.has('word-order') && diff(PREPS)) out.add('preposition');
  if (!out.size) out.add(g.length < t.length - 1 ? 'missing-word' : 'vocabulary');
  return [...out];
}

function closest(got: string, targets: string[]): string {
  let best = targets[0];
  let bestScore = -1;
  const gs = new Set(got.split(' '));
  for (const t of targets) {
    const ts = t.split(' ');
    const overlap = ts.filter((w) => gs.has(w)).length / Math.max(ts.length, gs.size);
    if (overlap > bestScore) {
      bestScore = overlap;
      best = t;
    }
  }
  return best;
}

/** Agrega contagens para o mapa de erros. */
export function errorProfile(lists: string[][]): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of lists) for (const id of l) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
}
