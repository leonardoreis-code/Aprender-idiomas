/**
 * Detector de erros em FALA LIVRE, em tempo real, sem servidor e sem IA.
 *
 * Diferente de `production/errors.ts` (que compara com uma resposta conhecida),
 * aqui não existe alvo: as regras reconhecem diretamente os padrões que o
 * português "empresta" ao inglês de brasileiros ("I have 30 years", "she work",
 * "depends of"...). Roda a cada palavra reconhecida, então dá para sublinhar o
 * erro enquanto a pessoa ainda está falando.
 *
 * Princípio: prefira NÃO marcar a marcar errado. Cada regra tem testes de
 * falso positivo em spotter.test.ts.
 */

export interface Spot {
  rule: string;
  /** Categoria no mapa de erros (ver ERROR_CATEGORIES). */
  cat: string;
  start: number;
  end: number;
  wrong: string;
  /** Texto que substitui o trecho marcado. */
  fix: string;
  /** Pista que NÃO entrega a resposta (degrau 3 do feedback). */
  clue: string;
  /** Regra em português (aparece junto com a resposta, degrau 4). */
  explain: string;
}

interface Rule {
  id: string;
  cat: string;
  re: RegExp;
  /** Grupo que será sublinhado e substituído (0 = o match inteiro). */
  g?: number;
  fix: (m: RegExpExecArray) => string;
  clue: string;
  explain: string;
  /** Filtro extra contra falsos positivos. */
  when?: (m: RegExpExecArray) => boolean;
}

const r = String.raw;
const mk = (src: string) => new RegExp(src, 'gd');
/** Início de oração: começo do texto, pontuação ou conector. */
const START = r`(?:^|[.!?;,]\s+|\b(?:and|but|because|so|then|when|if|today|now|yesterday|think)\s+)`;
const NUM = r`(?:\d{1,3}|(?:twenty|thirty|forty|fifty|sixty)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)`;
const VERBS = 'work|live|like|want|need|have|go|do|say|know|think|make|use|study|play|speak|help|start|love|feel|come|take|get|give|look|try|call|ask|run|write|read|understand|believe|talk|teach|learn|watch|drive|lead|manage|build|send|bring|stay|spend|pay|tell|mean|keep|seem';
const AUX_BEFORE = 'do|does|did|can|could|will|would|should|may|might|must|let|make|makes|made|help|helps|see|saw|to';

const PAST: Record<string, string> = {
  go: 'went', have: 'had', work: 'worked', see: 'saw', make: 'made', do: 'did', get: 'got', come: 'came', take: 'took', finish: 'finished',
  start: 'started', talk: 'talked', meet: 'met', buy: 'bought', say: 'said', tell: 'told', think: 'thought', need: 'needed', want: 'wanted',
  use: 'used', study: 'studied', eat: 'ate', am: 'was', is: 'was', are: 'were',
};
const BASE: Record<string, string> = {
  went: 'go', saw: 'see', had: 'have', made: 'make', got: 'get', came: 'come', took: 'take', knew: 'know', thought: 'think', told: 'tell', found: 'find',
  gave: 'give', left: 'leave', bought: 'buy', said: 'say', did: 'do', worked: 'work', finished: 'finish', liked: 'like', wanted: 'want', needed: 'need',
  started: 'start', used: 'use', studied: 'study', learned: 'learn', talked: 'talk',
};
const OBJ: Record<string, string> = { i: 'me', you: 'you', he: 'him', she: 'her', we: 'us', they: 'them', it: 'it' };
const be = (subj: string, past = false) => (past ? (/^(i|he|she|it)$/.test(subj) ? 'was' : 'were') : subj === 'i' ? 'am' : /^(he|she|it)$/.test(subj) ? 'is' : 'are');

