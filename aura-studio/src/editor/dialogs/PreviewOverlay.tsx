import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { renderPage } from '../../lib/render';

export default function PreviewOverlay({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const [i, setI] = useState(engine.pageIndex);
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    (async () => {
      await engine.saveNow();
      const scale = Math.min(2, (Math.max(innerWidth, innerHeight) * devicePixelRatio) / Math.max(project.width, project.height));
      for (let n = 0; n < project.pages.length && alive; n++) {
        const { blob } = await renderPage(project, project.pages[n], { scale, format: 'png' });
        const u = URL.createObjectURL(blob);
        made.push(u);
        if (alive) setUrls((s) => ({ ...s, [n]: u }));
      }
    })();
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);  

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((v) => Math.min(project.pages.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, project.pages.length]);

  const n = project.pages.length;
  return (
    <div className="preview">
      <header>
        <span>{project.title}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close preview">
          <X size={18} />
        </button>
      </header>
      <main>{urls[i] ? <img src={urls[i]} alt={`Page ${i + 1}`} /> : <span className="faint">Rendering…</span>}</main>
      <footer>
        <button className="icon-btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ChevronLeft size={18} />
        </button>
        <span>
          Page {i + 1} / {n}
        </span>
        <button className="icon-btn" disabled={i >= n - 1} onClick={() => setI(i + 1)}>
          <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
