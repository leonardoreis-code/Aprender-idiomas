/**
 * Revisão semanal: junta o que o plano pedia para a semana com o que foi medido
 * e devolve um veredito, até três sugestões acionáveis e o foco da semana seguinte.
 * Puro (sem React, sem relógio): `today` vem de fora.
 */
import type { AppState } from '../../infra/storage';
import { autonomy } from '../coach/mediation';
import { dayKey } from '../motivation/motivation';
import { addDays, autoTarget as autoTargetFor, dayDiff, phaseOf, PLAN_WEEKS, weekOf } from '../plan/sixMonths';
import { ERROR_CATEGORIES, errorProfile } from '../production/errors';
import { planWeekTotals, weekly } from '../progress/daily';

export interface WeekReview {
  /** Semana do plano que contém `today` (0 = plano não iniciado; pode passar de 26). */
  week: number;
  phaseTitle: string;
  speakMin: number;
  speakTarget: number;
  talkMin: number;
  talkTarget: number;
  activeDays: number;
  retention: number | null;
  selfRepair: number | null;
  auto: number;
  autoTarget: number;
  topErrors: { id: string; count: number }[];
  verdict: 'sem-plano' | 'adiantado' | 'no-ritmo' | 'atrasado' | 'parado';
  suggestions: string[];
  focus: string;
}

export type ReviewAction = 'checkpoint' | 'erros' | 'simulacao' | 'pratica';

/** Limiares das regras (exportados para a tela e para os testes). */
export const REVIEW_RULES = {
  /** Fração da meta proporcional a partir da qual a semana está adiantada / no ritmo. */
  ahead: 1.1,
  onPace: 0.7,
  /** Retenção abaixo disso: revisar antes de aula nova. */
  retentionMin: 75,
  /** Autocorreção abaixo disso: ainda precisa da marcação ao vivo. */
  selfRepairMin: 40,
  /** Ocorrências para um erro contar como dominante. */
  dominantError: 3,
  /** Dias ativos esperados numa semana cheia. */
  activeDaysGoal: 6,
} as const;

const MAX_SUGGESTIONS = 3;

interface Advice {
  suggestion: string;
  focus: string;
}

/** Dias ativos mínimos para não disparar o alerta de frequência (4 numa semana cheia). */
const minActiveDays = (elapsed: number) => Math.floor((elapsed * 4) / 7);

