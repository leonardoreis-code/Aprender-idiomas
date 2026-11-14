/**
 * Usos do Claude (capacidade `sample` do artefato). Tudo aqui é opcional: sem
 * Claude, o app usa só as regras locais e diz isso ao aluno.
 */
import type { Drill } from '../domain/curriculum/speaking';
import { normalize } from '../domain/practice/answer';
import { caps } from './platform';

export const llmAvailable = () => !!caps.sample;

async function askJson<T>(prompt: string): Promise<T | null> {
  const s = caps.sample;
  if (!s) return null;
  try {
    if (s.json) return (await s.json(prompt, { modelTier: 'default', cache: false })) as T;
    const r = await s(prompt, { modelTier: 'default', cache: false });
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
