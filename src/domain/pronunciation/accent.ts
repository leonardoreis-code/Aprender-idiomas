/**
 * Análise de sotaque PT-BR: alinha o que você QUIS dizer com o que a máquina
 * OUVIU (Web Speech ou ElevenLabs Scribe) e classifica cada troca num padrão
 * conhecido de interferência do português. Mede inteligibilidade, não "sotaque nativo".
 */
import { levenshtein, normalize } from '../practice/answer';

export interface AccentRule {
  id: string;
  title: string;
  howTo: string;
}

export const ACCENT_RULES: Record<string, AccentRule> = {
  th: { id: 'th', title: 'TH /θ ð/', howTo: 'Ponta da língua entre os dentes e sopre. Não troque por T, D, F ou S.' },
  'final-vowel': { id: 'final-vowel', title: '"i" no final da palavra', howTo: 'Termine seco na consoante: "big", não "bigui".' },
  'short-long-i': { id: 'short-long-i', title: '/ɪ/ curto × /iː/ longo', howTo: 'ship (curto, relaxado) × sheep (longo, sorrindo).' },
  'ae-e': { id: 'ae-e', title: '/æ/ aberto × /ɛ/', howTo: 'bad: boca bem aberta. bed: como o "é" do português.' },
  'h-r': { id: 'h-r', title: 'H × R inicial', howTo: 'R inglês não é o "rr" do português: "red" com a língua curvada, sem tocar.' },
  ed: { id: 'ed', title: 'Final -ed', howTo: 'worked = /t/, played = /d/, só wanted/needed têm sílaba extra /ɪd/.' },
  'final-consonant': { id: 'final-consonant', title: 'Consoante final engolida', howTo: 'Pronuncie a última consoante: "want", "first", "asked".' },
  stress: { id: 'stress', title: 'Sílaba tônica', howTo: 'Ouça de novo e marque a sílaba forte (deVELop, not develOP).' },
  'v-w': { id: 'v-w', title: 'V × W', howTo: 'V com os dentes no lábio; W com os lábios em bico ("uó").' },
};

const SHORT_LONG: [string, string][] = [['ship', 'sheep'], ['it', 'eat'], ['live', 'leave'], ['sit', 'seat'], ['fill', 'feel'], ['hit', 'heat'], ['bit', 'beat'], ['still', 'steal'], ['will', 'wheel']];
const AE_E: [string, string][] = [['bad', 'bed'], ['man', 'men'], ['sad', 'said'], ['pan', 'pen'], ['had', 'head'], ['bat', 'bet']];

export interface WordResult {
  word: string;
  heard?: string;
  ok: boolean;
  rule?: string;
}

export interface AccentReport {
  score: number;
  words: WordResult[];
  rules: { id: string; words: string[] }[];
}

/** Classifica a troca target→heard num padrão de interferência PT-BR. */
export function classify(target: string, heard: string | undefined): string | undefined {
  if (!heard) return /(ed|t|d|k|g|p|b)$/.test(target) ? (target.endsWith('ed') ? 'ed' : 'final-consonant') : undefined;
  if (target.includes('th') && !heard.includes('th')) return 'th';
  if (heard.startsWith(target) && /^(y|ee|i|e|ie)$/.test(heard.slice(target.length))) return 'final-vowel';
  for (const [a, b] of SHORT_LONG) if ((target === a && heard === b) || (target === b && heard === a)) return 'short-long-i';
  for (const [a, b] of AE_E) if ((target === a && heard === b) || (target === b && heard === a)) return 'ae-e';
  if (target.endsWith('ed') && heard === target.replace(/ed$/, '')) return 'ed';
  if (heard === target.slice(0, -1) || heard === target.slice(0, -2)) return 'final-consonant';
  if ((target[0] === 'r' && heard[0] === 'h') || (target[0] === 'h' && heard[0] === 'r') || (target[0] === 'h' && heard === target.slice(1))) return 'h-r';
  if ((target[0] === 'v' && heard[0] === 'w') || (target[0] === 'w' && heard[0] === 'v')) return 'v-w';
  return levenshtein(target, heard) <= 2 ? 'stress' : undefined;
}

/** Alinhamento palavra a palavra (DP) entre alvo e ouvido. */
export function analyzeAccent(target: string, heardText: string): AccentReport {
  const t = normalize(target).split(' ').filter(Boolean);
  const h = normalize(heardText).split(' ').filter(Boolean);
  const n = t.length;
  const m = h.length;
  const cost = (a: string, b: string) => (a === b ? 0 : levenshtein(a, b) <= Math.max(1, Math.floor(a.length / 3)) ? 0.6 : 1);
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost(t[i - 1], h[j - 1]));
  const words: WordResult[] = [];
  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0 && d[i][j] === d[i - 1][j - 1] + cost(t[i - 1], h[j - 1])) {
      const ok = t[i - 1] === h[j - 1];
      words.unshift({ word: t[i - 1], heard: h[j - 1], ok, rule: ok ? undefined : classify(t[i - 1], h[j - 1]) });
      i--;
      j--;
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
      // palavra extra ouvida: possível vogal epentética ("bigui" → "big e")
      if (words[0] && /^(e|i|ee|y)$/.test(h[j - 1])) words[0] = { ...words[0], ok: false, rule: 'final-vowel' };
      j--;
    } else {
      words.unshift({ word: t[i - 1], ok: false, rule: classify(t[i - 1], undefined) });
      i--;
    }
  }
  const okCount = words.filter((w) => w.ok).length;
  const ruleMap = new Map<string, string[]>();
  for (const w of words) if (w.rule) ruleMap.set(w.rule, [...(ruleMap.get(w.rule) ?? []), w.word]);
  return {
    score: n ? Math.round((okCount / n) * 100) : 0,
    words,
    rules: [...ruleMap.entries()].map(([id, ws]) => ({ id, words: ws })),
  };
}
