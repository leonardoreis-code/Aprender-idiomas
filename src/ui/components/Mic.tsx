import { useEffect, useRef, useState } from 'react';
import { canRecord, startRecording, type ActiveRecording, type Recording } from '../../infra/recorder';
import { speechRecognitionSupported } from '../../infra/speech';
import { MicIcon } from '../icons/ui';

export const micAvailable = () => canRecord() || speechRecognitionSupported();

/** Botão de gravação com medidor de volume ao vivo. Clique para começar, clique para parar. */
export function MicButton({ onResult, maxMs = 12000, autoStart = false, disabled, label = 'Gravar minha voz' }: {
  onResult: (r: Recording) => void;
  maxMs?: number;
  autoStart?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const [state, setState] = useState<'idle' | 'rec' | 'processing'>('idle');
  const [lvl, setLvl] = useState(0);
  const active = useRef<ActiveRecording | null>(null);
  const raf = useRef(0);

  const start = async () => {
    if (state !== 'idle') return;
    setState('rec');
    try {
      const rec = await startRecording({ maxMs });
      active.current = rec;
      const tick = () => {
        setLvl(rec.level());
        raf.current = requestAnimationFrame(tick);
      };
      tick();
      const result = await rec.done;
      cancelAnimationFrame(raf.current);
      setLvl(0);
      setState('idle');
      active.current = null;
      onResult(result);
    } catch {
      setState('idle');
    }
  };
  const stop = () => {
    if (!active.current) return;
    setState('processing');
    active.current.stop();
  };

  useEffect(() => {
    if (autoStart) void start();
    return () => {
      cancelAnimationFrame(raf.current);
      active.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
      <button
        type="button"
        className={`mic ${state === 'rec' ? 'listening' : ''}`}
        onClick={state === 'rec' ? stop : start}
        disabled={disabled || state === 'processing'}
        aria-label={state === 'rec' ? 'Parar gravação' : label}
        style={{ boxShadow: state === 'rec' ? `0 6px 0 color-mix(in srgb, var(--tangerine) 60%, #000), 0 0 0 ${4 + lvl * 26}px color-mix(in srgb, var(--tangerine) 25%, transparent)` : undefined }}
      >
        {state === 'rec' ? (
          <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
        ) : state === 'processing' ? (
          <span className="spinner" aria-hidden />
        ) : (
          <MicIcon size={44} />
        )}
      </button>
      <span role="status" style={{ color: 'var(--ink-2)', minHeight: 22, fontSize: '.95rem' }}>
        {state === 'rec' ? 'Gravando… toque para parar' : state === 'processing' ? 'Analisando sua fala…' : 'Toque e fale'}
      </span>
    </div>
  );
}
