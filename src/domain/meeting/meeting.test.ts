import { describe, expect, it } from 'vitest';
import { spot } from '../coach/spotter';
import type { Issue } from '../coach/mediation';
import { DEFAULT_CONTEXT, type Goal } from '../sim/engine';
import { initialMeet, meetReact, muteNudge, opening, recastOf, toSecondPerson, meetScore, pickRecast, RECAST_GAP } from './engine';
import type { Meeting } from './types';

const goal = (id: string, detect: string[][]): Goal => ({ id, label: id, pt: id, example: id, starter: id, detect });
const M: Meeting = {
  id: 't', kind: 'daily', title: 't', setting: 't', minutes: 5,
  participants: [
    { id: 'ana', name: 'Ana', role: 'EM', voice: 0, look: { skin: 1, hair: 1, hairColor: 0, shirt: '#333' } },
    { id: 'raj', name: 'Raj', role: 'Dev', voice: 1, look: { skin: 2, hair: 0, hairColor: 1, shirt: '#444' } },
  ],
  goals: [goal('y', [['yesterday']]), goal('t', [['today']])],
  agenda: [
    { before: [{ by: 'raj', say: 'I fixed the bug.' }, { by: 'ana', say: 'Nice. {you}, your turn.' }], by: 'ana', say: 'What did you do yesterday?', pt: '', wants: ['y'], nudge: 'And yesterday?', nudgeBy: 'raj' },
    { by: 'ana', say: 'And today?', pt: '', wants: ['t'], nudge: 'What about today?' },
  ],
  closing: { by: 'ana', say: 'Thanks, {you}!' },
};
const issuesOf = (t: string): Issue[] => spot(t).map((s) => ({ source: 'rule', ...s }));

describe('Reunião ao vivo', () => {
  it('abre com conversa entre colegas e chama o aluno pelo nome (A1)', () => {
    const o = opening(M, DEFAULT_CONTEXT, 'Leo');
    expect(o.map((l) => l.by)).toEqual(['raj', 'ana', 'ana']);
    expect(o[1].text).toContain('Leo, your turn');
    expect(o[2].kind).toBe('ask');
  });

  it('2ª pessoa na reformulação', () => {
    expect(toSecondPerson('I was late to my meeting')).toBe('you were late to your meeting');
    expect(toSecondPerson("I'm blocked")).toBe("you're blocked");
  });

  it('reformula o erro de passado na 2ª pessoa, pelo colega que perguntou (A2)', () => {
    const text = 'Yesterday I go to the client and we talk about the dashboard';
    const iss = issuesOf(text);
    expect(iss.some((i) => i.cat === 'past-tense')).toBe(true);
    const step = meetReact(M, initialMeet(), text, DEFAULT_CONTEXT, 'Leo', iss);
    const rc = step.lines.find((l) => l.kind === 'recast');
    expect(rc?.by).toBe('ana');
    expect(rc?.text).toBe('Okay, so yesterday you went to the client?');
    // a outra oração ("we talk") não entra: poderia repetir um erro não detectado
  });

  it('no máximo uma reformulação a cada 2 falas (A2)', () => {
    const iss = issuesOf('Yesterday I go to the office');
    let st = initialMeet();
    const a = meetReact(M, st, 'Yesterday I go to the office', DEFAULT_CONTEXT, 'Leo', iss);
    st = a.state;
    expect(a.recast).not.toBeNull();
    const b = pickRecast({ ...st, turns: st.turns + 1 }, 'Yesterday I go to the office', iss);
    expect(b).toBeNull();
    expect(pickRecast({ ...st, turns: st.turns + RECAST_GAP }, 'Yesterday I go to the office', iss)).not.toBeNull();
  });

  it('erro de IA sem posição também reformula (e recusa trecho curto demais)', () => {
    const r = recastOf('Today I will finish the tests and make deploy', { source: 'ai', rule: 'ai:collocation', cat: 'collocation', wrong: 'make deploy', fix: 'deploy it', clue: '', explain: '' });
    expect(r).toBeNull();
    expect(recastOf('Yesterday the job fail in production', { source: 'ai', rule: 'ai:past-tense', cat: 'past-tense', wrong: 'fail', fix: 'failed', clue: '', explain: '' })).toBe('yesterday the job failed in production');
  });

  it('pedido de repetição repete a pergunta sem contar turno (A4)', () => {
    const s = meetReact(M, initialMeet(), 'Sorry, could you repeat?', DEFAULT_CONTEXT, 'Leo');
    expect(s.state.turns).toBe(0);
    expect(s.lines[0].kind).toBe('repeat');
    expect(s.lines[0].text).toContain('What did you do yesterday?');
  });

  it('cobra uma vez (com outro colega) e depois segue', () => {
    const a = meetReact(M, initialMeet(), 'I am working on the pipeline project', DEFAULT_CONTEXT, 'Leo');
    expect(a.lines.at(-1)).toMatchObject({ by: 'raj', kind: 'nudge' });
    const b = meetReact(M, a.state, 'Nothing special really', DEFAULT_CONTEXT, 'Leo');
    expect(b.lines.at(-1)?.text).toBe('And today?');
  });

  it('fecha a reunião depois da última pergunta', () => {
    let st = meetReact(M, initialMeet(), 'Yesterday I fixed the tests', DEFAULT_CONTEXT, 'Leo').state;
    const end = meetReact(M, st, 'Today I will deploy the new version', DEFAULT_CONTEXT, 'Leo');
    st = end.state;
    expect(st.done).toBe(true);
    expect(end.lines.at(-1)).toMatchObject({ kind: 'close', text: 'Thanks, Leo!' });
    expect(meetScore(M, st.met, 0, 0).stars).toBe(3);
  });

  it('"acho que você está no mudo" (A5)', () => {
    const a = muteNudge(M, initialMeet(), 'Leo');
    expect(a.line.text).toMatch(/mute/);
    const b = muteNudge(M, a.state, 'Leo');
    expect(b.line.by).toBe('raj');
  });
});
