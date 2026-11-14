import { useCallback, useEffect, useMemo, useState } from 'react';
import { allItems, englishCourse, findItem, findLesson } from './content/en/course';
import { buildLesson, buildReview } from './domain/practice/builder';
import type { Exercise } from './domain/practice/types';
import { reconcileStreak } from './domain/motivation/motivation';
import { dueItemIds } from './domain/srs/scheduler';
import { completeSession, type SessionOutcome } from './application/completeSession';
import { loadManifest } from './infra/audio';
import { setSfxEnabled } from './infra/sfx';
import { defaultState, loadState, resetState, saveState, type AppState } from './infra/storage';
import { Home } from './ui/screens/Home';
import { LessonSheet } from './ui/screens/LessonSheet';
import { SessionPlayer, type SessionSummary } from './ui/screens/SessionPlayer';
import { Complete } from './ui/screens/Complete';
import { Settings } from './ui/screens/Settings';
import { Onboarding } from './ui/screens/Onboarding';

type View =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'session'; kind: 'lesson' | 'review'; lessonId?: string; exercises: Exercise[]; title: string }
  | { name: 'complete'; summary: SessionSummary; outcome: SessionOutcome };

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const s = loadState();
    const { usedFreezes: _u, ...motivation } = reconcileStreak(s.motivation);
    return { ...s, motivation };
  });
  const [view, setView] = useState<View>({ name: 'home' });
  const [sheet, setSheet] = useState<string | null>(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => void loadManifest(), []);
  useEffect(() => {
    const root = document.documentElement;
    const s = state.settings;
    root.style.setProperty('--scale', String(s.fontScale));
    if (s.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', s.theme);
    if (s.highContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    setSfxEnabled(s.sound);
  }, [state.settings]);

  const due = useMemo(() => dueItemIds(state.cards), [state.cards, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const startLesson = (id: string) => {
    const lesson = findLesson(id)!;
    setSheet(null);
    setView({ name: 'session', kind: 'lesson', lessonId: id, title: lesson.title, exercises: buildLesson(lesson, allItems, Date.now() % 100000) });
  };

  const startReview = () => {
    const items = due.map(findItem).filter((i): i is NonNullable<typeof i> => !!i);
    setView({ name: 'session', kind: 'review', title: 'Revisão', exercises: buildReview(items, allItems, Date.now() % 100000) });
  };

  const finish = useCallback(
    (summary: SessionSummary) => {
      if (view.name !== 'session') return;
      const lesson = view.lessonId ? findLesson(view.lessonId) : undefined;
      const outcome = completeSession(state, {
        kind: view.kind,
        lessonId: view.lessonId,
        attempts: summary.attempts,
        xp: summary.xp,
        bestSpeech: summary.bestSpeech,
        introducedItemIds: lesson?.items.map((i) => i.id),
      });
      setState(outcome.state);
      setView({ name: 'complete', summary, outcome });
    },
    [view, state],
  );

  if (!state.onboarded) {
    return (
      <Onboarding
        onDone={(goal) => setState((s) => ({ ...s, onboarded: true, motivation: { ...s.motivation, dailyGoal: goal } }))}
      />
    );
  }

  switch (view.name) {
    case 'session':
      return (
        <SessionPlayer
          key={view.title + view.exercises.length}
          title={view.title}
          exercises={view.exercises}
          slow={state.settings.slowAudio}
          mic={state.settings.microphone}
          onExit={() => setView({ name: 'home' })}
          onFinish={finish}
        />
      );
    case 'complete':
      return (
        <Complete
          summary={view.summary}
          streak={view.outcome.state.motivation.streak}
          goalJustMet={view.outcome.goalJustMet}
          levelUp={view.outcome.levelUp}
          achievements={view.outcome.achievements}
          usedFreezes={0}
          onContinue={() => setView({ name: 'home' })}
        />
      );
    case 'settings':
      return (
        <Settings
          state={state}
          onBack={() => setView({ name: 'home' })}
          onChange={(p) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } }))}
          onGoal={(g) => setState((s) => ({ ...s, motivation: { ...s.motivation, dailyGoal: g } }))}
          onReset={() => {
            resetState();
            setState(defaultState());
            setView({ name: 'home' });
          }}
        />
      );
    default:
      return (
        <>
          <Home
            course={englishCourse}
            state={state}
            dueCount={due.length}
            onOpenLesson={setSheet}
            onReview={startReview}
            onSettings={() => setView({ name: 'settings' })}
          />
          <LessonSheet
            lesson={sheet ? findLesson(sheet) ?? null : null}
            done={!!sheet && state.lessonsDone.includes(sheet)}
            onStart={() => sheet && startLesson(sheet)}
            onClose={() => setSheet(null)}
          />
        </>
      );
  }
}
