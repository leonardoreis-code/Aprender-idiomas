/** Curriculum bounded context — dados declarativos do curso. */

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2';

/** Ícone SVG desenhado à mão (ver ui/icons/ItemIcon.tsx). Dupla codificação. */
export type IconName =
  | 'wave' | 'handshake' | 'person' | 'globe' | 'house' | 'coffee' | 'water' | 'bread'
  | 'apple' | 'sun' | 'moon' | 'clock' | 'book' | 'phone' | 'car' | 'bus' | 'heart'
  | 'family' | 'work' | 'money' | 'question' | 'check' | 'number' | 'cat' | 'dog'
  | 'think' | 'three' | 'ship' | 'sheep' | 'bed' | 'bad' | 'hat' | 'eat' | 'it';

export interface Item {
  /** Identificador estável — chave do Card FSRS. */
  id: string;
  en: string;
  pt: string;
  ipa?: string;
  icon?: IconName;
  /** Chunk = expressão de várias palavras aprendida como bloco (abordagem lexical). */
  kind: 'word' | 'chunk';
  /** Dica de pronúncia para falantes de PT-BR. */
  tip?: string;
}

export interface Sentence {
  id: string;
  en: string;
  pt: string;
  /** Formas alternativas aceitas (ex.: sem contração). */
  alt?: string[];
  /** Palavra a lacunar em fill-gap. */
  gap?: string;
}

export interface MinimalPair {
  a: string;
  b: string;
  ipaA: string;
  ipaB: string;
  /** O contraste fonológico treinado, ex. "/ɪ/ vs /iː/". */
  contrast: string;
}

export interface SoundFocus {
  title: string;
  /** Explicação curta, em PT-BR, com orientação articulatória. */
  howTo: string;
  /** Ilustração articulatória a mostrar. */
  mouth?: 'th' | 'short-i' | 'long-i' | 'ae' | 'h' | 'ed';
  pairs: MinimalPair[];
}

export interface Lesson {
  id: string;
  title: string;
  /** Objetivo comunicativo "can-do" (CEFR). */
  canDo: string;
  items: Item[];
  sentences: Sentence[];
  sound?: SoundFocus;
  /** Áudio-aula narrado (ElevenLabs) — caminho relativo a /public. */
  introAudio?: string;
  introScript?: string;
}

export interface Unit {
  id: string;
  title: string;
  cefr: Cefr;
  color: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  language: string;
  speechLang: string;
  units: Unit[];
}
