import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { Attempt } from '../practice/types';

/** Memory bounded context — adaptador fino sobre FSRS (F-04). */

export type CardMap = Record<string, Card>;

const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365 }));

/** Converte desempenho observado em nota FSRS — o usuário não precisa autoavaliar. */
export function gradeFromAttempt(a: Pick<Attempt, 'correct' | 'hesitant' | 'production' | 'ms'>): Grade {
  if (!a.correct) return Rating.Again;
  if (a.hesitant) return Rating.Hard;
  if (a.production && a.ms < 6000) return Rating.Easy;
  return Rating.Good;
}

/** Agrega várias tentativas do mesmo item numa sessão: vale a pior. */
export function worstGrade(grades: Grade[]): Grade {
  return Math.min(...grades) as Grade;
}

export function review(cards: CardMap, itemId: string, grade: Grade, now = new Date()): CardMap {
  const card = cards[itemId] ? reviveCard(cards[itemId]) : createEmptyCard(now);
  const { card: next } = scheduler.next(card, now, grade);
  return { ...cards, [itemId]: next };
}

export function applySession(cards: CardMap, attempts: Attempt[], now = new Date()): CardMap {
  const byItem = new Map<string, Grade[]>();
  for (const a of attempts) {
    for (const id of a.itemIds) byItem.set(id, [...(byItem.get(id) ?? []), gradeFromAttempt(a)]);
  }
  let next = cards;
  for (const [id, grades] of byItem) next = review(next, id, worstGrade(grades), now);
  return next;
}

export function dueItemIds(cards: CardMap, now = new Date()): string[] {
  return Object.entries(cards)
    .filter(([, c]) => new Date(c.due).getTime() <= now.getTime())
    .sort(([, a], [, b]) => new Date(a.due).getTime() - new Date(b.due).getTime())
    .map(([id]) => id);
}

/** Itens com estabilidade ≥ 21 dias contam como "dominados". */
export function masteredCount(cards: CardMap): number {
  return Object.values(cards).filter((c) => c.state === State.Review && c.stability >= 21).length;
}

/** JSON.parse devolve datas como string — reidrata. */
export function reviveCard(c: Card): Card {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

export { Rating };
