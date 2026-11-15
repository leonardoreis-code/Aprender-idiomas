/**
 * Checkpoint de fala — a PROVA de aprendizado.
 *
 * Mede três coisas que definem "conseguir falar", sempre em material nunca treinado:
 *   1. Precisão  — % de frases PT→EN produzidas corretamente.
 *   2. Velocidade — segundos por palavra para produzir a frase (automaticidade).
 *   3. Fluência  — palavras por minuto em fala livre.
 * O Índice de fala (0–100) combina as três. É uma métrica interna consistente
 * ao longo do tempo, NÃO um certificado CEFR.
 */
import { checkTyped, normalize } from '../practice/answer';
import { detectErrors } from '../production/errors';
import { FORMS, type CheckCategory, type CheckForm, type CheckItem } from './forms';
import { FORMS_EXTRA } from './forms2';

/** Seis formas paralelas: com um checkpoint a cada 4 semanas, nenhuma se repete em menos de 24 semanas. */
export const ALL_FORMS: CheckForm[] = [...FORMS, ...FORMS_EXTRA];

export interface ItemResult {
  id: string;
  cat: CheckCategory;
  said: string;
  verdict: 'correct' | 'almost' | 'wrong';
  /** true quando um avaliador (Claude) aceitou uma paráfrase fora da lista. */
  judged?: boolean;
  /** Do aparecimento da frase até o fim da resposta. */
  totalMs: number;
  /** Do aparecimento até começar a falar (tempo de formulação). */
  thinkMs: number;
  words: number;
  errors: string[];
  spoken: boolean;
}

export interface FreeResult {
  prompt: string;
  text: string;
  ms: number;
  words: number;
  wpm: number;
  /** Variedade lexical (índice de Guiraud: palavras distintas / √total). */
  variety: number;
}

export interface CheckpointResult {
  id: string;
  at: number;
  day: string;
  /** Semana do plano em que foi feito (0 = linha de base). */
  week: number;
  form: CheckForm['id'];
  modality: 'voz' | 'digitado' | 'misto';
  items: ItemResult[];
  free: FreeResult[];
  accuracy: number;
  secPerWord: number;
  thinkSec: number;
  wpm: number;
  index: number;
  rubric?: { errorsPer100?: number; cefr?: string; comment?: string };
}

/** Formas giram A → B → … → F → A: nunca a mesma em checkpoints seguidos. */
export function nextForm(history: Pick<CheckpointResult, 'form'>[]): CheckForm {
  const order = ALL_FORMS.map((f) => f.id);
  const last = history[history.length - 1]?.form;
  const id = last ? order[(order.indexOf(last) + 1) % order.length] : 'A';
  return ALL_FORMS.find((f) => f.id === id)!;
}

export function scoreItem(item: CheckItem, said: string, timing: { totalMs: number; thinkMs: number }, spoken: boolean): ItemResult {
  // prova: fala exige a frase exata (reconhecedor não comete erro de digitação); digitado tolera 1 typo
  const raw = said.trim() ? checkTyped(said, item.en) : 'wrong';
  const verdict = raw === 'almost' && spoken ? 'wrong' : raw;
  return {
    id: item.id,
    cat: item.cat,
    said,
    verdict,
    totalMs: timing.totalMs,
    thinkMs: timing.thinkMs,
    words: item.en[0].split(/\s+/).length,
    errors: verdict === 'wrong' && said.trim() ? detectErrors(said, item.en) : [],
    spoken,
  };
}

/**
 * `windowMs`: janela mínima da medida. No checkpoint a fala livre vale pela janela
 * inteira (45 s): parar cedo ou digitar 10 palavras em 3 s não vira "fluência alta".
 */
