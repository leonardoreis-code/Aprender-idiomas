import { useState } from 'react';
import { allDrills } from '../../content';
import { compare, reportText } from '../../domain/assessment/checkpoint';
import { dayKey } from '../../domain/motivation/motivation';
import { autoTarget, checkpointSchedule, endDay, nextCheckpoint, phaseOf, PHASES, PLAN_HOURS, PLAN_WEEKS, weekOf } from '../../domain/plan/sixMonths';
import { planWeekTotals, weekly } from '../../domain/progress/daily';
import { DataTable, LineChart, StackedBars } from '../components/Charts';
import type { Route } from '../router';
import { useStore } from '../store';
import { CheckpointReport } from './Checkpoint';

const brDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Evolução: plano de 6 meses + provas (checkpoints) + evidência contínua semanal. */
export function Evolution({ go }: { go: (r: Route) => void }) {
  const { state, toast } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const today = dayKey();
  const cps = state.checkpoints;
  const start = state.plan.startDay;
  const week = weekOf(start, today);
  const phase = phaseOf(Math.min(Math.max(week, 1), PLAN_WEEKS));
  const slots = checkpointSchedule(start, cps.map((c) => c.week), today);
  const next = nextCheckpoint(slots);
  const weeks = weekly(state.daily, today, 8);
  const auto = Object.values(state.production).filter((p) => p.stage >= 3).length;
  const wk = start && week >= 1 ? planWeekTotals(state.daily, start, Math.min(week, PLAN_WEEKS)) : { speakMin: 0, mayaMin: 0, activeDays: 0 };
  const base = cps[0];
  const last = cps[cps.length - 1];
  const delta = cps.length > 1 ? compare(base, last) : null;
  const opened = open ? cps.find((c) => c.id === open) : null;
  if (opened) return <><button className="link-btn back shell" onClick={() => setOpen(null)}>‹ Evolução</button><CheckpointReport result={opened} history={cps} /></>;

  const copy = async () => {
    const text = reportText(cps, state.profile.name);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Relatório copiado', kind: 'info' });
    } catch {
      toast({ title: 'Não consegui copiar', body: 'Abra o relatório abaixo e selecione o texto.', kind: 'info' });
    }
  };

  return (
    <main className="shell evolution" id="main">
      <h1 className="page-title">Evolução</h1>

      {/* ---------- plano ---------- */}
      <section className="card plan-card">
        {start ? (
          <>
            <div className="row-between">
              <div>
                <span className="ex-kicker">Plano de 6 meses · semana {Math.min(week, PLAN_WEEKS)} de {PLAN_WEEKS}</span>
                <h2 className="card-h">Fase {phase.id}: {phase.title}</h2>
              </div>
              <small className="muted">termina em {brDate(endDay(start))}/{endDay(start).slice(0, 4)}</small>
            </div>
            <PlanTimeline week={week} slots={slots} />
            <p className="muted" style={{ marginTop: 4 }}>{phase.focus}</p>
            <div className="plan-goals">
              <Goal label="Minutos falando nesta semana" value={wk.speakMin} target={phase.speakMin} unit="min" />
              <Goal label="Conversa (treinador ou Maya) nesta semana" value={wk.mayaMin} target={phase.mayaMin} unit="min" />
              <Goal label="Frases automáticas (degrau Falar ou acima)" value={auto} target={autoTarget(Math.min(week, PLAN_WEEKS))} unit="" />
              <Goal label="Dias ativos nesta semana" value={wk.activeDays} target={6} unit="" />
            </div>
            <details>
              <summary>O que fazer nesta fase</summary>
              <ul className="outline">{phase.content.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="muted"><b>Ao final:</b> {phase.outcome}</p>
            </details>
          </>
        ) : (
          <>
            <span className="ex-kicker">Plano de 6 meses</span>
            <h2 className="card-h">Seu plano começa com o primeiro checkpoint</h2>
            <p className="muted">São {PLAN_WEEKS} semanas em 4 fases, com cerca de {PLAN_HOURS} horas de prática ativa (perto de 1 hora por dia, 6 dias por semana). A cada 4 semanas você refaz o teste de fala e vê a diferença.</p>
            <ol className="phase-list">{PHASES.map((p) => <li key={p.id}><b>Semanas {p.from}–{p.to} · {p.title}.</b> {p.outcome}</li>)}</ol>
          </>
        )}
        {next && (
          <div className={`cp-cta ${next.status === 'due' ? 'due' : ''}`}>
            <span>
              {next.status === 'due'
                ? cps.length === 0 ? 'Faça agora o checkpoint inicial (8 min): ele define sua linha de base.' : `Checkpoint da semana ${next.week} liberado.`
                : `Próximo checkpoint: semana ${next.week}${start ? ` (por volta de ${brDate(dayKey(new Date(new Date(start + 'T12:00:00').getTime() + next.week * 7 * 86_400_000)))})` : ''}.`}
            </span>
            <button className="btn btn-ghost" onClick={() => go({ name: 'weekly' })}>Revisão da semana</button>
            <button className={`btn ${next.status === 'due' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => go({ name: 'checkpoint' })}>{next.status === 'due' ? 'Fazer checkpoint' : 'Fazer um extra agora'}</button>
          </div>
        )}
      </section>

      {/* ---------- provas ---------- */}
      <section className="card">
        <div className="row-between">
          <h2 className="card-h">Prova de aprendizado: checkpoints de fala</h2>
          {cps.length > 0 && <button className="btn btn-ghost" onClick={copy}>Copiar relatório</button>}
        </div>
        {cps.length === 0 ? (
          <p className="muted">Nenhum checkpoint ainda. Sem linha de base não há como provar evolução: faça o primeiro hoje.</p>
        ) : (
          <>
            {delta ? (
              <p className="evo-headline">
                Índice de fala: <b>{base.index}</b> → <b>{last.index}</b> <span className={`cp-chip ${delta.index >= 0 ? 'up' : 'down'}`}>{delta.index >= 0 ? '▲ +' : '▼ '}{delta.index}</span> em {cps.length} checkpoints.
                {!delta.comparable && <small className="muted"> Modalidades diferentes: comparação aproximada.</small>}
              </p>
            ) : (
              <p className="evo-headline">Linha de base registrada: índice <b>{base.index}</b>. O segundo checkpoint mostra a primeira diferença.</p>
            )}
            <div className="chart-grid">
              <div><h3>Índice de fala (0–100)</h3><LineChart title="Índice de fala" points={cps.map((c) => ({ label: brDate(c.day), value: c.index, note: `forma ${c.form}` }))} yMin={0} yMax={100} lowerIsBetter={false} /></div>
              <div><h3>Precisão em frases novas (%)</h3><LineChart title="Precisão" unit="%" points={cps.map((c) => ({ label: brDate(c.day), value: Math.round(c.accuracy * 100) }))} yMin={0} yMax={100} lowerIsBetter={false} /></div>
              <div><h3>Segundos por palavra</h3><LineChart title="Segundos por palavra" unit="s" points={cps.map((c) => ({ label: brDate(c.day), value: c.secPerWord || null }))} yMin={0} lowerIsBetter /></div>
              <div><h3>Palavras por minuto na fala livre</h3><LineChart title="Palavras por minuto" points={cps.map((c) => ({ label: brDate(c.day), value: c.wpm || null }))} yMin={0} lowerIsBetter={false} /></div>
            </div>
            <DataTable
              summary="Ver checkpoints como tabela"
              head={['Data', 'Semana', 'Forma', 'Modo', 'Índice', 'Precisão', 's/palavra', 'Palavras/min']}
              rows={cps.map((c) => [c.day, c.week, c.form, c.modality, c.index, `${Math.round(c.accuracy * 100)}%`, c.secPerWord, c.wpm])}
            />
            <div className="row" style={{ marginTop: 8 }}>
              {cps.map((c) => <button key={c.id} className="chip" onClick={() => setOpen(c.id)}>{brDate(c.day)} · {c.index}</button>)}
            </div>
          </>
        )}
      </section>

      {/* ---------- evidência contínua ---------- */}
      <section className="card">
        <h2 className="card-h">Entre um checkpoint e outro</h2>
        <p className="muted">Medidas automáticas da sua prática, por semana. Nada aqui é autodeclarado.</p>
        <div className="chart-grid">
          <div>
            <h3>Minutos falando por semana</h3>
            <StackedBars title="Minutos falando por semana" unit=" min" names={['Frases e fala livre', 'Treinador e Maya']} target={start ? phase.speakMin + phase.mayaMin : undefined}
              data={weeks.map((w) => ({ label: w.label, a: w.speakMin, b: w.mayaMin }))} />
          </div>
          <div>
            <h3>Retenção real (%)</h3>
            <LineChart title="Retenção" unit="%" points={weeks.map((w) => ({ label: w.label, value: w.retention }))} yMin={0} yMax={100} lowerIsBetter={false} />
            <p className="fine">Frases vencidas que saíram certas na primeira tentativa. A meta é ficar perto de 85–90%.</p>
          </div>
          <div>
            <h3>Autocorreção (%)</h3>
            <LineChart title="Autocorreção" unit="%" points={weeks.map((w) => ({ label: w.label, value: w.selfRepair }))} yMin={0} yMax={100} lowerIsBetter={false} />
            <p className="fine">Erros apontados pelo treinador que você consertou sem ver a resposta. Subir aqui significa precisar de menos ajuda para o mesmo erro.</p>
          </div>
          <div>
            <h3>Tempo para começar a responder (s)</h3>
            <LineChart title="Tempo de resposta" unit="s" points={weeks.map((w) => ({ label: w.label, value: w.latency }))} yMin={0} lowerIsBetter />
            <p className="fine">Medido no treino Resposta rápida. Em conversa real, começar em até 2 segundos soa natural.</p>
          </div>
          <div>
            <h3>Pausas longas por minuto de fala</h3>
            <LineChart title="Pausas longas por minuto" points={weeks.map((w) => ({ label: w.label, value: w.pausesPerMin }))} yMin={0} lowerIsBetter />
            <p className="fine">Pausas acima de 1,5 s no treinador, nas simulações, no reconto e na fluência. Valor aproximado: depende do ritmo do reconhecedor de fala.</p>
          </div>
          <div>
            <h3>Segundos por palavra nas frases faladas</h3>
            <LineChart title="Segundos por palavra na prática" unit="s" points={weeks.map((w) => ({ label: w.label, value: w.secPerWord }))} yMin={0} lowerIsBetter />
          </div>
          <div>
            <h3>Frases automáticas (acumulado)</h3>
            <LineChart title="Frases automáticas" points={weeks.map((w) => ({ label: w.label, value: w.auto }))} yMin={0} lowerIsBetter={false} />
            <p className="fine">{auto} de {allDrills.length + state.custom.length} frases no degrau Falar ou Relâmpago.</p>
          </div>
        </div>
        <DataTable
          summary="Ver semanas como tabela"
          head={['Semana de', 'Min falando', 'Min de conversa', 'Frases faladas', 'Retenção', 'Autocorreção', 's/palavra', 'Palavras/min', 'Resposta (s)', 'Pausas/min', 'Dias ativos']}
          rows={weeks.map((w) => [w.label, w.speakMin, w.mayaMin, w.spoken, w.retention === null ? '—' : `${w.retention}%`, w.selfRepair === null ? '—' : `${w.selfRepair}%`, w.secPerWord ?? '—', w.wpm ?? '—', w.latency ?? '—', w.pausesPerMin ?? '—', w.activeDays])}
        />
      </section>

      <section className="card">
        <h2 className="card-h">Prova externa (recomendado)</h2>
        <ul className="outline">
          <li><b>Grave 2 minutos no celular hoje</b> respondendo "Tell me about yourself and your work". Regrave a mesma pergunta nos meses 3 e 6 e compare. É a prova que qualquer pessoa entende.</li>
          <li><b>Faça um teste oral externo</b> no início e no fim, com avaliador que não seja este app. O índice daqui serve para acompanhar a tendência, não para colocar no currículo.</li>
          <li><b>Marque uma conversa real por mês</b> com alguém que fale inglês (colega, professor, entrevista simulada) e anote: quantas vezes precisou voltar ao português.</li>
        </ul>
      </section>
    </main>
  );
}

function Goal({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="goal">
      <div className="row-between"><span>{label}</span><b>{value}{unit && ` ${unit}`} <span className="muted">/ {target}{unit && ` ${unit}`}</span></b></div>
      <div className="qbar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(value, target)}><span style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--ok)' : 'var(--viz-1)' }} /></div>
    </div>
  );
}

/** Linha do tempo das 26 semanas: fases, posição atual e checkpoints. */
function PlanTimeline({ week, slots }: { week: number; slots: { week: number; status: string }[] }) {
  const W = 340;
  const x = (w: number) => 8 + (w / PLAN_WEEKS) * (W - 16);
  return (
    <svg viewBox={`0 0 ${W} 54`} width="100%" role="img" aria-label={`Semana ${Math.min(week, PLAN_WEEKS)} de ${PLAN_WEEKS}. Checkpoints feitos: ${slots.filter((s) => s.status === 'done').length} de ${slots.length}.`}>
      {PHASES.map((p) => (
        <g key={p.id}>
          <rect x={x(p.from - 1) + 1} y={14} width={x(p.to) - x(p.from - 1) - 2} height={10} rx={3} fill={week > p.to ? 'var(--viz-1)' : 'var(--surface-2)'} />
          {week >= p.from && week <= p.to && <rect x={x(p.from - 1) + 1} y={14} width={Math.max(4, x(Math.min(week, p.to)) - x(p.from - 1) - 2)} height={10} rx={3} fill="var(--viz-1)" />}
          <text x={(x(p.from - 1) + x(p.to)) / 2} y={9} fontSize="9" textAnchor="middle" fill="var(--ink-3)">Fase {p.id}</text>
        </g>
      ))}
      {slots.map((s) => (
        <g key={s.week}>
          <circle cx={x(s.week)} cy={19} r={5} fill={s.status === 'done' ? 'var(--ok)' : s.status === 'due' ? 'var(--sticky)' : 'var(--surface)'} stroke="var(--ink-2)" strokeWidth="1.5" />
          {s.week !== 24 && <text x={x(s.week)} y={40} fontSize="9" textAnchor={s.week === 0 ? 'start' : s.week === PLAN_WEEKS ? 'end' : 'middle'} fill="var(--ink-3)">{s.week === 0 ? 'base' : s.week === PLAN_WEEKS ? 'fim' : `S${s.week}`}</text>}
        </g>
      ))}
      <text x={W / 2} y={52} fontSize="9" textAnchor="middle" fill="var(--ink-3)">● checkpoints de fala</text>
    </svg>
  );
}
