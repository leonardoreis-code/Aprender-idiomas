/**
 * Feedback graduado (avaliação dinâmica): em vez de dar a resposta, o treinador
 * oferece a MENOR ajuda possível e só aumenta se a pessoa não conseguir consertar.
 * O degrau em que o erro foi consertado mede autonomia: com o tempo, o mesmo
 * erro deve ser resolvido com menos ajuda.
 *
 *   1 aviso     "Tem um ajuste nessa frase. Diga de novo."
 *   2 localiza  mostra ONDE está o problema (trecho sublinhado)
 *   3 pista     dá a regra, sem a resposta
 *   4 modelo    mostra e fala a forma correta; a pessoa repete
 */
import { normalize } from '../practice/answer';
import { spot } from './spotter';

export type HelpLevel = 1 | 2 | 3 | 4;

export interface Issue {
  source: 'rule' | 'ai';
  rule: string;
  cat: string;
  wrong: string;
  fix: string;
  clue: string;
  explain: string;
  start?: number;
  end?: number;
}

export interface RepairRecord {
  rule: string;
  cat: string;
  /** Degrau em que foi consertado; 5 = não consertou nem com o modelo. */
  level: number;
  at: number;
}

export const LEVEL_LABEL: Record<HelpLevel, string> = { 1: 'Aviso', 2: 'Onde', 3: 'Pista', 4: 'Modelo' };

export const nextLevel = (l: HelpLevel): HelpLevel | null => (l < 4 ? ((l + 1) as HelpLevel) : null);

/** A nova tentativa consertou o problema? */
export function repaired(issue: Issue, attempt: string): boolean {
  const a = normalize(attempt);
  if (!a) return false;
  const fix = normalize(issue.fix);
  const wrong = normalize(issue.wrong);
  if (fix && wrong !== fix && a.includes(wrong) && !fix.includes(wrong)) return false; // repetiu o erro
  if (fix && a.includes(fix)) return true;
  // regra local: o padrão deixou de aparecer e a pessoa não fugiu da frase
  if (issue.source === 'rule') {
    if (spot(attempt).some((s) => s.rule === issue.rule)) return false;
    const fixWords = fix.split(' ').filter((w) => w.length > 2);
    const hit = fixWords.filter((w) => a.split(' ').includes(w)).length;
    return fixWords.length > 0 && hit / fixWords.length >= 0.6;
  }
  const fixWords = fix.split(' ');
  return fixWords.filter((w) => a.split(' ').includes(w)).length / Math.max(fixWords.length, 1) >= 0.8;
}

/** Consertado sem ver a resposta (degraus 1–3). */
export const selfRepaired = (r: Pick<RepairRecord, 'level'>) => r.level <= 3;

export function autonomy(records: RepairRecord[]): { n: number; selfPct: number; meanLevel: number } {
  if (!records.length) return { n: 0, selfPct: 0, meanLevel: 0 };
  return {
    n: records.length,
    selfPct: Math.round((records.filter(selfRepaired).length / records.length) * 100),
    meanLevel: Math.round((records.reduce((a, r) => a + Math.min(r.level, 5), 0) / records.length) * 10) / 10,
  };
}

/** Ajuda inicial por regra: começa um degrau abaixo do que foi necessário da última vez. */
export function startLevel(records: RepairRecord[], rule: string, liveMarks: boolean): HelpLevel {
  const last = [...records].reverse().find((r) => r.rule === rule);
  const base: HelpLevel = liveMarks ? 2 : 1;
  if (!last) return base;
  return Math.max(base, Math.min(4, last.level - 1)) as HelpLevel;
}
