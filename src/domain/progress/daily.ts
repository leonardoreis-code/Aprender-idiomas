/**
 * Estatísticas diárias — evidência contínua entre um checkpoint e outro.
 * Tudo aqui é medido (não autodeclarado): segundos de fala gravada, acertos
 * na PRIMEIRA tentativa de frases vencidas (retenção real), tempo por palavra.
 */
import { addDays } from '../plan/sixMonths';

export interface DayStats {
  /** Segundos de fala medidos em exercícios (gravações / ditado). */
  spokenSec: number;
  /** Frases ditas em voz alta. */
  spoken: number;
  produced: number;
  correct: number;
  /** Frases vencidas revistas e quantas saíram certas de primeira. */
  due: number;
  dueOk: number;
  /** Soma e contagem de segundos-por-palavra nas frases faladas certas. */
  spwSum: number;
  spwN: number;
  /** Segundos de conversa com a Maya. */
  mayaSec: number;
  /** Fala livre: soma e contagem de palavras por minuto. */
  wpmSum: number;
  wpmN: number;
  /** Frases no degrau ≥ Falar ao fim do dia (foto, não soma). */
  auto: number;
}

export type Daily = Record<string, DayStats>;

export const emptyDay = (): DayStats => ({ spokenSec: 0, spoken: 0, produced: 0, correct: 0, due: 0, dueOk: 0, spwSum: 0, spwN: 0, mayaSec: 0, wpmSum: 0, wpmN: 0, auto: 0 });

export function addDay(daily: Daily, day: string, patch: Partial<DayStats>): Daily {
  const cur = daily[day] ?? emptyDay();
  const next = { ...cur };
  for (const [k, v] of Object.entries(patch) as [keyof DayStats, number][]) {
    next[k] = k === 'auto' ? v : cur[k] + v;
  }
  return { ...daily, [day]: next };
}

export interface WeekSummary {
  /** Primeiro dia do intervalo (YYYY-MM-DD). */
  start: string;
  label: string;
  speakMin: number;
  mayaMin: number;
  spoken: number;
  /** % de frases vencidas certas de primeira; null sem dados. */
  retention: number | null;
  secPerWord: number | null;
  wpm: number | null;
  auto: number | null;
  activeDays: number;
}

/** Janelas de 7 dias terminando em `today` (a última é a semana corrente). */
export function weekly(daily: Daily, today: string, weeks = 8): WeekSummary[] {
  const out: WeekSummary[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(today, -7 * i - 6);
    const acc = emptyDay();
    let active = 0;
    let auto: number | null = null;
    for (let d = 0; d < 7; d++) {
      const s = daily[addDays(start, d)];
      if (!s) continue;
      if (s.spokenSec || s.produced || s.mayaSec) active++;
      for (const k of Object.keys(acc) as (keyof DayStats)[]) if (k !== 'auto') acc[k] += s[k];
      auto = s.auto;
    }
    out.push({
      start,
      label: `${start.slice(8, 10)}/${start.slice(5, 7)}`,
      speakMin: Math.round((acc.spokenSec / 60) * 10) / 10,
      mayaMin: Math.round((acc.mayaSec / 60) * 10) / 10,
      spoken: acc.spoken,
      retention: acc.due >= 3 ? Math.round((acc.dueOk / acc.due) * 100) : null,
      secPerWord: acc.spwN >= 3 ? Math.round((acc.spwSum / acc.spwN) * 100) / 100 : null,
      wpm: acc.wpmN ? Math.round(acc.wpmSum / acc.wpmN) : null,
      auto,
      activeDays: active,
    });
  }
  return out;
}

/** Totais da semana do plano que contém `today`. */
export function planWeekTotals(daily: Daily, startDay: string, week: number): { speakMin: number; mayaMin: number; activeDays: number } {
  const from = addDays(startDay, (week - 1) * 7);
  let spoken = 0;
  let maya = 0;
  let active = 0;
  for (let d = 0; d < 7; d++) {
    const s = daily[addDays(from, d)];
    if (!s) continue;
    spoken += s.spokenSec;
    maya += s.mayaSec;
    if (s.spokenSec || s.produced || s.mayaSec) active++;
  }
  return { speakMin: Math.round(spoken / 60), mayaMin: Math.round(maya / 60), activeDays: active };
}
