import { describe, expect, it } from 'vitest';
import { applyProduction, buildProductionQueue, flashLimitMs, nextStage } from './ladder';
import { detectErrors, errorProfile } from './errors';
import { analyzeAccent, classify } from '../pronunciation/accent';
import { bump, claimable, questsFor } from '../motivation/quests';
import { falaLessons } from '../../content/en/fala';

describe('Escada de produção', () => {
  it('sobe ao acertar, mantém com hesitação, desce ao errar', () => {
    expect(nextStage(0, { correct: true, hesitant: false })).toBe(1);
    expect(nextStage(2, { correct: true, hesitant: true })).toBe(2);
    expect(nextStage(2, { correct: false, hesitant: false })).toBe(1);
    expect(nextStage(0, { correct: false, hesitant: false })).toBe(0);
    expect(nextStage(4, { correct: true, hesitant: false })).toBe(4);
  });
  it('tempo do relâmpago cresce com a frase', () => {
    expect(flashLimitMs('I am here')).toBeLessThan(flashLimitMs('I have been working here for two years'));
  });
  it('aplica tentativas e agenda revisão', () => {
    const now = new Date('2026-03-01T10:00:00');
    const s = applyProduction({}, [{ drillId: 'x', stage: 0, correct: true, hesitant: false, ms: 1000, errors: [] }], now);
    expect(s.x.stage).toBe(1);
    expect(s.x.card).toBeDefined();
  });
  it('fila prioriza vencidos e limita novos', () => {
    const drills = falaLessons[0].drills;
    const q = buildProductionQueue(drills, {}, { max: 8, newLimit: 5 });
    expect(q).toHaveLength(5);
    expect(q.every((i) => i.reason === 'new' && i.stage === 0)).toBe(true);
  });
});

describe('Detector de erros PT-BR', () => {
  it('sujeito faltando', () => expect(detectErrors('is raining', ["It's raining."])).toContain('missing-subject'));
  it('there is', () => expect(detectErrors('have a bug in production', ['There is a bug in production.'])).toContain('there-is'));
  it('do-support', () => expect(detectErrors('you like coffee?', ['Do you like coffee?'])).toContain('do-support'));
  it('3ª pessoa', () => expect(detectErrors('she work at a bank', ['She works at a bank.'])).toContain('third-person'));
  it('3ª pessoa com substantivo', () => {
    expect(detectErrors('my boss live in london', ['My boss lives in London.'])).toContain('third-person');
    expect(detectErrors('there are two error in the report', ['There are two errors in the report.'])).not.toContain('third-person');
  });
  it('passado', () => expect(detectErrors('yesterday i go to the office', ['Yesterday I went to the office.'])).toContain('past-tense'));
  it('ordem do adjetivo', () => expect(detectErrors('a database big', ['a big database'])).toContain('word-order'));
  it('perfect', () => expect(detectErrors('i work here for two years', ['I have been working here for two years.'])).toContain('perfect'));
  it('resposta certa = sem erros', () => expect(detectErrors("it's raining", ["It's raining."])).toEqual([]));
  it('perfil agrega', () => expect(errorProfile([['a', 'b'], ['a']])[0]).toEqual({ id: 'a', count: 2 }));
});

describe('Análise de sotaque', () => {
  it('classifica trocas típicas', () => {
    expect(classify('think', 'sink')).toBe('th');
    expect(classify('ship', 'sheep')).toBe('short-long-i');
    expect(classify('bad', 'bed')).toBe('ae-e');
    expect(classify('worked', 'work')).toBe('ed');
  });
  it('alinha e pontua', () => {
    const r = analyzeAccent('I think this is a big problem', 'I sink this is a big problem');
    expect(r.score).toBe(86);
    expect(r.rules[0]).toEqual({ id: 'th', words: ['think'] });
  });
  it('vogal epentética', () => {
    const r = analyzeAccent('a big dog', 'a big e dog');
    expect(r.rules.map((x) => x.id)).toContain('final-vowel');
  });
});

describe('Missões', () => {
  it('3 missões por dia, métricas distintas, determinísticas', () => {
    const q = questsFor('2026-03-01');
    expect(q).toHaveLength(3);
    expect(new Set(q.map((x) => x.metric)).size).toBe(3);
    expect(questsFor('2026-03-01')).toEqual(q);
  });
  it('progresso e resgate', () => {
    const day = '2026-03-01';
    const q = questsFor(day)[0];
    const qd = bump({ day: 'x', progress: {}, claimed: [] }, day, q.metric, q.target);
    expect(claimable(qd, day).map((c) => c.id)).toContain(q.id);
  });
});
