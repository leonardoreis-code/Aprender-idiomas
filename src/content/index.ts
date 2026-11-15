import type { SpeakingLesson } from '../domain/curriculum/speaking';
import type { LearnerLevel } from '../infra/storage';
import { zeroLessons } from './en/zero';
import { falaLessons } from './en/fala';
import { techLessons } from './en/tech';
import { kitLessons } from './en/kit';
import { b2Lessons } from './en/b2';
import { stories } from './en/stories';
import { videoLessons } from './en/videos';

export const TRACKS = [
  { id: 'zero', title: 'Do zero', level: 'A1', color: 'var(--tangerine)', desc: 'Para quem nunca estudou: frases curtas, muito apoio em português.', lessons: zeroLessons },
  { id: 'fala', title: 'Destravar a fala', level: 'A2 → B1', color: 'var(--indigo)', desc: 'Você entende, mas trava para montar a frase. Aqui você aprende a pensar em inglês.', lessons: [...falaLessons, ...kitLessons] },
  { id: 'tech', title: 'Inglês para tech', level: 'B1', color: 'var(--teal)', desc: 'Daily, bloqueios, pipelines, métricas e entrevistas de dados.', lessons: techLessons },
  { id: 'b2', title: 'Rumo ao B2', level: 'B1 → B2', color: 'var(--ochre)', desc: 'Condicionais, voz passiva, discurso indireto, phrasal verbs de trabalho e linguagem diplomática.', lessons: b2Lessons },
] as const;

export const allSpeakingLessons: SpeakingLesson[] = [...zeroLessons, ...falaLessons, ...kitLessons, ...techLessons, ...b2Lessons];
export const allDrills = allSpeakingLessons.flatMap((l) => l.drills);
export const findSpeakingLesson = (id: string) => allSpeakingLessons.find((l) => l.id === id);
export const videoForLesson = (lessonId: string) => videoLessons.find((v) => v.lessonId === lessonId)?.id ?? null;
export { stories, videoLessons };

/** Trilha recomendada a partir do perfil. */
export function recommendedTracks(level: LearnerLevel, goals: string[]): string[] {
  const base = level === 'zero' ? ['zero', 'fala'] : ['fala'];
  if (goals.includes('trabalho') || goals.includes('entrevista')) base.push('tech');
  // quem já fala começa pelo B2; para os demais ele vem depois
  return level === 'avancado' ? ['b2', ...base] : [...base, 'b2'];
}

/** Próxima aula: primeira não praticada das trilhas recomendadas. */
export function nextLesson(level: LearnerLevel, goals: string[], done: Record<string, { practice?: boolean }>): SpeakingLesson | undefined {
  for (const t of recommendedTracks(level, goals)) {
    const tr = TRACKS.find((x) => x.id === t)!;
    const l = tr.lessons.find((x) => !done[x.id]?.practice);
    if (l) return l;
  }
  return undefined;
}

/** Categoria de erro → aulas que tratam exatamente daquele ponto. */
export const ERROR_LESSONS: Record<string, string[]> = {
  'missing-subject': ['fala-01'],
  'word-order': ['fala-01'],
  'do-support': ['fala-02', 'zero-05'],
  'third-person': ['fala-02', 'zero-04'],
  'past-tense': ['fala-03'],
  perfect: ['fala-05'],
  'there-is': ['fala-06'],
  preposition: ['fala-09'],
  article: ['zero-02'],
  vocabulary: ['fala-08', 'fala-11'],
  collocation: ['fala-08'],
  'false-friend': ['fala-11'],
  'verb-pattern': ['fala-07', 'fala-04'],
  agreement: ['fala-02'],
  'be-have': ['zero-01'],
};

/** Frases das aulas ligadas às categorias de erro mais frequentes do aluno. */
export function drillsForErrors(topErrors: string[]) {
  const ids = new Set(topErrors.flatMap((e) => ERROR_LESSONS[e] ?? []));
  return allSpeakingLessons.filter((l) => ids.has(l.id)).flatMap((l) => l.drills);
}
