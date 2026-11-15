import { describe, expect, it } from 'vitest';
import type { AppState } from '../../infra/storage';
import { addDays, autoTarget, PHASES } from '../plan/sixMonths';
import type { ProductionState, Stage } from '../production/ladder';
import { emptyDay, type Daily, type DayStats } from '../progress/daily';
import { nextAction, weekReview } from './weekly';

type ReviewState = Pick<AppState, 'daily' | 'plan' | 'production' | 'errorLog' | 'repairs'>;

const START = '2026-01-05';
/** Último dia da semana 1 (7 dias decorridos: meta proporcional = meta cheia). */
const END_W1 = '2026-01-11';

const st = (over: Partial<ReviewState> = {}): ReviewState => ({ daily: {}, plan: { startDay: START }, production: {}, errorLog: [], repairs: [], ...over });

/** `days` dias seguidos a partir de `from`, cada um com os minutos indicados. */
function days(from: string, n: number, perDay: { speak?: number; talk?: number } & Partial<DayStats> = {}): Daily {
  const { speak = 0, talk = 0, ...rest } = perDay;
  const out: Daily = {};
  for (let i = 0; i < n; i++) out[addDays(from, i)] = { ...emptyDay(), spokenSec: speak * 60, mayaSec: talk * 60, produced: 5, ...rest };
  return out;
}

const production = (n: number, stage: Stage = 3): ProductionState =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`d${i}`, { stage, mastered: 0, lastErrors: [] }]));

/** Semana 1 cheia e saudável: 42 min falando, 21 de conversa, 6 dias, frases automáticas em dia. */
const healthy = (over: Partial<ReviewState> = {}) => st({ daily: days(START, 6, { speak: 7, talk: 3.5 }), production: production(15), ...over });

describe('weekReview: números da semana', () => {
  it('usa as metas da fase e a semana do plano que contém hoje', () => {
    const daily = { ...days('2026-01-12', 3, { speak: 30 }), ...days('2026-01-19', 2, { speak: 10, talk: 4 }) };
    const r = weekReview(st({ daily }), '2026-01-20');
    expect(r.week).toBe(3);
    expect(r.phaseTitle).toBe(PHASES[0].title);
    expect(r.speakTarget).toBe(PHASES[0].speakMin);
    expect(r.talkTarget).toBe(PHASES[0].mayaMin);
    expect(r.speakMin).toBe(20); // só os dias 19 e 20: a semana 2 fica de fora
    expect(r.talkMin).toBe(8);
    expect(r.activeDays).toBe(2);
    expect(r.autoTarget).toBe(autoTarget(3));
  });

  it('muda de fase junto com a semana', () => {
    const r = weekReview(st(), addDays(START, 7 * 9)); // semana 10
    expect(r.week).toBe(10);
    expect(r.phaseTitle).toBe(PHASES[1].title);
    expect(r.speakTarget).toBe(70);
    expect(r.talkTarget).toBe(40);
  });

  it('conta como automáticas só as frases no degrau Falar ou acima', () => {
    const r = weekReview(st({ production: { ...production(4, 3), a: { stage: 4, mastered: 1, lastErrors: [] }, b: { stage: 2, mastered: 0, lastErrors: [] } } }), END_W1);
    expect(r.auto).toBe(5);
  });

  it('retenção e autocorreção vêm da última janela de 7 dias', () => {
    const daily = days(START, 6, { speak: 7, talk: 3.5, due: 2, dueOk: 1, repN: 1, repSelf: 1 });
    const r = weekReview(st({ daily }), END_W1);
    expect(r.retention).toBe(50);
    expect(r.selfRepair).toBe(100);
    expect(weekReview(st(), END_W1).retention).toBeNull();
    expect(weekReview(st(), END_W1).selfRepair).toBeNull();
  });

  it('sem medida diária, a autocorreção cai para o histórico de consertos da semana', () => {
    const at = (d: number) => new Date(2026, 0, d, 12).getTime();
    const repairs = [1, 2, 4, 5].map((level, i) => ({ rule: 'age', cat: 'be-have', level, at: at(8 + (i % 3)) }));
    expect(weekReview(st({ repairs }), END_W1).selfRepair).toBe(50);
    // consertos antigos não entram
    expect(weekReview(st({ repairs: repairs.map((r) => ({ ...r, at: at(1) })) }), END_W1).selfRepair).toBeNull();
  });

  it('lista os 3 erros mais frequentes dos últimos 80 registros', () => {
    const errorLog = [['article', 'third-person'], ['third-person'], ['third-person', 'preposition'], ['preposition'], ['past-tense'], ['perfect']];
    const r = weekReview(st({ errorLog: [...errorLog, ...Array.from({ length: 80 }, () => ['vocabulary'])] }), END_W1);
    expect(r.topErrors).toHaveLength(3);
    expect(r.topErrors[0]).toEqual({ id: 'vocabulary', count: 74 });
    expect(r.topErrors[1]).toEqual({ id: 'third-person', count: 3 });
    expect(r.topErrors[2]).toEqual({ id: 'preposition', count: 2 });
  });
});

