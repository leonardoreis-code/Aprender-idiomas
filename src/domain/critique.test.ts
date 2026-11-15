import { describe, expect, it } from 'vitest';
import { FORMS } from './assessment/forms';
import { scoreFree, scoreItem, summarize } from './assessment/checkpoint';
import { applyProduction, buildProductionQueue, startStageFor } from './production/ladder';
import { falaLessons } from '../content/en/fala';

/** Regressões da rodada de crítica: o índice não pode premiar resposta rápida e errada. */
describe('Índice de fala honesto', () => {
  const form = FORMS[0];
  const meta = { at: 1, day: '2026-11-15', week: 0 };

  it('0% de acerto, digitando rápido, não passa de 10 pontos', () => {
    const items = form.items.map((it) => scoreItem(it, 'banana banana banana', { totalMs: 900, thinkMs: 200 }, false));
    // 10 palavras digitadas em 3 s numa janela de 45 s
    const free = form.prompts.map((p) => scoreFree(p.en, 'I like work I like data I like code ok', 3000, 45_000));
    const r = summarize(form.id, items, free, meta);
    expect(r.accuracy).toBe(0);
    expect(r.secPerWord).toBe(0);
    expect(r.wpm).toBeLessThanOrEqual(14);
    expect(r.index).toBeLessThanOrEqual(10);
  });

  it('velocidade só usa frases certas', () => {
    const [a, b] = form.items;
    const items = [
      scoreItem(a, a.en[0], { totalMs: 6000, thinkMs: 1000 }, false),
      scoreItem(b, 'nothing to do with it', { totalMs: 500, thinkMs: 100 }, false),
    ];
    const r = summarize(form.id, items, [], meta);
    const words = a.en[0].split(/\s+/).length;
    expect(r.secPerWord).toBeCloseTo(6 / words, 1);
  });

  it('fala livre vale pela janela inteira', () => {
    expect(scoreFree('x', 'one two three four five six seven eight nine ten', 3000, 45_000).wpm).toBe(13);
    expect(scoreFree('x', 'one two three four five six seven eight nine ten', 3000).wpm).toBe(200);
  });
});

describe('Escada: quem entende começa produzindo', () => {
  const drills = falaLessons[0].drills;

  it('degrau de entrada por nível', () => {
    expect(startStageFor('zero')).toBe(0);
    expect(startStageFor('fala')).toBe(2);
    expect(startStageFor('avancado')).toBe(3);
    const q = buildProductionQueue(drills, {}, { startStage: 2, newLimit: 3 });
    expect(q.every((x) => x.stage === 2)).toBe(true);
  });

  it('acertar no degrau apresentado sobe a partir dele, não do zero', () => {
    const d = drills[0];
    const s = applyProduction({}, [{ drillId: d.id, stage: 2, correct: true, hesitant: false, ms: 3000, errors: [] }]);
    expect(s[d.id].stage).toBe(3);
  });

  it('errar no degrau 2 desce para o 1', () => {
    const d = drills[0];
    const s = applyProduction({}, [{ drillId: d.id, stage: 2, correct: false, hesitant: false, ms: 3000, errors: [] }]);
    expect(s[d.id].stage).toBe(1);
  });
});

import { checkTyped } from './practice/answer';
import { repaired } from './coach/mediation';
import { asksRepeat } from './sim/engine';
import { addXp, initialMotivation } from './motivation/motivation';
import { spot } from './coach/spotter';
import { weekly } from './progress/daily';

describe('Correção de resposta (achados da revisão de bugs)', () => {
  it('outra palavra real não passa como erro de digitação', () => {
    expect(checkTyped('were do you live', ['Where do you live?'])).toBe('wrong');
    expect(checkTyped('I thing the project is late', ['I think the project is late'])).toBe('wrong');
    expect(checkTyped('is three any coffee', ['Is there any coffee?'])).toBe('wrong');
    expect(checkTyped('I brought a laptop', ['I bought a laptop'])).toBe('wrong');
    expect(checkTyped('nice to meet you, plaese', ['Nice to meet you, please'])).toBe('almost');
  });
  it('números, hífens, porcentagem e a.m. como o reconhecedor escreve', () => {
    expect(checkTyped('I am 20 years old', ['I am twenty years old.'])).toBe('correct');
    expect(checkTyped('I am thirty two years old', ['I am thirty-two years old.'])).toBe('correct');
    expect(checkTyped('it dropped by 30 percent', ['It dropped by 30%.'])).toBe('correct');
    expect(checkTyped('at 6 am', ['at 6 a.m.'])).toBe('correct');
    expect(checkTyped('she gets home at 6:15', ['She gets home at six fifteen.'])).toBe('correct');
    expect(checkTyped('my mother in law', ['my mother-in-law'])).toBe('correct');
  });
});

describe('Conserto e conversa', () => {
  const issue = { source: 'rule' as const, rule: 'past', cat: 'past-tense', wrong: 'go', fix: 'went', clue: '', explain: '' };
  it('"ago" não conta como repetir o erro "go"', () => {
    expect(repaired(issue, 'Two days ago I went to the office')).toBe(true);
    expect(repaired(issue, 'Two days ago I go to the office')).toBe(false);
  });
  it('resposta com "didn\'t get" não é pedido de repetição', () => {
    expect(asksRepeat("I didn't get the data from the API")).toBe(false);
    expect(asksRepeat('We need to repeat the test tomorrow morning')).toBe(false);
    expect(asksRepeat("Sorry, I didn't get that")).toBe(true);
    expect(asksRepeat('Could you repeat, please?')).toBe(true);
  });
  it('detector não marca inglês correto comum', () => {
    for (const ok of [
      'I suggested to the team that we wait',
      'The most important thing for me is my family',
      'The file I sent you has two tabs',
      "Why doesn't he like it?",
      'I have 10 years experience with data',
      'Yesterday was hard',
      'I realized the project was late',
      'I live here and have two kids',
    ]) expect(spot(ok).map((s) => s.rule), ok).toEqual([]);
  });
});

describe('Sequência e semana', () => {
  it('bater a meta depois de 10 dias parado não soma em cima da sequência velha', () => {
    const s = { ...initialMotivation(), streak: 5, lastGoalDay: '2026-01-01', freezes: 0, dailyGoal: 10 };
    expect(addXp(s, 20, '2026-01-11').state.streak).toBe(1);
  });
  it('dia só de conversa não zera "frases automáticas" da semana', () => {
    const base = { spokenSec: 0, spoken: 0, produced: 0, correct: 0, due: 0, dueOk: 0, spwSum: 0, spwN: 0, mayaSec: 0, wpmSum: 0, wpmN: 0, auto: 0, repN: 0, repSelf: 0, latSum: 0, latN: 0, pauses: 0, pauseMin: 0 };
    const w = weekly({ '2026-01-06': { ...base, produced: 12, auto: 37 }, '2026-01-10': { ...base, mayaSec: 300 } }, '2026-01-10', 1);
    expect(w[0].auto).toBe(37);
  });
});
