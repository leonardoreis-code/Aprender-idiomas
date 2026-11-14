/**
 * Production bounded context — "Pense em inglês".
 *
 * Cada frase (Drill) sobe por uma ESCADA de produção, do mais apoiado ao mais
 * automático. O objetivo é tirar a tradução palavra a palavra da cabeça:
 *   0 build  → montar com blocos (vê o português dividido em blocos de sentido)
 *   1 chunks → produzir bloco a bloco, depois a frase inteira
 *   2 type   → escrever a frase inteira sem apoio
 *   3 speak  → falar a frase inteira
 *   4 flash  → falar em tempo limitado (automaticidade)
 * Acertou sem ajuda → sobe; errou → desce um degrau. FSRS decide QUANDO volta.
 */
import type { Card } from 'ts-fsrs';
import type { Drill } from '../curriculum/speaking';
import { review, type CardMap } from '../srs/scheduler';
import { Rating } from 'ts-fsrs';

export type Stage = 0 | 1 | 2 | 3 | 4;
export const STAGES: { id: Stage; key: 'build' | 'chunks' | 'type' | 'speak' | 'flash'; label: string; desc: string }[] = [
  { id: 0, key: 'build', label: 'Montar', desc: 'Junte os blocos na ordem do inglês' },
  { id: 1, key: 'chunks', label: 'Blocos', desc: 'Traduza bloco a bloco' },
  { id: 2, key: 'type', label: 'Escrever', desc: 'Escreva a frase inteira' },
  { id: 3, key: 'speak', label: 'Falar', desc: 'Diga a frase em voz alta' },
  { id: 4, key: 'flash', label: 'Relâmpago', desc: 'Fale antes do tempo acabar' },
];

export interface DrillProgress {
  stage: Stage;
  card?: Card;
  /** Quantas vezes acertou no estágio máximo. */
  mastered: number;
  /** Histórico curto de categorias de erro (ver errors.ts). */
  lastErrors: string[];
}

export type ProductionState = Record<string, DrillProgress>;

export interface ProductionAttempt {
  drillId: string;
  stage: Stage;
  correct: boolean;
  hesitant: boolean;
  ms: number;
  errors: string[];
}

/** Tempo-limite do modo relâmpago: cresce com o tamanho da frase. */
export function flashLimitMs(en: string): number {
  const words = en.split(/\s+/).length;
  return Math.round(2500 + words * 650);
}

export function nextStage(cur: Stage, a: Pick<ProductionAttempt, 'correct' | 'hesitant'>): Stage {
  if (!a.correct) return Math.max(0, cur - 1) as Stage;
  if (a.hesitant) return cur;
  return Math.min(4, cur + 1) as Stage;
}

export function gradeProduction(a: Pick<ProductionAttempt, 'correct' | 'hesitant' | 'stage'>) {
  if (!a.correct) return Rating.Again;
  if (a.hesitant) return Rating.Hard;
  return a.stage >= 3 ? Rating.Easy : Rating.Good;
}

export function applyProduction(state: ProductionState, attempts: ProductionAttempt[], now = new Date()): ProductionState {
  let next = { ...state };
  // agrega por drill: estágio evolui a cada tentativa; FSRS recebe a pior nota
  const byDrill = new Map<string, ProductionAttempt[]>();
  for (const a of attempts) byDrill.set(a.drillId, [...(byDrill.get(a.drillId) ?? []), a]);
  for (const [id, list] of byDrill) {
    const prev = next[id] ?? { stage: 0 as Stage, mastered: 0, lastErrors: [] };
    let stage = prev.stage;
    let mastered = prev.mastered;
    for (const a of list) {
      if (a.correct && !a.hesitant && a.stage === 4) mastered++;
      stage = nextStage(stage, a);
    }
    const worst = Math.min(...list.map(gradeProduction));
    const cards: CardMap = prev.card ? { [id]: prev.card } : {};
    const card = review(cards, id, worst as never, now)[id];
    const errs = list.flatMap((a) => a.errors);
    next = { ...next, [id]: { stage, mastered, card, lastErrors: [...errs, ...prev.lastErrors].slice(0, 6) } };
  }
  return next;
}

export interface QueueItem {
  drill: Drill;
  stage: Stage;
  reason: 'new' | 'due' | 'weak';
}

/**
 * Fila personalizada: vencidos primeiro, depois os que mais erram (fraquezas),
 * depois novos da aula atual. Intercala aulas diferentes (interleaving).
 */
export function buildProductionQueue(
  drills: Drill[],
  state: ProductionState,
  opts: { max?: number; newLimit?: number; now?: Date; focusIds?: string[] } = {},
): QueueItem[] {
  const now = opts.now ?? new Date();
  const max = opts.max ?? 12;
  const newLimit = opts.newLimit ?? 6;
  const due: QueueItem[] = [];
  const weak: QueueItem[] = [];
  const fresh: QueueItem[] = [];
  const focus = opts.focusIds ? new Set(opts.focusIds) : null;
  for (const d of drills) {
    const p = state[d.id];
    if (!p) {
      if (!focus || focus.has(d.id)) fresh.push({ drill: d, stage: 0, reason: 'new' });
      continue;
    }
    if (p.card && new Date(p.card.due).getTime() <= now.getTime()) due.push({ drill: d, stage: p.stage, reason: 'due' });
    else if (p.lastErrors.length >= 2 && p.stage < 3) weak.push({ drill: d, stage: p.stage, reason: 'weak' });
  }
  due.sort((a, b) => new Date(state[a.drill.id].card!.due).getTime() - new Date(state[b.drill.id].card!.due).getTime());
  const picked = [...due, ...weak].slice(0, max - Math.min(newLimit, fresh.length));
  const out = [...picked, ...fresh.slice(0, Math.max(0, max - picked.length)).slice(0, newLimit)];
  // intercala: evita duas frases seguidas da mesma aula quando possível
  return interleave(out, (q) => q.drill.id.replace(/-d\d+$/, ''));
}

export function interleave<T>(items: T[], group: (t: T) => string): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) buckets.set(group(it), [...(buckets.get(group(it)) ?? []), it]);
  const out: T[] = [];
  while (out.length < items.length) {
    for (const [, b] of buckets) if (b.length) out.push(b.shift()!);
  }
  return out;
}

export function dueDrillCount(state: ProductionState, now = new Date()): number {
  return Object.values(state).filter((p) => p.card && new Date(p.card.due).getTime() <= now.getTime()).length;
}
