import { describe, expect, it } from 'vitest';
import { goalsMet } from '../domain/sim/engine';
import { DAY_TAGS, GLOSSARY, MISSIONS } from './missions';
import { GLOSSARY_EXTRA, MISSIONS_EXTRA } from './missions2';

const tagIds = new Set(DAY_TAGS.map((t) => t.id));

/** Contraste WCAG entre a cor do personagem e letra branca. */
const contrastWithWhite = (hex: string) => {
  const [r, gr, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * gr + 0.0722 * b + 0.05);
};

describe('Simulações extras', () => {
  it('são 10, com ids únicos que não colidem com as existentes', () => {
    expect(MISSIONS_EXTRA).toHaveLength(10);
    const ids = MISSIONS_EXTRA.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    const existing = new Set(MISSIONS.map((m) => m.id));
    for (const id of ids) expect(existing.has(id), id).toBe(false);
  });

  it('seis são de trabalho e quatro do dia a dia', () => {
    expect(MISSIONS_EXTRA.filter((m) => m.area === 'trabalho')).toHaveLength(6);
    expect(MISSIONS_EXTRA.filter((m) => m.area === 'vida')).toHaveLength(4);
  });

  it('cada uma tem 4 objetivos (ids únicos) e de 3 a 5 falas', () => {
    for (const m of MISSIONS_EXTRA) {
      expect(m.goals, m.id).toHaveLength(4);
      expect(new Set(m.goals.map((g) => g.id)).size, m.id).toBe(4);
      expect(m.beats.length, m.id).toBeGreaterThanOrEqual(3);
      expect(m.beats.length, m.id).toBeLessThanOrEqual(5);
    }
  });

  it('todo objetivo é pedido por alguma fala e todo wants existe', () => {
    for (const m of MISSIONS_EXTRA) {
      const goalIds = new Set(m.goals.map((g) => g.id));
      const wanted = new Set(m.beats.flatMap((b) => b.wants));
      for (const id of goalIds) expect(wanted.has(id), `${m.id}: ${id} nunca é pedido`).toBe(true);
      for (const id of wanted) expect(goalIds.has(id), `${m.id}: wants ${id} não existe`).toBe(true);
      for (const b of m.beats) expect(b.wants.length, m.id).toBeGreaterThan(0);
    }
  });

  it('o exemplo de cada objetivo é reconhecido pelo próprio detector', () => {
    for (const m of MISSIONS_EXTRA) {
      for (const g of m.goals) expect(goalsMet(m.goals, g.example), `${m.id}/${g.id}: "${g.example}"`).toContain(g.id);
    }
  });

  it('respostas vazias de conteúdo não cumprem nenhum objetivo', () => {
    for (const m of MISSIONS_EXTRA) {
      for (const empty of ['hello hmm okay', 'yes', 'no', 'okay sure', 'I see', '']) {
        expect(goalsMet(m.goals, empty), `${m.id}: "${empty}"`).toEqual([]);
      }
    }
  });

  it('detectores usam expressões normalizadas (minúsculas, sem pontuação, apóstrofo reto)', () => {
    for (const m of MISSIONS_EXTRA) {
      for (const g of m.goals) {
        expect(g.detect.length, `${m.id}/${g.id}`).toBeGreaterThan(0);
        for (const group of g.detect) {
          expect(group.length, `${m.id}/${g.id}`).toBeGreaterThan(0);
          for (const phrase of group) expect(phrase, `${m.id}/${g.id}`).toMatch(/^[a-z0-9']+( [a-z0-9']+)*$/);
        }
      }
    }
  });

  it('textos obrigatórios preenchidos, starter termina em reticências, sem travessão', () => {
    for (const m of MISSIONS_EXTRA) {
      const texts = [m.title, m.setting, m.closing, m.character.name, m.character.role];
      for (const g of m.goals) {
        texts.push(g.label, g.pt, g.example, g.starter);
        expect(g.starter.endsWith('…'), `${m.id}/${g.id}`).toBe(true);
      }
      for (const b of m.beats) texts.push(b.say, b.pt, b.nudge);
      for (const t of texts) {
        expect(t.trim().length, m.id).toBeGreaterThan(0);
        expect(t.includes('\u2014'), `${m.id}: "${t}"`).toBe(false);
      }
      const placeholders = [m.closing, ...m.beats.flatMap((b) => [b.say, b.nudge])].join(' ').match(/\{[^}]*\}/g) ?? [];
      for (const p of placeholders) expect(['{project}', '{teammate}', '{tool}', '{role}'], m.id).toContain(p);
    }
  });

  it('tags só usam ids de DAY_TAGS', () => {
    for (const m of MISSIONS_EXTRA) {
      for (const tag of m.tags) expect(tagIds.has(tag), `${m.id}: ${tag}`).toBe(true);
    }
  });

  it('personagem tem voz 0 ou 1 e cor escura o bastante para letra branca', () => {
    for (const m of MISSIONS_EXTRA) {
      expect([0, 1], m.id).toContain(m.character.voice);
      expect(m.character.color, m.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrastWithWhite(m.character.color), m.id).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('Glossário extra', () => {
  const keys = Object.keys(GLOSSARY_EXTRA);

  it('tem pelo menos 150 entradas', () => {
    expect(keys.length).toBeGreaterThanOrEqual(150);
  });

  it('chaves em minúsculas e sem acento', () => {
    for (const k of keys) {
      expect(k, k).toBe(k.toLowerCase().trim());
      expect(k, k).toMatch(/^[a-z]+( [a-z]+)*$/);
    }
  });

  it('nenhuma chave repete o GLOSSARY existente', () => {
    for (const k of keys) expect(k in GLOSSARY, k).toBe(false);
  });

  it('valores preenchidos e sem travessão', () => {
    for (const k of keys) {
      const v = GLOSSARY_EXTRA[k];
      expect(v.trim().length, k).toBeGreaterThan(0);
      expect(v.includes('\u2014'), k).toBe(false);
    }
  });
});
