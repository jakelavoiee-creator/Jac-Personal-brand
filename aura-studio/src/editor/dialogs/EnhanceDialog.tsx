/**
 * AI enhance — 2× super-resolution on device. Same size on the canvas,
 * twice the pixels (sharper zoom, higher print DPI).
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Cpu, Sparkles } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { toast } from '../../store/app';
import { MaskStage } from './MaskStage';
import { ENHANCE, ENHANCE_MODELS, defaultEnhanceModel, upscale2x, type EnhanceModel } from '../../lib/ai/enhance';
import { isModelCached, segDeviceLabel, type Progress } from '../../lib/ai/runtime';
import { getAsset, putAsset } from '../../lib/db';
import { uid } from '../../lib/ids';
import type { Asset } from '../../lib/types';

export default function EnhanceDialog() {
  const engine = useEngine();
  const tool = useEditor((s) => s.imageTool);
  const img = tool?.kind === 'enhance' ? tool.img : null;
  const close = () => useEditor.setState({ imageTool: null });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const src = useRef<{ el: HTMLImageElement; name: string; assetId?: string } | null>(null);
  const result = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [split, setSplit] = useState(50);
  const [busy, setBusy] = useState<{ stage: string; pct?: number } | null>(null);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [device, setDevice] = useState('');
  const [done, setDone] = useState(0);
  const [model, setModel] = useState<EnhanceModel>('fast');
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!img) return;
    result.current = null;
    setDone(0);
    (async () => {
      try {
        const s = await engine.imageSources(img);
        src.current = { el: s.current, name: s.name, assetId: s.assetId };
        setSize({ w: s.current.naturalWidth, h: s.current.naturalHeight });
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
    defaultEnhanceModel().then(setModel);
    segDeviceLabel().then(setDevice);
  }, [img]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isModelCached(ENHANCE_MODELS[model].id).then(setCached);
  }, [model]);

  const W = size.w * 2;
  const H = size.h * 2;
  const tooBig = Math.max(size.w, size.h) > ENHANCE.maxInput;

  useEffect(() => {
    const c = canvasRef.current;
    const s = src.current;
    if (!c || !s || !size.w) return;
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, W, H);
    x.imageSmoothingQuality = 'high';
    x.drawImage(s.el, 0, 0, W, H);
    if (result.current) {
      const sx = Math.round((W * split) / 100);
      x.drawImage(result.current, sx, 0, W - sx, H, sx, 0, W - sx, H);
      x.fillStyle = '#fff';
      x.fillRect(sx - Math.max(1, W / 800), 0, Math.max(2, W / 400), H);
    }
  });

  const run = async () => {
    const s = src.current;
    if (!s) return;
    setError('');
    setBusy({ stage: 'Loading model…' });
    const t0 = performance.now();
    try {
      const onP: Progress = (p) => setBusy(p);
      abort.current = new AbortController();
      result.current = await upscale2x(s.el, size.w, size.h, model, onP, abort.current.signal);
      setDone(performance.now() - t0);
      setCached(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? String(e));
    } finally {
      abort.current = null;
      setBusy(null);
    }
  };

  const apply = async () => {
    const s = src.current;
    const out = result.current;
    if (!img || !s || !out) return;
    setBusy({ stage: 'Saving…' });
    try {
      const prev = s.assetId ? await getAsset(s.assetId) : undefined;
      const type = prev?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const blob: Blob = await new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), type, 0.95));
      const asset: Asset = { id: uid('a_'), name: `${(prev?.name ?? s.name).replace(/ – enhanced$/, '')} – enhanced`, type, blob, width: W, height: H, size: blob.size, favorite: false, createdAt: Date.now(), credit: prev?.credit };
      await putAsset(asset);
      await engine.swapImageUpscaled(img, asset, 2);
      engine.select([img]);
      toast(`Enhanced to ${W} × ${H}px`, 'success');
      close();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  if (!img) return null;
  return (
    <div className="modal-back studio-back">
      <div className="modal studio" role="dialog" aria-label="Enhance" onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Sparkles size={15} /> Enhance · 2× upscale
          </h3>
          <span className="studio-badge">
            <Cpu size={12} /> On-device AI · free · nothing is uploaded
          </span>
          <button className="icon-btn sm" onClick={close} aria-label="Close" style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
        <div className="studio-body">
          <MaskStage canvasRef={canvasRef} width={W} height={H} brush={0} backdrop="checker">
            {busy && (
              <div className="studio-busy" data-testid="enhance-busy">
                <div className="spinner" />
                <div>{busy.stage}</div>
                {busy.pct !== undefined && (
                  <div className="bar">
                    <i style={{ width: `${busy.pct}%` }} />
                  </div>
                )}
                {abort.current && (
                  <button className="btn sm ghost" onClick={() => abort.current?.abort()}>
                    Cancel
                  </button>
                )}
              </div>
            )}
          </MaskStage>
          <aside className="studio-side">
            <section>
              <h6>Super-resolution</h6>
              <p className="small" style={{ color: 'var(--text-2)' }}>
                Rebuilds fine detail — edges, hair, texture — instead of just stretching pixels. The layer keeps its size on the page with twice the resolution.
              </p>
              <div className="kv">
                <span>Now</span>
                <b>
                  {size.w} × {size.h}
                </b>
                <span>After</span>
                <b>
                  {W} × {H}
                </b>
              </div>
              <div className="model-list">
                {(Object.keys(ENHANCE_MODELS) as EnhanceModel[]).map((k) => (
                  <button key={k} className={`model-opt ${model === k ? 'on' : ''}`} onClick={() => setModel(k)} data-model={k}>
                    <b>{ENHANCE_MODELS[k].label}</b>
                    <span>
                      {ENHANCE_MODELS[k].hint} · {ENHANCE_MODELS[k].size}
                    </span>
                  </button>
                ))}
              </div>
              <button className="btn primary block" disabled={!!busy || tooBig || !size.w} onClick={run} data-testid="run-enhance">
                <Sparkles size={14} /> {done ? 'Run again' : 'Enhance'}
              </button>
              <p className="faint small">
                {ENHANCE.license} · {cached ? 'model ready' : `${ENHANCE_MODELS[model].size} one-time download`} · {device}. Large images take a while on CPU — the editor stays usable.
              </p>
              {tooBig && <p className="err small">Already {size.w}px wide — enhance is for images up to {ENHANCE.maxInput}px.</p>}
              {done > 0 && <p className="small" style={{ color: 'var(--ok)' }}>Done in {(done / 1000).toFixed(1)} s. Drag the divider to compare.</p>}
              {error && <p className="err small">{error}</p>}
            </section>
          </aside>
        </div>
        <div className="modal-foot">
          <span className="small faint">Original</span>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} disabled={!done} style={{ width: 240 }} aria-label="Compare" />
          <span className="small faint">Enhanced</span>
          <span style={{ marginLeft: 'auto' }} />
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={!done || !!busy} onClick={apply} data-testid="apply-enhance">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
