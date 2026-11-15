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
  /** Palavras da frase-alvo (para segundos por palavra). */
  words?: number;
  /** Duração da fala gravada, se a resposta foi falada. */
  spokenMs?: number;
  /** A frase estava vencida (revisão) — base da retenção real. */
  due?: boolean;
}

/** Tempo-limite do modo relâmpago: cresce com o tamanho da frase. */
export function flashLimitMs(en: string): number {
  const words = en.split(/\s+/).length;
  return Math.round(2500 + words * 650);
}

/**
 * Degrau de entrada de uma frase nova. Quem entende inglês não precisa montar blocos:
 * o gargalo é PRODUZIR, então começa escrevendo (fala) ou já falando (avançado).
 */
export function startStageFor(level: 'zero' | 'fala' | 'avancado'): Stage {
  return level === 'zero' ? 0 : level === 'fala' ? 2 : 3;
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
      // o degrau que vale é o que foi apresentado (a frase nova pode entrar acima do 0)
      stage = nextStage(a.stage ?? stage, a);
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
  opts: { max?: number; newLimit?: number; now?: Date; focusIds?: string[]; startStage?: Stage } = {},
): QueueItem[] {
  const startStage = opts.startStage ?? 0;
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
      if (!focus || focus.has(d.id)) fresh.push({ drill: d, stage: startStage, reason: 'new' });
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

/**
 * Treino dos meus erros: frases das aulas ligadas às categorias em que o aluno
 * mais erra. Prioriza frases já erradas e os degraus mais baixos.
 */
export function buildErrorQueue(drills: Drill[], state: ProductionState, max = 12, startStage: Stage = 0): QueueItem[] {
  const scored = drills.map((d) => {
    const p = state[d.id];
    return { d, stage: (p?.stage ?? startStage) as Stage, score: (p?.lastErrors.length ?? 0) * 10 - (p?.stage ?? 0) * 2 + (p ? 1 : 0) };
  });
  scored.sort((a, b) => b.score - a.score);
  return interleave(
    scored.slice(0, max).map((x) => ({ drill: x.d, stage: x.stage, reason: 'weak' as const })),
    (q) => q.drill.id.replace(/-d\d+$/, ''),
  );
}

/** Acerto na primeira tentativa de cada frase da sessão (0–1). */
export function firstTryAccuracy(attempts: ProductionAttempt[]): number {
  const first = new Map<string, boolean>();
  for (const a of attempts) if (!first.has(a.drillId)) first.set(a.drillId, a.correct);
  return first.size ? [...first.values()].filter(Boolean).length / first.size : 0;
}
