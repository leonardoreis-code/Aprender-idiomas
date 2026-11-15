import { describe, expect, it } from 'vitest';
import { goalMet } from '../domain/sim/engine';
import { MEETINGS } from './meetings';

const ALLOWED = new Set(['you', 'role', 'project', 'teammate', 'tool']);

const placeholders = (text: string) => [...text.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);

describe('Reuniões ao vivo', () => {
  it('são 6, com ids únicos e um kind de cada', () => {
    expect(MEETINGS).toHaveLength(6);
    const ids = MEETINGS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    const kinds = MEETINGS.map((m) => m.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect([...kinds].sort()).toEqual(['client', 'daily', 'incident', 'interview', 'planning', 'retro']);
  });

  for (const m of MEETINGS) {
    describe(m.id, () => {
      const people = new Set(m.participants.map((p) => p.id));
      const goalIds = new Set(m.goals.map((g) => g.id));

      it('tem 2–3 participantes com ids únicos e vozes não todas iguais', () => {
        expect(m.participants.length).toBeGreaterThanOrEqual(2);
        expect(m.participants.length).toBeLessThanOrEqual(3);
        expect(people.size).toBe(m.participants.length);
        expect(new Set(m.participants.map((p) => p.voice)).size).toBeGreaterThan(1);
      });

      it('só usa participantes válidos em todas as falas', () => {
        for (const t of m.agenda) {
          expect(people.has(t.by), t.by).toBe(true);
          if (t.nudgeBy) expect(people.has(t.nudgeBy), t.nudgeBy).toBe(true);
          for (const l of t.before ?? []) expect(people.has(l.by), l.by).toBe(true);
        }
        expect(people.has(m.closing.by), m.closing.by).toBe(true);
      });

      it('wants aponta para goals existentes e todo goal é pedido', () => {
        const wanted = new Set<string>();
        for (const t of m.agenda) {
          for (const w of t.wants) {
            expect(goalIds.has(w), w).toBe(true);
            wanted.add(w);
          }
        }
        for (const id of goalIds) expect(wanted.has(id), id).toBe(true);
      });

      it('cada exemplo é reconhecido e o detector não é frouxo demais', () => {
        expect(goalIds.size).toBe(m.goals.length);
        for (const g of m.goals) {
          expect(goalMet(g, g.example), `${g.id}: ${g.example}`).toBe(true);
          expect(goalMet(g, 'yes okay thank you'), g.id).toBe(false);
        }
      });

      it('tem pelo menos 3 turnos com conversa antes', () => {
        expect(m.agenda.filter((t) => (t.before?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(3);
      });

      it('não usa placeholder desconhecido', () => {
        const texts = [m.closing.say, ...m.agenda.flatMap((t) => [t.say, t.nudge, ...(t.before ?? []).map((l) => l.say)])];
        for (const text of texts) for (const p of placeholders(text)) expect(ALLOWED.has(p), `${p} em "${text}"`).toBe(true);
      });
    });
  }
});
