import { useCallback, useEffect, useRef, useState } from 'react';
import type { Attempt, Exercise } from '../../domain/practice/types';
import { PRODUCTION_TYPES, isGraded } from '../../domain/practice/types';
import { xpForAnswer } from '../../domain/motivation/motivation';
import { stopAudio } from '../../infra/audio';
import { sfxCorrect, sfxWrong } from '../../infra/sfx';
import { CheckIcon, CloseIcon, XIcon } from '../icons/ui';
import { ExerciseView, type Result } from '../components/Exercises';

export interface SessionSummary {
  attempts: Attempt[];
  xp: number;
  correct: number;
  graded: number;
  ms: number;
  maxCombo: number;
  bestSpeech: number;
}

interface Props {
  title: string;
  exercises: Exercise[];
  slow: boolean;
  mic: boolean;
  onExit: () => void;
  onFinish: (s: SessionSummary) => void;
}

const PRAISE = ['Isso!', 'Mandou bem!', 'Perfeito!', 'Exato!', 'Boa!', 'Certinho!'];

/**
 * Orquestra uma sessão: fila de exercícios, re-enfileira erros (até 2x),
 * combo, XP e feedback imediato com resposta correta (feedback corretivo explícito).
 */
export function SessionPlayer({ title, exercises, slow, mic, onExit, onFinish }: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [combo, setCombo] = useState(0);
  const [xpPop, setXpPop] = useState<{ n: number; id: number } | null>(null);
  const attempts = useRef<Attempt[]>([]);
  const xp = useRef(0);
  const maxCombo = useRef(0);
  const bestSpeech = useRef(0);
  const retries = useRef<Record<string, number>>({});
  const startedAt = useRef(Date.now());
  const exStart = useRef(Date.now());
  const stageRef = useRef<HTMLElement>(null);

  const ex = queue[idx];
  const total = queue.length;

  const finish = useCallback(() => {
    stopAudio();
    const graded = attempts.current;
    onFinish({
      attempts: graded,
      xp: xp.current,
      correct: graded.filter((a) => a.correct).length,
      graded: graded.length,
      ms: Date.now() - startedAt.current,
      maxCombo: maxCombo.current,
      bestSpeech: bestSpeech.current,
    });
  }, [onFinish]);

  const advance = useCallback(() => {
    setResult(null);
    if (idx + 1 >= queue.length) return finish();
    setIdx((i) => i + 1);
    exStart.current = Date.now();
  }, [idx, queue.length, finish]);

  // foco no novo exercício (leitores de tela anunciam o título)
  useEffect(() => {
    const h = stageRef.current?.querySelector<HTMLElement>('h1');
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }, [idx]);

  const handleResult = (r: Result) => {
    if (!r.graded) {
      if (r.skipped) setResult(r);
      else advance();
      return;
    }
    const ms = Date.now() - exStart.current;
    attempts.current.push({
      exerciseKey: ex.key,
      itemIds: ex.itemIds,
      correct: r.correct,
      hesitant: !!r.hesitant,
      production: PRODUCTION_TYPES.includes(ex.type),
      ms,
    });
    if (r.speech) bestSpeech.current = Math.max(bestSpeech.current, r.speech.score);
    if (r.correct) {
      const c = combo + 1;
      setCombo(c);
      maxCombo.current = Math.max(maxCombo.current, c);
      const gained = xpForAnswer(c);
      xp.current += gained;
      setXpPop({ n: gained, id: Date.now() });
      sfxCorrect(c);
    } else {
      setCombo(0);
      sfxWrong();
      // erro volta no fim da sessão (prática de recuperação + espaçamento curto)
      const baseKey = ex.key.split('~')[0];
      const n = retries.current[baseKey] ?? 0;
      if (n < 2 && isGraded(ex)) {
        retries.current[baseKey] = n + 1;
        setQueue((q) => [...q, { ...ex, key: `${baseKey}~r${n + 1}` } as Exercise]);
      }
    }
    setResult(r);
  };

  // Enter = continuar; Espaço = tocar áudio (quando o foco não está num controle)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === 'Enter' && result && !e.repeat) {
        e.preventDefault();
        advance();
      } else if (e.key === ' ' && tag !== 'INPUT' && tag !== 'BUTTON') {
        const play = document.querySelector<HTMLButtonElement>('[data-hotkey="play"]');
        if (play) {
          e.preventDefault();
          play.click();
        }
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    // registra no próximo tick para não capturar o mesmo Enter que verificou
    const t = setTimeout(() => window.addEventListener('keydown', h), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', h);
    };
  }, [result, advance, onExit]);

  if (!ex) return null;
  const progress = (idx + (result ? 1 : 0)) / total;
  const ok = result?.correct && !result.skipped;

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={() => { stopAudio(); onExit(); }} aria-label="Sair da sessão (Esc)">
          <CloseIcon />
        </button>
        <div className="progress" role="progressbar" aria-label={`Progresso: ${title}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={idx}>
          <span style={{ width: `${Math.max(progress * 100, 3)}%` }} />
        </div>
        <div className="combo" aria-live="polite" aria-label={combo >= 2 ? `Combo de ${combo}` : undefined}>
          {combo >= 2 ? `×${combo}` : ''}
        </div>
      </header>

      <main ref={stageRef} className="stage" id="main" key={ex.key}>
        <ExerciseView ex={ex} onResult={handleResult} answered={!!result} slow={slow} mic={mic} />
      </main>

      {xpPop && !result?.skipped && ok && (
        <div key={xpPop.id} className="xp-pop" aria-hidden onAnimationEnd={() => setXpPop(null)}>+{xpPop.n} XP</div>
      )}

      <div aria-live="assertive" className="sr-only">
        {result && (result.skipped ? 'Pulado.' : result.correct ? `Correto. ${result.solution ?? ''}` : `Incorreto. Resposta: ${result.solution ?? ''}`)}
      </div>

      {result && (
        <footer className={`footer ${result.skipped ? '' : ok ? 'ok' : 'bad'} pop-in`}>
          <div className="footer-inner">
            <div className="msg">
              {!result.skipped && (
                <span style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', color: ok ? 'var(--ok)' : 'var(--bad)', flex: 'none' }}>
                  {ok ? <CheckIcon size={30} /> : <XIcon size={30} />}
                </span>
              )}
              <div>
                <strong>
                  {result.skipped ? 'Tudo bem, seguimos.' : ok ? (result.hesitant ? 'Quase perfeito!' : PRAISE[idx % PRAISE.length]) : 'Resposta correta:'}
                </strong>
                {!ok && result.solution && <small lang="en" style={{ display: 'block', fontWeight: 700 }}>{result.solution}</small>}
                {ok && result.hesitant && result.solution && <small lang="en" style={{ display: 'block' }}>Forma ideal: {result.solution}</small>}
                {result.note && <small style={{ display: 'block' }}>{result.note}</small>}
              </div>
            </div>
            <button className={`btn ${result.skipped ? 'btn-primary' : ok ? 'btn-ok' : 'btn-bad'}`} onClick={advance} autoFocus>
              Continuar
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
