import { useEffect, useState } from 'react';
import type { AchievementDef } from '../../domain/motivation/motivation';
import { sfxComplete } from '../../infra/sfx';
import { Confetti, TrainArrival } from '../components/Graphics';
import { Flame } from '../icons/ui';
import type { SessionSummary } from './SessionPlayer';

interface Props {
  summary: SessionSummary;
  streak: number;
  goalJustMet: boolean;
  levelUp: number | null;
  achievements: AchievementDef[];
  usedFreezes: number;
  onContinue: () => void;
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function Complete({ summary, streak, goalJustMet, levelUp, achievements, onContinue }: Props) {
  const acc = summary.graded ? Math.round((summary.correct / summary.graded) * 100) : 100;
  const xp = useCountUp(summary.xp);
  const accV = useCountUp(acc);
  const mins = Math.max(1, Math.round(summary.ms / 60000));
  useEffect(() => {
    sfxComplete();
  }, []);

  const headline = acc === 100 ? 'Sem nenhum erro!' : acc >= 80 ? 'Lição concluída!' : 'Concluída — e o cérebro trabalhou!';
  return (
    <main className="complete" id="main">
      <Confetti seed={summary.xp + 1} />
      <div style={{ maxWidth: 460, width: '100%', position: 'relative' }}>
        <TrainArrival />
        <h1 tabIndex={-1} ref={(el) => el?.focus()}>{headline}</h1>
        <p style={{ color: 'var(--ink-2)', margin: 0 }}>
          {acc < 80 ? 'Errar durante a prática fortalece a memória. Os itens difíceis vão voltar na revisão.' : 'Os itens entraram na sua fila de revisão espaçada.'}
        </p>

        <div className="stats">
          <div className="stat-box" style={{ borderColor: 'var(--tangerine)' }}>
            <span style={{ color: 'var(--tangerine)' }}>XP</span><b>+{xp}</b>
          </div>
          <div className="stat-box" style={{ borderColor: 'var(--teal)' }}>
            <span style={{ color: 'var(--teal)' }}>Acerto</span><b>{accV}%</b>
          </div>
          <div className="stat-box" style={{ borderColor: 'var(--indigo)' }}>
            <span style={{ color: 'var(--indigo)' }}>Tempo</span><b>{mins}m</b>
          </div>
        </div>

        {summary.maxCombo >= 5 && <p style={{ fontWeight: 700 }}>Maior combo: ×{summary.maxCombo}</p>}

        {goalJustMet && (
          <div className="achv pop-in" style={{ borderColor: 'var(--tangerine)' }}>
            <Flame size={36} />
            <div><strong>Meta do dia batida!</strong><br />Sequência: {streak} {streak === 1 ? 'dia' : 'dias'}</div>
          </div>
        )}
        {levelUp && (
          <div className="achv pop-in" style={{ borderColor: 'var(--indigo)' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden><path d="M18 3l4.5 9.5 10.5 1.3-7.7 7.2 2 10.4L18 26.3 8.7 31.4l2-10.4L3 13.8l10.5-1.3z" fill="var(--indigo)" /></svg>
            <div><strong>Nível {levelUp}!</strong><br />Você subiu de nível.</div>
          </div>
        )}
        {achievements.map((a) => (
          <div className="achv pop-in" key={a.id}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden><circle cx="18" cy="14" r="10" fill="var(--ochre)" /><path d="M12 22l-3 11 9-4 9 4-3-11" fill="var(--ochre)" opacity=".7" /><path d="M14 14l3 3 6-6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>
            <div><strong>{a.title}</strong><br />{a.description}</div>
          </div>
        ))}

        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onContinue}>Continuar</button>
      </div>
    </main>
  );
}
