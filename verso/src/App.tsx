import { lazy, Suspense } from 'react';
import { useApp } from './store/app';
import { Toasts } from './ui/controls';
import Dashboard from './dashboard/Dashboard';

// The editor (and fabric.js) only loads when a design is opened.
const Editor = lazy(() => import('./editor/Editor'));

export default function App() {
  const route = useApp((s) => s.route);
  return (
    <>
      {route.name === 'editor' ? (
        <Suspense fallback={<div className="loading">Opening editor…</div>}>
          <Editor key={route.id} projectId={route.id} />
        </Suspense>
      ) : (
        <Dashboard route={route} />
      )}
      <Toasts />
    </>
  );
}
