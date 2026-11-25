/**
 * Magic eraser — paint over anything and it's removed, on device.
 * Each erase builds on the last; every step can be undone. Applying saves a
 * new asset and keeps the original for "Restore original".
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Cpu, Eraser, Redo2, Trash2, Undo2, Wand2 } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RangeField, Toggle } from '../../ui/controls';
import { toast } from '../../store/app';
import { MaskStage, paintDab, type StrokePoint } from './MaskStage';
import { inpaint, isCached, LAMA, type InpaintMode } from '../../lib/ai/inpaint';
import { alphaOf } from '../../lib/ai/mask';
import { getAsset, putAsset } from '../../lib/db';
import { uid } from '../../lib/ids';
import type { Asset } from '../../lib/types';
import type { Progress } from '../../lib/ai/runtime';

const HISTORY = 12;
const STROKE = '#ff3d7f';

export default function EraseDialog() {
  const engine = useEngine();
  const tool = useEditor((s) => s.imageTool);
  const img = tool?.kind === 'erase' ? tool.img : null;
  const close = () => useEditor.setState({ imageTool: null });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meta = useRef<{ name: string; assetId?: string; originalAssetId?: string; original: HTMLCanvasElement } | null>(null);
  const work = useRef<HTMLCanvasElement[]>([]); // history of results; last = current
  const redo = useRef<HTMLCanvasElement[]>([]);
  const strokes = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const last = useRef<StrokePoint | null>(null);
  const hasStrokes = useRef(false);
  const eraseRef = useRef<() => void>(() => {});

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<InpaintMode>('ai');
  const [cached, setCached] = useState(false);
  const [auto, setAuto] = useState(true);
  const [brush, setBrush] = useState(50);
  const [painted, setPainted] = useState(false);
  const [busy, setBusy] = useState<{ stage: string; pct?: number } | null>(null);
  const [before, setBefore] = useState(false);
  const [error, setError] = useState('');
  const [, force] = useState(0);

  useEffect(() => {
    if (!img) return;
    (async () => {
      try {
        const s = await engine.imageSources(img);
        const w = s.current.naturalWidth;
        const h = s.current.naturalHeight;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d')!.drawImage(s.current, 0, 0);
        meta.current = { name: s.name, assetId: s.assetId, originalAssetId: s.originalAssetId, original: c };
        work.current = [c];
        redo.current = [];
        strokes.current.width = w;
        strokes.current.height = h;
        setSize({ w, h });
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
    isCached(LAMA.url).then(setCached);
  }, [img]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = () => work.current[work.current.length - 1];

  const render = () => {
    const c = canvasRef.current;
    if (!c || !size.w || !work.current.length) return;
    if (c.width !== size.w || c.height !== size.h) {
      c.width = size.w;
      c.height = size.h;
    }
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, size.w, size.h);
    x.drawImage(before ? meta.current!.original : current(), 0, 0);
    if (!before) {
      x.globalAlpha = 0.55;
      x.drawImage(strokes.current, 0, 0);
      x.globalAlpha = 1;
    }
  };
  useEffect(render);

  const clearStrokes = () => {
    strokes.current.getContext('2d')!.clearRect(0, 0, size.w, size.h);
    hasStrokes.current = false;
    setPainted(false);
  };

  const erase = async () => {
    if (!hasStrokes.current || busy) return;
    setError('');
    const { w, h } = size;
    const mask = alphaOf(strokes.current.getContext('2d')!.getImageData(0, 0, w, h));
    setBusy({ stage: mode === 'ai' ? 'Loading model…' : 'Filling…' });
    const onP: Progress = (p) => setBusy(p);
    try {
      const src = current();
      const out = await inpaint(src, mask, w, h, mode, onP);
      // keep the layer's transparency (e.g. a cutout) exactly as it was
      const ctx = out.getContext('2d')!;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      work.current.push(out);
      if (work.current.length > HISTORY) work.current.splice(1, 1); // never drop the original
      redo.current = [];
      clearStrokes();
      setCached(await isCached(LAMA.url));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  eraseRef.current = erase;

  const onStroke = (phase: 'start' | 'move' | 'end', p: StrokePoint) => {
    if (busy) return;
    if (phase === 'start') last.current = null;
    if (phase !== 'end') {
      paintDab(strokes.current.getContext('2d')!, last.current, p, 1, 'paint', STROKE);
      last.current = p;
      hasStrokes.current = true;
      if (!painted) setPainted(true);
      render();
    } else {
      last.current = null;
      if (auto) eraseRef.current();
    }
  };

  const undo = () => {
    if (painted) return clearStrokes();
    if (work.current.length < 2) return;
    redo.current.push(work.current.pop()!);
    force((n) => n + 1);
  };
  const redoStep = () => {
    const r = redo.current.pop();
    if (r) work.current.push(r);
    force((n) => n + 1);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!img || (e.target as HTMLElement)?.closest('input')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) redoStep();
        else undo();
      } else if (e.key === '[') setBrush((b) => Math.max(4, Math.round(b / 1.2)));
      else if (e.key === ']') setBrush((b) => Math.min(400, Math.round(b * 1.2)));
      else if (e.key === 'Enter') erase();
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async () => {
    const m = meta.current;
    if (!img || !m || work.current.length < 2) return;
    setBusy({ stage: 'Saving…' });
    try {
      const out = current();
      const type = m.assetId && (await getAsset(m.assetId))?.type === 'image/jpeg' && !m.originalAssetId ? 'image/jpeg' : 'image/png';
      const blob: Blob = await new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), type, 0.95));
      let originalId = m.originalAssetId ?? m.assetId;
      if (!originalId) {
        const ob: Blob = await new Promise((res) => m.original.toBlob((b) => res(b!), 'image/png'));
        const oa: Asset = { id: uid('a_'), name: m.name, type: 'image/png', blob: ob, width: size.w, height: size.h, size: ob.size, favorite: false, createdAt: Date.now() };
        await putAsset(oa);
        originalId = oa.id;
      }
      const prev = m.assetId ? await getAsset(m.assetId) : undefined;
      const asset: Asset = { id: uid('a_'), name: `${(prev?.name ?? m.name).replace(/ – edited$/, '')} – edited`, type, blob, width: size.w, height: size.h, size: blob.size, favorite: false, createdAt: Date.now(), credit: prev?.credit };
      await putAsset(asset);
      await engine.swapImageAsset(img, asset, originalId);
      engine.select([img]);
      toast('Objects removed', 'success');
      close();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  if (!img) return null;
  const steps = work.current.length - 1;
  return (
    <div className="modal-back studio-back">
      <div className="modal studio" role="dialog" aria-label="Magic eraser" onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Wand2 size={15} /> Magic eraser
          </h3>
          <span className="studio-badge">
            <Cpu size={12} /> On-device AI · free · nothing is uploaded
          </span>
          <button className="icon-btn sm" onClick={close} aria-label="Close" style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
        <div className="studio-body">
          <MaskStage canvasRef={canvasRef} width={size.w} height={size.h} brush={before || busy ? 0 : brush} brushColor={STROKE} backdrop="checker" onStroke={onStroke}>
            {busy && (
              <div className="studio-busy" data-testid="erase-busy">
                <div className="spinner" />
                <div>{busy.stage}</div>
                {busy.pct !== undefined && (
                  <div className="bar">
                    <i style={{ width: `${busy.pct}%` }} />
                  </div>
                )}
              </div>
            )}
          </MaskStage>
          <aside className="studio-side">
            <section>
              <h6>Paint over what to remove</h6>
              <div className="prop-row">
                <span>Brush</span>
                <RangeField value={brush} min={4} max={400} onChange={(v) => setBrush(v)} unit="px" />
              </div>
              <div className="prop-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <span>Erase when I release</span>
                <Toggle on={auto} onChange={setAuto} />
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn primary" style={{ flex: 1 }} disabled={!painted || !!busy} onClick={erase} data-testid="run-erase">
                  <Eraser size={14} /> Erase
                </button>
                <button className="btn" disabled={!painted || !!busy} onClick={clearStrokes} title="Clear brush strokes">
                  <Trash2 size={14} />
                </button>
              </div>
              {error && <p className="err small">{error}</p>}
            </section>
            <section>
              <h6>Engine</h6>
              <div className="model-list">
                <button className={`model-opt ${mode === 'ai' ? 'on' : ''}`} onClick={() => setMode('ai')} data-mode="ai">
                  <b>AI fill</b>
                  <span>Rebuilds what was behind — people, objects, text. {cached ? 'Ready.' : `${LAMA.size} one-time download.`}</span>
                </button>
                <button className={`model-opt ${mode === 'quick' ? 'on' : ''}`} onClick={() => setMode('quick')} data-mode="quick">
                  <b>Quick fill</b>
                  <span>Instant, no download — spots, dust, wires on plain areas.</span>
                </button>
              </div>
              <p className="faint small">{mode === 'ai' ? `${LAMA.license} · runs on CPU (WebAssembly), ~5–20 s per area` : 'Classical push-pull fill with grain matching'}</p>
            </section>
            <section>
              <h6>Tips</h6>
              <p className="faint small">Cover the object and its shadow with a little margin. Big areas work best in a few passes. [ ] brush size · Enter erase · ⌘Z undo.</p>
            </section>
          </aside>
        </div>
        <div className="modal-foot">
          <button className="icon-btn" title="Undo (⌘Z)" onClick={undo} disabled={!painted && steps < 1}>
            <Undo2 size={15} />
          </button>
          <button className="icon-btn" title="Redo (⇧⌘Z)" onClick={redoStep} disabled={!redo.current.length}>
            <Redo2 size={15} />
          </button>
          <button className="btn ghost" disabled={steps < 1} onPointerDown={() => setBefore(true)} onPointerUp={() => setBefore(false)} onPointerLeave={() => setBefore(false)}>
            Before
          </button>
          <span className="faint small" style={{ marginLeft: 'auto' }} data-testid="erase-steps">
            {steps} {steps === 1 ? 'edit' : 'edits'} · {size.w} × {size.h} px · original kept
          </span>
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={steps < 1 || !!busy} onClick={apply} data-testid="apply-erase">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
