import { describe, expect, it } from 'vitest';
import { allItems, allLessons, englishCourse } from '../content/en/course';
import { checkTyped, normalize } from './practice/answer';
import { buildLesson, buildReview } from './practice/builder';
import { applySession, dueItemIds, gradeFromAttempt, Rating, review } from './srs/scheduler';
import { scoreSpeech, tipFor } from './pronunciation/score';
import { addXp, initialMotivation, levelFor, reconcileStreak, unlockAchievements, xpForAnswer } from './motivation/motivation';

describe('Curriculum', () => {
  it('ids de item são únicos (chave FSRS)', () => {
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('toda lição tem objetivo can-do, ≥4 itens e ≥3 frases', () => {
    for (const l of allLessons) {
      expect(l.canDo.length).toBeGreaterThan(10);
      expect(l.items.length).toBeGreaterThanOrEqual(4);
      expect(l.sentences.length).toBeGreaterThanOrEqual(3);
      for (const s of l.sentences) if (s.gap) expect(s.en).toContain(s.gap);
    }
  });
  it('curso tem 4 unidades A1', () => {
    expect(englishCourse.units).toHaveLength(4);
  });
});

describe('F-03 correção tolerante', () => {
  it('ignora caixa, pontuação e contrações', () => {
    expect(normalize("Hi, I'm Ana!")).toBe('hi i am ana');
    expect(checkTyped('hi i am ana', ["Hi, I'm Ana."])).toBe('correct');
    expect(checkTyped('I’m from Brazil', ["I'm from Brazil."])).toBe('correct');
  });
  it('1 typo em palavra longa = almost; em palavra curta = wrong', () => {
    expect(checkTyped('nice to meet you, plaese', ['Nice to meet you, please'])).toBe('almost');
    expect(checkTyped('I eta bread', ['I eat bread'])).toBe('wrong');
  });
  it('vazio é errado', () => expect(checkTyped('   ', ['hi'])).toBe('wrong'));
});

describe('F-02 builder', () => {
  it('é determinístico e todo exercício tem resposta válida', () => {
    for (const l of allLessons) {
      const a = buildLesson(l, allItems, 42);
      const b = buildLesson(l, allItems, 42);
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThanOrEqual(12);
      for (const e of a) {
        if (e.type === 'listen-choose' || e.type === 'pt-to-en-choose' || e.type === 'fill-gap') {
          expect(e.options).toContain(e.answer);
          expect(new Set(e.options.map((o) => o.toLowerCase())).size).toBe(e.options.length);
        }
        if (e.type === 'word-bank') {
          expect(checkTyped(e.answer, e.accepted)).toBe('correct');
          for (const w of e.answer.split(' ')) expect(e.bank).toContain(w);
        }
      }
      expect(new Set(a.map((e) => e.key)).size).toBe(a.length);
    }
  });
  it('vai de reconhecimento para produção', () => {
    const ex = buildLesson(allLessons[0], allItems, 1);
    const firstProd = ex.findIndex((e) => e.type === 'speak' || e.type === 'dictation');
    const lastRecog = ex.map((e) => e.type).lastIndexOf('listen-choose');
    expect(firstProd).toBeGreaterThan(lastRecog);
  });
  it('lição com foco sonoro inclui pares mínimos', () => {
    const th = allLessons.find((l) => l.id === 'u1-l3')!;
    expect(buildLesson(th, allItems).filter((e) => e.type === 'minimal-pair')).toHaveLength(4);
  });
  it('revisão gera um exercício por item, limitado', () => {
    expect(buildReview(allItems.slice(0, 20), allItems, 3, 10)).toHaveLength(10);
  });
});

describe('F-04 FSRS', () => {
  const now = new Date('2026-01-10T10:00:00');
  it('mapeia desempenho em nota', () => {
    expect(gradeFromAttempt({ correct: false, hesitant: false, production: true, ms: 1000 })).toBe(Rating.Again);
    expect(gradeFromAttempt({ correct: true, hesitant: true, production: true, ms: 1000 })).toBe(Rating.Hard);
    expect(gradeFromAttempt({ correct: true, hesitant: false, production: true, ms: 2000 })).toBe(Rating.Easy);
    expect(gradeFromAttempt({ correct: true, hesitant: false, production: false, ms: 2000 })).toBe(Rating.Good);
  });
  it('Good agenda para o futuro; Again volta logo', () => {
    let cards = review({}, 'hi', Rating.Good, now);
    cards = review(cards, 'hi', Rating.Good, new Date(cards.hi.due));
    expect(new Date(cards.hi.due).getTime() - now.getTime()).toBeGreaterThan(86_400_000);
    const again = review({}, 'hello', Rating.Again, now);
    expect(new Date(again.hello.due).getTime() - now.getTime()).toBeLessThan(3_600_000);
  });
  it('sessão usa a pior nota por item e dueItemIds encontra vencidos', () => {
    const cards = applySession({}, [
      { exerciseKey: 'a', itemIds: ['hi'], correct: true, hesitant: false, production: false, ms: 1 },
      { exerciseKey: 'b', itemIds: ['hi'], correct: false, hesitant: false, production: false, ms: 1 },
    ], now);
    expect(dueItemIds(cards, new Date(now.getTime() + 3_600_000))).toEqual(['hi']);
  });
});

describe('F-05 pronúncia', () => {
  it('fala idêntica = 100; parcial < 85', () => {
    expect(scoreSpeech('Nice to meet you', ['nice to meet you']).score).toBe(100);
    const s = scoreSpeech('I think so', ['I sink so']);
    expect(s.score).toBeLessThan(85);
    expect(s.words.find((w) => w.word === 'think')?.ok).toBe(false);
  });
  it('escolhe a melhor alternativa', () => {
    expect(scoreSpeech('three', ['tree', 'three']).verdict).toBe('great');
  });
  it('dá dica de TH', () => expect(tipFor(['think'])).toMatch(/TH/));
});

describe('F-07 motivação', () => {
  it('combo aumenta XP com teto', () => {
    expect(xpForAnswer(1)).toBe(10);
    expect(xpForAnswer(3)).toBe(14);
    expect(xpForAnswer(50)).toBe(20);
  });
  it('bater a meta incrementa streak uma vez por dia', () => {
    let s = initialMotivation();
    let r = addXp(s, 30, '2026-01-01');
    expect(r.goalJustMet).toBe(false);
    r = addXp(r.state, 30, '2026-01-01');
    expect(r.goalJustMet).toBe(true);
    expect(r.state.streak).toBe(1);
    r = addXp(r.state, 100, '2026-01-01');
    expect(r.state.streak).toBe(1);
    s = r.state;
    expect(addXp(s, 60, '2026-01-02').state.streak).toBe(2);
  });
  it('freeze cobre 1 dia perdido; sem freeze zera', () => {
    const base = { ...initialMotivation(), streak: 8, lastGoalDay: '2026-01-01', freezes: 1 };
    const kept = reconcileStreak(base, '2026-01-03');
    expect(kept.streak).toBe(8);
    expect(kept.freezes).toBe(0);
    expect(kept.usedFreezes).toBe(1);
    expect(reconcileStreak({ ...base, freezes: 0 }, '2026-01-03').streak).toBe(0);
    expect(reconcileStreak(base, '2026-01-02').streak).toBe(8);
  });
  it('ganha freeze a cada 7 dias (máx 2)', () => {
    let s: ReturnType<typeof initialMotivation> = { ...initialMotivation(), streak: 6, lastGoalDay: '2026-01-06' };
    s = addXp(s, 50, '2026-01-07').state;
    expect(s.freezes).toBe(1);
  });
  it('níveis', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(50).level).toBe(2);
    expect(levelFor(49).level).toBe(1);
  });
  it('conquistas destravam uma vez', () => {
    const ctx = { lessonsDone: 1, itemsLearned: 6, perfectLesson: true, clearedReviews: false, bestSpeech: 0 };
    const r = unlockAchievements(initialMotivation(), ctx);
    expect(r.unlocked.map((a) => a.id)).toEqual(['first-lesson', 'perfect']);
    expect(unlockAchievements(r.state, ctx).unlocked).toHaveLength(0);
  });
});
