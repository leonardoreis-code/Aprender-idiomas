import type { CardMap } from '../domain/srs/scheduler';
import { initialMotivation, type MotivationState } from '../domain/motivation/motivation';
import type { ProductionState } from '../domain/production/ladder';
import type { QuestDay } from '../domain/motivation/quests';

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
