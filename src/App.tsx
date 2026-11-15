import { useCallback, useEffect, useMemo, useState } from 'react';
import { allItems, englishCourse, findItem, findLesson } from './content/en/course';
import { allDrills, drillsForErrors, findSpeakingLesson, stories, videoForLesson, videoLessons } from './content';
import { buildLesson, buildReview } from './domain/practice/builder';
import type { Exercise } from './domain/practice/types';
import { buildErrorQueue, buildProductionQueue, firstTryAccuracy } from './domain/production/ladder';
import { errorProfile } from './domain/production/errors';
import { dueItemIds } from './domain/srs/scheduler';
import { completeSession, type SessionOutcome } from './application/completeSession';
import { loadManifest } from './infra/audio';
import { defaultState, resetState } from './infra/storage';
import { StoreProvider, useStore } from './ui/store';
import { parse, toHash, type Route } from './ui/router';
import { Home } from './ui/screens/Home';
import { LessonSheet } from './ui/screens/LessonSheet';
import { SessionPlayer, type SessionSummary } from './ui/screens/SessionPlayer';
import { Complete } from './ui/screens/Complete';
import { Settings } from './ui/screens/Settings';
import { Onboarding } from './ui/screens/Onboarding';
import { Dashboard } from './ui/screens/Dashboard';
import { Course, StoriesList } from './ui/screens/Course';
import { LessonPage } from './ui/screens/LessonPage';
import { ProductionSession } from './ui/screens/ProductionSession';
import { VideoPlayer } from './ui/screens/VideoPlayer';
import { StoryPlayer } from './ui/screens/StoryPlayer';
import { TeacherRoom } from './ui/screens/TeacherRoom';
import { AccentLab } from './ui/screens/AccentLab';
import { Profile } from './ui/screens/Profile';
import { CheckpointScreen } from './ui/screens/Checkpoint';
import { Evolution } from './ui/screens/Evolution';
import { Monologue, MySentences } from './ui/screens/Extras';
import { LiveCoach } from './ui/screens/LiveCoach';
import { DelayedEcho, Fluency, Lab, Retell } from './ui/screens/Methods';
import { MissionPlayer, MissionsHub } from './ui/screens/Missions';
import { findMission } from './content/missions';
import { isArtifact } from './infra/platform';
import { Logo } from './ui/icons/ui';
import { NavIcon } from './ui/components/NavIcon';

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const h = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const go = useCallback((r: Route) => {
    location.hash = toHash(r);
  }, []);
  return [route, go];
}

const NAV: { route: Route; label: string; icon: Parameters<typeof NavIcon>[0]['name'] }[] = [
  { route: { name: 'home' }, label: 'Início', icon: 'home' },
  { route: { name: 'course' }, label: 'Curso', icon: 'course' },
  { route: { name: 'lab' }, label: 'Falar', icon: 'teacher' },
  { route: { name: 'evolution' }, label: 'Evolução', icon: 'practice' },
  { route: { name: 'profile' }, label: 'Perfil', icon: 'profile' },
];

