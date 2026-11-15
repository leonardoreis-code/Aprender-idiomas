import { describe, expect, it } from 'vitest';
import { ASKS, QUICKS, TRANSFORMS } from '../../content/drills2';
import { checkAnswers, checkNumber, makeNumberItem, meanLatency, numberWords, ordinalWords, spokenForm, type NumberItem } from './check';
import { TRANSFORM_LABEL } from './types';

const KINDS: NumberItem['kind'][] = ['integer', 'percent', 'price', 'year', 'time', 'decimal', 'date'];

describe('checkAnswers', () => {
  const answers = ["I don't work on weekends.", 'I do not work on weekends.'];

  it('aceita a forma canônica, ignorando caixa e pontuação', () => {
    expect(checkAnswers("i don't work on weekends", answers)).toBe('correct');
    expect(checkAnswers("I DON'T WORK ON WEEKENDS!", answers)).toBe('correct');
  });

  it('aceita variações com e sem contração', () => {
    expect(checkAnswers('I do not work on weekends', answers)).toBe('correct');
    expect(checkAnswers("She's going to present the results", ['She is going to present the results.'])).toBe('correct');
  });

  it('aceita números em dígitos vindos do reconhecimento de fala', () => {
    expect(checkAnswers("I've been working here for 2 years", ['I have been working here for two years.'])).toBe('correct');
  });

  it('marca "quase" para um deslize pequeno numa palavra longa', () => {
    expect(checkAnswers("I don't work on weekands", answers)).toBe('almost');
  });

  it('marca errado quando a gramática muda ou não há resposta', () => {
    expect(checkAnswers('I not work on weekends', answers)).toBe('wrong');
    expect(checkAnswers('She work with data', ['She works with data.'])).toBe('wrong');
    expect(checkAnswers('', answers)).toBe('wrong');
    expect(checkAnswers('   ', answers)).toBe('wrong');
  });
});

describe('conteúdo dos treinos', () => {
  it('tem 48 transformações, 8 de cada tipo', () => {
    expect(TRANSFORMS).toHaveLength(48);
    for (const kind of Object.keys(TRANSFORM_LABEL)) {
      expect(TRANSFORMS.filter((t) => t.kind === kind), kind).toHaveLength(8);
    }
  });

  it('tem 36 perguntas e 40 respostas rápidas', () => {
    expect(ASKS).toHaveLength(36);
    expect(QUICKS).toHaveLength(40);
  });

  it('tem ids únicos', () => {
    const ids = [...TRANSFORMS, ...ASKS, ...QUICKS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TRANSFORMS.every((t) => /^t\d\d$/.test(t.id))).toBe(true);
    expect(ASKS.every((a) => /^a\d\d$/.test(a.id))).toBe(true);
    expect(QUICKS.every((q) => /^q\d\d$/.test(q.id))).toBe(true);
  });

  it('aceita toda resposta listada das transformações', () => {
    for (const t of TRANSFORMS) {
      expect(t.answers.length, t.id).toBeGreaterThan(0);
      for (const ans of t.answers) expect(checkAnswers(ans, t.answers), `${t.id}: ${ans}`).toBe('correct');
      expect(checkAnswers(t.answers[0], t.answers), t.id).toBe('correct');
    }
  });

  it('aceita toda resposta listada das perguntas', () => {
    for (const a of ASKS) {
      expect(a.answers.length, a.id).toBeGreaterThan(0);
      for (const ans of a.answers) expect(checkAnswers(ans, a.answers), `${a.id}: ${ans}`).toBe('correct');
      expect(checkAnswers(a.answers[0], a.answers), a.id).toBe('correct');
    }
  });

  it('não aceita a frase de partida como resposta da transformação', () => {
    for (const t of TRANSFORMS) expect(checkAnswers(t.base, t.answers), t.id).not.toBe('correct');
  });

  it('segue as regras de cada tipo de transformação', () => {
    for (const t of TRANSFORMS) {
      expect(t.base.trim(), t.id).not.toBe('');
      expect(t.pt.trim(), t.id).not.toBe('');
      if (t.kind === 'third') {
        expect(t.base.startsWith('I '), t.id).toBe(true);
        expect(t.answers[0].startsWith('She '), t.id).toBe(true);
        expect(t.answers.some((x) => x.startsWith('He ')), t.id).toBe(true);
      }
      if (t.kind === 'question') expect(t.answers.every((x) => x.endsWith('?')), t.id).toBe(true);
      if (t.kind === 'future') expect(t.answers[0], t.id).toMatch(/going to/);
      if (t.kind === 'perfect') {
        expect(t.pt, t.id).toMatch(/\((há|desde) [^)]+\)/);
        expect(t.answers[0], t.id).toMatch(/\b(have|has)\b.*\b(for|since)\b/);
      }
    }
  });

  it('destaca um trecho que existe na resposta e só aceita perguntas', () => {
    for (const a of ASKS) {
      expect(a.statement.includes(a.focus), a.id).toBe(true);
      expect(a.pt.trim(), a.id).not.toBe('');
      expect(a.answers.every((x) => x.endsWith('?')), a.id).toBe(true);
    }
  });

  it('cobre as palavras interrogativas e os auxiliares pedidos', () => {
    const starts = ['Where', 'When', 'What time', 'What', 'Who', 'Why', 'How long', 'How many', 'How much', 'How often', 'How do', 'Which', 'Do ', 'Does ', 'Did ', 'Are ', 'Is ', 'Have ', 'Can '];
    for (const s of starts) expect(ASKS.some((a) => a.answers[0].startsWith(s)), s).toBe(true);
  });

  it('traz pergunta, tradução e começo de resposta nas respostas rápidas', () => {
    for (const q of QUICKS) {
      expect(q.en.endsWith('?'), q.id).toBe(true);
      expect(q.pt.trim(), q.id).not.toBe('');
      expect(q.starter.endsWith('…'), q.id).toBe(true);
    }
    expect(new Set(QUICKS.map((q) => q.en)).size).toBe(QUICKS.length);
  });

  it('não usa travessão nos textos', () => {
    expect(JSON.stringify([TRANSFORMS, ASKS, QUICKS])).not.toContain('—');
  });
});

