import { describe, expect, it } from 'vitest';
import { applyFix, corrected, mutedFrom, ruleInfo, RULE_COUNT, setMutedRules, spot } from './spotter';
import { autonomy, nextLevel, repaired, startLevel, type Issue } from './mediation';

const rules = (t: string) => spot(t).map((s) => s.rule);
const fixed = (t: string) => corrected(t);

describe('Detector de fala livre: acertos', () => {
  const cases: [string, string, string][] = [
    ['I have 30 years', 'age', 'I am 30 years old'],
    ['she has twenty five years old', 'age', 'she is twenty five years old'],
    ['I have hungry', 'have-feeling', 'I am hungry'],
    ['is raining a lot today', 'it-subject', 'it is raining a lot today'],
    ['I think is important to test', 'it-subject', 'I think it is important to test'],
    ['there have many problems', 'there-have', 'there are many problems'],
    ['have many bugs in production', 'have-existential', 'there are many bugs in production'],
    ['she work at a bank', 'third-person', 'she works at a bank'],
    ['he have two kids', 'third-person', 'he has two kids'],
    ['my boss want the report', 'third-person-noun', 'my boss wants the report'],
    ['the pipeline run every hour', 'third-person-noun', 'the pipeline runs every hour'],
    ['people is nice here', 'people-is', 'people are nice here'],
    ['we was late', 'was-were', 'we were late'],
    ["she don't know", 'he-dont', "she doesn't know"],
    ['they has a problem', 'i-has', 'they have a problem'],
    ["I didn't went there", 'did-past', "I didn't go there"],
    ['did you saw my email', 'did-past', 'did you see my email'],
    ['where you work', 'wh-no-aux', 'where do you work'],
    ['yesterday I go to the office', 'past-marker', 'yesterday I went to the office'],
    ['two days ago we finish the migration', 'past-marker', 'two days ago we finished the migration'],
    ['I see him yesterday', 'past-marker-end', 'I saw him yesterday'],
    ['I work here since 2020', 'present-since', 'I have been working here since 2020'],
    ['I live in Rio for five years', 'present-since', 'I have lived in Rio for five years'],
    ['since two years', 'since-duration', 'for two years'],
    ['I am work on a new project', 'be-base', 'I am working on a new project'],
    ['I have been work here', 'been-base', 'I have been working here'],
    ['I wanted to went there', 'to-past', 'I wanted to go there'],
    ['I can to help you', 'modal-to', 'I can help you'],
    ['I enjoy to work with data', 'ing-after-verb', 'I enjoy working with data'],
    ['I want that you send it', 'want-that', 'I want you to send it'],
    ['I study for to learn', 'for-to', 'I study to learn'],
    ['I went there for buy a laptop', 'for-verb', 'I went there to buy a laptop'],
    ["I don't know nothing", 'double-negative', "I don't know anything"],
    ['it is more better', 'more-er', 'it is better'],
    ['I am agree with you', 'agree', 'I agree with you'],
    ['I am not agree', 'agree', "I don't agree"],
    ['I born in Brazil', 'born', 'I was born in Brazil'],
    ['it depends of the client', 'depend-of', 'it depends on the client'],
    ['can you explain me this', 'explain-me', 'can you explain to me this'],
    ['she said me the truth', 'say-me', 'she told me the truth'],
    ['we discussed about the plan', 'discuss-about', 'we discussed the plan'],
    ['he is married with a doctor', 'married-with', 'he is married to a doctor'],
    ['I listen music every day', 'listen-to', 'I listen to music every day'],
    ['I went to home', 'to-home', 'I went home'],
    ['see you in monday', 'day-prep', 'see you on Monday'],
    ['I arrived in the office late', 'arrive-at', 'I arrived at the office late'],
    ['I asked to him', 'verb-to-person', 'I asked him'],
    ['I like of coffee', 'like-of', 'I like coffee'],
    ['the my team is small', 'the-my', 'my team is small'],
    ['I need more informations', 'uncountable-plural', 'I need more information'],
    ['much people use it', 'much-plural', 'many people use it'],
    ['can I make a question', 'make-question', 'can I ask a question'],
    ['I did a mistake', 'do-mistake', 'I made a mistake'],
    ['I made a course last year', 'make-course', 'I took a course last year'],
    ['I took a coffee', 'take-meal', 'I had a coffee'],
    ['I lost the bus', 'lost-missed', 'I missed the bus'],
    ['I passed the weekend at home', 'pass-spend', 'I spent the weekend at home'],
    ['I pretend to travel next year', 'pretend', 'I intend to travel next year'],
    ['I assisted a movie', 'assist-watch', 'I watched a movie'],
    ['I stayed nervous', 'stay-feeling', 'I got nervous'],
    ['I have a doubt', 'have-doubt', 'I have a question'],
    ['how do you call this', 'how-call', 'what do you call this'],
    ['I am responsible of the pipeline', 'prep-adjective', 'I am responsible for the pipeline'],
    ['I am interested on this role', 'prep-adjective', 'I am interested in this role'],
    ['it is different of the old one', 'prep-adjective', 'it is different from the old one'],
    ['I participated of the meeting', 'prep-adjective', 'I participated in the meeting'],
    ['she is good in python', 'prep-adjective', 'she is good at python'],
    ['I am thinking in changing jobs', 'think-in', 'I am thinking about changing jobs'],
    ['I work in home', 'work-in-home', 'I work from home'],
    ['I study all the days', 'all-days', 'I study every day'],
    ['we have a call today night', 'today-night', 'we have a call tonight'],
    ['for me is difficult', 'for-me-is', 'for me it is difficult'],
    ['exist many ways to do it', 'exist-start', 'there are many ways to do it'],
    ['I am understanding the problem', 'stative-ing', 'I understand the problem'],
    ['I went to there last year', 'go-to-there', 'I went there last year'],
    ['I asked for him to review it', 'ask-for-to', 'I asked him to review it'],
    ['we made a meeting', 'make-meeting', 'we had a meeting'],
    ['I have a good news', 'a-news', 'I have some good news'],
    ['thanks god it worked', 'thanks-god', 'thank God it worked'],
    ['I want to know new places', 'know-place', 'I want to visit new places'],
  ];
  for (const [input, rule, out] of cases) {
    it(`${rule}: "${input}"`, () => {
      expect(rules(input)).toContain(rule);
      expect(fixed(input).toLowerCase()).toBe(out.toLowerCase());
    });
  }
  it(`cobre ${RULE_COUNT} regras`, () => {
    const covered = new Set(cases.map((c) => c[1]));
    expect(covered.size).toBeGreaterThanOrEqual(RULE_COUNT - 6);
    expect(RULE_COUNT).toBeGreaterThanOrEqual(70);
  });
});

