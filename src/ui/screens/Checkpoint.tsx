import { useEffect, useRef, useState } from 'react';
import { ALL_FORMS, applyJudgement, compare, nextForm, scoreFree, scoreItem, summarize, type CheckpointResult, type FreeResult, type ItemResult } from '../../domain/assessment/checkpoint';
import { CATEGORY_LABEL } from '../../domain/assessment/forms';
import { dayKey } from '../../domain/motivation/motivation';
import { checkpointSchedule, nextCheckpoint, weekOf } from '../../domain/plan/sixMonths';
import { judgeCheckpoint, llmAvailable } from '../../infra/llm';
import type { Recording } from '../../infra/recorder';
import { stopAudio } from '../../infra/audio';
import { MicButton, micAvailable } from '../components/Mic';
import { CheckIcon, CloseIcon, XIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

const FREE_SECONDS = 45;

/**
 * Checkpoint de fala: condições de prova. Sem dica, sem áudio do alvo, sem
 * feedback entre os itens (o gabarito só aparece no fim).
 */
export function CheckpointScreen({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const history = store.state.checkpoints;
  const [form] = useState(() => nextForm(history));
  const [phase, setPhase] = useState<'intro' | 'items' | 'free' | 'scoring' | 'result'>('intro');
  const [i, setI] = useState(0);
  const [items, setItems] = useState<ItemResult[]>([]);
  const [free, setFree] = useState<FreeResult[]>([]);
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [useVoice, setUseVoice] = useState(micAvailable());
  const today = dayKey();
  const start = store.state.plan.startDay;
  const slot = nextCheckpoint(checkpointSchedule(start, history.map((c) => c.week), today));
  const week = history.length === 0 ? 0 : slot?.status === 'due' ? slot.week : Math.max(0, weekOf(start, today) - 1);

  useEffect(() => () => stopAudio(), []);

  const finishing = useRef(false);
  const finish = async (all: ItemResult[], allFree: FreeResult[]) => {
    if (finishing.current) return;
    finishing.current = true;
    setPhase('scoring');
    let r = summarize(form.id, all, allFree, { at: Date.now(), day: today, week });
    if (llmAvailable()) {
      const toJudge = all.filter((x) => x.verdict === 'wrong' && x.said.trim()).map((x) => ({ id: x.id, said: x.said, pt: form.items.find((f) => f.id === x.id)!.pt, refs: form.items.find((f) => f.id === x.id)!.en }));
      const j = await judgeCheckpoint(toJudge, allFree.map((f) => ({ prompt: f.prompt, text: f.text })));
      if (j) r = applyJudgement(r, j.accepted, j.rubric);
    }
    store.set((s) => ({ ...s, checkpoints: [...s.checkpoints, r], plan: { startDay: s.plan.startDay ?? today } }));
    store.logDay({ spokenSec: allFree.filter((f) => f.words > 0).reduce((a, f) => a + Math.min(f.ms, FREE_SECONDS * 1000), 0) / 1000 + all.filter((x) => x.spoken && x.said).reduce((a, x) => a + (x.totalMs - x.thinkMs), 0) / 1000, spoken: all.filter((x) => x.spoken && x.said).length });
    store.gainXp(50);
    setResult(r);
    setPhase('result');
  };

  const answerItem = (res: ItemResult) => {
    const all = [...items, res];
    setItems(all);
    if (i + 1 < form.items.length) setI(i + 1);
    else {
      setI(0);
      setPhase('free');
    }
  };
  const answerFree = (res: FreeResult) => {
    if (finishing.current) return;
    const all = [...free, res];
    setFree(all);
    if (all.length < form.prompts.length) setI(i + 1);
    else void finish(items, all);
  };

  if (phase === 'intro')
    return (
      <main className="shell checkpoint" id="main">
        <span className="ex-kicker">Checkpoint de fala · {history.length === 0 ? 'linha de base' : `semana ${week}`} · forma {form.id}</span>
        <h1 className="page-title">{history.length === 0 ? 'Vamos medir de onde você parte' : 'Hora de medir sua evolução'}</h1>
        <p className="lead">São cerca de 8 minutos. O resultado vira um ponto no seu gráfico: é assim que você comprova que está falando melhor, e não só usando o app.</p>
        <ol className="cp-rules">
          <li><b>12 frases em português</b> para dizer em inglês. Nenhuma delas existe nas aulas: mede se você consegue montar frases novas.</li>
          <li><b>2 falas livres de {FREE_SECONDS} segundos</b> sobre o seu trabalho e a sua vida.</li>
          <li><b>Regras de prova:</b> sem dicionário, sem tradutor, sem dica e sem correção durante o teste. Não sabe? Diga o que conseguir ou pule.</li>
          <li>O tempo conta. O relógio começa quando a frase aparece.</li>
        </ol>
        {!micAvailable() && <p className="tip">Seu navegador não tem microfone disponível aqui. Você pode fazer digitando, mas o resultado fica marcado como "digitado" e não mede fala.</p>}
        {micAvailable() && (
          <label className="cp-mode">
            <input type="checkbox" checked={!useVoice} onChange={(e) => setUseVoice(!e.target.checked)} /> Não posso falar agora: fazer digitando (o resultado fica marcado como "digitado")
          </label>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={() => setPhase('items')}>Começar o checkpoint</button>
          <button className="btn btn-ghost" onClick={() => go({ name: 'evolution' })}>Agora não</button>
        </div>
      </main>
    );

  if (phase === 'items' || phase === 'free') {
    const total = form.items.length + form.prompts.length;
    const pos = phase === 'items' ? i : form.items.length + free.length;
    return (
      <div className="session">
        <header className="session-top">
          <button className="icon-btn" onClick={() => go({ name: 'evolution' })} aria-label="Abandonar o checkpoint"><CloseIcon /></button>
          <div className="progress" role="progressbar" aria-label="Checkpoint" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos}>
            <span style={{ width: `${Math.max((pos / total) * 100, 3)}%` }} />
          </div>
          <div className="combo" style={{ color: 'var(--ink-2)' }}>{pos + 1}/{total}</div>
        </header>
        <main className="stage" id="main">
          {phase === 'items' ? (
            <ItemStep key={form.items[i].id} pt={form.items[i].pt} voice={useVoice} onDone={(said, timing, spoken) => answerItem(scoreItem(form.items[i], said, timing, spoken))} />
          ) : (
            <FreeStep key={free.length} prompt={form.prompts[free.length]} voice={useVoice} onDone={(text, ms) => answerFree(scoreFree(form.prompts[free.length].en, text, ms, FREE_SECONDS * 1000))} />
          )}
        </main>
      </div>
    );
  }

  if (phase === 'scoring' || !result)
    return (
      <main className="complete" id="main">
        <div><span className="spinner" aria-hidden /> <p role="status">Calculando seu resultado…</p></div>
      </main>
    );

  const first = store.state.checkpoints.length <= 1;
  return <CheckpointReport result={result} history={store.state.checkpoints} continueLabel={first ? 'Seguir para o roteiro de hoje' : 'Ver minha evolução'} onContinue={() => go(first ? { name: 'home' } : { name: 'evolution' })} />;
}

function ItemStep({ pt, voice, onDone }: { pt: string; voice: boolean; onDone: (said: string, timing: { totalMs: number; thinkMs: number }, spoken: boolean) => void }) {
  const t0 = useRef(Date.now());
  const firstKey = useRef(0);
  const [val, setVal] = useState('');
  return (
    <section aria-labelledby="cp-h">
      <p className="ex-kicker">Diga em inglês</p>
      <h1 id="cp-h" className="ex-title pt-prompt">{pt}</h1>
      {voice ? (
        <MicButton
          maxMs={15000}
          label="Falar a frase em inglês"
          onResult={(r: Recording) => {
            const thinkMs = Math.max(0, r.startedAt - t0.current);
            onDone(r.text, { thinkMs, totalMs: thinkMs + r.durationMs }, true);
          }}
        />
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); const total = Date.now() - t0.current; onDone(val, { totalMs: total, thinkMs: firstKey.current ? firstKey.current - t0.current : total }, false); }}>
          <label htmlFor="cp-in" className="sr-only">Sua resposta em inglês</label>
          <input id="cp-in" className="text-input" lang="en" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false} value={val}
            onChange={(e) => { if (!firstKey.current) firstKey.current = Date.now(); setVal(e.target.value); }} placeholder="Escreva em inglês…" />
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={!val.trim()}>Próxima</button>
        </form>
      )}
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button type="button" className="link-btn" onClick={() => onDone('', { totalMs: Date.now() - t0.current, thinkMs: Date.now() - t0.current }, voice)}>Não sei — pular</button>
      </div>
    </section>
  );
}