export function scoreFree(prompt: string, text: string, ms: number, windowMs = 0): FreeResult {
  const tokens = normalize(text).split(' ').filter(Boolean);
  const minutes = Math.max(ms, windowMs, 1000) / 60000;
  return {
    prompt,
    text,
    ms,
    words: tokens.length,
    wpm: Math.min(220, Math.round(tokens.length / minutes)),
    variety: tokens.length ? Math.round((new Set(tokens).size / Math.sqrt(tokens.length)) * 10) / 10 : 0,
  };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Faixas de referência do índice (constantes = comparável ao longo do tempo). */
export const INDEX_WEIGHTS = { accuracy: 0.45, speed: 0.25, fluency: 0.3 };
export const SPEED_RANGE = { slow: 3.2, fast: 0.7 }; // s por palavra
export const WPM_RANGE = { low: 30, high: 120 };

export function speakingIndex(accuracy: number, secPerWord: number, wpm: number): number {
  const speed = secPerWord > 0 ? clamp01((SPEED_RANGE.slow - secPerWord) / (SPEED_RANGE.slow - SPEED_RANGE.fast)) : 0;
  const fluency = clamp01((wpm - WPM_RANGE.low) / (WPM_RANGE.high - WPM_RANGE.low));
  return Math.round(100 * (INDEX_WEIGHTS.accuracy * accuracy + INDEX_WEIGHTS.speed * speed + INDEX_WEIGHTS.fluency * fluency));
}

export function summarize(
  form: CheckForm['id'],
  items: ItemResult[],
  free: FreeResult[],
  meta: { at: number; day: string; week: number; rubric?: CheckpointResult['rubric'] },
): CheckpointResult {
  const points = items.reduce((a, r) => a + (r.verdict === 'correct' ? 1 : r.verdict === 'almost' ? 0.8 : 0), 0);
  const accuracy = items.length ? points / items.length : 0;
  const answered = items.filter((r) => r.said.trim());
  // velocidade só conta em frase CERTA: responder rápido e errado não é automaticidade
  const right = items.filter((r) => r.verdict !== 'wrong');
  const secPerWord = Math.round(median(right.map((r) => r.totalMs / 1000 / r.words)) * 100) / 100;
  const thinkSec = Math.round(median(answered.map((r) => r.thinkMs / 1000)) * 10) / 10;
  const spokenFree = free.filter((f) => f.words > 0);
  const wpm = spokenFree.length ? Math.round(spokenFree.reduce((a, f) => a + f.wpm, 0) / spokenFree.length) : 0;
  const spoken = items.filter((r) => r.spoken).length;
  return {
    id: `cp-${meta.at}`,
    at: meta.at,
    day: meta.day,
    week: meta.week,
    form,
    modality: spoken === items.length ? 'voz' : spoken === 0 ? 'digitado' : 'misto',
    items,
    free,
    accuracy: Math.round(accuracy * 1000) / 1000,
    secPerWord,
    thinkSec,
    wpm,
    index: speakingIndex(accuracy, secPerWord, wpm),
    rubric: meta.rubric,
  };
}

/** Aplica o veredito de um avaliador (paráfrases corretas fora da lista) e recalcula. */
export function applyJudgement(r: CheckpointResult, accepted: string[], rubric?: CheckpointResult['rubric']): CheckpointResult {
  const items = r.items.map((i) => (i.verdict === 'wrong' && accepted.includes(i.id) ? { ...i, verdict: 'correct' as const, judged: true, errors: [] } : i));
  return summarize(r.form, items, r.free, { at: r.at, day: r.day, week: r.week, rubric: rubric ?? r.rubric });
}

export interface Delta {
  index: number;
  accuracyPts: number;
  secPerWord: number;
  wpm: number;
  /** Só é comparável quando a modalidade é a mesma. */
  comparable: boolean;
}

export function compare(base: CheckpointResult, now: CheckpointResult): Delta {
  return {
    index: now.index - base.index,
    accuracyPts: Math.round((now.accuracy - base.accuracy) * 100),
    secPerWord: Math.round((now.secPerWord - base.secPerWord) * 100) / 100,
    wpm: now.wpm - base.wpm,
    comparable: base.modality === now.modality,
  };
}

/** Acerto por categoria gramatical — mostra ONDE houve ganho. */
export function byCategory(r: CheckpointResult): Record<string, boolean> {
  return Object.fromEntries(r.items.map((i) => [i.cat, i.verdict !== 'wrong']));
}

export function reportText(history: CheckpointResult[], name: string): string {
  if (!history.length) return 'Nenhum checkpoint feito ainda.';
  const base = history[0];
  const last = history[history.length - 1];
  const lines = [
    `Relatório de fala em inglês — ${name || 'aluno'}`,
    `Checkpoints: ${history.length} · linha de base ${base.day} · último ${last.day}`,
    '',
    'Data        Sem  Forma  Modo      Índice  Precisão  s/palavra  Palavras/min',
    ...history.map((c) => `${c.day}  ${String(c.week).padStart(3)}  ${c.form}      ${c.modality.padEnd(8)}  ${String(c.index).padStart(6)}  ${`${Math.round(c.accuracy * 100)}%`.padStart(8)}  ${String(c.secPerWord).padStart(9)}  ${String(c.wpm).padStart(12)}`),
  ];
  if (history.length > 1) {
    const d = compare(base, last);
    lines.push('', `Evolução desde a linha de base: índice ${d.index >= 0 ? '+' : ''}${d.index}, precisão ${d.accuracyPts >= 0 ? '+' : ''}${d.accuracyPts} pts, ${d.secPerWord <= 0 ? '' : '+'}${d.secPerWord} s/palavra, ${d.wpm >= 0 ? '+' : ''}${d.wpm} palavras/min.${d.comparable ? '' : ' (modalidades diferentes: comparação aproximada)'}`);
  }
  lines.push('', 'Método: 12 frases PT→EN nunca treinadas (formas A a F em rodízio) + 2 falas livres de 45 s. Índice = 45% precisão + 25% velocidade + 30% fluência. Métrica interna, não é certificado CEFR.');
  return lines.join('\n');
}
