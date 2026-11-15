import { describe, expect, it } from 'vitest';
import { FORMS } from '../domain/assessment/forms';
import { FORMS_EXTRA } from '../domain/assessment/forms2';
import { normalize } from '../domain/practice/answer';
import { STORIES, retellCoverage } from './coach';
import { STORIES_EXTRA } from './retell2';
import { kitLessons } from './en/kit';
import { falaLessons } from './en/fala';
import { zeroLessons } from './en/zero';
import { techLessons } from './en/tech';

/* Robusto caso o conteúdo extra venha a ser incorporado às listas base. */
const baseForms = FORMS.filter((f) => !FORMS_EXTRA.includes(f));
const allForms = [...baseForms, ...FORMS_EXTRA];
const baseStories = STORIES.filter((s) => !STORIES_EXTRA.includes(s));
const courseLessons = [...zeroLessons, ...falaLessons, ...techLessons].filter((l) => !kitLessons.includes(l));

describe('Checkpoint: formas extras D, E, F', () => {
  it('3 formas paralelas: 12 itens, mesmas categorias na mesma ordem, 2 falas livres', () => {
    expect(FORMS_EXTRA.map((f) => f.id)).toEqual(['D', 'E', 'F']);
    expect(allForms).toHaveLength(6);
    const cats = FORMS[0].items.map((i) => i.cat);
    for (const f of FORMS_EXTRA) {
      expect(f.items).toHaveLength(12);
      expect(f.items.map((i) => i.cat)).toEqual(cats);
      expect(f.items.map((i) => i.id)).toEqual(cats.map((_, k) => `${f.id}${String(k + 1).padStart(2, '0')}`));
      expect(f.prompts).toHaveLength(2);
      for (const p of f.prompts) {
        expect(p.en.trim()).not.toBe('');
        expect(p.pt.trim()).not.toBe('');
      }
      for (const i of f.items) {
        expect(i.pt.trim(), i.id).not.toBe('');
        expect(i.en.length, i.id).toBeGreaterThan(0);
      }
    }
  });
  it('ids únicos nas 6 formas', () => {
    const ids = [...allForms.map((f) => f.id), ...allForms.flatMap((f) => f.items.map((i) => i.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('as 6 formas têm tamanho parecido (diferença de palavras ≤ 15%)', () => {
    const words = allForms.map((f) => f.items.reduce((a, i) => a + i.en[0].split(' ').length, 0));
    expect((Math.max(...words) - Math.min(...words)) / Math.max(...words)).toBeLessThanOrEqual(0.15);
  });
  it('nenhuma frase repetida entre as 6 formas (pt e todas as respostas en)', () => {
    const pts = allForms.flatMap((f) => f.items.map((i) => i.pt.toLowerCase()));
    expect(new Set(pts).size).toBe(pts.length);
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const f of allForms) for (const i of f.items) {
      for (const key of new Set(i.en.map(normalize))) {
        const other = seen.get(key);
        if (other) dup.push(`${i.id} × ${other}: ${key}`);
        else seen.set(key, i.id);
      }
    }
    expect(dup).toEqual([]);
  });
  it('prompts de fala livre diferentes dos existentes', () => {
    const prompts = allForms.flatMap((f) => f.prompts.map((p) => normalize(p.en)));
    expect(new Set(prompts).size).toBe(prompts.length);
  });
  it('nenhuma frase das formas extras existe nas aulas do curso', () => {
    const drills = [...courseLessons, ...kitLessons].flatMap((l) => l.drills);
    const trained = new Set(drills.flatMap((d) => [d.en, ...(d.alt ?? [])]).map(normalize));
    const trainedPt = new Set(drills.map((d) => d.pt.toLowerCase()));
    for (const f of FORMS_EXTRA) for (const i of f.items) {
      expect(trainedPt.has(i.pt.toLowerCase()), i.pt).toBe(false);
      for (const en of i.en) expect(trained.has(normalize(en)), en).toBe(false);
    }
  });
});

describe('Reconto: histórias extras', () => {
  const wordCount = (text: string) => text.trim().split(/\s+/).length;
  it('8 histórias, ids r7 a r14, únicos e diferentes dos de STORIES', () => {
    expect(STORIES_EXTRA).toHaveLength(8);
    const ids = STORIES_EXTRA.map((s) => s.id);
    expect(ids).toEqual(['r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14']);
    expect(new Set(ids).size).toBe(ids.length);
    const base = new Set(baseStories.map((s) => s.id));
    for (const id of ids) expect(base.has(id), id).toBe(false);
    const titles = [...baseStories, ...STORIES_EXTRA].map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('níveis: 3 A2, 3 B1, 2 B2', () => {
    const count = (lv: string) => STORIES_EXTRA.filter((s) => s.level === lv).length;
    expect([count('A2'), count('B1'), count('B2')]).toEqual([3, 3, 2]);
  });
  it('55 a 85 palavras e 5 a 7 ideias, com chaves em minúsculas', () => {
    for (const s of STORIES_EXTRA) {
      const n = wordCount(s.text);
      expect(n, `${s.id}: ${n} palavras`).toBeGreaterThanOrEqual(55);
      expect(n, `${s.id}: ${n} palavras`).toBeLessThanOrEqual(85);
      expect(s.ideas.length, s.id).toBeGreaterThanOrEqual(5);
      expect(s.ideas.length, s.id).toBeLessThanOrEqual(7);
      for (const idea of s.ideas) {
        expect(idea.label.trim(), s.id).not.toBe('');
        expect(idea.keys.length, `${s.id}: ${idea.label}`).toBeGreaterThan(0);
        for (const group of idea.keys) {
          expect(group.length, `${s.id}: ${idea.label}`).toBeGreaterThan(0);
          for (const k of group) expect(k, `${s.id}: ${idea.label}`).toMatch(/^[a-z']+( [a-z']+)*$/);
        }
      }
    }
  });
  it('o próprio texto cobre todas as ideias', () => {
    for (const s of STORIES_EXTRA) {
      const missing = retellCoverage(s, s.text).filter((c) => !c.ok).map((c) => `${s.id}: ${c.label}`);
      expect(missing).toEqual([]);
    }
  });
  it('um reconto vazio de conteúdo não cobre nenhuma ideia', () => {
    for (const s of STORIES_EXTRA) {
      const covered = retellCoverage(s, 'hello this is a story').filter((c) => c.ok).map((c) => `${s.id}: ${c.label}`);
      expect(covered).toEqual([]);
    }
  });
});

describe('Kit de sobrevivência em reunião', () => {
  it('2 aulas (fala-13 e fala-14) no formato da trilha fala', () => {
    expect(kitLessons.map((l) => l.id)).toEqual(['fala-13', 'fala-14']);
    expect(kitLessons.map((l) => l.order)).toEqual([13, 14]);
    for (const l of kitLessons) {
      expect(l.track).toBe('fala');
      expect(l.level).toBe('B1');
      expect(l.minutes).toBe(12);
      expect(l.pattern.frame.trim()).not.toBe('');
      expect(l.pattern.meaning.trim()).not.toBe('');
      expect(l.speakingPrompt.en.trim()).not.toBe('');
      expect(l.speakingPrompt.pt.trim()).not.toBe('');
    }
  });
  it('12 drills por aula, com ids em sequência', () => {
    for (const l of kitLessons) {
      expect(l.drills).toHaveLength(12);
      expect(l.drills.map((d) => d.id)).toEqual(l.drills.map((_, k) => `${l.id}-d${String(k + 1).padStart(2, '0')}`));
    }
  });
  it('chunks reconstituem a frase inglesa (ordem do inglês), 2 a 5 por frase, pt nunca vazio', () => {
    const bad: string[] = [];
    for (const l of kitLessons) for (const d of l.drills) {
      const joined = d.chunks.map((c) => c.en).join(' ');
      if (normalize(joined) !== normalize(d.en)) bad.push(`${d.id}: ${d.en}`);
      if (joined !== d.en.replace(/[.?!]+$/, '')) bad.push(`${d.id}: pontuação dos chunks`);
      if (d.chunks.length < 2 || d.chunks.length > 5) bad.push(`${d.id}: ${d.chunks.length} chunks`);
      if (d.chunks.some((c) => !c.pt.trim() || !c.en.trim())) bad.push(`${d.id}: chunk vazio`);
    }
    expect(bad).toEqual([]);
  });
  it('artigo: 8 a 12 blocos, com contraste PT×EN (erro típico), exemplos e 1 dica', () => {
    for (const l of kitLessons) {
      expect(l.article.length).toBeGreaterThanOrEqual(8);
      expect(l.article.length).toBeLessThanOrEqual(12);
      const compares = l.article.filter((b) => b.type === 'compare');
      expect(compares.length).toBeGreaterThanOrEqual(2);
      for (const c of compares) if (c.type === 'compare') expect((c.wrong ?? '').trim(), c.pt).not.toBe('');
      expect(l.article.filter((b) => b.type === 'example').length).toBeGreaterThanOrEqual(3);
      expect(l.article.filter((b) => b.type === 'tip')).toHaveLength(1);
    }
  });
  it('ids únicos, sem colisão com as aulas existentes, e frases inéditas', () => {
    const lessons = [...courseLessons, ...kitLessons];
    const ids = [...lessons.map((l) => l.id), ...lessons.flatMap((l) => l.drills.map((d) => d.id))];
    expect(new Set(ids).size).toBe(ids.length);
    const course = new Set(courseLessons.flatMap((l) => l.drills.flatMap((d) => [d.en, ...(d.alt ?? [])].map(normalize))));
    const kit = kitLessons.flatMap((l) => l.drills);
    expect(new Set(kit.map((d) => normalize(d.en))).size).toBe(kit.length);
    for (const d of kit) expect(course.has(normalize(d.en)), d.en).toBe(false);
  });
});