function FreeStep({ prompt, voice, onDone }: { prompt: { en: string; pt: string }; voice: boolean; onDone: (text: string, ms: number) => void }) {
  const [val, setVal] = useState('');
  const [left, setLeft] = useState(FREE_SECONDS);
  const started = useRef(0);
  useEffect(() => {
    if (voice) return;
    const id = setInterval(() => {
      if (!started.current) return;
      const l = Math.max(0, FREE_SECONDS - Math.round((Date.now() - started.current) / 1000));
      setLeft(l);
    }, 500);
    return () => clearInterval(id);
  }, [voice]);
  return (
    <section aria-labelledby="cp-f">
      <p className="ex-kicker">Fala livre · {FREE_SECONDS} segundos</p>
      <h1 id="cp-f" className="ex-title" lang="en">{prompt.en}</h1>
      <p className="muted">{prompt.pt}</p>
      <p className="tip">Fale sem parar até o tempo acabar. Errar não tira ponto de fluência: travar tira.</p>
      {voice ? (
        <MicButton maxMs={FREE_SECONDS * 1000} label="Começar a falar" onResult={(r: Recording) => onDone(r.text, r.durationMs)} />
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); onDone(val, started.current ? Date.now() - started.current : FREE_SECONDS * 1000); }}>
          <label htmlFor="cp-free" className="sr-only">Sua resposta</label>
          <textarea id="cp-free" className="text-input" lang="en" rows={5} value={val} onChange={(e) => { if (!started.current) started.current = Date.now(); setVal(e.target.value); }} placeholder="Escreva em inglês, sem parar…" />
          <div className="row-between" style={{ marginTop: 10 }}>
            <span className="muted">{left}s</span>
            <button className="btn btn-primary" disabled={!val.trim()}>Enviar</button>
          </div>
        </form>
      )}
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button type="button" className="link-btn" onClick={() => onDone('', FREE_SECONDS * 1000)}>Pular esta fala</button>
      </div>
    </section>
  );
}

