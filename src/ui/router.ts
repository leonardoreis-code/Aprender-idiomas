/** Roteador por hash (funciona em hospedagem estática e dentro do servidor). */
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
  | { name: 'base' };

export function parse(hash: string): Route {
  const [path, query] = hash.replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(query ?? '');
  const [a, b] = path.split('/');
  switch (a) {
    case 'curso': return { name: 'course' };
    case 'aula': return b ? { name: 'lesson', id: b } : { name: 'course' };
    case 'pratica': return { name: 'practice', lessonId: b || undefined };
    case 'video': return b ? { name: 'video', id: b } : { name: 'course' };
    case 'historias': return { name: 'stories' };
    case 'historia': return b ? { name: 'story', id: b } : { name: 'stories' };
    case 'professora': return { name: 'teacher', lessonId: q.get('aula') ?? undefined, mode: q.get('modo') ?? undefined };
    case 'sotaque': return { name: 'accent' };
    case 'perfil': return { name: 'profile' };
    case 'ajustes': return { name: 'settings' };
    case 'base': return { name: 'base' };
    default: return { name: 'home' };
  }
}

export function toHash(r: Route): string {
  switch (r.name) {
    case 'home': return '#/';
    case 'course': return '#/curso';
    case 'lesson': return `#/aula/${r.id}`;
    case 'practice': return r.lessonId ? `#/pratica/${r.lessonId}` : '#/pratica';
    case 'video': return `#/video/${r.id}`;
    case 'stories': return '#/historias';
    case 'story': return `#/historia/${r.id}`;
    case 'teacher': {
      const q = new URLSearchParams();
      if (r.lessonId) q.set('aula', r.lessonId);
      if (r.mode) q.set('modo', r.mode);
      return `#/professora${q.size ? '?' + q : ''}`;
    }
    case 'accent': return '#/sotaque';
    case 'profile': return '#/perfil';
    case 'settings': return '#/ajustes';
    case 'base': return '#/base';
  }
}
