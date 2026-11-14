/**
 * Conteúdo da plataforma v2 — foco em PRODUÇÃO (português → inglês) e fala.
 * Contrato de dados escrito antes do conteúdo (SDD). Validado em src/content/content.test.ts.
 */
import type { Cefr } from './types';

/* ---------------------------------------------------------------- *
 * Material escrito (artigo da aula)
 * ---------------------------------------------------------------- */
export type ArticleBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  /** Exemplo bilíngue com áudio. */
  | { type: 'example'; en: string; pt: string; note?: string }
  /** Contraste PT × EN: como o brasileiro pensa vs como o inglês organiza. */
  | { type: 'compare'; pt: string; wrong?: string; en: string; explain: string }
  | { type: 'tip'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] };

/* ---------------------------------------------------------------- *
 * Drill PT → EN (o coração do "pensar em inglês")
 * ---------------------------------------------------------------- */
export interface Chunk {
  /** Bloco de sentido em português, na ordem do português. */
  pt: string;
  /** Equivalente em inglês daquele bloco. */
  en: string;
}

export interface Drill {
  id: string;
  /** Frase em português que o aluno deve produzir em inglês. */
  pt: string;
  /** Resposta canônica. */
  en: string;
  /** Outras respostas corretas e naturais (contrações, sinônimos comuns). */
  alt?: string[];
  /**
   * A frase quebrada em blocos de sentido. A ORDEM do array segue o INGLÊS,
   * para ensinar a reordenar o pensamento (ex.: adjetivo antes do substantivo).
   */
  chunks: Chunk[];
  /** Dica curta em PT exibida quando o aluno trava. */
  hint?: string;
}

/* ---------------------------------------------------------------- *
 * Aula (lição com material escrito + padrão + drills)
 * ---------------------------------------------------------------- */
export interface SpeakingLesson {
  id: string;
  /** Trilha: zero (nunca estudou), fala (entende mas não fala), tech (trabalho em tecnologia). */
  track: 'zero' | 'fala' | 'tech';
  order: number;
  title: string;
  level: Cefr;
  /** Objetivo "can-do" em PT. */
  goal: string;
  /** Duração estimada em minutos. */
  minutes: number;
  /** Estrutura-modelo da aula, ex. "I've been ___ing for ___". */
  pattern: { frame: string; meaning: string };
  article: ArticleBlock[];
  /** 10–14 drills PT→EN, do mais fácil ao mais difícil. */
  drills: Drill[];
  /** Pergunta aberta para falar livremente com o professor IA no fim da aula. */
  speakingPrompt: { en: string; pt: string };
}

/* ---------------------------------------------------------------- *
 * Histórias interativas (diálogos em que o aluno participa)
 * ---------------------------------------------------------------- */
export interface StoryCharacter {
  id: string;
  name: string;
  role: string;
  /** Cor do avatar (hex). */
  color: string;
}

export type StoryLine =
  /** Fala de um personagem (aluno ouve e lê). */
  | { type: 'line'; speaker: string; en: string; pt: string }
  /** Aluno escolhe a resposta adequada. */
  | { type: 'choice'; prompt: string; options: { en: string; correct: boolean; feedback: string }[] }
  /** Aluno precisa DIZER a frase a partir do português (produção). */
  | { type: 'speak'; pt: string; en: string; alt?: string[] }
  /** Pergunta de compreensão sobre o que aconteceu. */
  | { type: 'check'; question: string; options: string[]; answer: number };

export interface Story {
  id: string;
  track: 'zero' | 'fala' | 'tech';
  title: string;
  level: Cefr;
  setting: string;
  characters: StoryCharacter[];
  lines: StoryLine[];
}

/* ---------------------------------------------------------------- *
 * Vídeo-aula (slides animados + narração do professor avatar)
 * ---------------------------------------------------------------- */
export type SlideVisual =
  | { kind: 'title'; title: string; subtitle?: string }
  | { kind: 'bullets'; title: string; bullets: string[] }
  | { kind: 'example'; en: string; pt: string; highlight?: string }
  | { kind: 'compare'; pt: string; wrong?: string; en: string }
  | { kind: 'formula'; parts: { text: string; role: 'subject' | 'verb' | 'object' | 'time' | 'aux' | 'other' }[]; caption?: string }
  | { kind: 'quiz'; question: string; options: string[]; answer: number };

export interface Slide {
  visual: SlideVisual;
  /** Texto que o professor fala (PT-BR com exemplos em inglês). 1–3 frases. */
  narration: string;
}

export interface VideoLesson {
  id: string;
  track: 'zero' | 'fala' | 'tech';
  title: string;
  level: Cefr;
  /** Aula escrita relacionada (SpeakingLesson.id), se houver. */
  lessonId?: string;
  slides: Slide[];
}
