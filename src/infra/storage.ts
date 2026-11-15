import type { CardMap } from '../domain/srs/scheduler';
import { initialMotivation, type MotivationState } from '../domain/motivation/motivation';
import type { ProductionState } from '../domain/production/ladder';
import type { QuestDay } from '../domain/motivation/quests';
import type { CheckpointResult } from '../domain/assessment/checkpoint';
import type { Daily } from '../domain/progress/daily';
import type { Drill } from '../domain/curriculum/speaking';
import type { RepairRecord } from '../domain/coach/mediation';
import { DEFAULT_CONTEXT, type SimContext } from '../domain/sim/engine';

export type LearnerLevel = 'zero' | 'fala' | 'avancado';
export type Goal = 'trabalho' | 'entrevista' | 'viagem' | 'dia-a-dia';

export interface Profile {
  name: string;
  level: LearnerLevel;
  goals: Goal[];
  minutes: number;
}

export interface LessonProgress {
  video?: boolean;
  article?: boolean;
  practice?: boolean;
  teacher?: boolean;
}

/** Persistence (F-09). Estado único versionado; falhas de storage nunca quebram o app. */

export interface Settings {
  sound: boolean;
  fontScale: 1 | 1.15 | 1.3;
  highContrast: boolean;
  theme: 'auto' | 'light' | 'dark';
  /** false = pular exercícios de fala automaticamente. */
  microphone: boolean;
  slowAudio: boolean;
}

export interface AppState {
  version: 1;
  cards: CardMap;
  lessonsDone: string[];
  /** Lições concluídas sem erro. */
  perfect: string[];
  bestSpeech: number;
  motivation: MotivationState;
  settings: Settings;
  onboarded: boolean;
  /* ---- v2 ---- */
  profile: Profile;
  production: ProductionState;
  lessons: Record<string, LessonProgress>;
  storiesDone: string[];
  videosDone: string[];
  gems: number;
  quests: QuestDay;
  /** Últimas listas de categorias de erro (mapa de erros). */
  errorLog: string[][];
  /** Contagem por regra de sotaque. */
  accentLog: Record<string, number>;
  teacherSeconds: number;
  /** Frases que o aluno salvou para treinar ("Meu caderno"). */
  notebook: { en: string; pt: string; at: number }[];
  /** Itens comprados na loja. */
  purchases: string[];
  /* ---- v3: prova de aprendizado ---- */
  plan: { startDay: string | null };
  checkpoints: CheckpointResult[];
  daily: Daily;
  /** Frases do próprio aluno ("Minhas frases"). */
  custom: Drill[];
  /** Treinador ao vivo: histórico de consertos (degrau de ajuda necessário). */
  repairs: RepairRecord[];
  coach: { liveMarks: boolean; echoBest: number };
  /** Simulações do dia a dia. */
  sim: {
    context: SimContext;
    today: { day: string; tags: string[] };
    handsFree: boolean;
    results: Record<string, { stars: number; plays: number; at: number }>;
  };
}

const KEY = 'fluente:v1';

export const defaultState = (): AppState => ({
  version: 1,
  cards: {},
  lessonsDone: [],
  perfect: [],
  bestSpeech: 0,
  motivation: initialMotivation(),
  settings: { sound: true, fontScale: 1, highContrast: false, theme: 'auto', microphone: true, slowAudio: false },
  onboarded: false,
  profile: { name: '', level: 'fala', goals: ['trabalho'], minutes: 15 },
  production: {},
  lessons: {},
  storiesDone: [],
  videosDone: [],
  gems: 0,
  quests: { day: '', progress: {}, claimed: [] },
  errorLog: [],
  accentLog: {},
  teacherSeconds: 0,
  notebook: [],
  purchases: [],
  plan: { startDay: null },
  checkpoints: [],
  daily: {},
  custom: [],
  repairs: [],
  coach: { liveMarks: true, echoBest: 0 },
  sim: { context: { ...DEFAULT_CONTEXT }, today: { day: '', tags: [] }, handsFree: false, results: {} },
});

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      motivation: { ...base.motivation, ...parsed.motivation },
      settings: { ...base.settings, ...parsed.settings },
      profile: { ...base.profile, ...parsed.profile },
      plan: { ...base.plan, ...parsed.plan },
      coach: { ...base.coach, ...parsed.coach },
      sim: { ...base.sim, ...parsed.sim, context: { ...base.sim.context, ...parsed.sim?.context } },
      version: 1,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* modo privado / cota cheia: segue em memória */
  }
}

export function resetState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
