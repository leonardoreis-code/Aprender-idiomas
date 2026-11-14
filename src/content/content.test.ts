import { describe, expect, it } from 'vitest';
import { falaLessons } from './en/fala';
import { zeroLessons } from './en/zero';
import { techLessons } from './en/tech';
import { stories } from './en/stories';
import { videoLessons } from './en/videos';
import { normalize } from '../domain/practice/answer';

const lessons = [...zeroLessons, ...falaLessons, ...techLessons];

describe('Conteúdo v2', () => {
  it('quantidades mínimas', () => {
    expect(zeroLessons.length).toBe(8);
    expect(falaLessons.length).toBe(12);
    expect(techLessons.length).toBe(6);
    expect(stories.length).toBe(10);
    expect(videoLessons.length).toBe(8);
  });
  it('ids únicos (aulas, drills, histórias, vídeos)', () => {
    const ids = [...lessons.map((l) => l.id), ...lessons.flatMap((l) => l.drills.map((d) => d.id)), ...stories.map((s) => s.id), ...videoLessons.map((v) => v.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('chunks reconstituem a frase inglesa (ordem do inglês)', () => {
    const bad: string[] = [];
    for (const l of lessons) for (const d of l.drills) {
      if (normalize(d.chunks.map((c) => c.en).join(' ')) !== normalize(d.en)) bad.push(`${d.id}: ${d.en}`);
      if (d.chunks.some((c) => !c.pt.trim())) bad.push(`${d.id}: chunk pt vazio`);
    }
    expect(bad).toEqual([]);
  });
  it('toda aula tem artigo com contraste PT×EN e 12 drills', () => {
    for (const l of lessons) {
      expect(l.drills).toHaveLength(12);
      expect(l.article.some((b) => b.type === 'compare')).toBe(true);
    }
  });
  it('histórias: escolhas com 1 correta, checks válidos, aluno presente', () => {
    for (const s of stories) {
      expect(s.characters.some((c) => c.id === 'you')).toBe(true);
      for (const ln of s.lines) {
        if (ln.type === 'choice') expect(ln.options.filter((o) => o.correct)).toHaveLength(1);
        if (ln.type === 'check') expect(ln.answer).toBeLessThan(ln.options.length);
        if (ln.type === 'line') expect(s.characters.some((c) => c.id === ln.speaker)).toBe(true);
      }
    }
  });
  it('vídeos: quiz válido e lessonId existente', () => {
    const ids = new Set(lessons.map((l) => l.id));
    for (const v of videoLessons) {
      if (v.lessonId) expect(ids.has(v.lessonId)).toBe(true);
      for (const s of v.slides) if (s.visual.kind === 'quiz') expect(s.visual.answer).toBeLessThan(s.visual.options.length);
    }
  });
});
