import { useEffect, useMemo, useRef, useState } from 'react';
import { ERROR_LESSONS, findSpeakingLesson } from '../../content';
import { checkFix, dueErrors, resolvedCount, reviewError, type ErrorCard } from '../../domain/coach/errorBank';
import { MUTE_AFTER, mutedFrom, ruleInfo } from '../../domain/coach/spotter';
import type { SpeakingLesson } from '../../domain/curriculum/speaking';
import { checkTyped } from '../../domain/practice/answer';
import { ERROR_CATEGORIES } from '../../domain/production/errors';
import { speak, stopAudio } from '../../infra/audio';
import { liveAvailable, startLive, type LiveSession } from '../../infra/live';
import { defaultState, type AppState } from '../../infra/storage';
import { sfxComplete, sfxCorrect, sfxWrong } from '../../infra/sfx';
import { BackIcon, BulbIcon, MicIcon, SpeakerIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';

/* ------------------------------------------------------------------ */
/* Conserte seus erros: revisão espaçada dos erros reais da sua fala    */
/* ------------------------------------------------------------------ */
export function ErrorReview({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const bank = store.state.errorBank;
  const [queue] = useState<ErrorCard[]>(() => dueErrors(bank, Date.now(), 10));
  const [i, setI] = useState(0);
  const [live, setLive] = useState('');
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(!liveAvailable());
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; said: string } | null>(null);
  const [okCount, setOkCount] = useState(0);
  const sess = useRef<LiveSession | null>(null);
  const card = queue[i];
  useEffect(() => () => { sess.current?.stop(); stopAudio(); }, []);

  const answer = (said: string, ms: number, spoken: boolean) => {
    const ok = checkFix(card, said);
    setRes({ ok, said });
    store.set((s) => ({ ...s, errorBank: reviewError(s.errorBank, card.id, ok, hint) }));
    if (spoken) { store.logDay({ spokenSec: ms / 1000, spoken: 1 }); store.track('spoken'); }
    if (ok) { sfxCorrect(2); setOkCount((n) => n + 1); void speak(card.context); } else sfxWrong();
  };
  const listen = () => {
    if (sess.current) return sess.current.stop();
    setLive('');
    setListening(true);
    const s = startLive({ onText: setLive, silenceMs: 2200, maxMs: 20000 });
    sess.current = s;
    void s.done.then(({ text, ms }) => { sess.current = null; setListening(false); if (text.trim()) answer(text, ms, true); });
  };
  const next = () => {
    setRes(null); setHint(false); setLive(''); setTyped('');
    if (i + 1 >= queue.length) { sfxComplete(); store.gainXp(10 + okCount * 4); setI(queue.length); } else setI(i + 1);
  };

  if (!queue.length || i >= queue.length)
    return (
      <main className="shell" id="main">
        <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Falar</button>
        <h1 className="page-title">{queue.length ? 'Revisão concluída' : 'Nenhum erro para revisar agora'}</h1>
        {queue.length > 0 && <p className="lead">Você consertou <b>{okCount} de {queue.length}</b>. Os que errou voltam ainda hoje; os que acertou voltam em alguns dias.</p>}
        <div className="cp-tiles" style={{ marginTop: 12 }}>
          <div className="cp-tile"><span className="tag">No banco</span><b>{bank.length}</b><small className="muted">erros reais da sua fala</small></div>
          <div className="cp-tile"><span className="tag">Resolvidos</span><b>{resolvedCount(store.state.errorBank)}</b><small className="muted">revisão a 7 dias ou mais</small></div>
          <div className="cp-tile"><span className="tag">Para hoje</span><b>{dueErrors(store.state.errorBank).length}</b><small className="muted">vencidos agora</small></div>
        </div>
        <p className="muted">O banco se enche sozinho: todo erro marcado no treinador ao vivo, nas simulações e no reconto entra aqui e volta com repetição espaçada.</p>
        <div className="row"><button className="btn btn-primary" onClick={() => go({ name: 'missions' })}>Fazer uma simulação</button><button className="btn btn-ghost" onClick={() => go({ name: 'teacher' })}>Treinador ao vivo</button></div>
      </main>
    );

  const lessonId = ERROR_LESSONS[card.cat]?.[0];
  const lesson = lessonId ? findSpeakingLesson(lessonId) : undefined;
  const parts = card.wrongContext.split(card.wrong);
  return (
    <main className="shell" id="main">
      <div className="row-between">
        <button className="link-btn back" onClick={() => go({ name: 'lab' })}><BackIcon /> Sair</button>
        <small className="muted">{i + 1} de {queue.length} · {ERROR_CATEGORIES[card.cat]?.title ?? 'Erro'}{card.seen > 1 ? ` · apareceu ${card.seen} vezes` : ''}</small>
      </div>
      <h1 className="page-title">Conserte o que você disse</h1>
      <section className="card stack">
        <span className="tag">Você disse</span>
        <p className="live-text" lang="en">{parts.length > 1 ? <>{parts[0]}<mark className="live-miss">{card.wrong}</mark>{parts.slice(1).join(card.wrong)}</> : card.wrongContext}</p>
        {!res && (
          <>
            <p className="muted" style={{ margin: 0 }}>Diga o trecho de novo, do jeito certo.</p>
            {hint && <p className="tip"><BulbIcon /> <span>{card.explain}</span></p>}
            {typing ? (
              <form className="row" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) answer(typed.trim(), 3000, false); }}>
                <input className="text-input" style={{ flex: 1 }} lang="en" autoFocus autoComplete="off" autoCapitalize="off" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Trecho corrigido" placeholder="Escreva o trecho corrigido" />
                <button className="btn btn-primary" disabled={!typed.trim()}>Verificar</button>
              </form>
            ) : (
              <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                <button className={`mic ${listening ? 'listening' : ''}`} onClick={listen} aria-label={listening ? 'Terminei' : 'Dizer o trecho corrigido'}><MicIcon size={44} /></button>
                {live && <p className="live-text small" lang="en" aria-live="polite">{live}</p>}
              </div>
            )}
            <div className="row" style={{ justifyContent: 'center' }}>
              {!hint && <button className="chip" onClick={() => setHint(true)}>Ver a regra</button>}
              {liveAvailable() && !listening && <button className="chip" onClick={() => setTyping(!typing)}>{typing ? 'Falar' : 'Digitar'}</button>}
              <button className="chip" onClick={() => { store.reportFp(card.rule); next(); }}>Não era erro</button>
            </div>
          </>
        )}
        {res && (
          <div aria-live="assertive" className="stack">
            <p className={res.ok ? 'word-ok' : 'word-miss'} style={{ fontSize: '1.1rem', margin: 0 }}>{res.ok ? (hint ? 'Certo, com a regra.' : 'Certo, sem ajuda.') : `Ainda não. Você disse: "${res.said}"`}</p>
            <div className="better-box">
              <span className="tag">Forma correta</span>
              <p lang="en" style={{ margin: '4px 0', fontWeight: 700 }}>{card.context} <button className="icon-btn inline" onClick={() => speak(card.context)} aria-label="Ouvir"><SpeakerIcon size={16} /></button></p>
              <small>{card.explain}</small>
            </div>
            {lesson && !res.ok && <button className="link-btn" onClick={() => go({ name: 'lesson', id: lesson.id })}>Ver a aula que explica isso: {lesson.title}</button>}
            <button className="btn btn-primary" autoFocus onClick={next}>{i + 1 >= queue.length ? 'Ver resultado' : 'Próximo'}</button>
          </div>
        )}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Tente antes: 3 frases ANTES da explicação (efeito do pré-teste)      */
