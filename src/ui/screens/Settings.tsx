import { useState } from 'react';
import type { AppState, Settings as S } from '../../infra/storage';
import { ACHIEVEMENTS } from '../../domain/motivation/motivation';
import { BackIcon } from '../icons/ui';

interface Props {
  state: AppState;
  onChange: (s: Partial<S>) => void;
  onGoal: (g: number) => void;
  onReset: () => void;
  onBack: () => void;
}

function Switch({ label, desc, on, onToggle }: { label: string; desc?: string; on: boolean; onToggle: () => void }) {
  const id = label.replace(/\W/g, '');
  return (
    <div className="setting">
      <div><strong id={id}>{label}</strong>{desc && <p>{desc}</p>}</div>
      <button className="switch" role="switch" aria-checked={on} aria-labelledby={id} onClick={onToggle} />
    </div>
  );
}

/** Confirmação em dois cliques (confirm() não funciona em artefatos). */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span>Apagar todo o progresso deste dispositivo?</span>
      <button className="btn btn-bad" onClick={onReset}>Sim, apagar</button>
      <button className="btn btn-ghost" onClick={() => setArmed(false)}>Cancelar</button>
    </div>
  ) : (
    <button className="btn btn-ghost" onClick={() => setArmed(true)}>Apagar progresso</button>
  );
}

export function Settings({ state, onChange, onGoal, onReset, onBack }: Props) {
  const s = state.settings;
  return (
    <main className="shell settings" id="main">
      <button className="link-btn" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
        <BackIcon /> Voltar
      </button>
      <h1>Ajustes</h1>

      <div className="setting">
        <div><strong>Meta diária</strong><p>Metas pequenas e diárias vencem maratonas.</p></div>
        <div className="seg" role="group" aria-label="Meta diária">
          {[20, 50, 100].map((g) => (
            <button key={g} aria-pressed={state.motivation.dailyGoal === g} onClick={() => onGoal(g)}>{g}</button>
          ))}
        </div>
      </div>
      <Switch label="Efeitos sonoros" on={s.sound} onToggle={() => onChange({ sound: !s.sound })} />
      <Switch label="Exercícios de fala" desc="Usa o microfone (Chrome, Edge ou Safari)." on={s.microphone} onToggle={() => onChange({ microphone: !s.microphone })} />
      <Switch label="Áudio sempre lento" desc="Toca o áudio a 80% da velocidade." on={s.slowAudio} onToggle={() => onChange({ slowAudio: !s.slowAudio })} />
      <Switch label="Alto contraste" on={s.highContrast} onToggle={() => onChange({ highContrast: !s.highContrast })} />

      <div className="setting">
        <div><strong>Tamanho do texto</strong></div>
        <div className="seg" role="group" aria-label="Tamanho do texto">
          {([1, 1.15, 1.3] as const).map((v, i) => (
            <button key={v} aria-pressed={s.fontScale === v} onClick={() => onChange({ fontScale: v })} aria-label={['Normal', 'Grande', 'Muito grande'][i]}>
              <span style={{ fontSize: `${0.85 + i * 0.2}rem` }}>A</span>
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <div><strong>Tema</strong></div>
        <div className="seg" role="group" aria-label="Tema">
          {(['auto', 'light', 'dark'] as const).map((t) => (
            <button key={t} aria-pressed={s.theme === t} onClick={() => onChange({ theme: t })}>{{ auto: 'Auto', light: 'Claro', dark: 'Escuro' }[t]}</button>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: '1.3rem', marginTop: 28 }}>Conquistas</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ACHIEVEMENTS.map((a) => {
          const got = state.motivation.achievements.includes(a.id);
          return (
            <li key={a.id} className="setting" style={{ opacity: got ? 1 : 0.5 }}>
              <div><strong>{a.title}</strong><p>{a.description}</p></div>
              <span aria-label={got ? 'conquistada' : 'bloqueada'}>{got ? '★' : '☆'}</span>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 28 }}>
        <ResetButton onReset={onReset} />
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: '.85rem', marginTop: 24 }}>
        Atalhos: <kbd>1–4</kbd> escolher · <kbd>Enter</kbd> verificar/continuar · <kbd>Espaço</kbd> ouvir · <kbd>Esc</kbd> sair.
      </p>
    </main>
  );
}
