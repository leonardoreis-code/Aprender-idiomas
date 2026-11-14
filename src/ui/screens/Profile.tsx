import { allDrills } from '../../content';
import { ACHIEVEMENTS, levelFor } from '../../domain/motivation/motivation';
import { SHOP } from '../../domain/motivation/quests';
import { ERROR_CATEGORIES, errorProfile } from '../../domain/production/errors';
import { STAGES } from '../../domain/production/ladder';
import { ACCENT_RULES } from '../../domain/pronunciation/accent';
import { speak } from '../../infra/audio';
import { GearIcon } from '../icons/ui';
import type { Route } from '../router';
import { useStore } from '../store';
import { Gem } from './Dashboard';

/** Perfil: progresso de produção, mapa de erros, sotaque, caderno, loja e conquistas. */
export function Profile({ go }: { go: (r: Route) => void }) {
  const store = useStore();
  const s = store.state;
  const lvl = levelFor(s.motivation.xpTotal);
  const errs = errorProfile(s.errorLog).slice(0, 6);
  const maxErr = Math.max(1, ...errs.map((e) => e.count));
  const byStage = STAGES.map((st) => Object.values(s.production).filter((p) => p.stage === st.id).length);
  const totalProduced = Object.keys(s.production).length;
  const accent = Object.entries(s.accentLog).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const buy = (id: string, price: number) => {
    if (s.gems < price) return;
    store.set((st) => ({
      ...st,
      gems: st.gems - price,
      motivation: id === 'freeze' ? { ...st.motivation, freezes: Math.min(2, st.motivation.freezes + 1) } : st.motivation,
      purchases: [...st.purchases, id],
    }));
    store.toast({ title: 'Comprado!', kind: 'info' });
  };

  return (
    <main className="shell profile" id="main">
      <div className="row-between">
        <h1 className="page-title">{s.profile.name || 'Seu perfil'}</h1>
        <button className="icon-btn" onClick={() => go({ name: 'settings' })} aria-label="Ajustes"><GearIcon /></button>
      </div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-box" style={{ borderColor: 'var(--indigo)' }}><span style={{ color: 'var(--indigo)' }}>Nível</span><b>{lvl.level}</b></div>
        <div className="stat-box" style={{ borderColor: 'var(--tangerine)' }}><span style={{ color: 'var(--tangerine)' }}>XP</span><b>{s.motivation.xpTotal}</b></div>
        <div className="stat-box" style={{ borderColor: 'var(--teal)' }}><span style={{ color: 'var(--teal)' }}>Frases</span><b>{totalProduced}</b></div>
        <div className="stat-box" style={{ borderColor: 'var(--ochre)' }}><span style={{ color: 'var(--ochre)' }}>Com a Maya</span><b>{Math.round(s.teacherSeconds / 60)}m</b></div>
      </div>

      <section className="card">
        <h2 className="card-h">Escada da fala</h2>
        <p className="muted">Quantas frases estão em cada degrau. A meta é levar tudo para "Falar" e "Relâmpago": aí você não traduz mais, só fala.</p>
        <svg viewBox="0 0 320 130" width="100%" role="img" aria-label={`Frases por degrau: ${STAGES.map((st, i) => `${st.label} ${byStage[i]}`).join(', ')}`}>
          {STAGES.map((st, i) => {
            const h = totalProduced ? (byStage[i] / Math.max(...byStage, 1)) * 80 : 0;
            return (
              <g key={st.id} transform={`translate(${i * 64 + 6} 0)`}>
                <rect x="0" y={96 - h} width="48" height={Math.max(h, 2)} rx="6" fill={i >= 3 ? 'var(--indigo)' : 'color-mix(in srgb, var(--indigo) 40%, transparent)'} />
                <text x="24" y={90 - h} textAnchor="middle" fontSize="12" fill="var(--ink)">{byStage[i]}</text>
                <text x="24" y="114" textAnchor="middle" fontSize="11" fill="var(--ink-2)">{st.label}</text>
              </g>
            );
          })}
        </svg>
        <p className="muted" style={{ margin: 0 }}>{totalProduced} de {allDrills.length} frases do curso já iniciadas.</p>
      </section>

      <div className="two-col">
        <section className="card">
          <h2 className="card-h">Mapa de erros</h2>
          {errs.length === 0 ? <p className="muted">Ainda sem erros registrados. Eles aparecem conforme você pratica — e a Maya usa essa lista para te corrigir.</p> : errs.map((e) => (
            <div key={e.id} className="err-row">
              <div className="row-between"><strong>{ERROR_CATEGORIES[e.id]?.title ?? e.id}</strong><small>{e.count}×</small></div>
              <div className="qbar"><span style={{ width: `${(e.count / maxErr) * 100}%`, background: 'var(--bad)' }} /></div>
              <small className="muted">{ERROR_CATEGORIES[e.id]?.explain}</small>
            </div>
          ))}
          {errs.length > 0 && <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => go({ name: 'teacher', mode: 'drill' })}>Treinar meus erros com a Maya</button>}
        </section>
        <section className="card">
          <h2 className="card-h">Sotaque</h2>
          {accent.length === 0 ? <p className="muted">Use o laboratório de sotaque para descobrir seus padrões.</p> : accent.map(([id, n]) => (
            <p key={id} style={{ margin: '8px 0' }}><strong>{ACCENT_RULES[id]?.title}</strong> · {n}×<br /><small className="muted">{ACCENT_RULES[id]?.howTo}</small></p>
          ))}
          <button className="btn btn-ghost btn-block" onClick={() => go({ name: 'accent' })}>Abrir laboratório</button>
        </section>
      </div>

      <section className="card">
        <h2 className="card-h">Meu caderno</h2>
        {s.notebook.length === 0 ? <p className="muted">Toque em "+ Caderno" no feedback para guardar frases que você quer dominar.</p> : (
          <ul className="notebook">
            {s.notebook.slice(0, 30).map((n) => (
              <li key={n.en}>
                <button className="icon-btn inline" onClick={() => speak(n.en)} aria-label={`Ouvir ${n.en}`}>▶</button>
                <span><b lang="en">{n.en}</b><br /><small className="muted">{n.pt}</small></span>
                <button className="link-btn" onClick={() => store.set((st) => ({ ...st, notebook: st.notebook.filter((x) => x.en !== n.en) }))} aria-label="Remover">remover</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="two-col">
        <section className="card">
          <h2 className="card-h">Loja <span className="stat" style={{ marginLeft: 8 }}><Gem /> {s.gems}</span></h2>
          {SHOP.map((it) => (
            <div key={it.id} className="row-between shop-row">
              <span><strong>{it.title}</strong><br /><small className="muted">{it.desc}</small></span>
              <button className="btn btn-ghost" disabled={s.gems < it.price || (it.id !== 'freeze' && s.purchases.includes(it.id))} onClick={() => buy(it.id, it.price)}>{it.price} <Gem size={14} /></button>
            </div>
          ))}
        </section>
        <section className="card">
          <h2 className="card-h">Conquistas</h2>
          <ul className="ach-list">
            {ACHIEVEMENTS.map((a) => {
              const got = s.motivation.achievements.includes(a.id);
              return <li key={a.id} className={got ? 'got' : ''}><span aria-hidden>{got ? '★' : '☆'}</span> <span><strong>{a.title}</strong><br /><small className="muted">{a.description}</small></span></li>;
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
