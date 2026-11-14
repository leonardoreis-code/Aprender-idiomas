import type { CardMap } from '../domain/srs/scheduler';
import { initialMotivation, type MotivationState } from '../domain/motivation/motivation';

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