describe('Detector de fala livre: não marca inglês correto', () => {
  const ok = [
    'I have two years of experience with Python',
    'Does she work here?',
    'She can work from home',
    "He didn't go to the meeting",
    'Did you see my email yesterday?',
    'I will let it go',
    'We can make it work',
    'If I were you, I would wait',
    'I have worked here for two years',
    'I have been working on this since 2020',
    'She works at a bank and he has two kids',
    'Have a nice weekend',
    'Have a good one',
    'I have a meeting at ten',
    'It is important to test before the deploy',
    'This is important for the team',
    'What is important is the result',
    'I asked for help and thanks for helping',
    'I study for two hours every day',
    'I do what I did yesterday',
    'He is a software engineer and she leads a research team',
    'I need some information about the project',
    'There are many people in the room',
    'People are nice here',
    'I want to go home',
    'I listen to music every day',
    'It depends on the client',
    'I agree with you',
    'I was born in Brazil',
    'She told me the truth and explained it to me',
    'Yesterday I went to the office and last week we finished the migration',
    "I don't know anything about it",
    'I think it is better to wait',
    'Where do you work and why does she want that?',
    'We were late because the traffic was terrible',
    'I am working on a new pipeline',
    'My boss wants the report on Monday',
    'I am 30 years old',
    'Tell me about yourself',
    'I talked to him and called her',
    'I have a question about the deadline',
    'What do you call this in English?',
    'I am responsible for the pipeline and interested in this role',
    'She is good at Python',
    'I am thinking about changing jobs',
    'I work from home every day',
    'We have a call tonight',
    'For me, it is difficult',
    'There are many ways to do it',
    'I understand the problem and I know him',
    'I went there last year and I asked him to review it',
    'We had a meeting and I have some good news',
    'I doubt that it will work',
    'I think in English when I work',
    'How do you call the API from the client?',
  ];
  for (const s of ok) it(`"${s}"`, () => expect(spot(s)).toEqual([]));
});

