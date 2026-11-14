import { describe, expect, it } from 'vitest';
import { FORMS } from './forms';
import { applyJudgement, compare, nextForm, reportText, scoreFree, scoreItem, speakingIndex, summarize } from './checkpoint';
import { allDrills } from '../../content';
import { normalize } from '../practice/answer';
import { autoTarget, checkpointSchedule, nextCheckpoint, phaseOf, weekOf, addDays, dayDiff } from '../plan/sixMonths';
import { addDay, weekly, planWeekTotals } from '../progress/daily';

describe('Checkpoint: banco de itens', () => {
  it('3 formas paralelas: 12 itens, mesmas categorias na mesma ordem, 2 falas livres', () => {
    const cats = FORMS[0].items.map((i) => i.cat);
    for (const f of FORMS) {
      expect(f.items).toHaveLength(12);
      expect(f.items.map((i) => i.cat)).toEqual(cats);
      expect(f.prompts).toHaveLength(2);
    }
  });
  it('nenhuma frase do checkpoint existe no curso (mede transferência, não decoreba)', () => {
    const trained = new Set(allDrills.flatMap((d) => [d.en, ...(d.alt ?? [])]).map(normalize));
    const trainedPt = new Set(allDrills.map((d) => d.pt.toLowerCase()));
    for (const f of FORMS) for (const i of f.items) {
      expect(trainedPt.has(i.pt.toLowerCase()), i.pt).toBe(false);
      for (const en of i.en) expect(trained.has(normalize(en)), en).toBe(false);
    }
  });
  it('formas têm tamanho parecido (diferença de palavras ≤ 15%)', () => {
    const words = FORMS.map((f) => f.items.reduce((a, i) => a + i.en[0].split(' ').length, 0));
    expect((Math.max(...words) - Math.min(...words)) / Math.max(...words)).toBeLessThanOrEqual(0.15);
  });
  it('rodízio A → B → C → A', () => {
    expect(nextForm([]).id).toBe('A');
    expect(nextForm([{ form: 'A' }]).id).toBe('B');
    expect(nextForm([{ form: 'A' }, { form: 'B' }, { form: 'C' }]).id).toBe('A');
  });
});

describe('Checkpoint: pontuação', () => {
  const t = { totalMs: 6000, thinkMs: 2000 };
  it('aceita contração, forma longa e número por extenso ou dígito', () => {
    const a08 = FORMS[0].items[7];
    expect(scoreItem(a08, 'I have lived here for 3 years', t, true).verdict).toBe('correct');
    expect(scoreItem(a08, 'I live here for three years', t, true).verdict).toBe('wrong');
    expect(scoreItem(a08, 'I live here for three years', t, true).errors).toContain('perfect');
    expect(scoreItem(a08, '', t, true).verdict).toBe('wrong');
    // -s da 3ª pessoa nunca passa como "erro de digitação"
    expect(scoreItem(FORMS[0].items[1], 'My boss live in London', t, false).verdict).toBe('wrong');
    expect(scoreItem(FORMS[0].items[1], 'My boss lives in Lodnon', t, false).verdict).toBe('almost');
    expect(scoreItem(FORMS[0].items[1], 'My boss lives in Lodnon', t, true).verdict).toBe('wrong');
  });
  it('fala livre: palavras por minuto e variedade', () => {
    const f = scoreFree('p', 'I work with data and I build pipelines every day', 6000);
    expect(f.words).toBe(10);
    expect(f.wpm).toBe(100);
    expect(f.variety).toBeGreaterThan(2);
  });
  it('índice cresce com precisão, velocidade e fluência; limites 0 e 100', () => {
    expect(speakingIndex(0, 5, 10)).toBe(0);
    expect(speakingIndex(1, 0.6, 130)).toBe(100);
    expect(speakingIndex(0.5, 2, 70)).toBeGreaterThan(speakingIndex(0.4, 2, 70));
    expect(speakingIndex(0.5, 1.5, 70)).toBeGreaterThan(speakingIndex(0.5, 2, 70));
    expect(speakingIndex(0.5, 2, 90)).toBeGreaterThan(speakingIndex(0.5, 2, 70));
  });
  const mk = (ok: number, ms: number, wpmText: string) => {
    const items = FORMS[0].items.map((i, k) => scoreItem(i, k < ok ? i.en[0] : 'I no know', { totalMs: ms, thinkMs: 1500 }, true));
    return summarize('A', items, [scoreFree('p', wpmText, 30000)], { at: 1, day: '2026-01-01', week: 0 });
  };
  it('resumo, comparação e relatório', () => {
    const base = mk(4, 14000, 'I work here and I like my job very much');
    const later = { ...mk(9, 8000, 'I work here and I like my job very much because the team is great and we build useful things for our clients every single day'), day: '2026-02-01', week: 4, form: 'B' as const };
    expect(base.accuracy).toBeCloseTo(4 / 12, 2);
    expect(base.modality).toBe('voz');
    const d = compare(base, later);
    expect(d.index).toBeGreaterThan(10);
    expect(d.accuracyPts).toBe(42);
    expect(d.secPerWord).toBeLessThan(0);
    expect(d.comparable).toBe(true);
    expect(reportText([base, later], 'Leo')).toMatch(/Evolução desde a linha de base: índice \+/);
  });
  it('avaliador aceita paráfrase e recalcula', () => {
    const base = mk(4, 9000, 'hello there my friend');
    const j = applyJudgement(base, [base.items[5].id], { cefr: 'B1' });
    expect(j.accuracy).toBeCloseTo(5 / 12, 2);
    expect(j.items[5].judged).toBe(true);
    expect(j.rubric?.cefr).toBe('B1');
  });
});

