import { useState } from 'react';
import { scoreFree, type FreeResult } from '../../domain/assessment/checkpoint';
import { dayKey } from '../../domain/motivation/motivation';
import { speak } from '../../infra/audio';
import { llmAvailable, makeDrills, speechFeedback, type SpeechFeedback } from '../../infra/llm';
import type { Recording } from '../../infra/recorder';
import { MicButton, micAvailable } from '../components/Mic';
import { BackIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

/** Perguntas da fala livre diária: giram pelo dia do ano. */
const PROMPTS: { en: string; pt: string }[] = [
  { en: 'What did you do yesterday, from morning to night?', pt: 'O que você fez ontem, da manhã à noite?' },
  { en: 'What are you working on this week?', pt: 'No que você está trabalhando esta semana?' },
  { en: 'Describe the last meeting you attended.', pt: 'Descreva a última reunião de que você participou.' },
  { en: 'Explain what your team does to someone outside the company.', pt: 'Explique o que seu time faz para alguém de fora da empresa.' },
  { en: 'Talk about a tool you use every day and why you like it.', pt: 'Fale de uma ferramenta que você usa todo dia e por que gosta dela.' },
  { en: 'What is the hardest part of your job?', pt: 'Qual é a parte mais difícil do seu trabalho?' },
  { en: 'Describe your weekend plans.', pt: 'Descreva seus planos para o fim de semana.' },
  { en: 'Tell me about a mistake you made at work and what you learned.', pt: 'Conte um erro que você cometeu no trabalho e o que aprendeu.' },
  { en: 'How do you usually start your work day?', pt: 'Como você costuma começar seu dia de trabalho?' },
  { en: 'Describe a person you admire and why.', pt: 'Descreva uma pessoa que você admira e por quê.' },
  { en: 'What would you change in your current project?', pt: 'O que você mudaria no seu projeto atual?' },
  { en: 'Explain a technical concept you know well in simple words.', pt: 'Explique com palavras simples um conceito técnico que você domina.' },
  { en: 'Talk about the city where you live.', pt: 'Fale da cidade onde você mora.' },
  { en: 'Why do you want to speak English well?', pt: 'Por que você quer falar inglês bem?' },
];

/** Fala livre de 1 minuto: mede palavras por minuto todo dia e dá correção (com Claude). */
export function Monologue({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const [k, setK] = useState(doy % PROMPTS.length);
  const [res, setRes] = useState<FreeResult | null>(null);
  const [fb, setFb] = useState<SpeechFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');
  const p = PROMPTS[k];
  const today = store.state.daily[dayKey()];
  const avg = today?.wpmN ? Math.round(today.wpmSum / today.wpmN) : null;

  const done = async (text: string, ms: number, spoken: boolean) => {
    const r = scoreFree(p.en, text, ms);
    setRes(r);
    setFb(null);
    if (r.words >= 5 && spoken) {
      store.logDay({ wpmSum: r.wpm, wpmN: 1, spokenSec: ms / 1000 });
      store.track('spoken');
      store.gainXp(15);
    }
    if (r.words >= 8 && llmAvailable()) {
      setLoading(true);
      setFb(await speechFeedback(p.en, text));
      setLoading(false);
    }
  };

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'home' })}><BackIcon /> Início</button>
      <h1 className="page-title">Fala livre de 1 minuto</h1>
      <p className="muted">Sem roteiro e sem parar. O objetivo é manter a fala saindo: é isso que mais falta a quem entende mas não fala. {avg !== null && <>Hoje você está em <b>{avg} palavras por minuto</b>.</>}</p>
      <section className="card stack">
        <div className="row-between">
          <span className="ex-kicker">Pergunta de hoje</span>
          <button className="link-btn" onClick={() => { setK((k + 1) % PROMPTS.length); setRes(null); setFb(null); }}>Trocar pergunta</button>
        </div>
        <p className="pt-prompt" lang="en" style={{ margin: 0 }}>{p.en} <button className="icon-btn inline" onClick={() => speak(p.en)} aria-label="Ouvir a pergunta"><SpeakerIcon size={16} /></button></p>
        <p className="muted" style={{ margin: 0 }}>{p.pt}</p>
        {micAvailable() ? (
          <MicButton key={`${k}-${res ? res.ms : 0}`} maxMs={60000} label="Começar a falar" onResult={(r: Recording) => void done(r.text, r.durationMs, true)} />
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void done(typed, 60000, false); }}>
            <p className="tip">Sem microfone aqui: escreva sua resposta para receber correção. Não conta como minutos falando.</p>
            <textarea className="text-input" rows={4} lang="en" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Sua resposta" />
            <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={!typed.trim()}>Enviar</button>
          </form>
        )}
      </section>

      {res && (
        <section className="card stack" aria-live="polite">
          <div className="cp-tiles">
            <div className="cp-tile"><span className="tag">Fluência</span><b>{res.wpm}</b><small className="muted">palavras por minuto</small></div>
            <div className="cp-tile"><span className="tag">Volume</span><b>{res.words}</b><small className="muted">palavras em {Math.round(res.ms / 1000)}s</small></div>
            <div className="cp-tile"><span className="tag">Variedade</span><b>{res.variety}</b><small className="muted">índice de vocabulário</small></div>
          </div>
          <p className="muted" style={{ margin: 0 }}>Referência: conversa natural em inglês fica entre 110 e 150 palavras por minuto. Abaixo de 60, as pausas ainda dominam.</p>
          <p lang="en" style={{ margin: 0 }}>“{res.text || 'Não ouvi nada. Tente de novo.'}”</p>
          {loading && <p role="status"><span className="spinner" aria-hidden /> Analisando sua fala…</p>}
          {fb && (
            <>
              {fb.tip && <p className="tip">{fb.tip}</p>}
              {fb.fixes.map((f, i) => (
                <p key={i} className="err-pill" lang="en"><s>{f.original}</s> → <b>{f.better}</b><br /><small lang="pt-BR">{f.why}</small></p>
              ))}
              <div className="better-box">
                <div className="row-between"><span className="tag">Versão melhorada — leia em voz alta</span><button className="icon-btn inline" onClick={() => speak(fb.improved)} aria-label="Ouvir versão melhorada"><SpeakerIcon size={16} /></button></div>
                <p lang="en" style={{ margin: '6px 0 0' }}>{fb.improved}</p>
              </div>
            </>
          )}
          {!llmAvailable() && res.words >= 8 && <p className="fine">A correção do texto usa o Claude e só existe na versão publicada como artefato. Aqui, leve a transcrição para a aula com a Maya.</p>}
        </section>
      )}
    </main>
  );
}

