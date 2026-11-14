/**
 * Plano de 6 meses (26 semanas) para sair de "entendo" para "falo".
 * Metas semanais em MINUTOS FALANDO (não em tempo de app) e em frases
 * automáticas (degrau ≥ Falar). Checkpoints de fala a cada 4 semanas.
 */
export const PLAN_WEEKS = 26;
export const CHECKPOINT_WEEKS = [0, 4, 8, 12, 16, 20, 24, 26];
/** Horas totais de prática ativa que o plano pressupõe (~1 h/dia, 6 dias/semana). */
export const PLAN_HOURS = 150;

export interface Phase {
  id: number;
  title: string;
  from: number;
  to: number;
  focus: string;
  /** Minutos efetivamente falando por semana (frases + fala livre). */
  speakMin: number;
  /** Minutos de conversa com a Maya por semana. */
  mayaMin: number;
  /** Frases automáticas acumuladas ao fim da fase. */
  autoBy: number;
  content: string[];
  outcome: string;
}

export const PHASES: Phase[] = [
  {
    id: 1, title: 'Fundação da produção', from: 1, to: 4, speakMin: 40, mayaMin: 20, autoBy: 50,
    focus: 'Montar frases simples sem traduzir palavra por palavra.',
    content: ['Destravar a fala: aulas 1–6', 'Laboratório de sotaque: TH, "i" final, -ed', '1 fala livre de 1 min por dia'],
    outcome: 'Você produz frases no presente, passado e futuro sem travar no sujeito e no auxiliar.',
  },
  {
    id: 2, title: 'Automatizar', from: 5, to: 12, speakMin: 70, mayaMin: 40, autoBy: 170,
    focus: 'Levar as frases ao modo relâmpago e encadear ideias.',
    content: ['Destravar a fala: aulas 7–12', 'Inglês para tech: aulas 1–3', 'Histórias com fala', 'Maya: treino PT→EN e conversa livre'],
    outcome: 'Você responde em 2–3 segundos a perguntas previsíveis e sustenta 1 minuto de fala.',
  },
  {
    id: 3, title: 'Conversa sustentada', from: 13, to: 20, speakMin: 100, mayaMin: 60, autoBy: 290,
    focus: 'Falar sobre o seu trabalho por vários minutos e reagir ao inesperado.',
    content: ['Inglês para tech: aulas 4–6', 'Minhas frases: 10 por semana do seu trabalho real', 'Maya: daily standup 3× por semana', 'Fala livre de 2 min'],
    outcome: 'Você faz sua daily em inglês e explica um projeto com começo, meio e fim.',
  },
  {
    id: 4, title: 'Simulação real', from: 21, to: 26, speakMin: 120, mayaMin: 90, autoBy: 340,
    focus: 'Entrevistas e reuniões completas, sob pressão de tempo.',
    content: ['Maya: entrevista técnica e comportamental 3× por semana', 'Regravar as respostas fracas', 'Revisão dos erros que ainda aparecem', 'Checkpoint final'],
    outcome: 'Você passa por uma entrevista de 30 minutos em inglês sem recorrer ao português.',
  },
];

const toUtc = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const dayDiff = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
export function addDays(day: string, n: number): string {
  const d = new Date(toUtc(day) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Semana do plano (1..26; >26 = plano encerrado; 0 = não iniciado). */
export function weekOf(startDay: string | null, today: string): number {
  if (!startDay) return 0;
  return Math.floor(Math.max(0, dayDiff(startDay, today)) / 7) + 1;
}

export const phaseOf = (week: number): Phase => PHASES.find((p) => week >= p.from && week <= p.to) ?? (week < 1 ? PHASES[0] : PHASES[PHASES.length - 1]);

/** Meta acumulada de frases automáticas para a semana (interpolação linear dentro da fase). */
export function autoTarget(week: number): number {
  const w = Math.max(0, Math.min(PLAN_WEEKS, week));
  const p = phaseOf(Math.max(1, w));
  const prev = PHASES[p.id - 2]?.autoBy ?? 0;
  const frac = (w - (p.from - 1)) / (p.to - p.from + 1);
  return Math.round(prev + (p.autoBy - prev) * Math.max(0, Math.min(1, frac)));
}

export interface CheckpointSlot {
  week: number;
  /** 'done' já feito · 'due' é hora de fazer · 'future' ainda não. */
  status: 'done' | 'due' | 'future';
}

/**
 * Agenda de checkpoints. Um checkpoint cobre o marco mais recente já alcançado;
 * marcos perdidos não se acumulam (faz-se um só e segue).
 */
export function checkpointSchedule(startDay: string | null, doneWeeks: number[], today: string): CheckpointSlot[] {
  const elapsedWeeks = startDay ? dayDiff(startDay, today) / 7 : -1;
  const lastDone = doneWeeks.length ? Math.max(...doneWeeks) : -1;
  const reached = CHECKPOINT_WEEKS.filter((w) => w <= elapsedWeeks);
  const current = reached.length ? reached[reached.length - 1] : startDay ? -1 : 0;
  return CHECKPOINT_WEEKS.map((week) => ({
    week,
    status: doneWeeks.includes(week) || week < lastDone || (week < current && lastDone >= 0) ? 'done' : week === current && lastDone < current ? 'due' : 'future',
  }));
}

export const nextCheckpoint = (slots: CheckpointSlot[]) => slots.find((s) => s.status === 'due') ?? slots.find((s) => s.status === 'future') ?? null;

/** Data-alvo (fim da semana 26). */
export const endDay = (startDay: string) => addDays(startDay, PLAN_WEEKS * 7);
