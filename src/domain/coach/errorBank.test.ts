import { describe, expect, it } from 'vitest';
import { addErrors, checkFix, dueErrors, isDue, reviewError, toCard } from './errorBank';
import { spot } from './spotter';
import type { Issue } from './mediation';

const issues = (t: string): Issue[] => spot(t).map((s) => ({ source: 'rule' as const, ...s }));
const T = 'Yesterday I go to the office and she work late';

describe('Banco de erros pessoais', () => {
  it('cria cartões com contexto errado e corrigido', () => {
    const c = toCard(issues(T)[0], T, 1);
    expect(c.wrongContext).toBe('Yesterday I go to the office');
    expect(c.context).toBe('Yesterday I went to the office');
    expect(c.id).toMatch(/^err-past-marker-go/);
  });
  it('não duplica: o mesmo erro só soma na contagem', () => {
    let bank = addErrors([], issues(T), T, 1000);
    expect(bank).toHaveLength(2);
    bank = addErrors(bank, issues(T), T, 2000);
    expect(bank).toHaveLength(2);
    expect(bank.every((c) => c.seen === 2)).toBe(true);
  });
  it('correção: precisa da forma certa e não pode repetir o erro', () => {
    const [go, work] = addErrors([], issues(T), T).reverse();
    expect(checkFix(go, 'Yesterday I went to the office')).toBe(true);
    expect(checkFix(go, 'Yesterday I go to the office')).toBe(false);
    expect(checkFix(work, 'she works late')).toBe(true);
    expect(checkFix(work, 'she work late')).toBe(false);
  });
  it('acerto agenda para depois; erro volta logo; repetir o erro na fala reabre o cartão', () => {
    const now = new Date('2026-03-01T10:00:00');
    let bank = addErrors([], issues(T), T, now.getTime());
    const id = bank[0].id;
    expect(dueErrors(bank, now.getTime())).toHaveLength(2);
    bank = reviewError(bank, id, true, false, now);
    bank = reviewError(bank, id, true, false, new Date(bank[0].card!.due));
    expect(isDue(bank[0], now.getTime() + 3_600_000)).toBe(false);
    expect(dueErrors(bank, now.getTime() + 3_600_000)).toHaveLength(1);
    bank = addErrors(bank, issues(T), T, now.getTime() + 7_200_000);
    expect(isDue(bank.find((c) => c.id === id)!, now.getTime() + 7_200_000)).toBe(true);
    const failed = reviewError(bank, id, false, false, now);
    expect(new Date(failed.find((c) => c.id === id)!.card!.due).getTime() - now.getTime()).toBeLessThan(3_600_000);
  });
  it('os mais repetidos vêm primeiro', () => {
    let bank = addErrors([], issues('she work late'), 'she work late', 1);
    bank = addErrors(bank, issues('I have 30 years'), 'I have 30 years', 2);
    bank = addErrors(bank, issues('I have 30 years'), 'I have 30 years', 3);
    expect(dueErrors(bank, 10)[0].rule).toBe('age');
  });
});
