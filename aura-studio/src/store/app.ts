import { create } from 'zustand';

export type Route =
  | { name: 'home' }
  | { name: 'projects' }
  | { name: 'templates' }
  | { name: 'discover' }
  | { name: 'ai' }
  | { name: 'apparel' }
  | { name: 'brands' }
  | { name: 'assets' }
  | { name: 'favorites' }
  | { name: 'trash' }
  | { name: 'settings' }
  | { name: 'editor'; id: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'editor' && parts[1]) return { name: 'editor', id: parts[1] };
  const simple = ['home', 'projects', 'templates', 'discover', 'ai', 'apparel', 'brands', 'assets', 'favorites', 'trash', 'settings'];
  if (simple.includes(parts[0])) return { name: parts[0] } as Route;
  return { name: 'home' };
}

export function navigate(r: Route) {
  location.hash = r.name === 'editor' ? `#/editor/${r.id}` : `#/${r.name}`;
}

interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

interface AppState {
  route: Route;
  toasts: Toast[];
  toast: (text: string, kind?: Toast['kind']) => void;
  dismiss: (id: number) => void;
}

let tid = 0;
export const useApp = create<AppState>((set) => ({
  route: parseHash(location.hash),
  toasts: [],
  toast: (text, kind = 'info') => {
    const id = ++tid;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'error' ? 6000 : 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

window.addEventListener('hashchange', () => useApp.setState({ route: parseHash(location.hash) }));

export const toast = (text: string, kind?: Toast['kind']) => useApp.getState().toast(text, kind);