function Shell() {
  const store = useStore();
  const { state, set } = store;
  const [route, go] = useRoute();
  useEffect(() => void loadManifest(), []);

  if (!state.onboarded) {
    return (
      <Onboarding
        onDone={(r) => {
          set((s) => ({ ...s, onboarded: true, profile: { name: r.name, level: r.level, goals: r.goals, minutes: r.minutes }, motivation: { ...s.motivation, dailyGoal: r.dailyGoal } }));
          go({ name: 'home' });
        }}
      />
    );
  }

  // telas imersivas (sem navegação)
  const immersive = route.name === 'practice' || route.name === 'checkpoint';
  const screen = <Screen route={route} go={go} />;
  if (immersive) return <>{screen}<Toasts /></>;

  const active = (r: Route) => r.name === route.name || (r.name === 'course' && ['lesson', 'video', 'stories', 'story', 'base'].includes(route.name)) || (r.name === 'lab' && ['teacher', 'fluency', 'retell', 'echo', 'monologue', 'mine', 'accent', 'missions', 'mission'].includes(route.name)) || (r.name === 'profile' && route.name === 'settings');
  return (
    <div className="app">
      <a href="#main" className="skip">Pular para o conteúdo</a>
      <nav className="nav" aria-label="Principal">
        <div className="nav-brand"><Logo /> <span>Fluente</span></div>
        {NAV.map((n) => (
          <a key={n.label} href={toHash(n.route)} className="nav-item" aria-current={active(n.route) ? 'page' : undefined}>
            <NavIcon name={n.icon} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <div className="app-main">{screen}</div>
      <Toasts />
    </div>
  );
}

function Screen({ route, go }: { route: Route; go: (r: Route) => void }) {
  const store = useStore();
  const { state } = store;
  switch (route.name) {
    case 'home':
      return <Dashboard go={go} />;
    case 'course':
      return <Course go={go} />;
    case 'lesson': {
      const l = findSpeakingLesson(route.id);
      return l ? <LessonPage lesson={l} hasVideo={videoForLesson(l.id)} go={go} /> : <Course go={go} />;
    }
    case 'practice':
      return <PracticeRoute lessonId={route.lessonId} go={go} />;
    case 'video': {
      const v = videoLessons.find((x) => x.id === route.id);
      if (!v) return <Course go={go} />;
      return <VideoPlayer video={v} onBack={() => history.back()} onPractice={v.lessonId ? () => go({ name: 'lesson', id: v.lessonId! }) : undefined} />;
    }
    case 'stories':
      return <StoriesList go={go} />;
    case 'story': {
      const st = stories.find((x) => x.id === route.id);
      return st ? <StoryPlayer story={st} onBack={() => go({ name: 'stories' })} /> : <StoriesList go={go} />;
    }
    case 'teacher': {
      const l = route.lessonId ? findSpeakingLesson(route.lessonId) : undefined;
      // ligação de voz contínua (ElevenLabs) só fora do artefato e só quando pedida
      if (route.mode === 'call' && !isArtifact) return <TeacherRoom key="call" onBack={() => go({ name: 'lab' })} initialMode="conversation" />;
      const scenarioId = { roleplay: 'daily', interview: 'interview', conversation: 'smalltalk' }[route.mode ?? ''];
      return <LiveCoach key={`${route.lessonId ?? ''}-${route.mode ?? ''}`} go={go} lessonId={l?.id} scenarioId={scenarioId} />;
    }
    case 'accent':
      return <AccentLab onBack={() => history.back()} />;
    case 'profile':
      return <Profile go={go} />;
    case 'settings':
      return (
        <Settings
          state={state}
          onBack={() => go({ name: 'profile' })}
          onChange={(p) => store.set((s) => ({ ...s, settings: { ...s.settings, ...p } }))}
          onGoal={(g) => store.set((s) => ({ ...s, motivation: { ...s.motivation, dailyGoal: g } }))}
          onReset={() => {
            resetState();
            store.set(() => defaultState());
            go({ name: 'home' });
          }}
        />
      );
    case 'base':
      return <BaseTrack go={go} />;
    case 'evolution':
      return <Evolution go={go} />;
    case 'checkpoint':
      return <CheckpointScreen go={go} />;
    case 'monologue':
      return <Monologue go={go} />;
    case 'mine':
      return <MySentences go={go} />;
    case 'lab':
      return <Lab go={go} />;
    case 'fluency':
      return <Fluency go={go} />;
    case 'retell':
      return <Retell go={go} />;
    case 'echo':
      return <DelayedEcho go={go} />;
    case 'missions':
      return <MissionsHub go={go} />;
    case 'mission':
      return findMission(route.id) ? <MissionPlayer key={route.id} id={route.id} go={go} /> : <MissionsHub go={go} />;
    default:
      return <Dashboard go={go} />;
  }
}

/** "Pense em inglês": de uma aula, dos meus erros, das minhas frases ou a fila personalizada geral. */
function PracticeRoute({ lessonId, go }: { lessonId?: string; go: (r: Route) => void }) {
  const store = useStore();
  const { production, custom, errorLog } = store.state;
  const lesson = lessonId ? findSpeakingLesson(lessonId) : undefined;
  const mode = lesson ? 'lesson' : lessonId === 'erros' ? 'errors' : lessonId === 'minhas' ? 'mine' : 'mix';
  const { queue, pool, title } = useMemo(() => {
    if (lesson) return { title: lesson.title, pool: lesson.drills, queue: buildProductionQueue(lesson.drills, production, { max: 14, newLimit: 12, focusIds: lesson.drills.map((d) => d.id) }) };
    if (mode === 'errors') {
      const top = errorProfile(errorLog.slice(0, 120)).slice(0, 3).map((e) => e.id);
      const drills = drillsForErrors(top);
      return { title: 'Treino dos meus erros', pool: drills.length ? drills : allDrills, queue: buildErrorQueue(drills, production, 12) };
    }
    if (mode === 'mine') {
      const q = buildProductionQueue(custom, production, { max: 12, newLimit: 12 });
      return { title: 'Minhas frases', pool: custom, queue: q.length ? q : buildErrorQueue(custom, production, 12) };
    }
    const started = new Set(Object.keys(production).map((id) => id.replace(/-d\d+$/, '')));
    const seen = allDrills.filter((d) => started.has(d.id.replace(/-d\d+$/, '')));
    const all = [...(seen.length ? seen : allDrills.slice(0, 12)), ...custom];
    return { title: 'Pense em inglês', pool: [...allDrills, ...custom], queue: buildProductionQueue(all, production, { max: 12, newLimit: 4 }) };
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!queue.length) {
    return (
      <main className="complete" id="main">
        <div>
          <h1>{mode === 'errors' ? 'Sem erros registrados ainda' : 'Tudo em dia!'}</h1>
          <p className="muted">{mode === 'errors' ? 'Pratique algumas aulas: o treino de erros se monta sozinho a partir do que você errar.' : 'Nenhuma frase vencida agora. Comece uma aula nova ou converse com a Maya.'}</p>
          <button className="btn btn-primary" onClick={() => go({ name: 'course' })}>Ir para o curso</button>
        </div>
      </main>
    );
  }
  return (
    <ProductionSession
      title={title}
      queue={queue}
      pool={pool}
      onExit={() => (lesson ? go({ name: 'lesson', id: lesson.id }) : go({ name: 'home' }))}
      onDone={(attempts) => {
        if (lesson) {
          // domínio: a aula só conta como concluída com ≥ 70% de acerto na primeira tentativa
          const acc = firstTryAccuracy(attempts);
          if (acc >= 0.7) {
            store.set((s) => ({ ...s, lessons: { ...s.lessons, [lesson.id]: { ...s.lessons[lesson.id], practice: true, article: true } } }));
            store.track('lessons');
          } else {
            store.toast({ title: `Acerto de primeira: ${Math.round(acc * 100)}%`, body: 'A aula fecha com 70%. As frases erradas voltam amanhã; refaça a prática.', kind: 'info' });
          }
        } else store.track('reviews', queue.length);
      }}
    />
  );
}

/** Trilha base A1 (v1): mapa de metrô + lições geradas + revisão FSRS. */
type BaseView = { name: 'map' } | { name: 'session'; kind: 'lesson' | 'review'; lessonId?: string; exercises: Exercise[]; title: string } | { name: 'complete'; summary: SessionSummary; outcome: SessionOutcome };
function BaseTrack({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const { state } = store;
  const [view, setView] = useState<BaseView>({ name: 'map' });
  const [sheet, setSheet] = useState<string | null>(null);
  const due = useMemo(() => dueItemIds(state.cards), [state.cards, view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view.name === 'session')
    return (
      <SessionPlayer
        title={view.title}
        exercises={view.exercises}
        slow={state.settings.slowAudio}
        mic={state.settings.microphone}
        onExit={() => setView({ name: 'map' })}
        onFinish={(summary) => {
          const lesson = view.lessonId ? findLesson(view.lessonId) : undefined;
          const outcome = completeSession(state, { kind: view.kind, lessonId: view.lessonId, attempts: summary.attempts, xp: summary.xp, bestSpeech: summary.bestSpeech, introducedItemIds: lesson?.items.map((i) => i.id) });
          store.set(() => outcome.state);
          store.track(view.kind === 'review' ? 'reviews' : 'lessons', view.kind === 'review' ? summary.graded : 1);
          setView({ name: 'complete', summary, outcome });
        }}
      />
    );
  if (view.name === 'complete')
    return <Complete summary={view.summary} streak={view.outcome.state.motivation.streak} goalJustMet={view.outcome.goalJustMet} levelUp={view.outcome.levelUp} achievements={view.outcome.achievements} usedFreezes={0} onContinue={() => setView({ name: 'map' })} />;
  return (
    <>
      <Home
        course={englishCourse}
        state={state}
        dueCount={due.length}
        onOpenLesson={setSheet}
        onReview={() => setView({ name: 'session', kind: 'review', title: 'Revisão', exercises: buildReview(due.map(findItem).filter((i): i is NonNullable<typeof i> => !!i), allItems, Date.now() % 100000) })}
        onSettings={() => go({ name: 'settings' })}
      />
      <LessonSheet
        lesson={sheet ? findLesson(sheet) ?? null : null}
        done={!!sheet && state.lessonsDone.includes(sheet)}
        onStart={() => {
          if (!sheet) return;
          const l = findLesson(sheet)!;
          setSheet(null);
          setView({ name: 'session', kind: 'lesson', lessonId: sheet, title: l.title, exercises: buildLesson(l, allItems, Date.now() % 100000) });
        }}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind ?? 'info'} pop-in`}>
          <strong>{t.title}</strong>
          {t.body && <span>{t.body}</span>}
        </div>
      ))}
    </div>
  );
}