describe('numberWords / ordinalWords / spokenForm', () => {
  it('escreve inteiros por extenso', () => {
    expect(numberWords(0)).toBe('zero');
    expect(numberWords(13)).toBe('thirteen');
    expect(numberWords(30)).toBe('thirty');
    expect(numberWords(99)).toBe('ninety-nine');
    expect(numberWords(100)).toBe('one hundred');
    expect(numberWords(415)).toBe('four hundred fifteen');
    expect(numberWords(1250)).toBe('one thousand two hundred fifty');
    expect(numberWords(9999)).toBe('nine thousand nine hundred ninety-nine');
  });

  it('escreve ordinais de dias do mês', () => {
    expect([1, 2, 3, 5, 12, 20, 21, 22, 23, 30, 31].map(ordinalWords)).toEqual([
      'first', 'second', 'third', 'fifth', 'twelfth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'thirtieth', 'thirty-first',
    ]);
  });

  it('normaliza hífen, "and", vírgula de milhar e dígitos', () => {
    expect(spokenForm('Twenty-Four')).toBe('twenty four');
    expect(spokenForm('one hundred and five')).toBe('one hundred five');
    expect(spokenForm('1,250')).toBe('one thousand two hundred fifty');
    expect(spokenForm('7:45')).toBe('seven forty five');
    expect(spokenForm('8:05')).toBe('eight oh five');
    expect(spokenForm('37%')).toBe('thirty seven percent');
    expect(spokenForm('March 3rd.')).toBe('march third');
    expect(spokenForm('3.75')).toBe('three point seven five');
    expect(spokenForm("nine o'clock")).toBe('nine oclock');
  });
});