const sign = (n: number, digits = 0) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(digits).replace(/\.?0+$/, '') || '0'}`;

export function CheckpointReport({ result, history, onContinue, continueLabel = 'Ver minha evolução' }: { result: CheckpointResult; history: CheckpointResult[]; onContinue?: () => void; continueLabel?: string }) {
  const idx = history.findIndex((c) => c.id === result.id);
  const base = history[0] && history[0].id !== result.id ? history[0] : null;
  const prev = idx > 0 ? history[idx - 1] : null;
  const d = base ? compare(base, result) : null;
  const form = ALL_FORMS.find((f) => f.id === result.form)!;
  const prevCats = prev ? Object.fromEntries(prev.items.map((x) => [x.cat, x.verdict !== 'wrong'])) : null;
  return (
    <main className="shell checkpoint" id="main">
      <h1 className="sr-only">Resultado do checkpoint de fala</h1>
      <span className="ex-kicker">Resultado · {result.day} · semana {result.week} · forma {result.form} · {result.modality}</span>
      <div className="cp-hero">
        <div>
          <p className="cp-index">{result.index}<small>/100</small></p>
          <p className="muted" style={{ margin: 0 }}>Índice de fala</p>
        </div>
        {d ? (
          <p className="cp-delta">
            <b className={d.index >= 0 ? 'up' : 'down'}>{sign(d.index)} pontos</b> desde a linha de base ({base!.day}).
            {!d.comparable && <small> Modalidades diferentes (voz × digitado): comparação aproximada.</small>}
          </p>
        ) : (
          <p className="cp-delta">Esta é a sua <b>linha de base</b>. Todo progresso vai ser medido contra ela.</p>
        )}
      </div>

      <div className="cp-tiles">
        <Tile label="Precisão" value={`${Math.round(result.accuracy * 100)}%`} sub="frases novas certas" delta={d ? `${sign(d.accuracyPts)} pts` : undefined} good={d ? d.accuracyPts >= 0 : undefined} />
        <Tile label="Velocidade" value={result.secPerWord ? `${result.secPerWord}s` : '—'} sub="por palavra (menor é melhor)" delta={d && result.secPerWord && base!.secPerWord ? `${sign(d.secPerWord, 2)}s` : undefined} good={d ? d.secPerWord <= 0 : undefined} />
        <Tile label="Fluência" value={result.wpm ? String(result.wpm) : '—'} sub="palavras por minuto" delta={d && result.wpm && base!.wpm ? sign(d.wpm) : undefined} good={d ? d.wpm >= 0 : undefined} />
      </div>
      {result.thinkSec > 0 && <p className="muted">Tempo mediano para começar a falar: <b>{result.thinkSec}s</b>.</p>}

      {result.rubric && (result.rubric.cefr || result.rubric.comment) && (
        <section className="card">
          <h2 className="card-h">Avaliação da fala livre (Claude)</h2>
          <p style={{ margin: 0 }}>
            {result.rubric.cefr && <>Nível sugerido pelas amostras: <b>{result.rubric.cefr}</b>. </>}
            {result.rubric.errorsPer100 !== undefined && <>Erros de gramática: <b>{result.rubric.errorsPer100}</b> a cada 100 palavras. </>}
          </p>
          {result.rubric.comment && <p className="muted" style={{ marginBottom: 0 }}>{result.rubric.comment}</p>}
          <p className="fine">Estimativa a partir de duas amostras curtas. Não substitui um exame oficial.</p>
        </section>
      )}

      <section className="card">
        <h2 className="card-h">Por estrutura</h2>
        <ul className="cp-cats">
          {result.items.map((it) => {
            const ok = it.verdict !== 'wrong';
            const was = prevCats ? prevCats[it.cat] : undefined;
            return (
              <li key={it.id} className={ok ? 'ok' : 'bad'}>
                <span className="cp-mark" aria-hidden>{ok ? <CheckIcon size={16} /> : <XIcon size={16} />}</span>
                <span>{CATEGORY_LABEL[it.cat]}<span className="sr-only">: {ok ? 'certo' : 'errado'}</span></span>
                {was !== undefined && was !== ok && <small className="badge">{ok ? 'ganhou' : 'perdeu'}</small>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2 className="card-h">Gabarito</h2>
        <ol className="cp-key">
          {result.items.map((it) => {
            const f = form.items.find((x) => x.id === it.id)!;
            return (
              <li key={it.id} className={it.verdict === 'wrong' ? 'bad' : 'ok'}>
                <span className="muted">{f.pt}</span>
                <span lang="en"><span className="tag">Você</span> <span className={it.verdict === 'wrong' ? 'word-miss' : 'word-ok'}>{it.said || '(pulou)'}</span>{it.judged ? ' · aceita pelo avaliador' : ''} <small className="muted">· {(it.totalMs / 1000).toFixed(1)}s</small></span>
                {it.verdict !== 'correct' && <span lang="en"><span className="tag">Natural</span> <b>{f.en[0]}</b></span>}
              </li>
            );
          })}
        </ol>
        {result.free.map((f, k) => (
          <p key={k} className="muted"><b>Fala livre {k + 1}:</b> {f.words} palavras em {Math.round(f.ms / 1000)}s ({f.wpm} por minuto). <span lang="en">“{f.text || '—'}”</span></p>
        ))}
      </section>

      <p className="fine">Como o índice é calculado: 45% precisão, 25% velocidade (só nas frases certas), 30% fluência (palavras na janela inteira de 45 s), com faixas fixas. As 12 frases nunca aparecem nas aulas e as formas A a F se revezam. É uma medida interna consistente, não um certificado.</p>
      {onContinue && <button className="btn btn-primary" onClick={onContinue}>{continueLabel}</button>}
    </main>
  );
}

function Tile({ label, value, sub, delta, good }: { label: string; value: string; sub: string; delta?: string; good?: boolean }) {
  return (
    <div className="cp-tile">
      <span className="tag">{label}</span>
      <b>{value}</b>
      <small className="muted">{sub}</small>
      {delta && <small className={`cp-chip ${good ? 'up' : 'down'}`}>{good ? '▲' : '▼'} {delta} vs. base</small>}
    </div>
  );
}
