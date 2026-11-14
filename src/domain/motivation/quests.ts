/**
 * Missões diárias + gemas (moeda). Missões variam por dia (seed = data) e
 * miram comportamentos que geram aprendizagem: falar, produzir, revisar.
 */
import { rng, shuffle } from '../practice/builder';

export type QuestMetric = 'spoken' | 'produced' | 'lessons' | 'teacherMin' | 'reviews' | 'perfectFlash' | 'stories' | 'accentChecks';

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  target: number;
  title: string;
  gems: number;
}

const POOL: QuestDef[] = [
  { id: 'speak-10', metric: 'spoken', target: 10, title: 'Fale 10 frases em voz alta', gems: 15 },
  { id: 'speak-20', metric: 'spoken', target: 20, title: 'Fale 20 frases em voz alta', gems: 25 },
  { id: 'produce-15', metric: 'produced', target: 15, title: 'Produza 15 frases do português para o inglês', gems: 20 },
  { id: 'lesson-1', metric: 'lessons', target: 1, title: 'Complete 1 aula', gems: 15 },
  { id: 'teacher-3', metric: 'teacherMin', target: 3, title: 'Converse 3 minutos com a Maya', gems: 25 },
  { id: 'reviews-10', metric: 'reviews', target: 10, title: 'Revise 10 itens vencidos', gems: 15 },
  { id: 'flash-5', metric: 'perfectFlash', target: 5, title: 'Acerte 5 frases no modo relâmpago', gems: 25 },
  { id: 'story-1', metric: 'stories', target: 1, title: 'Termine 1 história', gems: 15 },
  { id: 'accent-3', metric: 'accentChecks', target: 3, title: 'Faça 3 análises de sotaque', gems: 15 },
];

export interface QuestDay {
  day: string;
  progress: Partial<Record<QuestMetric, number>>;
  claimed: string[];
}

export function questsFor(day: string): QuestDef[] {
  const seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const r = rng(seed);
  const picked: QuestDef[] = [];
  for (const q of shuffle(POOL, r)) {
    if (picked.some((p) => p.metric === q.metric)) continue;
    picked.push(q);
    if (picked.length === 3) break;
  }
  return picked;
}

export function bump(qd: QuestDay, day: string, metric: QuestMetric, by = 1): QuestDay {
  const base = qd.day === day ? qd : { day, progress: {}, claimed: [] };
  return { ...base, progress: { ...base.progress, [metric]: (base.progress[metric] ?? 0) + by } };
}

export function claimable(qd: QuestDay, day: string): QuestDef[] {
  if (qd.day !== day) return [];
  return questsFor(day).filter((q) => (qd.progress[q.metric] ?? 0) >= q.target && !qd.claimed.includes(q.id));
}

export const SHOP = [
  { id: 'freeze', title: 'Proteção de sequência', desc: 'Protege 1 dia sem estudo.', price: 60 },
  { id: 'teacher-theme', title: 'Professora com óculos de sol', desc: 'Visual extra para a Maya.', price: 120 },
] as const;