describe('checkNumber', () => {
  const int13: NumberItem = { display: '13', kind: 'integer', spoken: ['thirteen'] };
  const int1250: NumberItem = { display: '1,250', kind: 'integer', spoken: ['one thousand two hundred fifty'] };
  const pct37: NumberItem = { display: '37%', kind: 'percent', spoken: ['thirty-seven percent'] };
  const pct125: NumberItem = { display: '12.5%', kind: 'percent', spoken: ['twelve point five percent', 'twelve and a half percent'] };
  const price: NumberItem = { display: '$24.99', kind: 'price', spoken: ['twenty-four dollars and ninety-nine cents', 'twenty-four ninety-nine', 'twenty-four dollars ninety-nine'] };
  const y2024: NumberItem = { display: '2024', kind: 'year', spoken: ['twenty twenty-four', 'two thousand twenty-four'] };
  const y1998: NumberItem = { display: '1998', kind: 'year', spoken: ['nineteen ninety-eight'] };
  const t745: NumberItem = { display: '7:45', kind: 'time', spoken: ['seven forty-five', 'a quarter to eight', 'quarter to eight'] };
  const t900: NumberItem = { display: '9:00', kind: 'time', spoken: ["nine o'clock", 'nine'] };
  const dec: NumberItem = { display: '3.7', kind: 'decimal', spoken: ['three point seven'] };
  const date: NumberItem = { display: 'March 3rd', kind: 'date', spoken: ['March third', 'March the third', 'the third of March', 'third of March'] };

  const cases: [string, NumberItem, string, boolean][] = [
    // inteiros
    ['13 por extenso', int13, 'thirteen', true],
    ['13 em dígitos', int13, '13', true],
    ['13 dito como thirty', int13, 'thirty', false],
    ['13 reconhecido como 30', int13, '30', false],
    ['1,250 por extenso com and', int1250, 'one thousand two hundred and fifty', true],
    ['1,250 em dígitos com vírgula', int1250, '1,250', true],
    ['1,250 em dígitos sem vírgula', int1250, '1250', true],
    ['1,250 dito como 1,215', int1250, 'one thousand two hundred fifteen', false],
    // porcentagens
    ['37% por extenso', pct37, 'thirty-seven percent', true],
    ['37% em dígitos', pct37, '37%', true],
    ['37 percent', pct37, '37 percent', true],
    ['37% sem dizer percent', pct37, 'thirty seven', false],
    ['37 sem unidade', pct37, '37', false],
    ['37% dito como 73%', pct37, '73%', false],
    ['12.5% em dígitos', pct125, '12.5%', true],
    ['12.5% por extenso', pct125, 'twelve point five percent', true],
    ['12.5% and a half', pct125, 'Twelve and a half percent.', true],
    ['12.5% dito como 125%', pct125, '125%', false],
    // preços
    ['preço em dígitos', price, '$24.99', true],
    ['preço em dois blocos', price, '24 99', true],
    ['preço curto por extenso', price, 'twenty four ninety nine', true],
    ['preço completo por extenso', price, 'twenty-four dollars and ninety-nine cents', true],
    ['preço misto', price, '24 dollars and 99 cents', true],
    ['preço com centavos errados', price, '$24.90', false],
    ['preço com dólares errados', price, 'twenty-five ninety-nine', false],
    // anos
    ['ano em pares', y2024, 'twenty twenty-four', true],
    ['ano com thousand', y2024, 'two thousand and twenty-four', true],
    ['ano em dígitos', y2024, '2024', true],
    ['ano errado', y2024, '2014', false],
    ['1998 em dígitos', y1998, '1998', true],
    ['1998 por extenso', y1998, 'nineteen ninety eight', true],
    ['1998 dito como 1989', y1998, 'nineteen eighty-nine', false],
    // horas
    ['hora por extenso', t745, 'seven forty-five', true],
    ['hora com quarter', t745, 'a quarter to eight', true],
    ['hora com quarter e dígito', t745, 'quarter to 8', true],
    ['hora em dígitos', t745, '7:45', true],
    ['hora sem dois-pontos', t745, '745', true],
    ['hora errada', t745, '7:15', false],
    ['hora errada por extenso', t745, 'seven fifty-five', false],
    ['hora cheia por extenso', t900, "nine o'clock", true],
    ['hora cheia em dígitos', t900, '9:00', true],
    ['hora cheia com dígito e oclock', t900, "9 o'clock", true],
    ['hora cheia errada', t900, '8:00', false],
    // decimais
    ['decimal por extenso', dec, 'three point seven', true],
    ['decimal em dígitos', dec, '3.7', true],
    ['decimal sem ponto', dec, '37', false],
    ['decimal errado', dec, 'three point seventeen', false],
    // datas
    ['data por extenso', date, 'March third', true],
    ['data com the', date, 'the third of March', true],
    ['data em dígitos com sufixo', date, 'March 3rd', true],
    ['data em dígitos sem sufixo', date, 'March 3', true],
    ['data só com o dia', date, '3', false],
    ['data com mês errado', date, 'May 3rd', false],
    ['data com dia errado', date, 'March 13th', false],
    // vazio
    ['nada dito', int13, '', false],
    ['só ruído', int13, '...', false],
  ];

  it.each(cases)('%s', (_name, item, said, expected) => {
    expect(checkNumber(item, said)).toBe(expected);
  });

  it('tem pelo menos 12 casos certos e 12 errados', () => {
    expect(cases.filter((c) => c[3]).length).toBeGreaterThanOrEqual(12);
    expect(cases.filter((c) => !c[3]).length).toBeGreaterThanOrEqual(12);
  });
});