/* ------------------------------------------------------------------ */
export const PRETEST_INDEXES = [2, 6, 10];

export function Pretest({ lesson }: { lesson: SpeakingLesson }) {
  const store = useStore();
  const p = store.state.lessons[lesson.id] ?? {};
  const items = useMemo(() => PRETEST_INDEXES.map((k) => lesson.drills[k]).filter(Boolean), [lesson]);
  const [vals, setVals] = useState<string[]>(() => items.map(() => ''));
  const [done, setDone] = useState<boolean[] | null>(null);

  if (p.pre !== undefined && !done) {
    return (
      <section className="card pretest">
        <span className="ex-kicker">Antes e depois</span>
        <p style={{ margin: '4px 0 0' }}>
          Antes da aula você acertou <b>{p.pre} de {items.length}</b>.{' '}
          {p.post !== undefined ? <>Depois da prática: <b>{p.post} de {items.length}</b>{p.post > p.pre ? '. Mesma tarefa, sem ajuda: esse ganho é real (de curto prazo; a revisão dirá se fica).' : '.'}</> : 'Faça a prática para ver o depois.'}
        </p>
      </section>
    );
  }
  const submit = () => {
    const r = items.map((d, k) => checkTyped(vals[k], [d.en, ...(d.alt ?? [])]) !== 'wrong');
    setDone(r);
    store.set((s) => ({ ...s, lessons: { ...s.lessons, [lesson.id]: { ...s.lessons[lesson.id], pre: r.filter(Boolean).length } } }));
  };
  return (
    <section className="card pretest stack">
      <div>
        <span className="ex-kicker">Tente antes · 2 minutos</span>
        <p className="muted" style={{ margin: '4px 0 0' }}>Antes de ler a explicação, tente dizer estas três frases em inglês. Errar aqui é esperado e ajuda: quem tenta primeiro aprende mais com a explicação. Não vale nota.</p>
      </div>
      {items.map((d, k) => (
        <div key={d.id} className="field">
          <label htmlFor={`pre-${k}`}>{d.pt}</label>
          <input id={`pre-${k}`} className="text-input" lang="en" autoComplete="off" autoCapitalize="off" spellCheck={false} disabled={!!done} value={vals[k]} onChange={(e) => setVals(vals.map((v, j) => (j === k ? e.target.value : v)))} placeholder="Como você diria?" />
          {done && <small className={done[k] ? 'word-ok' : 'word-miss'} lang="en">{done[k] ? 'Certo' : d.en}</small>}
        </div>
      ))}
      {!done ? (
        <div className="row"><button className="btn btn-primary" onClick={submit}>Ver como me saí</button><button className="link-btn" onClick={() => store.set((s) => ({ ...s, lessons: { ...s.lessons, [lesson.id]: { ...s.lessons[lesson.id], pre: 0 } } }))}>Pular</button></div>
      ) : (
        <p role="status" style={{ margin: 0 }}><b>{done.filter(Boolean).length} de {items.length}.</b> Agora leia a explicação procurando exatamente o que faltou. No fim da prática você vê a diferença.</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Backup do progresso e regras silenciadas (em Ajustes)                */
/* ------------------------------------------------------------------ */
export function BackupPanel() {
  const store = useStore();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const json = () => JSON.stringify(store.state);
  /** Arquivo .json: o jeito mais seguro de levar o progresso para outro computador. */
  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `fluente-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg('Arquivo baixado. No outro computador: Ajustes → Restaurar de um backup → escolha o arquivo.');
    } catch {
      setShowCurrent(true);
      setMsg('Não consegui baixar aqui. Copie o texto abaixo.');
    }
  };
  const readFile = (f: File | undefined) => {
    if (!f) return;
    void f.text().then((t) => setText(t));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json());
      setMsg('Backup copiado. Cole num lugar seguro (notas, e-mail para você mesmo).');
    } catch {
      setShowCurrent(true);
      setMsg('Não consegui copiar sozinho. Selecione e copie o texto abaixo.');
    }
  };
  const restore = () => {
    try {
      const parsed = JSON.parse(text) as Partial<AppState>;
      if (typeof parsed !== 'object' || !parsed || !('motivation' in parsed) || !('production' in parsed)) throw new Error('formato');
      const base = defaultState();
      store.set(() => ({ ...base, ...parsed, motivation: { ...base.motivation, ...parsed.motivation }, settings: { ...base.settings, ...parsed.settings }, profile: { ...base.profile, ...parsed.profile }, plan: { ...base.plan, ...parsed.plan }, coach: { ...base.coach, ...parsed.coach }, sim: { ...base.sim, ...parsed.sim, context: { ...base.sim.context, ...parsed.sim?.context } }, meet: { ...base.meet, ...parsed.meet, copilot: { ...base.meet.copilot, ...parsed.meet?.copilot } }, version: 1 }));
      setText('');
      setMsg('Progresso restaurado.');
    } catch {
      setMsg('Esse texto não é um backup válido do Fluente.');
    }
  };
  const muted = mutedFrom(store.state.fp);
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: '1.3rem' }}>Backup do progresso</h2>
      <p className="muted">Seu progresso fica só neste navegador. Em 6 meses de estudo, vale guardar uma cópia de vez em quando.</p>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={download}>Baixar arquivo de backup</button>
        <button className="btn btn-ghost" onClick={copy}>Copiar backup</button>
        <button className="btn btn-ghost" onClick={() => setShow(!show)}>{show ? 'Esconder' : 'Restaurar de um backup'}</button>
      </div>
      {showCurrent && (
        <div className="stack" style={{ marginTop: 10 }}>
          <label htmlFor="bk-now" className="muted">Seu backup atual (selecione tudo e copie)</label>
          <textarea id="bk-now" className="text-input" rows={4} readOnly value={json()} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
      {show && (
        <div className="stack" style={{ marginTop: 10 }}>
          <label htmlFor="bk-file" className="muted">Escolha o arquivo de backup…</label>
          <input id="bk-file" type="file" accept="application/json,.json,.txt" onChange={(e) => readFile(e.target.files?.[0])} />
          <label htmlFor="bk" className="muted">…ou cole aqui o texto do backup</label>
          <textarea id="bk" className="text-input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={json().slice(0, 80) + '…'} />
          <button className="btn btn-primary" disabled={!text.trim()} onClick={restore}>Restaurar e substituir o progresso atual</button>
        </div>
      )}
      {msg && <p role="status" className="note" style={{ marginTop: 8 }}>{msg}</p>}

      <h2 style={{ fontSize: '1.3rem', marginTop: 28 }}>Regras do detector que você silenciou</h2>
      {muted.length === 0 ? (
        <p className="muted">Nenhuma. Quando o app marcar como erro algo que estava certo, toque em "Não era erro". Com {MUTE_AFTER} avisos, aquela regra para de marcar para você.</p>
      ) : (
        <ul className="notebook">
          {muted.map((id) => (
            <li key={id}><span><b>{ERROR_CATEGORIES[ruleInfo(id)?.cat ?? '']?.title ?? id}</b><br /><small className="muted">{ruleInfo(id)?.explain ?? id}</small></span>
              <button className="link-btn" onClick={() => store.set((s) => { const fp = { ...s.fp }; delete fp[id]; return { ...s, fp }; })}>reativar</button></li>
          ))}
        </ul>
      )}
    </section>
  );
}
