/**
 * Banco de erros pessoais: todo erro que o app encontra na SUA fala vira um
 * cartão que volta com repetição espaçada. O exercício é dizer o trecho
 * corrigido a partir do trecho errado (prática de recuperação sobre o erro
 * real, não sobre frases de livro).
 */
import type { Card } from 'ts-fsrs';
import { Rating } from 'ts-fsrs';
import { normalize } from '../practice/answer';
import { review } from '../srs/scheduler';
import { repaired, type Issue } from './mediation';

export interface ErrorCard {
  id: string;
  rule: string;
  cat: string;
  /** Trecho como foi dito, com um pouco de contexto. */
  wrongContext: string;
  /** O mesmo trecho, corrigido. */
  context: string;
  wrong: string;
  fix: string;
  explain: string;
  card?: Card;
  /** Quantas vezes o mesmo erro apareceu na fala. */
  seen: number;
  at: number;
}

export const BANK_LIMIT = 150;

/** Recorta ~3 palavras antes e depois do trecho. */
function around(text: string, start: number, end: number, replacement?: string): string {
  const before = text.slice(0, start).trim().split(/\s+/).filter(Boolean).slice(-3);
  const mid = replacement ?? text.slice(start, end);
  const after = text.slice(end).trim().split(/\s+/).filter(Boolean).slice(0, 3);
  return [...before, mid, ...after].join(' ').replace(/\s+/g, ' ').trim();
}

export function toCard(issue: Issue, utterance: string, now = Date.now()): ErrorCard {
  const has = issue.start !== undefined && issue.end !== undefined;
  return {
    id: `err-${normalize(`${issue.rule} ${issue.wrong}`).replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
    rule: issue.rule,
    cat: issue.cat,
    wrongContext: has ? around(utterance, issue.start!, issue.end!) : issue.wrong,
    context: has ? around(utterance, issue.start!, issue.end!, issue.fix) : issue.fix,
    wrong: issue.wrong,
    fix: issue.fix,
    explain: issue.explain,
    seen: 1,
    at: now,
  };
}

/** Adiciona erros ao banco; o mesmo erro repetido só aumenta a contagem e volta a ficar vencido. */
export function addErrors(bank: ErrorCard[], issues: Issue[], utterance: string, now = Date.now()): ErrorCard[] {
  let next = [...bank];
  for (const issue of issues) {
    if (!issue.fix.trim() || normalize(issue.fix) === normalize(issue.wrong)) continue;
    const c = toCard(issue, utterance, now);
    const i = next.findIndex((x) => x.id === c.id);
    if (i >= 0) next[i] = { ...next[i], seen: next[i].seen + 1, at: now, card: next[i].card ? { ...next[i].card!, due: new Date(now) } : undefined };
    else next = [c, ...next];
  }
  return next.slice(0, BANK_LIMIT);
}

export const isDue = (c: ErrorCard, now = Date.now()) => !c.card || new Date(c.card.due).getTime() <= now;

/** Vencidos primeiro (os mais repetidos na frente), até `max`. */
export function dueErrors(bank: ErrorCard[], now = Date.now(), max = 10): ErrorCard[] {
  return bank
    .filter((c) => isDue(c, now))
    .sort((a, b) => b.seen - a.seen || b.at - a.at)
    .slice(0, max);
}

/** A resposta contém a forma corrigida e não repete o erro? */
export function checkFix(card: ErrorCard, said: string): boolean {
  return repaired({ source: 'ai', rule: card.rule, cat: card.cat, wrong: card.wrong, fix: card.fix, clue: '', explain: card.explain }, said);
}

export function reviewError(bank: ErrorCard[], id: string, ok: boolean, usedHint: boolean, now = new Date()): ErrorCard[] {
  return bank.map((c) => {
    if (c.id !== id) return c;
    const grade = !ok ? Rating.Again : usedHint ? Rating.Hard : Rating.Good;
    const cards = review(c.card ? { [id]: c.card } : {}, id, grade, now);
    return { ...c, card: cards[id] };
  });
}

/** Erros considerados resolvidos: próxima revisão a 7 dias ou mais. */
export const resolvedCount = (bank: ErrorCard[]) => bank.filter((c) => !!c.card && c.card.scheduled_days >= 7).length;
