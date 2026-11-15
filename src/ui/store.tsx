import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addXp as addXpDomain, dayKey, reconcileStreak, unlockAchievements, type AchievementDef } from '../domain/motivation/motivation';
import { bump, claimable, type QuestMetric } from '../domain/motivation/quests';
import { applyProduction, type ProductionAttempt } from '../domain/production/ladder';
import { loadState, saveState, type AppState } from '../infra/storage';
import { addDay, type DayStats } from '../domain/progress/daily';
import { addErrors as addToBank } from '../domain/coach/errorBank';
import type { Issue } from '../domain/coach/mediation';
import { mutedFrom, setMutedRules } from '../domain/coach/spotter';
import { setSfxEnabled } from '../infra/sfx';

/** Store da aplicação: um único estado persistido + casos de uso que o alteram. */
interface Store {
  state: AppState;
  set: (fn: (s: AppState) => AppState) => void;
  /** XP + meta diária + streak. Retorna se bateu a meta agora. */
  gainXp: (xp: number) => { goalJustMet: boolean; levelUp: boolean };
  track: (metric: QuestMetric, by?: number) => void;
  recordProduction: (attempts: ProductionAttempt[]) => void;
  recordAccent: (rules: string[]) => void;
  /** Soma medidas do dia (segundos falando, Maya, fala livre…). */
  logDay: (patch: Partial<DayStats>) => void;
  /** Guarda erros reais da fala no banco pessoal (voltam com repetição espaçada). */
  bankErrors: (issues: Issue[], utterance: string) => void;
  /** "Não era erro": depois de 2 avisos a regra para de marcar para este aluno. */
  reportFp: (rule: string) => void;
  toast: (t: Toast) => void;
  toasts: Toast[];
}

export interface Toast {
  id?: number;
  title: string;
  body?: string;
  kind?: 'xp' | 'quest' | 'achievement' | 'info';
}

