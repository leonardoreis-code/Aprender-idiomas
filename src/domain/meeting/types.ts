/**
 * Reunião ao vivo: várias pessoas, perguntas diretas e correção como uma pessoa faz.
 * Conteúdo (roteiros) separado do motor: ver ./engine.ts e src/content/meetings.ts.
 */
import type { Goal } from '../sim/engine';

/** Aparência do avatar SVG (índices em paletas fixas, ver MeetAvatar). */
export interface Look {
  /** 0–4 */
  skin: number;
  /** 0 curto · 1 longo · 2 coque · 3 careca · 4 cacheado · 5 rabo de cavalo */
  hair: number;
  /** 0–4 */
  hairColor: number;
  /** cor CSS da camisa */
  shirt: string;
  glasses?: boolean;
  beard?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  /** Cargo em inglês, aparece no rótulo do vídeo. */
  role: string;
  /** Índice de voz (0 bella · 1 daniel · 2 matilda no servidor; no artefato, vozes do TTS). */
  voice: number;
  look: Look;
}

/** Fala de um colega (conversa entre eles, sem esperar o aluno). */
export interface Line {
  by: string;
  say: string;
}

/** Um momento em que a reunião se volta para o aluno. */
export interface MeetingTurn {
  /** Conversa entre os colegas antes da pergunta (opcional, dá o clima de reunião). */
  before?: Line[];
  /** Quem pergunta ao aluno. */
  by: string;
  /** Pergunta/fala dirigida ao aluno (inglês). Pode usar {you}, {role}, {project}, {teammate}, {tool}. */
  say: string;
  /** Tradução em português (mostrada só se o aluno pedir). */
  pt: string;
  /** Objetivos (ids de Goal) que esta pergunta pede. */
  wants: string[];
  /** Cobrança natural, uma vez, se o objetivo não veio (pode ser outro colega: nudgeBy). */
  nudge: string;
  nudgeBy?: string;
}

export type MeetingKind = 'daily' | 'planning' | 'incident' | 'client' | 'interview' | 'retro' | 'one-on-one';

export interface Meeting {
  id: string;
  kind: MeetingKind;
  title: string;
  /** Situação em português (briefing). */
  setting: string;
  minutes: number;
  participants: Participant[];
  goals: Goal[];
  agenda: MeetingTurn[];
  closing: Line;
}
