/**
 * Motor da Reunião ao vivo (puro, sem React): quem fala, quando cobra, quando
 * reformula. A correção imita o que um colega faz numa reunião de verdade:
 * não para a conversa, só devolve a ideia já certa ("So you went to the client?").
 */
import { asksRepeat, fill, goalsMet, type SimContext } from '../sim/engine';
import type { Issue } from '../coach/mediation';
import type { Meeting, MeetingTurn } from './types';

export type SaidKind = 'before' | 'ask' | 'recast' | 'nudge' | 'repeat' | 'more' | 'mute' | 'close';

export interface Said {
  by: string;
  text: string;
  kind: SaidKind;
}

export interface MeetState {
  turn: number;
  nudged: boolean;
  met: string[];
  done: boolean;
  /** Falas do aluno que contaram. */
  turns: number;
  repeats: number;
  /** Turno da última reformulação (para não virar professor). */
  lastRecast: number;
  recasts: number;
  muteNudges: number;
}

export const initialMeet = (): MeetState => ({ turn: 0, nudged: false, met: [], done: false, turns: 0, repeats: 0, lastRecast: -99, recasts: 0, muteNudges: 0 });

/** No máximo uma reformulação a cada 2 falas do aluno (critério A2). */
export const RECAST_GAP = 2;

/** Erros que um colega de verdade reformularia, porque mudam o sentido ou soam muito errado. */
const RECASTABLE = new Set(['past-tense', 'third-person', 'do-support', 'missing-subject', 'there-is', 'perfect', 'word-order', 'agreement', 'be-have', 'verb-pattern', 'false-friend', 'preposition']);

export const fillMeet = (text: string, ctx: SimContext, you: string) => fill(text.replace(/\{you\}/g, you.trim() || 'there'), ctx);

const ACKS = ['Okay, thanks.', 'Got it.', 'Nice.', 'Cool, thanks.', 'Right.', 'Okay.'];
const OPENERS = ['Sorry, just to confirm,', 'Okay, so', 'Wait, so', 'Got it, so'];

const lookup = (m: Meeting, id: string) => m.participants.find((p) => p.id === id) ?? m.participants[0];
export const speakerOf = lookup;

/** Abertura: conversa entre os colegas e a primeira pergunta. */
export function opening(m: Meeting, ctx: SimContext, you: string): Said[] {
  return turnLines(m, m.agenda[0], ctx, you);
}

function turnLines(m: Meeting, t: MeetingTurn, ctx: SimContext, you: string): Said[] {
  return [
    ...(t.before ?? []).map((l) => ({ by: lookup(m, l.by).id, text: fillMeet(l.say, ctx, you), kind: 'before' as const })),
    { by: lookup(m, t.by).id, text: fillMeet(t.say, ctx, you), kind: 'ask' as const },
  ];
}

/* ---------------- reformulação (recast) ---------------- */

const SWAP: Record<string, string> = {
  i: 'you', "i'm": "you're", "i've": "you've", "i'll": "you'll", "i'd": "you'd", me: 'you', my: 'your', mine: 'yours', myself: 'yourself',
};

/** "I was late" → "you were late"; "I am blocked" → "you are blocked". */
export function toSecondPerson(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let k = 0; k < words.length; k++) {
    const raw = words[k];
    const low = raw.toLowerCase().replace(/[’‘]/g, "'");
    const prev = out[k - 1]?.toLowerCase();
    if (SWAP[low]) out.push(SWAP[low]);
    else if (prev === 'you' && words[k - 1].toLowerCase() === 'i' && low === 'am') out.push('are');
    else if (prev === 'you' && words[k - 1].toLowerCase() === 'i' && low === 'was') out.push('were');
    else out.push(raw);
  }
  return out.join(' ');
}

/** Posição do erro na fala (regra local traz start/end; o avaliador de IA traz só o trecho). */
function locate(text: string, issue: Issue): { start: number; end: number } | null {
  if (issue.start !== undefined && issue.end !== undefined && issue.end > issue.start) return { start: issue.start, end: issue.end };
  const q = issue.wrong.replace(/[.,!?]/g, '').trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  return at >= 0 ? { start: at, end: at + q.length } : null;
}

/**
 * Frase que o colega diria de volta, já corrigida, na 2ª pessoa e curta
 * (até ~12 palavras em volta da correção). null quando não dá para reformular bem.
 */
export function recastOf(text: string, issue: Issue): string | null {
  const pos = locate(text, issue);
  if (!pos || !issue.fix.trim()) return null;
  const fixed = text.slice(0, pos.start) + issue.fix + text.slice(pos.end);
  const fixAt = pos.start;
  // só a oração onde está a correção
  // a reformulação fica só na oração do erro: outra oração pode ter outro erro não detectado
  const bounds = [...fixed.matchAll(/[.!?;,]|\b(?:but|and|so|then|because)\b/gi)].map((x) => ({ s: x.index!, e: x.index! + x[0].length }));
  const startCut = Math.max(0, ...bounds.filter((b) => b.e <= fixAt).map((b) => b.e));
  const endCut = Math.min(fixed.length, ...bounds.filter((b) => b.s >= fixAt + issue.fix.length).map((b) => b.s));
  let clause = fixed.slice(startCut, endCut).trim().replace(/^(and|so|well|um|uh|yeah|okay)\b[, ]*/i, '');
  let words = clause.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null; // curto demais soa estranho ("so, deploy it?")
  if (words.length > 12) {
    // janela em volta da correção
    const before = fixed.slice(startCut, fixAt).trim().split(/\s+/).filter(Boolean).length;
    const from = Math.max(0, before - 5);
    words = words.slice(from, from + 12);
    clause = words.join(' ');
  }
  const out = toSecondPerson(clause).replace(/[,\s]+$/, '');
  return out.charAt(0).toLowerCase() + out.slice(1);
}

