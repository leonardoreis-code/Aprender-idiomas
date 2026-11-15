import { describe, expect, it } from 'vitest';
import { lookup, MISSIONS } from '../../content/missions';
import { asksRepeat, DEFAULT_CONTEXT, fill, goalsMet, initialSim, nextGoal, react, score } from './engine';

describe('Simulações: conteúdo', () => {
  it('10 simulações, ids únicos, 3–4 falas e 4 objetivos', () => {
    expect(MISSIONS).toHaveLength(10);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(10);
    for (const m of MISSIONS) {
      expect(m.goals).toHaveLength(4);
      expect(m.beats.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('todo objetivo é pedido por alguma fala e todo "wants" existe', () => {
    for (const m of MISSIONS) {
      const ids = new Set(m.goals.map((g) => g.id));
      const wanted = new Set(m.beats.flatMap((b) => b.wants));
      for (const w of wanted) expect(ids.has(w), `${m.id}:${w}`).toBe(true);
      for (const id of ids) expect(wanted.has(id), `${m.id}:${id}`).toBe(true);
    }
  });
  it('o exemplo de cada objetivo é reconhecido pelo próprio detector', () => {
    for (const m of MISSIONS) for (const g of m.goals) expect(goalsMet(m.goals, g.example), `${m.id}:${g.id} "${g.example}"`).toContain(g.id);
  });
  it('resposta vazia de conteúdo não cumpre objetivo nenhum', () => {
    for (const m of MISSIONS) expect(goalsMet(m.goals, 'hello hmm okay'), m.id).toEqual([]);
  });
});

describe('Simulações: motor', () => {
  const m = MISSIONS.find((x) => x.id === 'daily-blocker')!;
  it('detecta objetivos em texto parcial (tempo real)', () => {
    expect(goalsMet(m.goals, 'Yesterday I')).toEqual([]);
    expect(goalsMet(m.goals, 'Yesterday I fixed the bug')).toEqual(['yesterday']);
    expect(goalsMet(m.goals, "Yesterday I fixed the bug and today I'm going to test it")).toEqual(['yesterday', 'today']);
  });
  it('personagem insiste uma vez quando o objetivo não vem, depois segue', () => {
    let s = initialSim();
    let step = react(m, s, 'I am fine', DEFAULT_CONTEXT);
    expect(step.kind).toBe('nudge');
    expect(step.line).toMatch(/yesterday/);
    step = react(m, step.state, 'I do not remember', DEFAULT_CONTEXT);
    expect(step.kind).toBe('next');
    expect(step.state.beat).toBe(1);
    s = step.state;
    step = react(m, s, "Today I'm going to write tests", DEFAULT_CONTEXT);
    expect(step.kind).toBe('next');
    expect(step.state.met).toContain('today');
    expect(step.line).toContain('the orders pipeline');
  });
  it('pedir para repetir não avança nem pune', () => {
    const step = react(m, initialSim(), 'Sorry, could you repeat that?', DEFAULT_CONTEXT);
    expect(step.kind).toBe('repeat');
    expect(step.state.beat).toBe(0);
    expect(step.state.repeats).toBe(1);
    expect(asksRepeat("I didn't catch that")).toBe(true);
    expect(asksRepeat('Yesterday I fixed it')).toBe(false);
  });
  it('conversa completa fecha com todos os objetivos', () => {
    let s = initialSim();
    const answers = ['Yesterday I finished the migration', "Today I'm going to write the tests", "I'm blocked waiting for database access", 'Could you help me with that after the call?'];
    let last = '';
    for (const a of answers) {
      const st = react(m, s, a, { ...DEFAULT_CONTEXT, teammate: 'Ana' });
      s = st.state;
      last = st.line;
    }
    expect(s.done).toBe(true);
    expect(s.met).toHaveLength(4);
    expect(last).toContain('Ana');
    expect(score(m, s.met, 0, 0)).toEqual({ goals: 4, total: 4, stars: 3 });
    expect(score(m, s.met, 2, 0).stars).toBe(2);
    expect(score(m, ['yesterday', 'today'], 0, 0).stars).toBe(1);
    expect(score(m, [], 0, 0).stars).toBe(0);
  });
  it('"travei" oferece o objetivo da fala atual', () => {
    expect(nextGoal(m, initialSim())?.id).toBe('yesterday');
    expect(nextGoal(m, { ...initialSim(), beat: 2, met: ['yesterday', 'today'] })?.id).toBe('blocker');
  });
  it('contexto pessoal entra nas falas; vazio usa o padrão', () => {
    expect(fill('How is {project} going?', { ...DEFAULT_CONTEXT, project: 'the billing API' })).toBe('How is the billing API going?');
    expect(fill('Ask {teammate}', { ...DEFAULT_CONTEXT, teammate: ' ' })).toBe('Ask Tom');
  });
});

describe('Como se diz?', () => {
  it('acha com e sem acento e aceita variações curtas', () => {
    expect(lookup('prazo')).toBe('deadline');
    expect(lookup('Reunião')).toBe('meeting');
    expect(lookup('relatórios')).toBe('report');
    expect(lookup('xyzabc')).toBeNull();
  });
});
