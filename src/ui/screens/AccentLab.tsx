import { useState } from 'react';
import { analyzeAccent, ACCENT_RULES, type AccentReport } from '../../domain/pronunciation/accent';
import { speak } from '../../infra/audio';
import type { Recording } from '../../infra/recorder';
import { MicButton, micAvailable } from '../components/Mic';
import { MouthDiagram } from '../components/Graphics';
import { BackIcon, SpeakerIcon, TurtleIcon } from '../icons/ui';
import { useStore } from '../store';

/** Frases-desafio, cada uma concentrando um padrão de interferência do português. */
const CHALLENGES: { rule: keyof typeof ACCENT_RULES; text: string; mouth?: 'th' | 'short-i' | 'ae' | 'ed' | 'h' }[] = [
  { rule: 'th', text: 'I think three things are worth the effort.', mouth: 'th' },
  { rule: 'th', text: 'This is the method they use for throughput.', mouth: 'th' },
  { rule: 'final-vowel', text: 'I have a big dog and a good book.', mouth: 'ed' },
  { rule: 'final-vowel', text: 'Check the logs and fix the bug.', mouth: 'ed' },
  { rule: 'short-long-i', text: 'Please sit in this seat and eat it.', mouth: 'short-i' },
  { rule: 'short-long-i', text: 'I will leave the ship and feel the heat.', mouth: 'short-i' },
  { rule: 'ae-e', text: 'The man said the bad bed was sad.', mouth: 'ae' },
  { rule: 'ed', text: 'I worked, played and wanted to rest.', mouth: 'ed' },
  { rule: 'ed', text: 'We fixed the pipeline and deployed it.', mouth: 'ed' },
  { rule: 'h-r', text: 'He read the report in his hotel room.', mouth: 'h' },
  { rule: 'v-w', text: 'We have very valuable west views.' },
  { rule: 'stress', text: 'I develop data architecture for analytics.' },
];

export function AccentLab({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const [k, setK] = useState(0);
  const [report, setReport] = useState<AccentReport | null>(null);
  const [rec, setRec] = useState<Recording | null>(null);
  const ch = CHALLENGES[k];
  const log = Object.entries(store.state.accentLog).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...log.map(([, n]) => n));

  const onResult = (r: Recording) => {
    setRec(r);
    const rep = analyzeAccent(ch.text, r.text);
    setReport(rep);
    store.recordAccent(rep.rules.map((x) => x.id));
    store.track('accentChecks');
    store.track('spoken');
    if (rep.score >= 90) store.gainXp(10);
    store.set((s) => ({ ...s, bestSpeech: Math.max(s.bestSpeech, rep.score) }));
  };

  return (
    <main className="shell accent" id="main">
      <button className="link-btn back" onClick={onBack}><BackIcon /> Voltar</button>
      <h1 className="page-title">Laboratório de sotaque</h1>
      <p className="muted">Fale a frase. O app compara o que você quis dizer com o que a máquina entendeu e aponta qual padrão do português apareceu. O alvo é ser entendido, não soar nativo.</p>

      <div className="accent-grid">
        <section className="card">
          <div className="row-between">
            <span className="ex-kicker">Desafio {k + 1}/{CHALLENGES.length} · {ACCENT_RULES[ch.rule].title}</span>
            <div className="row">
              <button className="icon-btn" onClick={() => { setK((k - 1 + CHALLENGES.length) % CHALLENGES.length); setReport(null); setRec(null); }} aria-label="Anterior">‹</button>
              <button className="icon-btn" onClick={() => { setK((k + 1) % CHALLENGES.length); setReport(null); setRec(null); }} aria-label="Próximo">›</button>
            </div>
          </div>
          <p className="speak-target" lang="en">
            {report ? report.words.map((w, i) => <span key={i} className={w.ok ? 'word-ok' : 'word-miss'} title={w.heard ? `ouvi: ${w.heard}` : 'não ouvi'}>{w.word} </span>) : ch.text}
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="chip" onClick={() => speak(ch.text, { variant: k })}><SpeakerIcon size={18} /> Nativo</button>
            <button className="chip" onClick={() => speak(ch.text, { slow: true, variant: k })}><TurtleIcon size={18} /> Devagar</button>
            {rec?.url && <button className="chip" onClick={() => new Audio(rec.url!).play()}>▶ Minha voz</button>}
          </div>
          {micAvailable() ? <MicButton key={k + (rec ? 'r' : '')} onResult={onResult} /> : <p className="tip">Seu navegador não permite gravar. Use Chrome, Edge ou Safari.</p>}
          {report && (
            <div className="accent-result pop-in" role="status">
              <p className="score-big">{report.score}<small>/100 inteligível</small></p>
              {rec && <p className="muted">Ouvi: “<span lang="en">{rec.text || '—'}</span>” {rec.source === 'scribe' ? '· ElevenLabs Scribe' : rec.source === 'browser' ? '· reconhecimento do navegador' : ''}</p>}
              {report.rules.length === 0 ? <p>Tudo entendido. Tente a versão mais rápida ou a próxima frase.</p> : report.rules.map((r) => (
                <p key={r.id} className="err-pill accent"><b>{ACCENT_RULES[r.id]?.title}</b> em <i lang="en">{r.words.join(', ')}</i>: {ACCENT_RULES[r.id]?.howTo}</p>
              ))}
            </div>
          )}
        </section>

        <aside className="stack">
          {ch.mouth && <div className="card"><MouthDiagram mouth={ch.mouth} /></div>}
          <div className="card">
            <strong>Seu mapa de sotaque</strong>
            {log.length === 0 ? <p className="muted">Faça alguns desafios para ver quais padrões mais aparecem na sua fala.</p> : (
              <svg viewBox={`0 0 260 ${log.length * 30}`} width="100%" role="img" aria-label="Padrões de pronúncia mais frequentes">
                {log.map(([id, n], i) => (
                  <g key={id} transform={`translate(0 ${i * 30})`}>
                    <text x="0" y="17" fontSize="12" fill="var(--ink)">{ACCENT_RULES[id]?.title ?? id}</text>
                    <rect x="130" y="6" width={(n / max) * 110} height="14" rx="7" fill="var(--tangerine)" />
                    <text x={136 + (n / max) * 110} y="17" fontSize="12" fill="var(--ink-2)">{n}</text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
