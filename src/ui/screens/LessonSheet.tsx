import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '../../domain/curriculum/types';
import { playFile, stopAudio } from '../../infra/audio';
import { ItemIcon } from '../icons/ItemIcon';
import { SpeakerIcon, TargetIcon } from '../icons/ui';

interface Props {
  lesson: Lesson | null;
  done: boolean;
  onStart: () => void;
  onClose: () => void;
}

/** Folha de abertura da lição: objetivo can-do + áudio-aula (ElevenLabs) + prévia. */
export function LessonSheet({ lesson, done, onStart, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (lesson && !d.open) d.showModal();
    if (!lesson && d.open) d.close();
  }, [lesson]);

  const close = () => {
    stopAudio();
    setPlaying(false);
    onClose();
  };

  return (
    <dialog ref={ref} className="sheet" onClose={close} onClick={(e) => e.target === ref.current && close()} aria-labelledby="sheet-h">
      {lesson && (
        <div className="sheet-body pop-in">
          <h2 id="sheet-h">{lesson.title}</h2>
          <div className="can-do">
            <TargetIcon />
            <div><strong>Objetivo</strong><br />{lesson.canDo}</div>
          </div>

          {lesson.introAudio ? (
            <div className="audio-lesson">
              <button
                className="play small"
                type="button"
                aria-label={playing ? 'Tocando áudio-aula' : 'Ouvir áudio-aula'}
                onClick={async () => {
                  setPlaying(true);
                  await playFile(lesson.introAudio!);
                  setPlaying(false);
                }}
              >
                <SpeakerIcon size={26} />
              </button>
              <div>
                <strong>Áudio-aula</strong> <span style={{ color: 'var(--ink-3)', fontSize: '.85rem' }}>· voz gerada com ElevenLabs</span>
                {lesson.introScript && (
                  <details>
                    <summary>Transcrição</summary>
                    <p className="transcript">{lesson.introScript}</p>
                  </details>
                )}
              </div>
            </div>
          ) : (
            lesson.introScript && <p className="transcript">{lesson.introScript}</p>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 18px' }} aria-label="Itens da lição">
            {lesson.items.map((i) => (
              <span key={i.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.95rem', boxShadow: 'none' }} lang="en">
                {i.icon && <ItemIcon name={i.icon} size={26} />} {i.en}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <button className="btn btn-primary btn-block" onClick={() => { stopAudio(); onStart(); }} autoFocus>
              {done ? 'Praticar de novo' : 'Começar lição'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={close}>Agora não</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