describe('weekReview: veredito', () => {
  it('sem plano iniciado', () => {
    const r = weekReview(st({ plan: { startDay: null }, daily: days(START, 6, { speak: 20 }) }), END_W1);
    expect(r.verdict).toBe('sem-plano');
    expect(r.week).toBe(0);
    expect(r.autoTarget).toBe(0);
    expect(r.suggestions[0]).toMatch(/checkpoint inicial/);
    expect(r.focus).toMatch(/checkpoint/);
    expect(nextAction(r)).toBe('checkpoint');
  });

  it('parado: nenhum dia ativo na semana do plano', () => {
    // praticou na semana 1, nada na semana 2
    const r = weekReview(st({ daily: days(START, 5, { speak: 10 }) }), '2026-01-14');
    expect(r.week).toBe(2);
    expect(r.activeDays).toBe(0);
    expect(r.verdict).toBe('parado');
    expect(r.suggestions[0]).toMatch(/dia corrido de 5 minutos/);
    expect(nextAction(r)).toBe('pratica');
  });

  it('adiantado: 110% ou mais da meta proporcional', () => {
    expect(weekReview(st({ daily: days(START, 6, { speak: 7.5 }) }), END_W1).verdict).toBe('adiantado'); // 45 de 40
    // no terceiro dia a meta proporcional é 40 × 3/7, cerca de 17 min
    expect(weekReview(st({ daily: days(START, 3, { speak: 6.5 }) }), '2026-01-07').verdict).toBe('adiantado'); // 20 (arredondado)
  });

  it('no ritmo: entre 70% e 110% da meta proporcional', () => {
    expect(weekReview(st({ daily: days(START, 6, { speak: 5 }) }), END_W1).verdict).toBe('no-ritmo'); // 30 de 40
    expect(weekReview(st({ daily: days(START, 6, { speak: 7 }) }), END_W1).verdict).toBe('no-ritmo'); // 42 < 44
    expect(weekReview(st({ daily: days(START, 3, { speak: 5 }) }), '2026-01-07').verdict).toBe('no-ritmo'); // 15 de ~17
    // os mesmos 15 minutos no fim da semana já são atraso
    expect(weekReview(st({ daily: days(START, 3, { speak: 5 }) }), END_W1).verdict).toBe('atrasado');
  });

  it('atrasado: abaixo de 70% da meta proporcional', () => {
    const r = weekReview(st({ daily: days(START, 6, { speak: 3 }) }), END_W1); // 18 de 40
    expect(r.verdict).toBe('atrasado');
    expect(r.suggestions.join(' ')).toMatch(/18 de 40 minutos/);
    expect(r.focus).toMatch(/40 minutos falando/);
  });
});