export function s3(v: string): string {
  if (v === 'have') return 'has';
  if (/(ch|sh|s|x|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}
export function ing(v: string): string {
  if (/^(plan|run|get|sit|stop|put|swim|begin)$/.test(v)) return v + v.slice(-1) + 'ing';
  if (/[^e]e$/.test(v)) return v.slice(0, -1) + 'ing';
  return v + 'ing';
}

const RULES: Rule[] = [
  /* ---------- "ter" do português onde o inglês usa "be" ---------- */
  {
    id: 'age', cat: 'be-have',
    re: mk(r`\b(i|you|we|they|he|she) (have|has|had) (${NUM}) years(?: old)?\b(?! (?:of|in|to|left|working|studying|at|with|as|doing))`),
    fix: (m) => `${m[1]} ${be(m[1], m[2] === 'had')} ${m[3]} years old`,
    clue: 'Idade em inglês não usa o verbo "ter".',
    explain: 'Idade usa o verbo to be: "I am 30 years old", nunca "I have 30 years".',
  },
  {
    id: 'have-feeling', cat: 'be-have',
    re: mk(r`\b(i|you|we|they|he|she) (have|has|had) (hungry|thirsty|afraid|sleepy|lucky|sure|fear|hunger|thirst)\b`),
    fix: (m) => `${m[1]} ${be(m[1], m[2] === 'had')} ${{ fear: 'afraid', hunger: 'hungry', thirst: 'thirsty' }[m[3]] ?? m[3]}`,
    clue: 'Fome, sede, medo e sono: em inglês você "é/está", não "tem".',
    explain: '"Estou com fome/medo" = "I am hungry / afraid". O inglês usa to be + adjetivo.',
  },
  /* ---------- sujeito ---------- */
  {
    id: 'it-subject', cat: 'missing-subject', g: 1,
    re: mk(r`${START}((?:is|was|will be) (?:raining|snowing|cold|hot|late|early|important|possible|impossible|difficult|hard|easy|necessary|good|bad|true|better|sunny|windy|common|normal|interesting|strange|clear|obvious))\b`),
    fix: (m) => `it ${m[1]}`,
    clue: 'Falta alguém antes do verbo: quem "is"?',
    explain: 'Toda oração precisa de sujeito. "É importante" = "It is important"; "Está chovendo" = "It is raining".',
  },
  {
    id: 'there-have', cat: 'there-is',
    re: /\bthere (have|has|had)\b(?! been| to| always| never)/gd,
    fix: (m) => ({ have: 'there are', has: 'there is', had: 'there was' })[m[1]]!,
    clue: '"Tem / há" no sentido de existir não usa have.',
    explain: '"Tem" (existir) = "there is / there are". "There have" não existe.',
  },
  {
    id: 'have-existential', cat: 'there-is', g: 1,
    re: mk(r`${START}((?:have|has|had) (a lot of|lots of|a|an|one|many|some|two|three|four|five|no)) (?!nice|good|great|safe|wonderful|seat|look|drink|rest|break|fun)`),
    fix: (m) => `${/^(a|an|one|no)$/.test(m[2]) ? 'there is' : 'there are'} ${m[2]}`,
    clue: 'A frase começa com "tem…": quem tem? Se é "existe", o inglês usa outra expressão.',
    explain: '"Tem muitos bugs" = "There are many bugs". Começar a frase com "Have" não funciona em inglês.',
  },
  /* ---------- concordância ---------- */
  {
    id: 'third-person', cat: 'third-person', g: 2,
    re: mk(r`(?<!\b(?:${AUX_BEFORE})\s)\b(he|she|it) (${VERBS})\b(?!')`),
    fix: (m) => s3(m[2]),
    clue: 'Olhe o verbo depois de he / she / it.',
    explain: 'No presente, com he, she e it o verbo ganha -s: "she works", "he has", "it goes".',
  },
  {
    id: 'third-person-noun', cat: 'third-person', g: 2,
    re: mk(r`(?<!\b(?:${AUX_BEFORE})\s)\b(?:my|our|the|your|his|her) (boss|manager|client|customer|wife|husband|brother|sister|mother|father|friend|colleague|system|pipeline|job|project) (work|live|like|want|need|have|go|do|use|make|think|know|say|run|start|help)\b`),
    fix: (m) => s3(m[2]),
    clue: 'O sujeito é uma pessoa ou coisa só (ele/ela). O verbo concorda?',
    explain: 'Sujeito no singular (my boss, the system) = he/she/it: o verbo ganha -s. "My boss works", "the pipeline runs".',
  },
  {
    id: 'people-is', cat: 'agreement', g: 1,
    re: /\bpeople (is|was|has|doesn't|does)\b/gd,
    fix: (m) => ({ is: 'are', was: 'were', has: 'have', "doesn't": "don't", does: 'do' })[m[1]]!,
    clue: '"People" é plural em inglês.',
    explain: '"People" é plural: "people are", "people have", "people don\'t".',
  },
  {
    id: 'was-were', cat: 'agreement', g: 1,
    re: /\b(?:we|they|you) (was)\b/gd,
    fix: () => 'were',
    clue: 'Olhe o verbo depois de we / they / you no passado.',
    explain: 'We, they e you usam "were": "we were", "they were".',
  },
  {
    id: 'he-dont', cat: 'agreement', g: 1,
    re: /\b(?:he|she|it) (don't|do not)\b/gd,
    fix: (m) => (m[1] === "don't" ? "doesn't" : 'does not'),
    clue: 'A negativa com he / she / it usa outro auxiliar.',
    explain: 'He, she e it usam "doesn\'t": "she doesn\'t know".',
  },
  {
    id: 'i-has', cat: 'agreement', g: 1,
    re: /\b(?:i|you|we|they) (has|doesn't|does not)\b/gd,
    fix: (m) => ({ has: 'have', "doesn't": "don't", 'does not': 'do not' })[m[1]]!,
    clue: 'Has e doesn\'t são só para he / she / it.',
    explain: 'I, you, we e they usam "have" e "don\'t".',
  },
  {
    id: 'irregular-plural', cat: 'agreement',
    re: /\b(childs|childrens|mans|womans|feets|tooths)\b/gd,
    fix: (m) => ({ childs: 'children', childrens: 'children', mans: 'men', womans: 'women', feets: 'feet', tooths: 'teeth' })[m[1]]!,
    clue: 'Esse plural é irregular.',
    explain: 'Plurais irregulares: child → children, man → men, woman → women.',
  },
  /* ---------- auxiliares e tempos ---------- */
  {
    id: 'did-past', cat: 'do-support', g: 1,
    re: /\b(?:(?:didn't|did not|doesn't|don't|does not|do not) (?:(?:i|you|he|she|it|we|they) )?|(?:did|does|do) (?:i|you|he|she|it|we|they) )(went|saw|had|made|got|came|took|knew|thought|told|found|gave|left|worked|finished|liked|wanted|needed|started|used|bought|said|studied|learned|talked)\b/gd,
    fix: (m) => BASE[m[1]] ?? m[1],
    clue: 'Depois de did / didn\'t / do / does, como fica o verbo?',
    explain: 'O auxiliar já carrega o tempo. Depois de did/didn\'t o verbo volta à forma base: "I didn\'t go", "Did you see?".',
  },
  {
    id: 'wh-no-aux', cat: 'do-support', g: 1,
    re: mk(r`(?:^|[.!?]\s+)((?:where|why) (you|he|she|they|we)) (?!are|is|was|were|do|does|did|can|could|will|would|should|have|has|had)\w+`),
    fix: (m) => `${m[1].split(' ')[0]} ${/^(he|she)$/.test(m[2]) ? 'does' : 'do'} ${m[2]}`,
    clue: 'É uma pergunta: falta uma palavrinha entre o "where/why" e o sujeito.',
    explain: 'Perguntas precisam do auxiliar: "Where do you work?", "Why does she want that?".',
  },
  {
    id: 'yn-no-aux', cat: 'do-support', g: 1,
    re: mk(r`(?:^|[.!?]\s+)((you|he|she|they|we)) (?:like|want|need|have|know|work|live|speak|think|understand|use|go)\b[^.?!]*\?`),
    fix: (m) => `${/^(he|she)$/.test(m[2]) ? 'does' : 'do'} ${m[2]}`,
    clue: 'Pergunta de sim ou não: como ela começa em inglês?',
    explain: 'Perguntas de sim/não começam com o auxiliar: "Do you like coffee?", "Does he work here?".',
  },
  {
    id: 'past-marker', cat: 'past-tense', g: 1,
    re: /\b(?:yesterday|last (?:week|month|year|night|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:two|three|four|five|\d+|a few|some) (?:days|weeks|months|years) ago),? (?:i|we|he|she|they|you) (go|have|work|see|make|do|get|come|take|finish|start|talk|meet|buy|say|tell|think|need|want|use|study|eat|am|is|are)\b/gd,
    fix: (m) => PAST[m[1]] ?? m[1],
    clue: 'Você disse quando aconteceu (ontem, semana passada…). O verbo acompanha?',
    explain: 'Com yesterday, last week, ago: verbo no passado. "Yesterday I went", "Last week we finished".',
  },
  {
    id: 'past-marker-end', cat: 'past-tense', g: 1,
    re: /\b(?:i|we|he|she|they) (go|have|work|see|make|do|get|come|take|finish|start|talk|meet|buy|say|tell|eat) ((?:\w+ ){0,3})(?:yesterday|last (?:week|month|year|night|weekend))\b/gd,
    fix: (m) => PAST[m[1]] ?? m[1],
    when: (m) => !/\b(did|was|were|had|went|said|told|made|got|saw|will|to)\b/.test(m[2]),
    clue: 'A frase termina com "yesterday / last…". O verbo está no tempo certo?',
    explain: 'Ação terminada no passado pede o passado: "I went there yesterday".',
  },
  {
    id: 'present-since', cat: 'perfect', g: 1,
    re: /\b(?:i|we|they|you) (work|live|study|know|am|are|have) ((?:\w+ ){0,4}?)(?:since (?:\d{4}|last \w+|january|february|march|april|may|june|july|august|september|october|november|december|\w+day|i was|\d+)|for (?:\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|many|several|some) (?:years?|months?))\b/gd,
    fix: (m) => ({ work: 'have been working', live: 'have lived', study: 'have been studying', know: 'have known', am: 'have been', are: 'have been', have: 'have had' })[m[1]]!,
    when: (m) => !/^(been|worked|lived|studied|known|had|\w+ed)\b/.test(m[2]),
    clue: 'Começou no passado e continua até agora. O presente simples dá conta?',
    explain: '"Faz X tempo que…" / "desde…" = present perfect: "I have worked here for two years", "I have lived here since 2020".',
  },
  {
    id: 'since-duration', cat: 'perfect',
    re: /\bsince ((?:\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|many|some|a few|few|several) (?:years?|months?|weeks?|days?|hours?))\b(?! ago)/gd,
    fix: (m) => `for ${m[1]}`,
    clue: 'Since marca o ponto de início (since 2020). Para duração, a palavra é outra.',
    explain: 'Duração usa "for": "for two years". "Since" é para o início: "since 2020".',
  },
  {
    id: 'years-that', cat: 'perfect',
    re: /\b(?:have|has|it has|there are|makes?) ((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|some) (?:years|months|weeks)) that\b/gd,
    fix: (m) => `for ${m[1]}`,
    clue: '"Faz dois anos que…" não se traduz palavra por palavra.',
    explain: '"Faz dois anos que eu trabalho aqui" = "I have been working here for two years".',
  },
  {
    id: 'be-base', cat: 'verb-pattern', g: 1,
    re: /\b(?:i am|i'm|we are|we're|they are|they're|you are|you're|he is|she is) (work|study|live|go|think|have|do|make|try|learn|talk|use|wait|look|plan|build|write|read|test|fix)\b(?!ing)/gd,
    fix: (m) => ing(m[1]),
    clue: 'Depois de am / is / are, o verbo precisa de uma terminação.',
    explain: 'To be + verbo pede -ing: "I am working", "we are trying". Ou tire o "am": "I work".',
  },
  {
    id: 'been-base', cat: 'verb-pattern', g: 1,
    re: /\b(?:have|has|had|'ve) been (work|study|live|learn|wait|try|use|do|talk|play|think|look|build|plan|test)\b(?!ing)/gd,
    fix: (m) => ing(m[1]),
    clue: 'Depois de "have been", o verbo precisa de uma terminação.',
    explain: 'Have been + verbo com -ing: "I have been working".',
  },
  {
    id: 'to-past', cat: 'verb-pattern', g: 1,
    re: /\bto (worked|went|studied|finished|learned|talked|made|did|saw|got|took|bought|said|told|came|wanted|needed|started|liked)\b/gd,
    fix: (m) => BASE[m[1]] ?? m[1],
    clue: 'Depois de "to", o verbo fica em que forma?',
    explain: 'Depois de "to" vem a forma base: "I wanted to go", não "to went".',
  },
  {
    id: 'modal-to', cat: 'verb-pattern',
    re: /\b(can|could|must|should|will|would|may|might|can't|cannot|couldn't|shouldn't|won't) to\b/gd,
    fix: (m) => m[1],
    clue: 'Tem uma palavra sobrando depois do can / must / should.',
    explain: 'Depois de modal (can, must, should, will) o verbo vem direto, sem "to": "I can help".',
  },
  {
    id: 'ing-after-verb', cat: 'verb-pattern',
    re: /\b(enjoy|enjoyed|finish|finished|avoid|avoided|consider|considered|suggest|suggested|keep|kept|practice|practiced) to (\w+)\b/gd,
    fix: (m) => `${m[1]} ${ing(m[2])}`,
    clue: 'Depois desse verbo não se usa "to".',
    explain: 'Enjoy, finish, avoid, keep, suggest pedem -ing: "I enjoy working", "we finished testing".',
  },
  {
    id: 'want-that', cat: 'verb-pattern',
    re: /\b(want|wants|wanted|need|needs|needed|would like) that (i|you|he|she|we|they|it)\b/gd,
    fix: (m) => `${m[1]} ${OBJ[m[2]]} to`,
    clue: '"Quero que você…" não usa "that" em inglês.',
    explain: '"Quero que você faça" = "I want you to do". Estrutura: want + pessoa + to + verbo.',
  },
  {
    id: 'for-to', cat: 'verb-pattern',
    re: /\bfor to (\w+)\b/gd,
    fix: (m) => `to ${m[1]}`,
    clue: 'Duas preposições seguidas: uma delas sobra.',
    explain: 'Finalidade usa só "to": "I study to learn", não "for to learn".',
  },
  {
    id: 'for-verb', cat: 'verb-pattern',
    re: /(?<!\b(?:ask|asked|asking|thanks|thank you|sorry|time|ready|easy|hard|difficult|important|me|him|her|us|them) )\bfor (buy|learn|make|do|get|go|see|improve|talk|understand|solve|fix|know|speak|have)\b(?!ing)/gd,
    fix: (m) => `to ${m[1]}`,
    clue: '"Para + verbo" (finalidade) não é "for".',
    explain: '"Para aprender" = "to learn". Use "to + verbo" para dizer a finalidade.',
  },
  {
    id: 'double-negative', cat: 'agreement', g: 1,
    re: /\b(?:don't|doesn't|didn't|do not|does not|did not|can't|cannot|won't|haven't) (?:\w+ ){0,2}(nothing|nobody|no one|nowhere)\b/gd,
    fix: (m) => ({ nothing: 'anything', nobody: 'anybody', 'no one': 'anyone', nowhere: 'anywhere' })[m[1]]!,
    clue: 'Duas negações na mesma frase.',
    explain: 'Inglês usa uma negação só: "I don\'t know anything", não "I don\'t know nothing".',
  },
  {
    id: 'more-er', cat: 'agreement',
    re: /\bmore (better|easier|faster|bigger|cheaper|worse|smaller|older|younger|harder|simpler|quicker|stronger|higher|lower|longer|shorter)\b/gd,
    fix: (m) => m[1],
    clue: 'Esse adjetivo já está no comparativo.',
    explain: 'Better, easier, faster já significam "mais…". Não precisam de "more".',
  },
  {
    id: 'agree', cat: 'verb-pattern',
    re: /\b(i|we|you|they|he|she) ?(?:am|'m|are|'re|is|'s) (not )?agree\b/gd,
    fix: (m) => (m[2] ? `${m[1]} ${/^(he|she)$/.test(m[1]) ? "doesn't" : "don't"} agree` : `${m[1]} ${/^(he|she)$/.test(m[1]) ? 'agrees' : 'agree'}`),
    clue: '"Concordar" em inglês é verbo, não adjetivo.',
    explain: '"Eu concordo" = "I agree" (sem am). Negativa: "I don\'t agree".',
  },
  {
    id: 'born', cat: 'verb-pattern',
    re: /\b(i|he|she|we|they|you) (?:born|borned|have born|has born)\b/gd,
    fix: (m) => `${m[1]} ${be(m[1], true)} born`,
    clue: '"Nascer" em inglês precisa do verbo to be.',
    explain: '"Eu nasci" = "I was born".',
  },
  /* ---------- preposições ---------- */
  {
    id: 'depend-of', cat: 'preposition',
    re: /\bdepend(s|ed|ing)? of\b/gd,
    fix: (m) => `depend${m[1] ?? ''} on`,
    clue: 'A preposição depois de "depend" não é a do português.',
    explain: '"Depende de" = "depends on".',
  },
  {
    id: 'explain-me', cat: 'preposition',
    re: /\b(explain|explained|explains) (me|him|her|us|them)\b/gd,
    fix: (m) => `${m[1]} to ${m[2]}`,
    clue: 'Falta uma preposição entre "explain" e a pessoa.',
    explain: '"Me explica" = "explain to me".',
  },
  {
    id: 'say-me', cat: 'collocation',
    re: /\b(said|say|says) (me|him|her|us|them)\b/gd,
    fix: (m) => `${{ said: 'told', say: 'tell', says: 'tells' }[m[1]]} ${m[2]}`,
    clue: '"Dizer para alguém": o inglês usa outro verbo quando vem a pessoa logo depois.',
    explain: 'Say não leva a pessoa direto. Use tell: "she told me", ou "she said to me".',
  },
  {
    id: 'discuss-about', cat: 'preposition',
    re: /\bdiscuss(ed|es|ing)? about\b/gd,
    fix: (m) => `discuss${m[1] ?? ''}`,
    clue: 'Tem uma preposição sobrando depois de "discuss".',
    explain: '"Discutir sobre" = "discuss" direto: "we discussed the plan".',
  },
  {
    id: 'married-with', cat: 'preposition',
    re: /\bmarried with\b/gd,
    fix: () => 'married to',
    clue: 'A preposição de "casado com" não é "with".',
    explain: '"Casado com" = "married to".',
  },
  {
    id: 'listen-to', cat: 'preposition',
    re: /\blisten(ed|ing|s)? (?!to\b)(music|the|my|your|a|an|this|that|podcasts?|him|her|you|me|songs?|what)\b/gd,
    fix: (m) => `listen${m[1] ?? ''} to ${m[2]}`,
    clue: 'Falta uma preposição depois de "listen".',
    explain: '"Ouvir algo" = "listen to": "I listen to music".',
  },
  {
    id: 'to-home', cat: 'preposition',
    re: /\b(go|went|going|gone|goes|arrive|arrived|come|came|comes|coming|get|got|getting|back|return|returned) to home\b/gd,
    fix: (m) => `${m[1]} home`,
    clue: 'Tem uma palavra sobrando antes de "home".',
    explain: 'Com verbos de movimento, "home" vem sem preposição: "go home", "get home".',
  },
  {
    id: 'day-prep', cat: 'preposition',
    re: /\b(?:in|at)(?: the)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday)(s?)\b/gd,
    fix: (m) => `on ${m[1][0].toUpperCase()}${m[1].slice(1)}${m[2]}`,
    clue: 'Dias da semana usam outra preposição.',
    explain: 'Dias da semana usam "on": "on Monday".',
  },
  {
    id: 'arrive-at', cat: 'preposition',
    re: /\barriv(e|ed|es|ing) (?:to|in) (?:the |my )?(office|work|airport|meeting|school|station|hotel|company)\b/gd,
    fix: (m) => `arriv${m[1]} at ${m[2] === 'work' ? '' : 'the '}${m[2]}`,
    clue: 'A preposição depois de "arrive" não é "to".',
    explain: '"Chegar a/em" um lugar = "arrive at": "I arrived at the office".',
  },
  {
    id: 'verb-to-person', cat: 'preposition',
    re: /\b(call|called|calls|ask|asked|asks|tell|told|tells|answer|answered) to (me|him|her|you|them|us|my|the)\b/gd,
    fix: (m) => `${m[1]} ${m[2]}`,
    clue: 'Tem um "to" sobrando entre o verbo e a pessoa.',
    explain: 'Call, ask, tell e answer levam a pessoa direto: "call me", "ask him", "tell her".',
  },
  {
    id: 'like-of', cat: 'preposition',
    re: /\b(i|you|we|they|he|she) (like|likes|liked|need|needs|needed) of\b/gd,
    fix: (m) => `${m[1]} ${m[2]}`,
    clue: 'Tem um "of" sobrando.',
    explain: '"Gostar de" e "precisar de" não levam preposição em inglês: "I like coffee", "I need help".',
  },
  {
    id: 'the-my', cat: 'article',
    re: /\bthe (my|your|his|her|our|their)\b/gd,
    fix: (m) => m[1],
    clue: 'Tem um artigo sobrando antes do possessivo.',
    explain: 'Inglês não usa artigo com possessivo: "my team", não "the my team".',
  },
  /* ---------- contáveis ---------- */
  {
    id: 'uncountable-plural', cat: 'uncountable',
    re: /\b(informations|advices|softwares|feedbacks|researches|equipments|homeworks|knowledges|stuffs|furnitures|evidences)\b/gd,
    fix: (m) => ({ researches: 'research' })[m[1]] ?? m[1].replace(/s$/, ''),
    clue: 'Essa palavra não tem plural em inglês.',
    explain: 'Information, advice, software, feedback são incontáveis: sem -s. Para contar: "two pieces of information".',
  },
  {
    id: 'uncountable-a', cat: 'uncountable',
    re: /\b(an?) (information|advice|software|feedback|homework|equipment|evidence|research)(?= (?:about|that|for|from|to|on|is|was|and|but|in|of)\b|[.,!?]|$)/gd,
    fix: (m) => `some ${m[2]}`,
    clue: 'Essa palavra não aceita "a / an".',
    explain: 'Incontáveis não usam a/an: "some information", "a piece of advice".',
  },
  {
    id: 'much-plural', cat: 'uncountable',
    re: /\bmuch (people|things|problems|years|days|times|friends|meetings|projects|bugs|tasks|questions|errors|mistakes|clients|customers|options|hours|months|weeks)\b/gd,
    fix: (m) => `many ${m[1]}`,
    clue: 'Para coisas que dá para contar, não é "much".',
    explain: 'Contáveis usam "many": "many people", "many bugs". "Much" é para incontáveis: "much time".',
  },
  /* ---------- combinações de palavras ---------- */
  {
    id: 'make-question', cat: 'collocation',
    re: /\b(make|made|making|do|did|doing) (a|an|the|some|many|my) (questions?)\b/gd,
    fix: (m) => `${{ make: 'ask', made: 'asked', making: 'asking', do: 'ask', did: 'asked', doing: 'asking' }[m[1]]} ${m[2]} ${m[3]}`,
    clue: 'Pergunta não se "faz" em inglês.',
    explain: '"Fazer uma pergunta" = "ask a question".',
  },
  {
    id: 'do-mistake', cat: 'collocation',
    re: /\b(do|did|doing|does) (a|an|the|some|many|my) (mistakes?|decisions?|effort|progress)\b/gd,
    fix: (m) => `${{ do: 'make', did: 'made', doing: 'making', does: 'makes' }[m[1]]} ${m[2]} ${m[3]}`,
    clue: 'Erro e decisão combinam com o outro "fazer".',
    explain: '"Make a mistake", "make a decision", "make progress". Make = criar/produzir.',
  },
  {
    id: 'make-course', cat: 'collocation',
    re: /\b(make|made|making) (a|an|the|my|some) (course|test|exam|exams)\b/gd,
    fix: (m) => `${{ make: 'take', made: 'took', making: 'taking' }[m[1]]} ${m[2]} ${m[3]}`,
    clue: 'Curso e prova não se "fazem" com make.',
    explain: '"Fazer um curso / uma prova" = "take a course / a test".',
  },
  {
    id: 'make-exercise', cat: 'collocation',
    re: /\b(make|made|making) (exercises?|homework|sports?)\b/gd,
    fix: (m) => `${{ make: 'do', made: 'did', making: 'doing' }[m[1]]} ${m[2]}`,
    clue: 'Exercício e lição combinam com o outro "fazer".',
    explain: '"Do exercise", "do homework". Do = executar uma atividade.',
  },
  {
    id: 'take-meal', cat: 'collocation',
    re: /\b(take|took|taking) (a |the |my )?(breakfast|lunch|dinner|coffee)\b/gd,
    fix: (m) => `${{ take: 'have', took: 'had', taking: 'having' }[m[1]]} ${m[2] ?? ''}${m[3]}`,
    clue: 'Refeição e café: o verbo não é "take".',
    explain: '"Tomar café / almoçar" = "have coffee / have lunch".',
  },
  {
    id: 'lost-missed', cat: 'false-friend',
    re: /\blost (the|my) (bus|train|flight|plane|class|meeting)\b/gd,
    fix: (m) => `missed ${m[1]} ${m[2]}`,
    clue: '"Perder o ônibus" não é o mesmo "perder" de perder a chave.',
    explain: '"Perder" um transporte ou compromisso = "miss": "I missed the bus".',
  },
  {
    id: 'pass-spend', cat: 'false-friend',
    re: /\b(pass|passed) (the |a |my )?(vacation|weekend|holidays|night|day|time)\b/gd,
    fix: (m) => `${m[1] === 'pass' ? 'spend' : 'spent'} ${m[2] ?? ''}${m[3]}`,
    clue: '"Passar" tempo em inglês usa outro verbo.',
    explain: '"Passar o fim de semana" = "spend the weekend".',
  },
  {
    id: 'pretend', cat: 'false-friend',
    re: /\bpretend(s|ed|ing)? to\b/gd,
    fix: (m) => `intend${m[1] ?? ''} to`,
    clue: 'Falso cognato: "pretend" não é "pretender".',
    explain: '"Pretend" = fingir. "Pretendo fazer" = "I intend to / I plan to".',
  },
  {
    id: 'assist-watch', cat: 'false-friend',
    re: /\bassist(ed|ing|s)? (?:to )?(a |the |an )?(movie|film|video|series|class|game|tv|show|lecture|match)\b/gd,
    fix: (m) => `watch${m[1] === 's' ? 'es' : m[1] ?? ''} ${m[2] ?? ''}${m[3]}`,
    clue: 'Falso cognato: "assist" não é "assistir".',
    explain: '"Assistir" (ver) = "watch". "Assist" = ajudar.',
  },
  {
    id: 'realize-do', cat: 'false-friend',
    re: /\b(realize|realized) (a|the|my) (project|task|work|test|job)\b/gd,
    fix: (m) => `${m[1] === 'realize' ? 'carry out' : 'carried out'} ${m[2]} ${m[3]}`,
    clue: 'Falso cognato: "realize" não é "realizar".',
    explain: '"Realize" = perceber. "Realizar um projeto" = "carry out / do a project".',
  },
  {
    id: 'stay-feeling', cat: 'false-friend',
    re: /\b(i|he|she|we|they|you) (stay|stayed|stays) (happy|sad|nervous|tired|angry|worried|sick|surprised|confused|stressed)\b/gd,
    fix: (m) => `${m[1]} ${m[2] === 'stayed' ? 'got' : m[2] === 'stays' ? 'gets' : 'get'} ${m[3]}`,
    clue: '"Ficar" (mudar de estado) não é "stay".',
    explain: '"Fiquei nervoso" = "I got nervous". "Stay" = permanecer num lugar ou estado.',
  },
];

const prep = (text: string) => text.toLowerCase().replace(/[’‘`´]/g, "'");

/** Marca erros típicos em fala livre. Retorna trechos sem sobreposição, em ordem. */
export function spot(text: string): Spot[] {
  const low = prep(text);
  const found: Spot[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(low))) {
      if (m[0] === '') {
        rule.re.lastIndex++;
        continue;
      }
      if (rule.when && !rule.when(m)) continue;
      const idx = m.indices?.[rule.g ?? 0];
      if (!idx) continue;
      const [start, end] = idx;
      found.push({ rule: rule.id, cat: rule.cat, start, end, wrong: text.slice(start, end), fix: rule.fix(m).trim(), clue: rule.clue, explain: rule.explain });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Spot[] = [];
  for (const s of found) if (!out.length || s.start >= out[out.length - 1].end) out.push(s);
  return out;
}

/** Aplica a correção de um trecho. */
export const applyFix = (text: string, s: Pick<Spot, 'start' | 'end' | 'fix'>) => text.slice(0, s.start) + s.fix + text.slice(s.end);

/** Texto com todas as correções aplicadas (para mostrar o modelo). */
export function corrected(text: string): string {
  return spot(text).reduceRight((t, s) => applyFix(t, s), text);
}

export const RULE_COUNT = RULES.length;