/** Escolhe o erro mais reformulável da fala (ou nenhum, se ainda é cedo). */
export function pickRecast(st: MeetState, text: string, issues: Issue[]): { issue: Issue; line: string } | null {
  if (st.turns - st.lastRecast < RECAST_GAP) return null;
  for (const issue of issues) {
    if (!RECASTABLE.has(issue.cat)) continue;
    const line = recastOf(text, issue);
    if (line) return { issue, line };
  }
  return null;
}

/* ---------------- reação da reunião ---------------- */

export interface MeetStep {
  state: MeetState;
  lines: Said[];
  recast: { issue: Issue; line: string } | null;
}

/**
 * Reação sem IA: repete, reformula, cobra ou passa a palavra adiante.
 * `issues` = erros já detectados nesta fala (regras locais e/ou IA).
 */
export function meetReact(m: Meeting, st: MeetState, utterance: string, ctx: SimContext, you: string, issues: Issue[] = []): MeetStep {
  const t = m.agenda[Math.min(st.turn, m.agenda.length - 1)];
  const asker = lookup(m, t.by).id;
  if (asksRepeat(utterance)) {
    return { state: { ...st, repeats: st.repeats + 1 }, lines: [{ by: asker, text: `Sure. ${fillMeet(t.say, ctx, you)}`, kind: 'repeat' }], recast: null };
  }
  const met = [...new Set([...st.met, ...goalsMet(m.goals, utterance)])];
  let next: MeetState = { ...st, met, turns: st.turns + 1 };
  const rc = pickRecast(next, utterance, issues);
  const lines: Said[] = [];
  if (rc) {
    next = { ...next, lastRecast: next.turns, recasts: next.recasts + 1 };
    lines.push({ by: asker, text: `${OPENERS[next.recasts % OPENERS.length]} ${rc.line}?`, kind: 'recast' });
  }
  const missing = t.wants.filter((w) => !met.includes(w));
  if (missing.length && !st.nudged) {
    lines.push({ by: lookup(m, t.nudgeBy ?? t.by).id, text: fillMeet(t.nudge, ctx, you), kind: 'nudge' });
    return { state: { ...next, nudged: true }, lines, recast: rc };
  }
  if (!st.nudged && utterance.trim().split(/\s+/).length < 3) {
    lines.push({ by: asker, text: 'Could you say a bit more about that?', kind: 'more' });
    return { state: { ...next, nudged: true }, lines, recast: rc };
  }
  const ack = ACKS[(st.turn + next.turns) % ACKS.length];
  const nt = st.turn + 1;
  if (nt >= m.agenda.length) {
    lines.push({ by: asker, text: ack, kind: 'before' });
    lines.push({ by: lookup(m, m.closing.by).id, text: fillMeet(m.closing.say, ctx, you), kind: 'close' });
    return { state: { ...next, turn: nt, nudged: false, done: true }, lines, recast: rc };
  }
  lines.push({ by: asker, text: ack, kind: 'before' }, ...turnLines(m, m.agenda[nt], ctx, you));
  return { state: { ...next, turn: nt, nudged: false }, lines, recast: rc };
}

/** Silêncio depois de uma pergunta: "acho que você está no mudo" (critério A5). */
export function muteNudge(m: Meeting, st: MeetState, you: string): { state: MeetState; line: Said } {
  const t = m.agenda[Math.min(st.turn, m.agenda.length - 1)];
  const others = m.participants.filter((p) => p.id !== t.by);
  const name = you.trim() || 'there';
  const lines = [
    { by: t.by, text: `${name}, I think you're on mute.` },
    { by: others[0]?.id ?? t.by, text: `${name}? Can you hear us?` },
    { by: t.by, text: 'No rush. Take your time.' },
  ];
  const l = lines[Math.min(st.muteNudges, lines.length - 1)];
  return { state: { ...st, muteNudges: st.muteNudges + 1 }, line: { ...l, by: lookup(m, l.by).id, kind: 'mute' } };
}

export interface MeetScore {
  goals: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
}

/** 3 estrelas = todos os objetivos, no máximo 1 ajuda e no máximo 2 erros. */
export function meetScore(m: Meeting, met: string[], helps: number, issues: number): MeetScore {
  const total = m.goals.length;
  const goals = m.goals.filter((g) => met.includes(g.id)).length;
  const all = goals === total;
  const stars = all && helps <= 1 && issues <= 2 ? 3 : all || goals / total >= 0.75 ? 2 : goals / total >= 0.5 ? 1 : 0;
  return { goals, total, stars };
}

/** Próximo objetivo pendente da pergunta atual (para o "travei"). */
export function pendingGoal(m: Meeting, st: MeetState) {
  const t = m.agenda[Math.min(st.turn, m.agenda.length - 1)];
  const want = t.wants.find((w) => !st.met.includes(w));
  return m.goals.find((g) => g.id === want) ?? m.goals.find((g) => !st.met.includes(g.id));
}