describe('makeNumberItem', () => {
  const items = Array.from({ length: 200 }, (_, seed) => makeNumberItem(seed));

  it('é determinístico por seed', () => {
    for (const seed of [0, 1, 7, 42, 199, 1_763_000_000_000]) {
      expect(makeNumberItem(seed)).toEqual(makeNumberItem(seed));
    }
    expect(items).toEqual(Array.from({ length: 200 }, (_, seed) => makeNumberItem(seed)));
  });

  it('cobre todos os tipos em 200 seeds', () => {
    const seen = new Set(items.map((i) => i.kind));
    for (const kind of KINDS) expect(seen.has(kind), kind).toBe(true);
  });

  it('cobre todos os tipos em 10 seeds consecutivas (uma sessão)', () => {
    for (const start of [0, 3, 1_763_000_000_123]) {
      const seen = new Set(Array.from({ length: 10 }, (_, i) => makeNumberItem(start + i).kind));
      expect(seen.size, String(start)).toBe(KINDS.length);
    }
  });

  it('varia o conteúdo entre seeds', () => {
    expect(new Set(items.map((i) => i.display)).size).toBeGreaterThan(120);
  });

  it('gera inteiros entre 13 e 9.999, incluindo os pares difíceis', () => {
    const many = Array.from({ length: 2000 }, (_, seed) => makeNumberItem(seed)).filter((i) => i.kind === 'integer');
    const values = many.map((i) => Number(i.display.replace(/,/g, '')));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(13);
    expect(Math.max(...values)).toBeLessThanOrEqual(9999);
    for (const n of [13, 30, 14, 40, 15, 50]) expect(values.includes(n), String(n)).toBe(true);
    expect(values.some((n) => n >= 1000)).toBe(true);
    expect(many.filter((i) => Number(i.display.replace(/,/g, '')) >= 1000).every((i) => /^\d,\d{3}$/.test(i.display))).toBe(true);
  });

  it('usa o formato esperado em cada tipo', () => {
    const shape: Record<NumberItem['kind'], RegExp> = {
      integer: /^(\d{2,3}|\d,\d{3})$/,
      percent: /^\d{1,3}(\.5)?%$/,
      price: /^\$\d{1,2}\.\d{2}$/,
      year: /^(19|20)\d{2}$/,
      time: /^([1-9]|1[0-2]):[0-5]\d$/,
      decimal: /^\d{1,2}\.[1-9]{1,2}$/,
      date: /^[A-Z][a-z]+ ([1-9]|[12]\d|3[01])(st|nd|rd|th)$/,
    };
    for (const it of items) expect(it.display, it.kind).toMatch(shape[it.kind]);
  });

  it('aceita as próprias formas faladas e a forma em dígitos', () => {
    for (const it of items) {
      expect(it.spoken.length, it.display).toBeGreaterThan(0);
      for (const s of it.spoken) {
        expect(s, it.display).toMatch(/^[A-Za-z' -]+$/);
        expect(checkNumber(it, s), `${it.display}: ${s}`).toBe(true);
      }
      expect(checkNumber(it, it.display), it.display).toBe(true);
    }
  });

  it('não aceita a resposta de outro item do mesmo tipo', () => {
    for (const kind of KINDS) {
      const same = items.filter((i) => i.kind === kind);
      const a = same[0];
      const b = same.find((i) => i.display !== a.display)!;
      expect(checkNumber(a, b.spoken[0]), `${a.display} x ${b.spoken[0]}`).toBe(false);
      expect(checkNumber(a, b.display), `${a.display} x ${b.display}`).toBe(false);
    }
  });

  it('dá as formas faladas dos exemplos clássicos', () => {
    const find = (kind: NumberItem['kind'], display: string) => {
      for (let seed = 0; seed < 200_000; seed++) {
        const it = makeNumberItem(seed);
        if (it.kind === kind && it.display === display) return it;
      }
      throw new Error(`não gerou ${display}`);
    };
    expect(find('year', '2024').spoken).toEqual(['twenty twenty-four', 'two thousand twenty-four']);
    expect(find('year', '2005').spoken).toContain('two thousand five');
    expect(find('year', '1998').spoken).toEqual(['nineteen ninety-eight']);
    expect(find('time', '7:45').spoken).toEqual(expect.arrayContaining(['seven forty-five', 'a quarter to eight']));
    expect(find('time', '10:30').spoken).toEqual(expect.arrayContaining(['ten thirty', 'half past ten']));
    expect(find('date', 'March 3rd').spoken).toContain('March third');
    expect(find('decimal', '3.7').spoken).toEqual(['three point seven']);
  });
});

describe('meanLatency', () => {
  it('devolve a média em segundos com uma casa', () => {
    expect(meanLatency([1000, 2000, 3000])).toBe(2);
    expect(meanLatency([1234])).toBe(1.2);
    expect(meanLatency([1250, 1350])).toBe(1.3);
    expect(meanLatency([840, 2110, 1675])).toBe(1.5);
  });

  it('devolve 0 sem medidas', () => {
    expect(meanLatency([])).toBe(0);
  });
});
