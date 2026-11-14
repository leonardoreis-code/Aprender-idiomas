import { useState } from 'react';
import { Logo } from '../icons/ui';

/** Primeira abertura: explica o método em 3 linhas e define a meta (autonomia — SDT). */
export function Onboarding({ onDone }: { onDone: (goal: number) => void }) {
  const [goal, setGoal] = useState(50);
  const opts = [
    { v: 20, t: 'Leve', d: '≈ 5 min por dia' },
    { v: 50, t: 'Constante', d: '≈ 10 min por dia' },
    { v: 100, t: 'Intenso', d: '≈ 20 min por dia' },
  ];
  return (
    <main className="onboard" id="main">
      <svg viewBox="0 0 320 120" width="100%" aria-hidden>
        <path d="M10 90 C 80 90, 90 30, 160 30 S 250 90, 310 60" stroke="var(--tangerine)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M20 20 C 90 20, 120 100, 200 96 S 290 30, 310 24" stroke="var(--teal)" strokeWidth="10" fill="none" strokeLinecap="round" />
        {[[160, 30], [200, 96], [62, 74], [276, 72]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="11" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" />
        ))}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Logo size={40} /><h1>Fluente</h1></div>
      <p style={{ fontSize: '1.15rem', margin: 0 }}>
        Inglês do zero, em sessões curtas. Você ouve, reconhece, monta, escreve e fala — e o app traz cada palavra de volta
        <strong> na hora exata em que você estaria prestes a esquecer.</strong>
      </p>
      <p className="science">
        Baseado em repetição espaçada (FSRS), prática de recuperação, treino fonético com várias vozes e feedback imediato.
      </p>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, marginBottom: 8 }}>Qual ritmo combina com você?</legend>
        <div className="goal-grid" role="radiogroup">
          {opts.map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={goal === o.v} className="option" onClick={() => setGoal(o.v)} style={{ justifyContent: 'space-between' }}>
              <span><strong>{o.t}</strong> · {o.v} XP</span>
              <span style={{ color: 'var(--ink-3)' }}>{o.d}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <button className="btn btn-primary btn-block" onClick={() => onDone(goal)}>Começar</button>
    </main>
  );
}