describe('Regras silenciadas pelo aluno', () => {
  it('silencia depois de 2 avisos e volta a marcar quando reativada', () => {
    expect(mutedFrom({ 'third-person': 1, age: 2 })).toEqual(['age']);
    setMutedRules(['third-person']);
    expect(spot('she work at a bank')).toEqual([]);
    expect(rules('I have 30 years')).toContain('age');
    setMutedRules([]);
    expect(rules('she work at a bank')).toContain('third-person');
    expect(ruleInfo('age')?.cat).toBe('be-have');
  });
});

describe('Posições e correção', () => {
  it('marca o trecho exato e não sobrepõe', () => {
    const t = 'Yesterday I go to the office and she work late';
    const s = spot(t);
    expect(s.map((x) => t.slice(x.start, x.end))).toEqual(['go', 'work']);
    expect(applyFix(t, s[0])).toBe('Yesterday I went to the office and she work late');
    expect(corrected(t)).toBe('Yesterday I went to the office and she works late');
  });
  it('funciona em texto parcial, palavra a palavra (tempo real)', () => {
    const words = 'I think is important because she work a lot'.split(' ');
    const counts = words.map((_, i) => spot(words.slice(0, i + 1).join(' ')).length);
    expect(counts[3]).toBe(1); // "…is important" já acusa
    expect(counts[counts.length - 1]).toBe(2);
  });
});

describe('Feedback graduado', () => {
  const issue = (t: string): Issue => ({ source: 'rule', ...spot(t)[0] });
  it('reconhece o conserto e a repetição do erro', () => {
    const i = issue('she work at a bank');
    expect(repaired(i, 'she works at a bank')).toBe(true);
    expect(repaired(i, 'she work at a bank')).toBe(false);
    expect(repaired(i, 'ok')).toBe(false);
    expect(repaired(issue('I have 30 years'), "I'm 30 years old")).toBe(true);
    expect(repaired(issue('it depends of the client'), 'it depends on the client')).toBe(true);
  });
  it('erro apontado pela IA: precisa conter a forma corrigida', () => {
    const ai: Issue = { source: 'ai', rule: 'ai', cat: 'vocabulary', wrong: 'I am here since morning', fix: 'I have been here since morning', clue: '', explain: '' };
    expect(repaired(ai, 'I have been here since morning')).toBe(true);
    expect(repaired(ai, 'I am here since morning')).toBe(false);
  });
  it('degraus e autonomia', () => {
    expect(nextLevel(1)).toBe(2);
    expect(nextLevel(4)).toBeNull();
    const recs = [{ rule: 'a', cat: 'x', level: 2, at: 1 }, { rule: 'a', cat: 'x', level: 4, at: 2 }, { rule: 'b', cat: 'x', level: 3, at: 3 }, { rule: 'b', cat: 'x', level: 5, at: 4 }];
    expect(autonomy(recs)).toEqual({ n: 4, selfPct: 50, meanLevel: 3.5 });
  });
  it('ajuda inicial diminui quando a pessoa já consertou com menos ajuda', () => {
    expect(startLevel([], 'a', false)).toBe(1);
    expect(startLevel([], 'a', true)).toBe(2);
    expect(startLevel([{ rule: 'a', cat: 'x', level: 4, at: 1 }], 'a', false)).toBe(3);
    expect(startLevel([{ rule: 'a', cat: 'x', level: 2, at: 1 }], 'a', false)).toBe(1);
  });
});