describe('weekReview: sugestões', () => {
  const all = (r: { suggestions: string[] }) => r.suggestions.join(' | ');

  it('semana saudável: uma sugestão de manutenção e nada mais', () => {
    const r = weekReview(healthy(), END_W1);
    expect(r.verdict).toBe('no-ritmo');
    expect(r.suggestions).toHaveLength(1);
    expect(r.focus).toMatch(/Manter/);
    expect(nextAction(r)).toBe('pratica');
  });

  it('retenção abaixo de 75%: revisar antes de aula nova', () => {
    const daily = days(START, 6, { speak: 7, talk: 3.5, due: 5, dueOk: 3 });
    const r = weekReview(healthy({ daily }), END_W1);
    expect(r.retention).toBe(60);
    expect(r.suggestions[0]).toMatch(/retenção está em 60%.*antes de abrir aula nova/);
    expect(r.focus).toMatch(/Revisar antes/);
    expect(all(weekReview(healthy({ daily: days(START, 6, { speak: 7, talk: 3.5, due: 5, dueOk: 4 }) }), END_W1))).not.toMatch(/retenção/);
  });

  it('autocorreção abaixo de 40%: manter a marcação ao vivo e usar a pista', () => {
    const daily = days(START, 6, { speak: 7, talk: 3.5, repN: 5, repSelf: 1 });
    const r = weekReview(healthy({ daily }), END_W1);
    expect(r.selfRepair).toBe(20);
    expect(all(r)).toMatch(/20% dos erros.*marcação ao vivo.*pista/);
  });

  it('poucos dias ativos: dia corrido de 5 minutos', () => {
    const daily = days(START, 2, { speak: 21, talk: 11 });
    const r = weekReview(healthy({ daily }), END_W1);
    expect(r.verdict).toBe('no-ritmo');
    expect(r.suggestions[0]).toMatch(/2 de 7 dias.*dia corrido de 5 minutos/);
    // 2 dias em 3 decorridos não é pouco
    expect(all(weekReview(healthy({ daily }), '2026-01-07'))).not.toMatch(/dia corrido/);
  });

  it('frases automáticas atrás da meta: priorizar a escada', () => {
    const w10 = addDays(START, 7 * 9);
    const daily = days(w10, 6, { speak: 12, talk: 7 });
    const today = addDays(w10, 6);
    const r = weekReview(st({ daily, production: production(40) }), today);
    expect(r.autoTarget).toBe(autoTarget(10));
    expect(all(r)).toMatch(new RegExp(`40 frases automáticas e a meta desta semana é ${autoTarget(10)}.*escada`));
    expect(all(weekReview(st({ daily, production: production(autoTarget(10)) }), today))).not.toMatch(/escada/);
  });

  it('erro dominante: cita a categoria e manda para o treino dos erros', () => {
    const r = weekReview(healthy({ errorLog: [['third-person'], ['third-person', 'article'], ['third-person'], ['third-person']] }), END_W1);
    expect(all(r)).toMatch(/"-s da 3ª pessoa" \(4 vezes.*treino dos erros/);
    expect(nextAction(r)).toBe('erros');
    expect(all(weekReview(healthy({ errorLog: [['third-person'], ['article']] }), END_W1))).not.toMatch(/treino dos erros/);
  });

  it('conversa abaixo da meta: uma simulação por dia', () => {
    const r = weekReview(healthy({ daily: days(START, 6, { speak: 7, talk: 1 }) }), END_W1);
    expect(all(r)).toMatch(/conversa está em 6 de 20 minutos.*simulação por dia/);
    expect(nextAction(r)).toBe('simulacao');
  });

  it('no máximo 3 sugestões, na ordem de prioridade, e o foco é a primeira', () => {
    const daily = days(START, 2, { speak: 4, due: 5, dueOk: 1, repN: 5, repSelf: 0 });
    const r = weekReview(st({ daily, errorLog: Array.from({ length: 6 }, () => ['preposition']) }), END_W1);
    expect(r.verdict).toBe('atrasado');
    expect(r.suggestions).toHaveLength(3);
    expect(r.suggestions[0]).toMatch(/retenção/);
    expect(r.suggestions[1]).toMatch(/dia corrido/);
    expect(r.suggestions[2]).toMatch(/8 de 40 minutos/);
    expect(r.focus).toMatch(/Revisar antes/);
  });

  it('texto em português, sem travessão, e sempre com foco', () => {
    const cases: ReviewState[] = [
      st({ plan: { startDay: null } }),
      st(),
      healthy(),
      st({ daily: days(START, 6, { speak: 9, talk: 5 }), production: production(20) }),
      st({ daily: days(START, 2, { speak: 4, due: 5, dueOk: 1, repN: 5, repSelf: 0 }), errorLog: Array.from({ length: 6 }, () => ['preposition']) }),
    ];
    for (const c of cases) {
      const r = weekReview(c, END_W1);
      expect(r.suggestions.length).toBeGreaterThanOrEqual(1);
      expect(r.suggestions.length).toBeLessThanOrEqual(3);
      expect(r.focus.length).toBeGreaterThan(10);
      for (const s of [...r.suggestions, r.focus]) expect(s).not.toMatch(/[–—]/);
    }
  });
});
