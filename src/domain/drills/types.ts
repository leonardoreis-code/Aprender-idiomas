/** Bancos de exercícios curtos de fala (conteúdo em src/content/drills2.ts). */

/** Transforme: dada uma frase, produzir a variação pedida. */
export interface TransformItem {
  id: string;
  /** Frase de partida, em inglês. */
  base: string;
  /** Tradução da frase de partida. */
  pt: string;
  kind: 'negative' | 'question' | 'past' | 'third' | 'future' | 'perfect';
  /** Respostas aceitas (a primeira é a canônica). */
  answers: string[];
}

/** Faça a pergunta: dada a resposta, formular a pergunta que a provoca. */
export interface AskItem {
  id: string;
  /** Frase-resposta, em inglês. */
  statement: string;
  /** Trecho da resposta que a pergunta deve buscar (ex.: "in São Paulo"). */
  focus: string;
  /** Dica em português (ex.: "Pergunte ONDE"). */
  pt: string;
  /** Perguntas aceitas (a primeira é a canônica). */
  answers: string[];
}

/** Resposta rápida: pergunta ouvida, resposta em frase completa o mais rápido possível. */
export interface QuickItem {
  id: string;
  en: string;
  pt: string;
  /** Começo de resposta sugerido se a pessoa travar. */
  starter: string;
}

export const TRANSFORM_LABEL: Record<TransformItem['kind'], string> = {
  negative: 'Diga na negativa',
  question: 'Transforme em pergunta',
  past: 'Diga no passado',
  third: 'Diga sobre ele ou ela',
  future: 'Diga no futuro (going to)',
  perfect: 'Diga com "há / desde" (present perfect)',
};
