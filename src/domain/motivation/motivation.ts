/** Motivation bounded context (F-07). Funções puras sobre um estado serializável. */

export interface MotivationState {
  xpTotal: number;
  /** XP por dia, chave YYYY-MM-DD (fuso local). */
  xpByDay: Record<string, number>;
  dailyGoal: number;
  streak: number;
  bestStreak: number;
  /** Último dia em que a meta foi batida. */
  lastGoalDay: string | null;
  freezes: number;
  achievements: string[];
}

export const initialMotivation = (): MotivationState => ({
  xpTotal: 0,
  xpByDay: {},
  dailyGoal: 50,
  streak: 0,
  bestStreak: 0,
  lastGoalDay: null,
  freezes: 0,
  achievements: [],
});

export const BASE_XP = 10;
export const MAX_COMBO_BONUS = 10;

export function xpForAnswer(combo: number): number {
  return BASE_XP + Math.min(Math.max(combo - 1, 0) * 2, MAX_COMBO_BONUS);
}

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/**
 * Ao abrir o app: se dias foram perdidos, consome freezes; sem freezes, streak zera.
 * Gentil por design (evita "streak anxiety").
 */
export function reconcileStreak(s: MotivationState, today = dayKey()): MotivationState & { usedFreezes: number } {
  if (!s.lastGoalDay || s.streak === 0) return { ...s, usedFreezes: 0 };
  const missed = daysBetween(s.lastGoalDay, today) - 1;
  if (missed <= 0) return { ...s, usedFreezes: 0 };
  if (missed <= s.freezes) {
    // Freeze preenche os dias perdidos; streak continua (não cresce).
    const yesterday = new Date(today + 'T12:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    return { ...s, freezes: s.freezes - missed, lastGoalDay: dayKey(yesterday), usedFreezes: missed };
  }
  return { ...s, streak: 0, usedFreezes: 0 };
}

export interface XpResult {
  state: MotivationState;
  goalJustMet: boolean;
  levelUp: boolean;
  newAchievements: string[];
}

export function addXp(s: MotivationState, xp: number, today = dayKey()): XpResult {
  const before = s.xpByDay[today] ?? 0;
  const after = before + xp;
  const levelBefore = levelFor(s.xpTotal).level;
  let next: MotivationState = { ...s, xpTotal: s.xpTotal + xp, xpByDay: { ...s.xpByDay, [today]: after } };
  const goalJustMet = before < s.dailyGoal && after >= s.dailyGoal;
  if (goalJustMet && next.lastGoalDay !== today) {
    // a aba pode ter ficado aberta: reconcilia antes de somar (dias perdidos zeram ou gastam proteção)
    const { usedFreezes: _u, ...rec } = reconcileStreak(next, today);
    next = { ...next, ...rec };
    const streak = next.streak + 1;
    const earnedFreeze = streak % 7 === 0 ? 1 : 0;
    next = {
      ...next,
      streak,
      bestStreak: Math.max(next.bestStreak, streak),
      lastGoalDay: today,
      freezes: Math.min(2, next.freezes + earnedFreeze),
    };
  }
  return { state: next, goalJustMet, levelUp: levelFor(next.xpTotal).level > levelBefore, newAchievements: [] };
}

/** XP acumulado necessário para atingir o nível n (n ≥ 1). */
export const xpToReach = (n: number) => Math.round(50 * Math.pow(n - 1, 1.5));

export function levelFor(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (xp >= xpToReach(level + 1)) level++;
  const floor = xpToReach(level);
  return { level, into: xp - floor, span: xpToReach(level + 1) - floor };
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-lesson', title: 'Primeira estação', description: 'Concluiu a primeira lição.' },
  { id: 'streak-7', title: 'Uma semana nos trilhos', description: '7 dias seguidos batendo a meta.' },
  { id: 'items-50', title: 'Vocabulário em expansão', description: '50 itens aprendidos.' },
  { id: 'perfect', title: 'Sem tropeços', description: 'Uma lição inteira sem erros.' },
  { id: 'clear-reviews', title: 'Caixa zerada', description: 'Zerou as revisões do dia.' },
  { id: 'mic-90', title: 'Voz clara', description: 'Tirou 90+ num exercício de fala.' },
];

export interface AchievementContext {
  lessonsDone: number;
  itemsLearned: number;
  perfectLesson: boolean;
  clearedReviews: boolean;
  bestSpeech: number;
}

export function unlockAchievements(s: MotivationState, ctx: AchievementContext): { state: MotivationState; unlocked: AchievementDef[] } {
  const rules: Record<string, boolean> = {
    'first-lesson': ctx.lessonsDone >= 1,
    'streak-7': s.streak >= 7,
    'items-50': ctx.itemsLearned >= 50,
    perfect: ctx.perfectLesson,
    'clear-reviews': ctx.clearedReviews,
    'mic-90': ctx.bestSpeech >= 90,
  };
  const unlocked = ACHIEVEMENTS.filter((a) => rules[a.id] && !s.achievements.includes(a.id));
  return { state: { ...s, achievements: [...s.achievements, ...unlocked.map((a) => a.id)] }, unlocked };
}
