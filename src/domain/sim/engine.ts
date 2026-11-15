/**
 * Simulações do dia a dia (ensino baseado em tarefas): o sucesso é medido pelo
 * que você CONSEGUIU FAZER na conversa (objetivos comunicativos), não só pela
 * gramática. Tudo aqui é puro e roda a cada palavra reconhecida, para os
 * objetivos acenderem enquanto a pessoa ainda está falando.
 */

export interface Goal {
  id: string;
  /** O que fazer, em português. */
  label: string;
  /** Exemplo em português e em inglês (vira treino na escada). */
  pt: string;
  example: string;
  /** Começo de frase oferecido quando a pessoa trava. */
  starter: string;
  /** Todos os grupos precisam aparecer; dentro do grupo, qualquer expressão serve. */
  detect: string[][];
}

export interface Beat {
  say: string;
  pt: string;
  /** Objetivos que esta fala do personagem está pedindo. */
  wants: string[];
  /** Insistência natural, usada uma vez, se o objetivo não veio. */
  nudge: string;
}

export interface Mission {
  id: string;
  area: 'trabalho' | 'vida';
  tags: string[];
  title: string;
  /** Situação, em português. */
  setting: string;
  character: { name: string; role: string; color: string; voice: number };
  goals: Goal[];
  beats: Beat[];
  closing: string;
}

export interface SimContext {
  role: string;
  project: string;
  teammate: string;
  tool: string;
}

export const DEFAULT_CONTEXT: SimContext = { role: 'data engineer', project: 'the orders pipeline', teammate: 'Tom', tool: 'Airflow' };

export const fill = (line: string, ctx: SimContext) =>
  line.replace(/\{(role|project|teammate|tool)\}/g, (_, k: keyof SimContext) => ctx[k]?.trim() || DEFAULT_CONTEXT[k]);

const pad = (text: string) => ` ${text.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()} `;

export function goalMet(goal: Goal, text: string): boolean {
  const t = pad(text);
  return goal.detect.every((group) => group.some((phrase) => t.includes(` ${phrase} `)));
}

export const goalsMet = (goals: Goal[], text: string): string[] => goals.filter((g) => goalMet(g, text)).map((g) => g.id);

/** Pedir para repetir é uma estratégia real de conversa: o personagem repete, sem punição. */
export const asksRepeat = (text: string) => /\b(repeat|say (that|it) again|come again|pardon|slower|more slowly|speak slowly|didn't (understand|catch|get|hear)|did not (understand|catch|get|hear)|don't understand|do not understand|what did you say)\b/i.test(text);

export interface SimState {
  beat: number;
  nudged: boolean;
  met: string[];
  done: boolean;
  turns: number;
  repeats: number;
}

export const initialSim = (): SimState => ({ beat: 0, nudged: false, met: [], done: false, turns: 0, repeats: 0 });

const ACKS = ['Got it.', 'Okay.', 'Right.', 'I see.', 'All right.'];

export interface Step {
  state: SimState;
  line: string;
  kind: 'repeat' | 'nudge' | 'more' | 'next' | 'close';
}

/** Reação do personagem (modo sem IA): repete, insiste ou segue, conforme o que foi dito. */
export function react(mission: Mission, state: SimState, utterance: string, ctx: SimContext): Step {
  const beat = mission.beats[state.beat];
  if (asksRepeat(utterance)) return { state: { ...state, repeats: state.repeats + 1 }, line: `Sure, no problem. ${fill(beat.say, ctx)}`, kind: 'repeat' };
  const met = [...new Set([...state.met, ...goalsMet(mission.goals, utterance)])];
  const base = { ...state, met, turns: state.turns + 1 };
  const missing = beat.wants.filter((w) => !met.includes(w));
  if (missing.length && !state.nudged) return { state: { ...base, nudged: true }, line: fill(beat.nudge, ctx), kind: 'nudge' };
  if (!state.nudged && utterance.trim().split(/\s+/).length < 3) return { state: { ...base, nudged: true }, line: 'Could you tell me a bit more?', kind: 'more' };
  const nextBeat = state.beat + 1;
  if (nextBeat >= mission.beats.length) return { state: { ...base, beat: nextBeat, nudged: false, done: true }, line: fill(mission.closing, ctx), kind: 'close' };
  return { state: { ...base, beat: nextBeat, nudged: false }, line: `${ACKS[state.beat % ACKS.length]} ${fill(mission.beats[nextBeat].say, ctx)}`, kind: 'next' };
}

/** Próximo objetivo ainda não cumprido (para o "travei"). */
export function nextGoal(mission: Mission, state: SimState): Goal | undefined {
  const beat = mission.beats[Math.min(state.beat, mission.beats.length - 1)];
  const want = beat.wants.find((w) => !state.met.includes(w));
  return mission.goals.find((g) => g.id === want) ?? mission.goals.find((g) => !state.met.includes(g.id));
}

export interface SimScore {
  goals: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
}

/** Estrelas: 3 = todos os objetivos, sem pedir ajuda e no máximo 1 ajuste de gramática. */
export function score(mission: Mission, met: string[], helps: number, issues: number): SimScore {
  const total = mission.goals.length;
  const goals = mission.goals.filter((g) => met.includes(g.id)).length;
  const all = goals === total;
  const stars = all && helps === 0 && issues <= 1 ? 3 : all || (goals / total >= 0.75 && helps <= 1) ? 2 : goals / total >= 0.5 ? 1 : 0;
  return { goals, total, stars };
}
