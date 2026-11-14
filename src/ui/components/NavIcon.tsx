/** Ícones da navegação principal (SVG próprios). */
export function NavIcon({ name }: { name: 'home' | 'course' | 'practice' | 'teacher' | 'profile' }) {
  const p = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'home':
      return <svg {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>;
    case 'course':
      return <svg {...p}><path d="M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1z" /><path d="M20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z" /></svg>;
    case 'practice':
      return <svg {...p}><path d="M4 18l4-4 3 3 7-8" /><path d="M14 9h4v4" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>;
    case 'teacher':
      return <svg {...p}><circle cx="12" cy="9" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /><path d="M18 4c1.5 1 2 2.5 2 4M6 4C4.5 5 4 6.5 4 8" /></svg>;
    case 'profile':
      return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="10" r="3" /><path d="M8 17c1-2 2.5-3 4-3s3 1 4 3" /></svg>;
  }
}
