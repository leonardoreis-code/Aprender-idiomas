import type { SpeakingLesson } from '../domain/curriculum/speaking';
import type { LearnerLevel } from '../infra/storage';
import { zeroLessons } from './en/zero';
import { falaLessons } from './en/fala';
import { techLessons } from './en/tech';
import { stories } from './en/stories';
import { videoLessons } from './en/videos';

export const TRACKS = [
  { id: 'zero', title: 'Do zero', level: 'A1', color: 'var(--tangerine)', desc: 'Para quem nunca estudou: frases curtas, muito apoio em português.', lessons: zeroLessons },
  { id: 'fala', title: 'Destravar a fala', level: 'A2 → B1', color: 'var(--indigo)', desc: 'Você entende, mas trava para montar a frase. Aqui você aprende a pensar em inglês.', lessons: falaLessons },
  { id: 'tech', title: 'Inglês para tech', level: 'B1', color: 'var(--teal)', desc: 'Daily, bloqueios, pipelines, métricas e entrevistas de dados.', lessons: techLessons },
] as const;

export const allSpeakingLessons: SpeakingLesson[] = [...zeroLessons, ...falaLessons, ...techLessons];
export const allDrills = allSpeakingLessons.flatMap((l) => l.drills);
export const findSpeakingLesson = (id: string) => allSpeakingLessons.find((l) => l.id === id);
export const videoForLesson = (lessonId: string) => videoLessons.find((v) => v.lessonId === lessonId)?.id ?? null;
export { stories, videoLessons };

/** Trilha recomendada a partir do perfil. */
export function recommendedTracks(level: LearnerLevel, goals: string[]): string[] {
  const base = level === 'zero' ? ['zero', 'fala'] : ['fala'];
  if (goals.includes('trabalho') || goals.includes('entrevista')) base.push('tech');
  return base;
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
