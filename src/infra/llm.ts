/**
 * Usos do Claude (capacidade `sample` do artefato). Tudo aqui é opcional: sem
 * Claude, o app usa só as regras locais e diz isso ao aluno.
 */
import type { Drill } from '../domain/curriculum/speaking';
import { normalize } from '../domain/practice/answer';
import { caps } from './platform';

export const llmAvailable = () => !!caps.sample;

async function askJson<T>(prompt: string, tier: 'quick' | 'default' = 'default'): Promise<T | null> {
  const s = caps.sample;
  if (!s) return null;
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

/** "Como se diz?": tradução curta de uma palavra ou expressão, no contexto da conversa. */
export async function howToSay(pt: string, situation: string): Promise<string | null> {
  const s = caps.sample;
  if (!s) return null;
  try {
    const r = await s(`A Brazilian learner is in this situation: ${situation}. They got stuck and need the natural spoken English for this Portuguese word or phrase: "${pt}". Answer with ONLY the English (max 8 words, most natural option; if two are common, separate with " / ").`, { modelTier: 'quick' });
    const t = r.text.trim().replace(/^["']|["'.]$/g, '');
    return t && t.length < 90 ? t : null;
  } catch {
    return null;
  }
}