/** Minhas frases: o aluno escreve em português o que precisa dizer no trabalho; vira treino na escada. */
export function MySentences({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const custom = store.state.custom;
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3).slice(0, 6);

  const create = async () => {
    setBusy(true);
    setErr(null);
    const drills = await makeDrills(lines, custom.length);
    setBusy(false);
    if (!drills || !drills.length) {
      setErr('Não consegui gerar as frases agora. Tente de novo em instantes.');
      return;
    }
    store.set((s) => ({ ...s, custom: [...s.custom, ...drills] }));
    store.toast({ title: `${drills.length} frase(s) adicionada(s) ao seu treino`, kind: 'info' });
    setText('');
  };

  return (
    <main className="shell" id="main">
      <button className="link-btn back" onClick={() => go({ name: 'home' })}><BackIcon /> Início</button>
      <h1 className="page-title">Minhas frases</h1>
      <p className="muted">Escreva em português o que você realmente precisa dizer no trabalho: a daily de amanhã, a explicação de um projeto, uma resposta de entrevista. Cada frase entra na escada de produção e volta na repetição espaçada.</p>
      <section className="card stack">
        {llmAvailable() ? (
          <>
            <label htmlFor="mine-in"><b>Uma frase por linha</b> (até 6 por vez)</label>
            <textarea id="mine-in" className="text-input" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Ontem eu terminei a migração do pipeline de pedidos.\nEstou bloqueado esperando o acesso ao banco.'} />
            {err && <p className="err-pill" role="alert">{err}</p>}
            <div className="row">
              <button className="btn btn-primary" disabled={!lines.length || busy} onClick={create}>{busy ? 'Gerando…' : `Transformar ${lines.length || ''} em treino`}</button>
              {custom.length > 0 && <button className="btn btn-ghost" onClick={() => go({ name: 'practice', lessonId: 'minhas' })}>Praticar minhas frases</button>}
            </div>
          </>
        ) : (
          <>
            <p className="tip">Criar frases novas usa o Claude e só funciona na versão publicada como artefato. As frases já criadas continuam no seu treino.</p>
            {custom.length > 0 && <button className="btn btn-primary" onClick={() => go({ name: 'practice', lessonId: 'minhas' })}>Praticar minhas frases</button>}
          </>
        )}
      </section>
      <section className="card">
        <h2 className="card-h">{custom.length} frase(s) suas</h2>
        {custom.length === 0 ? <p className="muted">Nada ainda. Comece com as 3 frases que você mais usaria numa reunião amanhã.</p> : (
          <ul className="notebook">
            {custom.map((d) => {
              const st = store.state.production[d.id]?.stage ?? 0;
              return (
                <li key={d.id}>
                  <button className="icon-btn inline" onClick={() => speak(d.en)} aria-label={`Ouvir ${d.en}`}>▶</button>
                  <span><b lang="en">{d.en}</b><br /><small className="muted">{d.pt} · degrau {st + 1}/5</small></span>
                  <button className="link-btn" onClick={() => store.set((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== d.id) }))}>remover</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