export function weekReview(state: Pick<AppState, 'daily' | 'plan' | 'production' | 'errorLog' | 'repairs'>, today: string): WeekReview {
  const start = state.plan.startDay;
  const week = weekOf(start, today);
  const started = !!start && week >= 1;
  const planWeek = Math.min(Math.max(week, 1), PLAN_WEEKS);
  const phase = phaseOf(planWeek);
  const last7 = weekly(state.daily, today, 1)[0];

  // Com plano: a semana do plano que contém hoje. Sem plano: os últimos 7 dias, só como referência.
  const totals = started
    ? planWeekTotals(state.daily, start, week)
    : { speakMin: Math.round(last7.speakMin), mayaMin: Math.round(last7.mayaMin), activeDays: last7.activeDays };
  const elapsed = started ? Math.min(7, Math.max(1, dayDiff(addDays(start, (week - 1) * 7), today) + 1)) : 7;

  const speakMin = totals.speakMin;
  const talkMin = totals.mayaMin;
  const activeDays = totals.activeDays;
  const speakTarget = phase.speakMin;
  const talkTarget = phase.mayaMin;
  const auto = Object.values(state.production).filter((p) => p.stage >= 3).length;
  const autoGoal = started ? autoTargetFor(planWeek) : 0;
  const topErrors = errorProfile(state.errorLog.slice(0, 80)).slice(0, 3);

  const retention = last7.retention;
  let selfRepair = last7.selfRepair;
  if (selfRepair === null) {
    // Sem medida diária suficiente: usa o histórico de consertos dos mesmos 7 dias.
    const from = addDays(today, -6);
    const recent = state.repairs.filter((r) => {
      const d = dayKey(new Date(r.at));
      return d >= from && d <= today;
    });
    if (recent.length >= 3) selfRepair = autonomy(recent).selfPct;
  }

  const pace = (speakTarget * elapsed) / 7;
  const verdict: WeekReview['verdict'] = !started
    ? 'sem-plano'
    : activeDays === 0
      ? 'parado'
      : speakMin >= pace * REVIEW_RULES.ahead
        ? 'adiantado'
        : speakMin >= pace * REVIEW_RULES.onPace
          ? 'no-ritmo'
          : 'atrasado';

  // Regras em ordem de prioridade: a primeira que dispara vira o foco.
  const advice: Advice[] = [];
  if (verdict === 'sem-plano') {
    advice.push({
      suggestion: 'Faça o checkpoint inicial de 8 minutos. Ele registra sua linha de base e inicia a contagem das 26 semanas do plano.',
      focus: 'Fazer o checkpoint inicial para começar o plano de 6 meses.',
    });
  }
  if (verdict === 'parado') {
    advice.push({
      suggestion: 'Nenhuma prática registrada nesta semana. Faça hoje um dia corrido de 5 minutos: uma fala livre de 1 minuto e cinco frases em voz alta.',
      focus: 'Voltar a praticar todos os dias, mesmo que por 5 minutos.',
    });
  }
  if (retention !== null && retention < REVIEW_RULES.retentionMin) {
    advice.push({
      suggestion: `Sua retenção está em ${retention}%. Revise as frases vencidas antes de abrir aula nova, até ela voltar a passar de 85%.`,
      focus: 'Revisar antes de aprender coisa nova, até a retenção passar de 85%.',
    });
  }
  if (started && activeDays > 0 && activeDays < minActiveDays(elapsed)) {
    advice.push({
      suggestion: `Você praticou em ${activeDays} de ${elapsed} dias. Nos dias cheios, faça um dia corrido de 5 minutos: frequência pesa mais que duração.`,
      focus: `Praticar em ${REVIEW_RULES.activeDaysGoal} dias da semana, usando o dia corrido de 5 minutos quando faltar tempo.`,
    });
  }
  if (verdict === 'atrasado') {
    advice.push({
      suggestion: `Você falou ${speakMin} de ${speakTarget} minutos da meta da semana. Faça um bloco de 10 minutos por dia de fluência ou reconto até fechar os ${Math.max(speakTarget - speakMin, 1)} que faltam.`,
      focus: `Chegar a ${speakTarget} minutos falando na semana, em blocos curtos todos os dias.`,
    });
  }
  const top = topErrors[0];
  if (top && top.count >= REVIEW_RULES.dominantError) {
    const title = ERROR_CATEGORIES[top.id]?.title ?? top.id;
    advice.push({
      suggestion: `Seu erro mais frequente é "${title}" (${top.count} vezes nas últimas práticas). Abra o treino dos erros e fale em voz alta as frases dessa estrutura.`,
      focus: `Reduzir o erro "${title}" com o treino dos erros.`,
    });
  }
  if (selfRepair !== null && selfRepair < REVIEW_RULES.selfRepairMin) {
    advice.push({
      suggestion: `Você consertou sem ver a resposta ${selfRepair}% dos erros apontados. Ainda é cedo para desligar a marcação ao vivo: use o treinador e peça a pista antes de abrir o modelo.`,
      focus: 'Consertar os próprios erros com a pista do treinador, sem pular para o modelo.',
    });
  }
  if (started && autoGoal - auto >= Math.max(5, autoGoal * 0.15)) {
    advice.push({
      suggestion: `Você tem ${auto} frases automáticas e a meta desta semana é ${autoGoal}. Priorize a escada: leve as frases já vistas até o degrau Falar antes de abrir aulas novas.`,
      focus: 'Subir frases na escada até o degrau Falar.',
    });
  }
  if (started && talkMin < ((talkTarget * elapsed) / 7) * REVIEW_RULES.onPace) {
    advice.push({
      suggestion: `Sua conversa está em ${talkMin} de ${talkTarget} minutos. Faça uma simulação por dia até fechar a meta.`,
      focus: 'Fazer uma simulação de conversa por dia.',
    });
  }
  if (!advice.length) {
    advice.push(
      verdict === 'adiantado'
        ? {
            suggestion: 'Você está acima da meta. Use a folga para subir a dificuldade: uma simulação mais longa ou a fluência 60, 45, 30 com um tema novo.',
            focus: 'Manter o ritmo e aumentar a dificuldade das conversas.',
          }
        : {
            suggestion: 'Você está no ritmo. Mantenha a rotina e inclua uma conversa mais longa nesta semana.',
            focus: 'Manter a rotina atual de prática.',
          },
    );
  }

  return {
    week,
    phaseTitle: phase.title,
    speakMin,
    speakTarget,
    talkMin,
    talkTarget,
    activeDays,
    retention,
    selfRepair,
    auto,
    autoTarget: autoGoal,
    topErrors,
    verdict,
    suggestions: advice.slice(0, MAX_SUGGESTIONS).map((a) => a.suggestion),
    focus: advice[0].focus,
  };
}

/** Para onde mandar o aluno primeiro (botão principal da revisão). */
export function nextAction(r: WeekReview): ReviewAction {
  if (r.verdict === 'sem-plano') return 'checkpoint';
  if (r.verdict === 'parado') return 'pratica';
  if (r.retention !== null && r.retention < REVIEW_RULES.retentionMin) return 'pratica';
  if (r.verdict === 'atrasado') return 'pratica';
  if (r.topErrors[0] && r.topErrors[0].count >= REVIEW_RULES.dominantError) return 'erros';
  if (r.talkMin < r.talkTarget) return 'simulacao';
  return 'pratica';
}
