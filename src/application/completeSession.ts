import { addXp, dayKey, levelFor, unlockAchievements, type AchievementDef } from '../domain/motivation/motivation';
import { applySession, dueItemIds } from '../domain/srs/scheduler';
import type { AppState } from '../infra/storage';
import type { Attempt } from '../domain/practice/types';

/** Caso de uso: encerrar uma sessão (lição ou revisão) e atualizar todos os agregados. */

export interface SessionOutcome {
  state: AppState;
  goalJustMet: boolean;
  levelUp: number | null;
  achievements: AchievementDef[];
}

export interface SessionInput {
  kind: 'lesson' | 'review';
  lessonId?: string;
  attempts: Attempt[];
  xp: number;
  bestSpeech: number;
  /** Itens apresentados na lição (entram no FSRS mesmo sem tentativa direta). */
  introducedItemIds?: string[];
}

export function completeSession(prev: AppState, input: SessionInput, now = new Date()): SessionOutcome {
  // Itens só apresentados ganham um "Good" implícito via tentativa sintética.
  const touched = new Set(input.attempts.flatMap((a) => a.itemIds));
  const implicit: Attempt[] = (input.introducedItemIds ?? [])
    .filter((id) => !touched.has(id) && !prev.cards[id])
    .map((id) => ({ exerciseKey: `intro:${id}`, itemIds: [id], correct: true, hesitant: false, production: false, ms: 0 }));

  const cards = applySession(prev.cards, [...input.attempts, ...implicit], now);
  const lessonDone = input.kind === 'lesson' && input.lessonId;
  const perfect = input.attempts.length > 0 && input.attempts.every((a) => a.correct);

  const xpRes = addXp(prev.motivation, input.xp, dayKey(now));
  const lessonsDone = lessonDone && !prev.lessonsDone.includes(input.lessonId!) ? [...prev.lessonsDone, input.lessonId!] : prev.lessonsDone;
  const perfectList = lessonDone && perfect && !prev.perfect.includes(input.lessonId!) ? [...prev.perfect, input.lessonId!] : prev.perfect;
  const bestSpeech = Math.max(prev.bestSpeech, input.bestSpeech);

  const ach = unlockAchievements(xpRes.state, {
    lessonsDone: lessonsDone.length,
    itemsLearned: Object.keys(cards).length,
    perfectLesson: !!lessonDone && perfect,
    clearedReviews: input.kind === 'review' && dueItemIds(cards, now).length === 0,
    bestSpeech,
  });

  return {
    state: { ...prev, cards, lessonsDone, perfect: perfectList, bestSpeech, motivation: ach.state },
    goalJustMet: xpRes.goalJustMet,
    levelUp: xpRes.levelUp ? levelFor(ach.state.xpTotal).level : null,
    achievements: ach.unlocked,
  };
}