describe('Plano de 6 meses', () => {
  it('semana e fase', () => {
    expect(weekOf(null, '2026-01-01')).toBe(0);
    expect(weekOf('2026-01-01', '2026-01-01')).toBe(1);
    expect(weekOf('2026-01-01', '2026-01-08')).toBe(2);
    expect(phaseOf(1).id).toBe(1);
    expect(phaseOf(12).id).toBe(2);
    expect(phaseOf(26).id).toBe(4);
    expect(dayDiff('2026-01-01', addDays('2026-01-01', 45))).toBe(45);
  });
  it('meta de frases automáticas é crescente', () => {
    let prev = -1;
    for (let w = 0; w <= 26; w++) {
      expect(autoTarget(w)).toBeGreaterThanOrEqual(prev);
      prev = autoTarget(w);
    }
    expect(autoTarget(26)).toBe(340);
  });
  it('agenda de checkpoints', () => {
    expect(nextCheckpoint(checkpointSchedule(null, [], '2026-01-01'))).toEqual({ week: 0, status: 'due' });
    const s = checkpointSchedule('2026-01-01', [0], '2026-01-10');
    expect(nextCheckpoint(s)).toEqual({ week: 4, status: 'future' });
    expect(nextCheckpoint(checkpointSchedule('2026-01-01', [0], '2026-01-30'))).toEqual({ week: 4, status: 'due' });
    // pulou a semana 4: na semana 9 deve só o marco 8
    const late = checkpointSchedule('2026-01-01', [0], '2026-03-01');
    expect(late.filter((x) => x.status === 'due').map((x) => x.week)).toEqual([8]);
  });
});

describe('Estatísticas diárias', () => {
  it('soma campos e fotografa auto', () => {
    let d = addDay({}, '2026-01-01', { spokenSec: 30, spoken: 2, auto: 5 });
    d = addDay(d, '2026-01-01', { spokenSec: 30, spoken: 1, auto: 7 });
    expect(d['2026-01-01'].spokenSec).toBe(60);
    expect(d['2026-01-01'].auto).toBe(7);
  });
  it('resumo semanal e retenção só com dados suficientes', () => {
    let d = addDay({}, '2026-01-07', { spokenSec: 120, mayaSec: 300, due: 4, dueOk: 3, spoken: 6 });
    d = addDay(d, '2026-01-01', { spokenSec: 60, due: 1, dueOk: 1 });
    const w = weekly(d, '2026-01-07', 2);
    expect(w).toHaveLength(2);
    expect(w[1].speakMin).toBe(3);
    expect(w[1].mayaMin).toBe(5);
    expect(w[1].retention).toBe(80);
    expect(w[0].retention).toBeNull();
    expect(planWeekTotals(d, '2026-01-01', 1)).toEqual({ speakMin: 3, mayaMin: 5, activeDays: 2 });
  });
});
