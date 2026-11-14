/**
 * Professor em tempo real: agente de conversação da ElevenLabs (voz ↔ voz,
 * baixa latência). O app envia contexto (nível, aula, erros recorrentes) para
 * personalizar a correção.
 */
import { Conversation, type VoiceConversation } from '@elevenlabs/client';
import { teacherAuth } from './api';

export type TeacherStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type TeacherMode = 'listening' | 'speaking' | 'thinking';

export interface TeacherCallbacks {
  onStatus: (s: TeacherStatus, detail?: string) => void;
  onMode: (m: TeacherMode) => void;
  onMessage: (m: { role: 'user' | 'agent'; text: string }) => void;
}

export interface TeacherSession {
  end: () => Promise<void>;
  outputLevel: () => number;
  inputLevel: () => number;
  sendContext: (text: string) => void;
  sendText: (text: string) => void;
  setMuted: (m: boolean) => void;
}

export async function startTeacher(cb: TeacherCallbacks, context: string): Promise<TeacherSession> {
  cb.onStatus('connecting');
  await navigator.mediaDevices.getUserMedia({ audio: true }); // pede permissão antes, com mensagem clara na UI
  const auth = await teacherAuth();
  const base = {
    onConnect: () => cb.onStatus('connected'),
    onDisconnect: () => cb.onStatus('idle'),
    onError: (message: string) => cb.onStatus('error', message),
    onModeChange: ({ mode }: { mode: string }) => cb.onMode(mode === 'speaking' ? 'speaking' : 'listening'),
    onMessage: (p: { message: string; source?: string; role?: string }) =>
      cb.onMessage({ role: p.role === 'user' || p.source === 'user' ? 'user' : 'agent', text: p.message }),
  };
  const opts = auth.signedUrl ? { ...base, signedUrl: auth.signedUrl } : { ...base, agentId: auth.agentId!, connectionType: 'websocket' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conv = (await Conversation.startSession(opts as any)) as VoiceConversation;
  conv.sendContextualUpdate(context);
  return {
    end: () => conv.endSession(),
    outputLevel: () => conv.getOutputVolume(),
    inputLevel: () => conv.getInputVolume(),
    sendContext: (t) => conv.sendContextualUpdate(t),
    sendText: (t) => conv.sendUserMessage(t),
    setMuted: (m) => conv.setMicMuted(m),
  };
}
