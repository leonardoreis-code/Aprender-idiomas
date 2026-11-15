/**
 * Usos do Claude (capacidade `sample` do artefato). Tudo aqui é opcional: sem
 * Claude, o app usa só as regras locais e diz isso ao aluno.
 */
import type { Drill } from '../domain/curriculum/speaking';
import { normalize } from '../domain/practice/answer';
import { caps, isArtifact } from './platform';
import { goalMet, type Mission } from '../domain/sim/engine';

/**
 * Fora do artefato (no seu computador), o Claude vem do servidor local (/api/llm),
 * que usa a SUA chave da Anthropic guardada no .env. Descoberto uma vez, na abertura.
 */
let serverLlm = false;
if (!isArtifact && typeof fetch !== 'undefined' && typeof window !== 'undefined') {
  void fetch('/api/health')
    .then((r) => (r.ok ? r.json() : null))
    .then((h: { llm?: boolean } | null) => {
      serverLlm = !!h?.llm;
    })
    .catch(() => {});
}

export const llmAvailable = () => !!caps.sample || serverLlm;

async function localSample(prompt: string, tier: 'quick' | 'default'): Promise<string | null> {
  const r = await fetch('/api/llm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, tier }) });
  if (!r.ok) return null;
  const j = (await r.json()) as { text?: string };
  return typeof j.text === 'string' ? j.text : null;
}

/** Próximo índice livre de "Minhas frases": o maior existente, não a quantidade (remover abre buraco). */
export function nextMineIndex(custom: { id: string }[]): number {
  return custom.reduce((max, d) => Math.max(max, Number(/^mine-d(\d+)$/.exec(d.id)?.[1] ?? 0)), 0);
}

async function askJson<T>(prompt: string, tier: 'quick' | 'default' = 'default'): Promise<T | null> {
  const s = caps.sample;
  if (!s) {
    if (!serverLlm) return null;
    try {
      const text = await localSample(`${prompt}\n\nReply with the JSON only, no other text.`, tier);
      const m = text?.match(/[[{][\s\S]*[\]}]/);
      return m ? (JSON.parse(m[0]) as T) : null;
    } catch {
      return null;
    }
  }
  try {
    if (s.json) return (await s.json(prompt, { modelTier: tier, cache: false })) as T;
    const r = await s(prompt, { modelTier: tier, cache: false });
    const m = r.text.match(/[[{][\s\S]*[\]}]/);
    return m ? (JSON.parse(m[0]) as T) : null;
  } catch {
    return null;
  }
}

export interface Judgement {
  accepted: string[];
  rubric?: { errorsPer100?: number; cefr?: string; comment?: string };
}

/**
 * Avaliador do checkpoint: aceita paráfrases corretas que não estavam na lista
 * e dá uma rubrica para a fala livre. Um pedido só por checkpoint.
 */
export async function judgeCheckpoint(
  items: { id: string; pt: string; said: string; refs: string[] }[],
  free: { prompt: string; text: string }[],
): Promise<Judgement | null> {
  const freeText = free.filter((f) => f.text.trim());
  if (!items.length && !freeText.length) return { accepted: [] };
  const r = await askJson<{ accepted?: unknown; errors_per_100_words?: unknown; cefr?: unknown; comment_pt?: unknown }>(
    `You are a strict but fair English examiner for Brazilian learners. Texts come from speech recognition: ignore punctuation and capitalization.

PART 1 - translations. For each item decide if the learner's sentence is a CORRECT and NATURAL English translation of the Portuguese sentence (same meaning, correct grammar). Different wording is fine. Any grammar error (tense, missing subject, missing auxiliary, third person -s, wrong preposition that changes correctness) means NOT accepted.
${items.map((i) => `- id ${i.id} | PT: "${i.pt}" | reference: "${i.refs[0]}" | learner: "${i.said}"`).join('\n') || '(none)'}

PART 2 - free speech samples (about 45 seconds each):
${freeText.map((f, k) => `Sample ${k + 1} (prompt: ${f.prompt}): "${f.text}"`).join('\n') || '(none)'}

Respond ONLY with JSON: {"accepted": ["ids accepted in part 1"], "errors_per_100_words": number or null (grammar errors per 100 words across the samples), "cefr": "A1"|"A2"|"B1"|"B2"|"C1" or null (speaking level suggested by the samples only), "comment_pt": "2 frases em português: o principal ponto forte e o principal erro a corrigir" or null}`,
  );
  if (!r) return null;
  const ids = new Set(items.map((i) => i.id));
  return {
    accepted: Array.isArray(r.accepted) ? r.accepted.filter((x): x is string => typeof x === 'string' && ids.has(x)) : [],
    rubric: freeText.length
      ? {
          errorsPer100: typeof r.errors_per_100_words === 'number' ? Math.round(r.errors_per_100_words * 10) / 10 : undefined,
          cefr: typeof r.cefr === 'string' ? r.cefr.slice(0, 2) : undefined,
          comment: typeof r.comment_pt === 'string' ? r.comment_pt.slice(0, 400) : undefined,
        }
      : undefined,
  };
}

export interface SpeechFeedback {
  improved: string;
  fixes: { original: string; better: string; why: string }[];
  tip: string;
}

/** Feedback para a fala livre diária. */
export async function speechFeedback(prompt: string, text: string): Promise<SpeechFeedback | null> {
  const r = await askJson<{ improved?: unknown; fixes?: unknown; tip_pt?: unknown }>(
    `You coach a Brazilian professional (tech/data) who understands English but struggles to speak. This is a transcript of ~1 minute of free speech answering: "${prompt}".
Transcript (speech recognition, ignore punctuation): "${text}"
Respond ONLY with JSON: {"improved": "the same content in natural B1-B2 spoken English, max 90 words", "fixes": [{"original": "exact excerpt", "better": "corrected", "why": "explicação curta em português"}] (max 4, most important), "tip_pt": "uma dica em português, 1 frase"}`,
  );
  if (!r || typeof r.improved !== 'string') return null;
  const fixes = Array.isArray(r.fixes) ? r.fixes : [];
  return {
    improved: r.improved.slice(0, 900),
    fixes: fixes
      .filter((f): f is { original: string; better: string; why: string } => !!f && typeof f.original === 'string' && typeof f.better === 'string')
      .slice(0, 4)
      .map((f) => ({ original: f.original.slice(0, 200), better: f.better.slice(0, 200), why: String(f.why ?? '').slice(0, 200) })),
    tip: typeof r.tip_pt === 'string' ? r.tip_pt.slice(0, 300) : '',
  };
}

/** "Minhas frases": transforma frases em português do aluno em drills com blocos alinhados. */
export async function makeDrills(sentencesPt: string[], startIndex: number): Promise<Drill[] | null> {
  const r = await askJson<unknown[]>(
    `Translate each Portuguese sentence (written by a Brazilian tech/data professional about their own work and life) into natural spoken English, B1-B2 level, and split it into 2-5 meaning chunks.
RULES for chunks: the array order follows the ENGLISH word order; joining the chunks' "en" with single spaces must reproduce the English sentence exactly (without the final punctuation); each chunk's "pt" is the matching piece of the Portuguese sentence; when English needs a word Portuguese omits (like the subject "it"), write it in parentheses in "pt", e.g. "(it) está".
Sentences:
${sentencesPt.map((s, i) => `${i + 1}. ${s}`).join('\n')}
Respond ONLY with a JSON array, one object per sentence in the same order: [{"pt": "...", "en": "...", "alt": ["other fully correct natural versions, max 3"], "chunks": [{"pt": "...", "en": "..."}], "hint": "dica curta em português sobre a estrutura"}]`,
  );
  if (!Array.isArray(r)) return null;
  const out: Drill[] = [];
  r.forEach((raw, i) => {
    const o = raw as { pt?: unknown; en?: unknown; alt?: unknown; chunks?: unknown; hint?: unknown };
    if (typeof o?.en !== 'string' || !o.en.trim()) return;
    const pt = typeof o.pt === 'string' && o.pt.trim() ? o.pt : sentencesPt[i];
    if (!pt) return;
    let chunks = Array.isArray(o.chunks)
      ? o.chunks.filter((c): c is { pt: string; en: string } => !!c && typeof c.pt === 'string' && typeof c.en === 'string' && !!c.pt.trim() && !!c.en.trim())
      : [];
    // garante a regra dos blocos; se o modelo errar, a frase vira um bloco só
    if (!chunks.length || normalize(chunks.map((c) => c.en).join(' ')) !== normalize(o.en)) chunks = [{ pt, en: o.en.replace(/[.!?]+$/, '') }];
    out.push({
      id: `mine-d${String(startIndex + out.length + 1).padStart(3, '0')}`,
      pt,
      en: o.en,
      alt: Array.isArray(o.alt) ? o.alt.filter((a): a is string => typeof a === 'string').slice(0, 3) : undefined,
      chunks,
      hint: typeof o.hint === 'string' ? o.hint.slice(0, 200) : undefined,
    });
  });
  return out;
}

export interface CoachReply {
  /** Erros além dos que as regras locais já acharam (no máximo 2). */
  errors: { quote: string; fix: string; clue: string; explain: string; cat: string }[];
  /** Jeito mais natural de dizer algo que estava correto mas "traduzido". */
  upgrade: { from: string; to: string; why: string } | null;
  /** Próxima fala do treinador: reação curta + uma pergunta. */
  reply: string;
}

const CATS = ['missing-subject', 'do-support', 'third-person', 'past-tense', 'perfect', 'word-order', 'article', 'preposition', 'there-is', 'be-have', 'verb-pattern', 'agreement', 'collocation', 'false-friend', 'uncountable', 'vocabulary'];

/** Um turno do treinador ao vivo com o Claude: corrige além das regras locais, ensina e continua a conversa. */
export async function coachTurn(input: {
  scenario: string;
  level: string;
  history: { role: 'coach' | 'student'; text: string }[];
  utterance: string;
  alreadyFound: string[];
  focus?: string;
}): Promise<CoachReply | null> {
  const r = await askJson<{ errors?: unknown; upgrade?: unknown; reply?: unknown }>(
    `You are a real-time English speaking coach for a Brazilian professional. Scenario: ${input.scenario}. Learner level: ${input.level}.${input.focus ? ` Target pattern of this session: ${input.focus}.` : ''}
Conversation so far:
${input.history.slice(-8).map((h) => `${h.role === 'coach' ? 'Coach' : 'Learner'}: ${h.text}`).join('\n')}
Learner just said (speech recognition, ignore punctuation/capitalization): "${input.utterance}"
A rule engine already flagged these excerpts, do NOT repeat them: ${input.alreadyFound.length ? input.alreadyFound.map((x) => `"${x}"`).join(', ') : '(none)'}

Do three things:
1. errors: up to 2 REAL grammar or word-choice errors that remain (not style, not pronunciation, not things already flagged). "quote" must be the exact excerpt from the learner. "clue_pt" is a hint in Portuguese that does NOT reveal the answer. "rule_pt" is the rule in one short Portuguese sentence. "cat" is one of: ${CATS.join(', ')}.
2. upgrade: if something was correct but sounds translated from Portuguese, give ONE more natural way to say it ("from" exact excerpt, "to" natural version, "why_pt" one short Portuguese sentence). Otherwise null.
3. reply: your next turn as the coach, in English: one short reaction to WHAT they said plus ONE question that keeps them talking. Max 2 sentences. No corrections inside the reply.
Respond ONLY with JSON: {"errors":[{"quote":"","fix":"","clue_pt":"","rule_pt":"","cat":""}],"upgrade":{"from":"","to":"","why_pt":""} or null,"reply":""}`,
    'quick',
  );
  if (!r || typeof r.reply !== 'string' || !r.reply.trim()) return null;
  const low = input.utterance.toLowerCase();
  const errors = (Array.isArray(r.errors) ? r.errors : [])
    .map((e) => e as { quote?: unknown; fix?: unknown; clue_pt?: unknown; rule_pt?: unknown; cat?: unknown })
    .filter((e) => typeof e.quote === 'string' && typeof e.fix === 'string' && e.quote.trim() && e.fix.trim() && e.quote.toLowerCase() !== (e.fix as string).toLowerCase() && low.includes((e.quote as string).toLowerCase().replace(/[.,!?]/g, '').trim()))
    .slice(0, 2)
    .map((e) => ({
      quote: (e.quote as string).slice(0, 160),
      fix: (e.fix as string).slice(0, 160),
      clue: typeof e.clue_pt === 'string' ? e.clue_pt.slice(0, 200) : 'Tem um ajuste neste trecho.',
      explain: typeof e.rule_pt === 'string' ? e.rule_pt.slice(0, 240) : '',
      cat: typeof e.cat === 'string' && CATS.includes(e.cat) ? e.cat : 'vocabulary',
    }));
  const u = r.upgrade as { from?: unknown; to?: unknown; why_pt?: unknown } | null;
  return {
    errors,
    upgrade: u && typeof u.from === 'string' && typeof u.to === 'string' && u.to.trim() ? { from: u.from.slice(0, 160), to: u.to.slice(0, 160), why: typeof u.why_pt === 'string' ? u.why_pt.slice(0, 200) : '' } : null,
    reply: r.reply.trim().slice(0, 300),
  };
}

export interface SimReply {
  /** Fala do personagem, em inglês, reagindo ao que foi dito. */
  reply: string;
  /** Objetivos que o aluno cumpriu nesta fala. */
  goalsMet: string[];
  errors: CoachReply['errors'];
  /** A conversa chegou a um fim natural. */
  done: boolean;
}

/** Um turno de simulação com o Claude fazendo o personagem. */
export async function simTurn(input: {
  setting: string;
  character: string;
  goals: { id: string; label: string; done: boolean }[];
  history: { role: 'character' | 'student'; text: string }[];
  utterance: string;
  alreadyFound: string[];
  turns: number;
  context: string;
}): Promise<SimReply | null> {
  const r = await askJson<{ reply?: unknown; goals_met?: unknown; errors?: unknown; done?: unknown }>(
    `You are playing a character in a realistic role-play to train a Brazilian professional to speak English in real-life situations.
Situation (in Portuguese, known to the learner): ${input.setting}
You are: ${input.character}. Learner's real context: ${input.context}.
Learner's communicative goals (id: description, status):
${input.goals.map((g) => `- ${g.id}: ${g.label} [${g.done ? 'already done' : 'NOT done yet'}]`).join('\n')}
Conversation so far:
${input.history.slice(-10).map((h) => `${h.role === 'character' ? 'You' : 'Learner'}: ${h.text}`).join('\n')}
Learner just said (speech recognition, ignore punctuation): "${input.utterance}"
Learner turns so far: ${input.turns}.

Stay fully in character, like a real person in this situation: react to what they actually said, interrupt politely or ask a follow-up when something is vague, and steer the conversation so the learner gets a natural chance to do a goal that is NOT done yet. Never teach, never mention goals, never correct. Keep it to 1-2 short spoken sentences. If the learner asks you to repeat or slow down, do it. When every goal is done (or after 9 learner turns), close the conversation naturally and set done true.
Also judge: "goals_met" = ids of goals the learner accomplished IN THIS utterance (meaning counts, even with grammar errors). "errors" = up to 2 real grammar/word-choice errors in the utterance, excluding these already flagged: ${input.alreadyFound.length ? input.alreadyFound.map((x) => `"${x}"`).join(', ') : '(none)'}; "quote" exact excerpt, "clue_pt" hint in Portuguese without the answer, "rule_pt" short rule in Portuguese, "cat" one of: ${CATS.join(', ')}.
Respond ONLY with JSON: {"reply":"","goals_met":[""],"errors":[{"quote":"","fix":"","clue_pt":"","rule_pt":"","cat":""}],"done":false}`,
    'quick',
  );
  if (!r || typeof r.reply !== 'string' || !r.reply.trim()) return null;
  const ids = new Set(input.goals.map((g) => g.id));
  const low = input.utterance.toLowerCase();
  const errors = (Array.isArray(r.errors) ? r.errors : [])
    .map((e) => e as { quote?: unknown; fix?: unknown; clue_pt?: unknown; rule_pt?: unknown; cat?: unknown })
    .filter((e) => typeof e.quote === 'string' && typeof e.fix === 'string' && e.quote.trim() && e.fix.trim() && e.quote.toLowerCase() !== (e.fix as string).toLowerCase() && low.includes((e.quote as string).toLowerCase().replace(/[.,!?]/g, '').trim()))
    .slice(0, 2)
    .map((e) => ({
      quote: (e.quote as string).slice(0, 160),
      fix: (e.fix as string).slice(0, 160),
      clue: typeof e.clue_pt === 'string' ? e.clue_pt.slice(0, 200) : 'Tem um ajuste neste trecho.',
      explain: typeof e.rule_pt === 'string' ? e.rule_pt.slice(0, 240) : '',
      cat: typeof e.cat === 'string' && CATS.includes(e.cat) ? e.cat : 'vocabulary',
    }));
  return {
    reply: r.reply.trim().slice(0, 320),
    goalsMet: Array.isArray(r.goals_met) ? r.goals_met.filter((x): x is string => typeof x === 'string' && ids.has(x)) : [],
    errors,
    done: r.done === true,
  };
}

export interface MeetReply {
  /** Falas dos colegas, em ordem (1 a 3). */
  lines: { by: string; text: string }[];
  goalsMet: string[];
  errors: CoachReply['errors'];
  /** Reformulação natural de um erro, já dentro de uma das falas (só informativo). */
  recast: boolean;
  done: boolean;
}

/**
 * Um turno da reunião ao vivo com o Claude fazendo os colegas. O roteiro dá a pauta;
 * os colegas reagem ao que o aluno disse de verdade, como pessoas numa call.
 */
export async function meetingTurn(input: {
  setting: string;
  participants: { id: string; name: string; role: string }[];
  learner: string;
  goals: { id: string; label: string; done: boolean }[];
  /** Próxima pergunta do roteiro (para não perder a pauta). */
  agendaNext: { by: string; say: string } | null;
  history: { by: string; text: string }[];
  utterance: string;
  alreadyFound: string[];
  /** Pode reformular um erro nesta resposta? (no máximo 1 a cada 2 falas) */
  mayRecast: boolean;
  turns: number;
  context: string;
}): Promise<MeetReply | null> {
  const ids = new Set(input.participants.map((p) => p.id));
  const r = await askJson<{ lines?: unknown; goals_met?: unknown; errors?: unknown; recast?: unknown; done?: unknown }>(
    `You are running a realistic video meeting (like Google Meet) to train a Brazilian professional, ${input.learner}, to speak English at work.
Situation (in Portuguese, known to the learner): ${input.setting}
Learner's real context: ${input.context}.
Other people in the call (speak ONLY as them): ${input.participants.map((p) => `${p.id} = ${p.name}, ${p.role}`).join('; ')}.
Learner's communicative goals: ${input.goals.map((g) => `${g.id}: ${g.label} [${g.done ? 'done' : 'NOT done'}]`).join('; ')}.
${input.agendaNext ? `Next item on the agenda (use it when the current topic is covered): ${input.agendaNext.by} asks "${input.agendaNext.say}"` : 'The agenda is finished: wrap up the meeting naturally.'}
Recent conversation:
${input.history.slice(-12).map((h) => `${h.by}: ${h.text}`).join('\n')}
${input.learner} just said (speech recognition, ignore punctuation): "${input.utterance}"
Learner turns so far: ${input.turns}.

Write what happens next in the call, as 1 to 3 short spoken lines from the participants (each line max 2 sentences, contractions, natural meeting talk). React to WHAT the learner actually said: ask a follow-up when it's vague, a colleague may add a comment or politely interrupt, then move the agenda forward. Never teach, never mention grammar or goals.
${input.mayRecast ? 'If the learner made a clear grammar error that changes or blurs the meaning, the person who asked may naturally echo the idea back CORRECTLY as a quick confirmation question (a recast), e.g. learner "yesterday I go to the client" -> "Oh, so you went to the client yesterday? How did it go?". Do it at most once and set "recast": true.' : 'Do not echo or rephrase the learner\'s sentence this time.'}
If the learner asks you to repeat or slow down, the last speaker repeats more simply. When every goal is done (or after 10 learner turns), close the meeting naturally and set done true.
Also judge: "goals_met" = goal ids accomplished IN THIS utterance (meaning counts); "errors" = up to 2 real grammar/word-choice errors, excluding: ${input.alreadyFound.length ? input.alreadyFound.map((x) => `"${x}"`).join(', ') : '(none)'}; "quote" exact excerpt, "fix" corrected excerpt, "clue_pt" hint in Portuguese without the answer, "rule_pt" short rule in Portuguese, "cat" one of: ${CATS.join(', ')}.
Respond ONLY with JSON: {"lines":[{"by":"<participant id>","text":""}],"goals_met":[""],"errors":[{"quote":"","fix":"","clue_pt":"","rule_pt":"","cat":""}],"recast":false,"done":false}`,
    'quick',
  );
  if (!r || !Array.isArray(r.lines)) return null;
  const lines = r.lines
    .map((l) => l as { by?: unknown; text?: unknown })
    .filter((l): l is { by: string; text: string } => typeof l.by === 'string' && ids.has(l.by) && typeof l.text === 'string' && !!l.text.trim())
    .slice(0, 3)
    .map((l) => ({ by: l.by, text: l.text.trim().slice(0, 300) }));
  if (!lines.length) return null;
  const goalIds = new Set(input.goals.map((g) => g.id));
  const low = input.utterance.toLowerCase();
  const errors = (Array.isArray(r.errors) ? r.errors : [])
    .map((e) => e as { quote?: unknown; fix?: unknown; clue_pt?: unknown; rule_pt?: unknown; cat?: unknown })
    .filter((e) => typeof e.quote === 'string' && typeof e.fix === 'string' && e.quote.trim() && e.fix.trim() && e.quote.toLowerCase() !== (e.fix as string).toLowerCase() && low.includes((e.quote as string).toLowerCase().replace(/[.,!?]/g, '').trim()))
    .slice(0, 2)
    .map((e) => ({
      quote: (e.quote as string).slice(0, 160),
      fix: (e.fix as string).slice(0, 160),
      clue: typeof e.clue_pt === 'string' ? e.clue_pt.slice(0, 200) : 'Tem um ajuste neste trecho.',
      explain: typeof e.rule_pt === 'string' ? e.rule_pt.slice(0, 240) : '',
      cat: typeof e.cat === 'string' && CATS.includes(e.cat) ? e.cat : 'vocabulary',
    }));
  return {
    lines,
    goalsMet: Array.isArray(r.goals_met) ? r.goals_met.filter((x): x is string => typeof x === 'string' && goalIds.has(x)) : [],
    errors,
    recast: r.recast === true && input.mayRecast,
    done: r.done === true,
  };
}

/** "Como se diz?": tradução curta de uma palavra ou expressão, no contexto da conversa. */
export async function howToSay(pt: string, situation: string): Promise<string | null> {
  const s = caps.sample;
  if (!s && !serverLlm) return null;
  try {
    const prompt = `A Brazilian learner is in this situation: ${situation}. They got stuck and need the natural spoken English for this Portuguese word or phrase: "${pt}". Answer with ONLY the English (max 8 words, most natural option; if two are common, separate with " / ").`;
    const raw = s ? (await s(prompt, { modelTier: 'quick' })).text : await localSample(prompt, 'quick');
    if (!raw) return null;
    const t = raw.trim().replace(/^["']|["'.]$/g, '');
    return t && t.length < 90 ? t : null;
  } catch {
    return null;
  }
}

/** Cria uma simulação a partir de uma situação real descrita pelo aluno (em português). */
export async function makeMission(description: string, context: string): Promise<Mission | null> {
  const r = await askJson<{ title?: unknown; setting?: unknown; character?: { name?: unknown; role?: unknown }; goals?: unknown; beats?: unknown; closing?: unknown; area?: unknown }>(
    `A Brazilian professional (context: ${context}) wants to rehearse, in English, this REAL upcoming situation (described in Portuguese): "${description}"
Design a short role-play. Respond ONLY with JSON:
{"title":"título curto em português","setting":"2 frases em português: a situação e o que o aluno precisa conseguir","area":"trabalho" or "vida","character":{"name":"first name","role":"papel em português"},
 "goals":[exactly 4 objects {"id":"short_id","label":"o que fazer, em português","pt":"frase-exemplo em português","example":"the same sentence in natural spoken English","starter":"sentence starter in English ending with …","keywords":["3 to 6 lowercase English words or short phrases, ANY of which signals the goal; at least one must appear in the example"]}],
 "beats":[3 or 4 objects {"say":"character line in English, 1-2 short sentences","pt":"tradução","wants":["goal ids this line invites"],"nudge":"natural follow-up in English if the learner did not do it"}],
 "closing":"character's last line in English"}
Every goal id must appear in some beat's "wants". Keep the English natural and at B1 level.`,
  );
  if (!r || typeof r.title !== 'string' || !Array.isArray(r.goals) || !Array.isArray(r.beats)) return null;
  const goals = (r.goals as { id?: unknown; label?: unknown; pt?: unknown; example?: unknown; starter?: unknown; keywords?: unknown }[])
    .filter((g) => typeof g.id === 'string' && typeof g.label === 'string' && typeof g.example === 'string')
    .slice(0, 4)
    .map((g) => {
      const example = (g.example as string).slice(0, 160);
      const kws = Array.isArray(g.keywords) ? g.keywords.filter((k): k is string => typeof k === 'string' && !!k.trim()).map((k) => k.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean) : [];
      const goal = { id: (g.id as string).slice(0, 30), label: (g.label as string).slice(0, 80), pt: typeof g.pt === 'string' ? g.pt.slice(0, 160) : '', example, starter: typeof g.starter === 'string' ? g.starter.slice(0, 60) : `${example.split(' ').slice(0, 3).join(' ')}…`, detect: [kws.slice(0, 8)] };
      // garantia: o exemplo precisa acender o próprio objetivo; senão usa palavras do exemplo
      if (!goal.detect[0].length || !goalMet(goal, example)) goal.detect = [example.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter((w) => w.length > 4).slice(0, 3)];
      return goal;
    })
    .filter((g) => g.detect[0].length > 0);
  const ids = new Set(goals.map((g) => g.id));
  const beats = (r.beats as { say?: unknown; pt?: unknown; wants?: unknown; nudge?: unknown }[])
    .filter((b) => typeof b.say === 'string' && b.say.trim())
    .slice(0, 5)
    .map((b) => ({ say: (b.say as string).slice(0, 240), pt: typeof b.pt === 'string' ? b.pt.slice(0, 240) : '', wants: Array.isArray(b.wants) ? b.wants.filter((w): w is string => typeof w === 'string' && ids.has(w)) : [], nudge: typeof b.nudge === 'string' && b.nudge.trim() ? b.nudge.slice(0, 200) : 'Could you tell me a bit more?' }));
  if (goals.length < 3 || beats.length < 2) return null;
  // todo objetivo precisa ser pedido por alguma fala
  const wanted = new Set(beats.flatMap((b) => b.wants));
  goals.forEach((g, i) => { if (!wanted.has(g.id)) beats[Math.min(i, beats.length - 1)].wants.push(g.id); });
  return {
    id: `meu-${Date.now().toString(36)}`,
    area: r.area === 'vida' ? 'vida' : 'trabalho',
    tags: [],
    title: r.title.slice(0, 60),
    setting: typeof r.setting === 'string' ? r.setting.slice(0, 320) : description.slice(0, 320),
    character: { name: typeof r.character?.name === 'string' ? r.character.name.slice(0, 20) : 'Alex', role: typeof r.character?.role === 'string' ? r.character.role.slice(0, 40) : 'colega', color: '#5b3fa8', voice: 0 },
    goals,
    beats,
    closing: typeof r.closing === 'string' && r.closing.trim() ? r.closing.slice(0, 200) : 'Great, thanks. Talk to you soon!',
  };
}
