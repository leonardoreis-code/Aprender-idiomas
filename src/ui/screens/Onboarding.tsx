import { useState } from 'react';
import { checkTyped } from '../../domain/practice/answer';
import type { Goal, LearnerLevel } from '../../infra/storage';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { Logo } from '../icons/ui';

/** Nivelamento rápido: frases PT → EN de dificuldade crescente (mede produção, não leitura). */
const PLACEMENT = [
  { pt: 'Eu sou do Brasil.', en: ["I'm from Brazil", 'I am from Brazil'] },
  { pt: 'Ela trabalha num banco.', en: ['She works at a bank', 'She works in a bank'] },
  { pt: 'Você gosta de café?', en: ['Do you like coffee'] },
  { pt: 'Ontem eu fui ao escritório.', en: ['Yesterday I went to the office', 'I went to the office yesterday'] },
  { pt: 'Faz dois anos que eu trabalho aqui.', en: ["I've been working here for two years", 'I have been working here for two years', "I've worked here for two years", 'I have worked here for two years'] },
];

export interface OnboardingResult {
  name: string;
  level: LearnerLevel;
  goals: Goal[];
  minutes: number;
  dailyGoal: number;
}

export function Onboarding({ onDone }: { onDone: (r: OnboardingResult) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [self, setSelf] = useState<LearnerLevel>('fala');
  const [goals, setGoals] = useState<Goal[]>(['trabalho']);
  const [minutes, setMinutes] = useState(15);
  const [pi, setPi] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hits, setHits] = useState<boolean[]>([]);

  const finish = (placementHits: boolean[]) => {
    const score = placementHits.filter(Boolean).length;
    const level: LearnerLevel = self === 'zero' && score <= 1 ? 'zero' : score >= 5 ? 'avancado' : score >= 2 || self !== 'zero' ? 'fala' : 'zero';
    onDone({ name: name.trim(), level, goals, minutes, dailyGoal: minutes <= 10 ? 30 : minutes <= 15 ? 50 : 100 });
  };

  const goalOpts: { id: Goal; label: string }[] = [
    { id: 'trabalho', label: 'Reuniões e dailies no trabalho' },
    { id: 'entrevista', label: 'Entrevista de emprego' },
    { id: 'viagem', label: 'Viagens' },
    { id: 'dia-a-dia', label: 'Conversar no dia a dia' },
  ];

  return (
    <main className="onboard" id="main">
      <div className="row" style={{ gap: 10 }}><Logo size={34} /><strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Fluente</strong></div>

      {step === 0 && (
        <>
          <TeacherAvatar state="idle" size={150} />
          <h1>Oi! Eu sou a Maya.</h1>
          <p className="lead">Vou te ajudar a <b>pensar em inglês</b> e falar sem travar. Primeiro, como posso te chamar?</p>
          <label htmlFor="ob-name" className="sr-only">Seu nome</label>
          <input id="ob-name" className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoComplete="given-name" />
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>Continuar</button>
        </>
      )}

      {step === 1 && (
        <>
          <h1>Qual frase mais parece você?</h1>
          <div className="goal-grid" role="radiogroup">
            {([
              ['zero', 'Nunca estudei ou sei pouquíssimo', 'Vamos do começo, com muito apoio.'],
              ['fala', 'Entendo lendo e ouvindo, mas travo para falar', 'Consigo traduzir do inglês, mas não montar a frase em inglês.'],
              ['avancado', 'Já falo, mas quero fluência e precisão', 'Quero falar mais rápido e errar menos.'],
            ] as const).map(([id, t, d]) => (
              <button key={id} className="option" role="radio" aria-checked={self === id} onClick={() => setSelf(id)}>
                <span><strong>{t}</strong><br /><small className="muted">{d}</small></span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>Continuar</button>
        </>
      )}

      {step === 2 && (
        <>
          <h1>Para que você quer inglês?</h1>
          <div className="goal-grid">
            {goalOpts.map((g) => (
              <button key={g.id} className="option" role="checkbox" aria-checked={goals.includes(g.id)} onClick={() => setGoals(goals.includes(g.id) ? goals.filter((x) => x !== g.id) : [...goals, g.id])}>{g.label}</button>
            ))}
          </div>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>Quanto tempo por dia?</legend>
            <div className="seg" role="group">
              {[10, 15, 25].map((m) => <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m} min</button>)}
            </div>
          </fieldset>
          <button className="btn btn-primary btn-block" disabled={!goals.length} onClick={() => setStep(self === 'zero' ? 4 : 3)}>{self === 'zero' ? 'Começar' : 'Fazer nivelamento (1 min)'}</button>
        </>
      )}

      {step === 3 && (
        <>
          <span className="ex-kicker">Nivelamento · {pi + 1} de {PLACEMENT.length}</span>
          <h1>Como você diria em inglês?</h1>
          <p className="pt-prompt">{PLACEMENT[pi].pt}</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const ok = checkTyped(answer, PLACEMENT[pi].en) !== 'wrong';
            const list = [...hits, ok];
            setHits(list);
            setAnswer('');
            if (pi + 1 < PLACEMENT.length) setPi(pi + 1);
            else finish(list);
          }}>
            <input className="text-input" lang="en" autoFocus autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escreva sem medo de errar" aria-label="Sua tradução" />
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { const list = [...hits, false]; setHits(list); setAnswer(''); pi + 1 < PLACEMENT.length ? setPi(pi + 1) : finish(list); }}>Não sei</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!answer.trim()}>Próxima</button>
            </div>
          </form>
          <p className="muted">Isso mede o que mais importa para falar: transformar o português em inglês. Não tem nota, só ajusta seu ponto de partida.</p>
        </>
      )}

      {step === 4 && (
        <>
          <h1>Tudo pronto!</h1>
          <p className="lead">Você começa pela trilha "Do zero". Em poucos dias já vai montar e falar suas primeiras frases.</p>
          <button className="btn btn-primary btn-block" onClick={() => finish([])}>Começar</button>
        </>
      )}
    </main>
  );
}
