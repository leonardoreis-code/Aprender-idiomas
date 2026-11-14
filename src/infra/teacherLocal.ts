/**
 * Maya no modo artefato: sem WebSocket externo nem microfone direto, a aula
 * vira turnos — você fala (ditado do runtime), o Claude responde como a Maya
 * (mesmas regras de correção do agente ElevenLabs) e a voz do Claude lê a resposta.
 */
import { caps } from './platform';
import type { TeacherCallbacks, TeacherSession } from './teacher';

export const MAYA_PROMPT = `You are Maya, a warm, sharp and patient English speaking coach inside the Fluente app. Your students are Brazilian Portuguese speakers who can READ and UNDERSTAND English but freeze when they have to BUILD a sentence and SAY it. Make them speak a lot and fix mistakes without killing their confidence.

How to correct (most important):
1. React to the MEANING first, in one short sentence.
2. If there was an error that affects clarity or is a classic Brazilian mistake, give a RECAST: "Oh, you mean: '...'".
3. Ask the student to REPEAT the corrected sentence. Praise briefly when they get it right.
4. Correct at most ONE or TWO things per turn. Priorities: missing subject ("is raining" -> "it's raining"), verb tense, do/does/did, word order, false friends, "have" vs "there is", preposition at the end of questions, third person -s, present perfect for "faz X tempo que".
5. Every 5 to 6 turns, give a 2-line recap: one thing done well, the main mistake to watch.

Modes: conversation (natural chat, one question at a time); drill (give one PORTUGUESE sentence, the student says it in English, you evaluate and give the next; harder after 3 correct in a row); roleplay (play the character from the context, still correct briefly); interview (realistic interviewer for a data/tech role, short feedback on structure, then a follow-up).

Language: clear natural English, short sentences. Portuguese only for one very short explanation when the student is lost or asks. Keep turns under 3 sentences so the student talks 70% of the time. No markdown, no emojis, no lists: your text is read aloud.`;

const FIRST = "Hi! I'm Maya, your English teacher. Today we're going to talk, and I'll help you fix small mistakes as we go. Ready? Tell me: how was your day so far?";

export interface LocalTeacherSession extends TeacherSession {
  /** Começa a ouvir — chamar DIRETO no clique (o ditado exige gesto). */
  talk: (onPartial: (t: string) => void) => void;
  stopTalk: () => void;
  canTalk: boolean;
}

export async function startLocalTeacher(cb: TeacherCallbacks, context: string): Promise<LocalTeacherSession> {
  if (!caps.sample) throw new Error('sample_unavailable');
  cb.onStatus('connecting');
  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  let speaking = false;
  let listening = false;
  let ended = false;
  let k = 0;
  let abort: AbortController | null = null;

  const say = async (text: string) => {
    speaking = true;
    cb.onMode('speaking');
    try {
      if (caps.tts) await caps.tts.speak(text, { voice: 'airy', language: 'en' });
      else await new Promise((r) => setTimeout(r, Math.min(6000, text.length * 55)));
    } catch {
      /* viewer parou a fala ou sem permissão: segue em texto */
    } finally {
      speaking = false;
      if (!ended) cb.onMode('listening');
    }
  };

  const reply = async (userText: string) => {
    if (ended || !userText.trim()) return;
    history.push({ role: 'user', content: userText });
    cb.onMessage({ role: 'user', text: userText });
    cb.onMode('thinking');
    abort?.abort();
    abort = new AbortController();
    const transcript = history.map((h) => `${h.role === 'user' ? 'Student' : 'Maya'}: ${h.content}`).join('\n');
    try {
      const res = await caps.sample!(
        `${MAYA_PROMPT}\n\nContext from the app: ${context}\n\nConversation so far:\nMaya: ${FIRST}\n${transcript}\n\nWrite ONLY Maya's next turn (max 3 short sentences, plain text).`,
        { modelTier: 'quick', signal: abort.signal, cache: false },
      );
      const text = res.text.trim().replace(/^Maya:\s*/i, '');
      history.push({ role: 'assistant', content: text });
      cb.onMessage({ role: 'agent', text });
      await say(text);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'not_granted') cb.onStatus('error', 'Permita o uso do Claude nesta página para conversar com a Maya.');
      else if (code === 'rate_limited') cb.onStatus('error', 'Muitas mensagens seguidas. Espere um minuto.');
      else if ((e as Error)?.name !== 'AbortError') cb.onStatus('error', 'A Maya não respondeu agora. Tente de novo.');
      if (!ended) cb.onMode('listening');
    }
  };

  cb.onStatus('connected');
  cb.onMessage({ role: 'agent', text: FIRST });
  void say(FIRST);

  return {
    canTalk: !!caps.dictation,
    talk: (onPartial) => {
      const d = caps.dictation;
      if (!d || listening) return;
      if (speaking) caps.tts?.stop();
      listening = true;
      let text = '';
      let started = false;
      const offs: (() => void)[] = [];
      offs.push(d.onPartial(({ text: t }) => onPartial(`${text} ${t}`.trim())));
      offs.push(d.onFinal(({ text: t }) => {
        text = `${text} ${t}`.trim();
        onPartial(text);
      }));
      offs.push(
        d.onState(({ state }) => {
          if (state === 'listening' || state === 'starting') started = true;
          if (state === 'idle' && started) {
            offs.forEach((o) => o());
            listening = false;
            onPartial('');
            void reply(text);
          }
        }),
      );
      d.start({ language: 'en' }).catch(() => {
        offs.forEach((o) => o());
        listening = false;
        cb.onStatus('error', 'Não consegui usar o ditado. Digite sua resposta abaixo.');
      });
    },
    stopTalk: () => void caps.dictation?.stop().catch(() => {}),
    end: async () => {
      ended = true;
      abort?.abort();
      caps.tts?.stop();
      await caps.dictation?.stop().catch(() => {});
      cb.onStatus('idle');
    },
    outputLevel: () => (speaking ? 0.25 + 0.6 * Math.abs(Math.sin((k += 0.35))) : 0),
    inputLevel: () => (listening ? 0.3 + 0.4 * Math.abs(Math.sin((k += 0.3))) : 0),
    sendContext: () => {},
    sendText: (t) => void reply(t),
    setMuted: () => {},
  };
}