const Ctx = createContext<Store | null>(null);
let themeApplied = false;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const s = loadState();
    const { usedFreezes: _u, ...motivation } = reconcileStreak(s.motivation);
    return { ...s, motivation };
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    saveState(state);
  }, [state]);
  useEffect(() => {
    const root = document.documentElement;
    const s = state.settings;
    root.style.setProperty('--scale', String(s.fontScale));
    // 'auto' não mexe no atributo: num artefato quem define o tema é o claude.ai
    if (s.theme !== 'auto') {
      root.setAttribute('data-theme', s.theme);
      themeApplied = true;
    } else if (themeApplied) {
      root.removeAttribute('data-theme');
      themeApplied = false;
    }
    if (s.highContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    setSfxEnabled(s.sound);
  }, [state.settings]);

  // regras silenciadas pelo aluno valem para todo o app
  const mutedKey = mutedFrom(state.fp).join(',');
  setMutedRules(mutedKey ? mutedKey.split(',') : []);

  const toast = useCallback((t: Toast) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3800);
  }, []);

  const set = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const checkAchievements = useCallback(
    (s: AppState): { state: AppState; unlocked: AchievementDef[] } => {
      const r = unlockAchievements(s.motivation, {
        lessonsDone: s.lessonsDone.length + Object.values(s.lessons).filter((l) => l.practice).length,
        itemsLearned: Object.keys(s.cards).length + Object.keys(s.production).length,
        perfectLesson: s.perfect.length > 0,
        clearedReviews: false,
        bestSpeech: s.bestSpeech,
      });
      return { state: { ...s, motivation: r.state }, unlocked: r.unlocked };
    },
    [],
  );

  const gainXp = useCallback(
    (xp: number) => {
      // calcula a partir do estado mais recente (evita sobrescrever atualizações na fila)
      const r = addXpDomain(ref.current.motivation, xp, dayKey());
      let unlocked: AchievementDef[] = [];
      setState((s) => {
        const res = addXpDomain(s.motivation, xp, dayKey());
        const ach = checkAchievements({ ...s, motivation: res.state });
        unlocked = ach.unlocked;
        return ach.state;
      });
      queueMicrotask(() => {
        if (r.goalJustMet) toast({ title: 'Meta do dia batida!', body: `Sequência: ${r.state.streak} dia(s)`, kind: 'quest' });
        unlocked.forEach((a) => toast({ title: a.title, body: a.description, kind: 'achievement' }));
      });
      return { goalJustMet: r.goalJustMet, levelUp: r.levelUp };
    },
    [checkAchievements, toast],
  );

  const toasted = useRef(new Set<string>());
  const track = useCallback(
    (metric: QuestMetric, by = 1) => {
      const day = dayKey();
      let ready: ReturnType<typeof claimable> = [];
      setState((s) => {
        const quests = bump(s.quests, day, metric, by);
        ready = claimable(quests, day);
        // resgate automático: missão completa vira gemas na hora (recompensa imediata)
        const gems = ready.reduce((a, q) => a + q.gems, 0);
        return { ...s, quests: { ...quests, claimed: [...quests.claimed, ...ready.map((q) => q.id)] }, gems: s.gems + gems };
      });
      queueMicrotask(() =>
        ready.forEach((q) => {
          const k = `${day}:${q.id}`;
          if (toasted.current.has(k)) return;
          toasted.current.add(k);
          toast({ title: 'Missão completa', body: `${q.title} · +${q.gems} gemas`, kind: 'quest' });
        }),
      );
    },
    [toast],
  );

  const recordProduction = useCallback((attempts: ProductionAttempt[]) => {
    setState((s) => {
      const production = applyProduction(s.production, attempts);
      // primeira tentativa de cada frase: é ela que mede retenção
      const first = new Map<string, ProductionAttempt>();
      for (const a of attempts) if (!first.has(a.drillId)) first.set(a.drillId, a);
      const firsts = [...first.values()];
      const spokenOk = attempts.filter((a) => a.spokenMs && a.correct && a.words);
      const patch: Partial<DayStats> = {
        produced: attempts.length,
        correct: attempts.filter((a) => a.correct).length,
        spoken: attempts.filter((a) => a.spokenMs).length,
        spokenSec: attempts.reduce((x, a) => x + (a.spokenMs ?? 0), 0) / 1000,
        due: firsts.filter((a) => a.due).length,
        dueOk: firsts.filter((a) => a.due && a.correct).length,
        spwSum: spokenOk.reduce((x, a) => x + a.ms / 1000 / a.words!, 0),
        spwN: spokenOk.length,
        auto: Object.values(production).filter((p) => p.stage >= 3).length,
      };
      return {
        ...s,
        production,
        errorLog: [...attempts.filter((a) => a.errors.length).map((a) => a.errors), ...s.errorLog].slice(0, 300),
        daily: addDay(s.daily, dayKey(), patch),
      };
    });
  }, []);

  const bankErrors = useCallback((issues: Issue[], utterance: string) => {
    if (issues.length) setState((s) => ({ ...s, errorBank: addToBank(s.errorBank, issues, utterance) }));
  }, []);

  const reportFp = useCallback(
    (rule: string) => {
      if (rule.startsWith('ai:')) return;
      setState((s) => ({ ...s, fp: { ...s.fp, [rule]: (s.fp[rule] ?? 0) + 1 }, errorBank: s.errorBank.filter((c) => c.rule !== rule || !!c.card) }));
      toast({ title: 'Anotado', body: 'Com 2 avisos, essa regra para de marcar para você.', kind: 'info' });
    },
    [toast],
  );

  const logDay = useCallback((patch: Partial<DayStats>) => {
    setState((s) => ({ ...s, daily: addDay(s.daily, dayKey(), patch) }));
  }, []);

  const recordAccent = useCallback((rules: string[]) => {
    setState((s) => {
      const log = { ...s.accentLog };
      for (const r of rules) log[r] = (log[r] ?? 0) + 1;
      return { ...s, accentLog: log };
    });
  }, []);

  const value = useMemo(
    () => ({ state, set, gainXp, track, recordProduction, recordAccent, logDay, bankErrors, reportFp, toast, toasts }),
    [state, set, gainXp, track, recordProduction, recordAccent, logDay, bankErrors, reportFp, toast, toasts],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider ausente');
  return s;
}

/** Contexto que vai para o professor IA: quem é o aluno e onde ele erra. */
export function teacherContext(s: AppState, extra = ''): string {
  const counts = new Map<string, number>();
  for (const l of s.errorLog.slice(0, 80)) for (const e of l) counts.set(e, (counts.get(e) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${n}x)`);
  const accent = Object.entries(s.accentLog).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const level = { zero: 'A1 beginner (keep it very simple, more Portuguese support allowed)', fala: 'A2-B1: understands well, struggles to build and say sentences', avancado: 'B1-B2: speaks, needs fluency and precision' }[s.profile.level];
  return [
    `Student name: ${s.profile.name || 'not given'}.`,
    `Level: ${level}.`,
    `Goals: ${s.profile.goals.join(', ')}.`,
    top.length ? `Recurring grammar mistakes detected by the app: ${top.join(', ')}. Watch for these and correct them.` : '',
    accent.length ? `Pronunciation issues detected: ${accent.join(', ')}.` : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
