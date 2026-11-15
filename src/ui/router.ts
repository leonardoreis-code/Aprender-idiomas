/**
 * Roteador por hash. Formato compatível com artefatos (só `#nome` com letras,
 * dígitos e hífens): `#curso`, `#aula--fala-01`, `#professora--drill--fala-01`.
 * O separador de argumentos é `--` (ids usam hífen simples).
 */
export type Route =
  | { name: 'home' }
  | { name: 'course' }
  | { name: 'lesson'; id: string }
  | { name: 'practice'; lessonId?: string }
  | { name: 'video'; id: string }
  | { name: 'stories' }
  | { name: 'story'; id: string }
  | { name: 'teacher'; lessonId?: string; mode?: string }
  | { name: 'accent' }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'base' }
  | { name: 'evolution' }
  | { name: 'checkpoint' }
  | { name: 'monologue' }
  | { name: 'mine' }
  | { name: 'lab' }
  | { name: 'fluency' }
  | { name: 'retell' }
  | { name: 'echo' }
  | { name: 'missions' }
  | { name: 'mission'; id: string };

const MODES = ['conversation', 'drill', 'roleplay', 'interview', 'call'];

export function parse(hash: string): Route {
  const [a, ...args] = hash.replace(/^#\/?/, '').replace(/\//g, '--').split('--');
  const b = args[0];
  switch (a) {
    case 'curso': return { name: 'course' };
    case 'aula': return b ? { name: 'lesson', id: b } : { name: 'course' };
    case 'pratica': return { name: 'practice', lessonId: b || undefined };
    case 'video': return b ? { name: 'video', id: b } : { name: 'course' };
    case 'historias': return { name: 'stories' };
    case 'historia': return b ? { name: 'story', id: b } : { name: 'stories' };
    case 'professora': {
      const mode = args.find((x) => MODES.includes(x));
      const lessonId = args.find((x) => !MODES.includes(x));
      return { name: 'teacher', mode, lessonId };
    }
    case 'sotaque': return { name: 'accent' };
    case 'perfil': return { name: 'profile' };
    case 'ajustes': return { name: 'settings' };
    case 'base': return { name: 'base' };
    case 'evolucao': return { name: 'evolution' };
    case 'checkpoint': return { name: 'checkpoint' };
    case 'fala-livre': return { name: 'monologue' };
    case 'minhas-frases': return { name: 'mine' };
    case 'falar': return { name: 'lab' };
    case 'fluencia': return { name: 'fluency' };
    case 'reconto': return { name: 'retell' };
    case 'eco': return { name: 'echo' };
    case 'simulacoes': return { name: 'missions' };
    case 'simulacao': return b ? { name: 'mission', id: b } : { name: 'missions' };
    default: return { name: 'home' };
  }
}

export function toHash(r: Route): string {
  switch (r.name) {
    case 'home': return '#inicio';
    case 'course': return '#curso';
    case 'lesson': return `#aula--${r.id}`;
    case 'practice': return r.lessonId ? `#pratica--${r.lessonId}` : '#pratica';
    case 'video': return `#video--${r.id}`;
    case 'stories': return '#historias';
    case 'story': return `#historia--${r.id}`;
    case 'teacher': return ['#professora', r.mode, r.lessonId].filter(Boolean).join('--');
    case 'accent': return '#sotaque';
    case 'profile': return '#perfil';
    case 'settings': return '#ajustes';
    case 'base': return '#base';
    case 'evolution': return '#evolucao';
    case 'checkpoint': return '#checkpoint';
    case 'monologue': return '#fala-livre';
    case 'mine': return '#minhas-frases';
    case 'lab': return '#falar';
    case 'fluency': return '#fluencia';
    case 'retell': return '#reconto';
    case 'echo': return '#eco';
    case 'missions': return '#simulacoes';
    case 'mission': return `#simulacao--${r.id}`;
  }
}
