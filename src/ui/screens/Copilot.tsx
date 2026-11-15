import { useEffect, useRef, useState } from 'react';
import type { Issue } from '../../domain/coach/mediation';
import { spot } from '../../domain/coach/spotter';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { coachTurn, llmAvailable } from '../../infra/llm';
import { isArtifact } from '../../infra/platform';
import { BackIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

interface Heard {
  id: number;
  text: string;
  issues: Issue[];
  upgrade?: { from: string; to: string; why: string } | null;
  checking: boolean;
}

/**
 * Copiloto de reunião REAL: fica aberto ao lado da call (Meet, Teams, Zoom),
 * ouve só a sua fala (com fone de ouvido), nunca emite som e mostra a correção
 * em silêncio. Os erros vão para o banco pessoal; nada de áudio é guardado.
 */
export function Copilot({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const [on, setOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState('');
  const [heard, setHeard] = useState<Heard[]>([]);
  const [aiCheck, setAiCheck] = useState(llmAvailable());
  const session = useRef<LiveSession | null>(null);
  const onRef = useRef(false);
  const alive = useRef(true);
  const totals = useRef({ utt: 0, iss: 0, secs: 0 });
  const [, force] = useState(0);

  useEffect(() => () => { alive.current = false; onRef.current = false; session.current?.stop(); }, []);

  const handle = (text: string, ms: number) => {
    const local: Issue[] = spot(text).map((s) => ({ source: 'rule' as const, ...s }));
    const id = Date.now() + Math.random();
    const useAi = aiCheck && llmAvailable() && text.trim().split(/\s+/).length >= 4;
    setHeard((h) => [{ id, text, issues: local, checking: useAi }, ...h].slice(0, 40));
    totals.current.utt++;
    totals.current.iss += local.length;
    totals.current.secs += ms / 1000;
    force((n) => n + 1);
    store.logDay({ spokenSec: ms / 1000, spoken: 1 });
    store.track('spoken');
    if (local.length) store.bankErrors(local, text);
    store.set((s) => ({ ...s, meet: { ...s.meet, copilot: { utterances: s.meet.copilot.utterances + 1, issues: s.meet.copilot.issues + local.length, seconds: s.meet.copilot.seconds + ms / 1000 } } }));
    if (!useAi) return;
    void coachTurn({ scenario: 'a real work meeting; only check the learner, do not chat', level: store.state.profile.level, history: [], utterance: text, alreadyFound: local.map((l) => l.wrong) }).then((r) => {
      if (!alive.current) return;
      const low = text.toLowerCase();
      const ai: Issue[] = (r?.errors ?? []).map((e) => {
        const q = e.quote.replace(/[.,!?]/g, '').trim();
        const at = low.indexOf(q.toLowerCase());
        return { source: 'ai', rule: `ai:${e.cat}`, cat: e.cat, wrong: e.quote, fix: e.fix, clue: e.clue, explain: e.explain, start: at >= 0 ? at : undefined, end: at >= 0 ? at + q.length : undefined };
      });
      if (ai.length) {
        store.bankErrors(ai, text);
        totals.current.iss += ai.length;
      }
      setHeard((h) => h.map((x) => (x.id === id ? { ...x, issues: [...x.issues, ...ai], upgrade: r?.upgrade ?? null, checking: false } : x)));
    });
  };

  const loop = () => {
    setPaused(false);
    const t0 = Date.now();
    // primeira chamada vem do clique (o ditado do artefato exige o gesto)
    const s = startLive({ silenceMs: 1600, maxMs: 45_000, onText: (t) => alive.current && setLive(t) });
    session.current = s;
    void s.done.then(({ text, ms }) => {
      session.current = null;
      if (!alive.current) return;
      setLive('');
      if (text.trim()) handle(text, ms);
      if (!onRef.current) return;
      // o reconhecedor recusou reiniciar sozinho (sem gesto): pede um toque, sem insistir
      if (!text.trim() && Date.now() - t0 < 900) {
        setPaused(true);
        return;
      }
      loop();
    });
  };

  const start = () => {
    onRef.current = true;
    setOn(true);
    loop();
  };
  const stop = () => {
    onRef.current = false;
    setOn(false);
    setPaused(false);
    session.current?.stop();
  };

  const latest = heard[0];
  const t = totals.current;

  return (
    <main className="shell copilot" id="main">
      <button className="link-btn back" onClick={() => { stop(); go({ name: 'meetings' }); }}><BackIcon /> Reuniões</button>
      <h1 className="page-title">Copiloto de reunião</h1>

      {!on && (
        <section className="card stack">
          <p style={{ margin: 0 }}>Para usar numa call de verdade (Meet, Teams, Zoom). O copiloto <b>ouve só você, nunca toca som</b> e mostra a correção em silêncio, para você usar na próxima frase.</p>
          <ol className="copilot-steps">
            <li>Abra a reunião em outra aba ou no celular.</li>
            <li><b>Use fone de ouvido.</b> Sem fone, o microfone ouve os colegas e o copiloto marca a fala deles.</li>
            <li>Deixe esta tela visível ao lado da call e toque em começar.</li>
            <li>Depois da reunião, conserte os erros em "Meus erros": eles voltam com repetição espaçada.</li>
          </ol>
          <p className="fine">Nada de áudio é guardado. Só o texto da sua fala fica neste navegador.{isArtifact ? ' Se o navegador parar de ouvir depois de um silêncio, aparece um botão para continuar.' : ''}</p>
          {llmAvailable() && (
            <label className="row-between"><span>Checagem extra com IA (pega erros fora das regras)</span><input type="checkbox" checked={aiCheck} onChange={(e) => setAiCheck(e.target.checked)} /></label>
          )}
          {liveAvailable() ? (
            <button className="btn btn-primary" onClick={start}>Começar a ouvir</button>
          ) : (
            <p className="tip">Este navegador não tem reconhecimento de fala ao vivo. Use o Chrome ou a versão publicada como artefato.</p>
          )}
        </section>
      )}

      {on && (
        <>
          <div className="copilot-status" role="status">
            <span className={`copilot-dot ${paused ? 'off' : 'on'}`} aria-hidden />
            {paused ? 'Pausado pelo navegador' : 'Ouvindo você'} · {t.utt} frases · {t.iss} ajustes · {Math.round(t.secs / 60)} min falando
            <button className="btn btn-ghost" onClick={stop} style={{ marginLeft: 'auto' }}>Parar</button>
          </div>
          {paused && <button className="btn btn-primary btn-block" onClick={loop}>Continuar ouvindo</button>}
          <p className="copilot-live" lang="en" aria-live="off">{live || <span className="muted">…</span>}</p>
        </>
      )}

      {latest && (
        <section className={`copilot-card ${latest.issues.length ? 'has-fix' : 'clean'}`} aria-live="polite">
          <p className="copilot-said" lang="en">{marked(latest.text, latest.issues)}</p>
          {latest.issues.map((i, k) => (
            <p key={k} className="copilot-fix"><span lang="en"><s>{i.wrong}</s> → <b>{i.fix}</b></span><small>{i.explain}</small></p>
          ))}
          {latest.upgrade && <p className="copilot-fix up"><span lang="en">Mais natural: <b>{latest.upgrade.to}</b></span><small>{latest.upgrade.why}</small></p>}
          {!latest.issues.length && !latest.checking && <p className="copilot-ok">Certo. Siga assim.</p>}
          {latest.checking && <small className="muted">conferindo…</small>}
        </section>
      )}

      {heard.length > 1 && (
        <details className="card">
          <summary><strong>Frases anteriores ({heard.length - 1})</strong></summary>
          {heard.slice(1).map((h) => (
            <p key={h.id} lang="en" style={{ margin: '8px 0' }}>{marked(h.text, h.issues)}{h.issues.map((i, k) => <small key={k} className="muted" style={{ display: 'block' }}>{i.wrong} → {i.fix}</small>)}</p>
          ))}
        </details>
      )}

      {!on && heard.length > 0 && (
        <button className="btn btn-primary" onClick={() => go({ name: 'errors' })}>Consertar os erros da reunião</button>
      )}
    </main>
  );
}

function marked(text: string, issues: Issue[]) {
  const ms = issues.filter((m): m is Issue & { start: number; end: number } => m.start !== undefined && m.end !== undefined).sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let pos = 0;
  ms.forEach((m, i) => {
    if (m.start < pos) return;
    out.push(text.slice(pos, m.start), <mark key={i} className="live-miss">{text.slice(m.start, m.end)}</mark>);
    pos = m.end;
  });
  out.push(text.slice(pos));
  return out;
}
