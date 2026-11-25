/**
 * Background remover — on-device AI segmentation + manual refinement.
 * The original pixels are never modified: the result is a new transparent PNG
 * asset and the layer remembers its original, so it can be refined again or
 * restored at any time.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Brush, Eraser, Redo2, Undo2, Cpu, Check, Sparkles } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RangeField, ColorField, Toggle } from '../../ui/controls';
import { toast } from '../../store/app';
import { MaskStage, paintDab, type StrokePoint } from './MaskStage';
import { SEG_MODELS, MODEL_LICENSES, predictMask, segDevice, segDownloadSize, type SegModel } from '../../lib/ai/segment';
import { isModelCached, type Progress } from '../../lib/ai/runtime';
import { alphaOf, cutoutPNG, maskCanvas, processMask, EDGE_DEFAULT, type EdgeSettings } from '../../lib/ai/mask';
import { getAsset, listAssets, putAsset } from '../../lib/db';
import { assetURL } from '../../lib/assets';
import { uid } from '../../lib/ids';
import type { Asset } from '../../lib/types';

type BgChoice = { kind: 'none' } | { kind: 'color'; color: string } | { kind: 'blur'; amount: number } | { kind: 'asset'; asset: Asset };
const UNDO_LIMIT = 20;

export default function CutoutDialog() {
  const engine = useEngine();
  const tool = useEditor((s) => s.imageTool);
  const img = tool?.kind === 'cutout' ? tool.img : null;
  const close = () => useEditor.setState({ imageTool: null });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const src = useRef<{ source: HTMLImageElement; name: string; assetId?: string; originalAssetId?: string } | null>(null);
  const base = useRef<HTMLCanvasElement>(document.createElement('canvas')); // editable mask (white + alpha)
  const proc = useRef<HTMLCanvasElement>(document.createElement('canvas')); // mask after edge settings
  const undo = useRef<Uint8ClampedArray[]>([]);
  const redo = useRef<Uint8ClampedArray[]>([]);
  const last = useRef<StrokePoint | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hasMask, setHasMask] = useState(false);
  const [model, setModel] = useState<SegModel>('general');
  const [device, setDevice] = useState('');
  const [dl, setDl] = useState('');
  const [busy, setBusy] = useState<{ stage: string; pct?: number } | null>(null);
  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [brush, setBrush] = useState(60);
  const [hardness, setHardness] = useState(0.6);
  const [edge, setEdge] = useState<EdgeSettings>(EDGE_DEFAULT);
  const [view, setView] = useState<'checker' | 'white' | 'black' | 'overlay'>('checker');
  const [before, setBefore] = useState(false);
  const [bg, setBg] = useState<BgChoice>({ kind: 'none' });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [, force] = useState(0);
  const [error, setError] = useState('');
  const [decon, setDecon] = useState(true);

  /* ---------- load ---------- */
  useEffect(() => {
    if (!img) return;
    let dead = false;
    (async () => {
      try {
        const s = await engine.imageSources(img);
        if (dead) return;
        src.current = s;
        const w = s.source.naturalWidth;
        const h = s.source.naturalHeight;
        base.current.width = proc.current.width = w;
        base.current.height = proc.current.height = h;
        setSize({ w, h });
        undo.current = [];
        redo.current = [];
        if (s.originalAssetId && s.current.naturalWidth === w && s.current.naturalHeight === h) {
          // refining an existing cutout: its alpha is the starting mask
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const x = c.getContext('2d')!;
          x.drawImage(s.current, 0, 0);
          maskCanvas(alphaOf(x.getImageData(0, 0, w, h)), w, h, base.current);
          setHasMask(true);
          reprocess(EDGE_DEFAULT);
        } else if (await isModelCached(SEG_MODELS.general.id)) {
          detect('general');
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
    segDevice().then(setDevice);
    listAssets().then((a) => setAssets(a.filter((x) => /^image\/(png|jpe?g|webp)$/.test(x.type)).slice(0, 30)));
    return () => {
      dead = true;
    };
  }, [img]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    segDownloadSize(model).then(setDl);
  }, [model]);

  /* ---------- rendering ---------- */
  const render = () => {
    const c = canvasRef.current;
    const s = src.current;
    if (!c || !s || !size.w) return;
    if (c.width !== size.w || c.height !== size.h) {
      c.width = size.w;
      c.height = size.h;
    }
    const x = c.getContext('2d')!;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, size.w, size.h);
    x.drawImage(s.source, 0, 0);
    if (before || !hasMask) return;
    if (view === 'overlay') {
      // tint what will be removed
      const t = document.createElement('canvas');
      t.width = size.w;
      t.height = size.h;
      const tx = t.getContext('2d')!;
      tx.fillStyle = 'rgba(255,40,90,.55)';
      tx.fillRect(0, 0, size.w, size.h);
      tx.globalCompositeOperation = 'destination-out';
      tx.drawImage(proc.current, 0, 0);
      x.drawImage(t, 0, 0);
    } else {
      x.globalCompositeOperation = 'destination-in';
      x.drawImage(proc.current, 0, 0);
      x.globalCompositeOperation = 'source-over';
    }
  };
  useEffect(render);

  const reprocessTimer = useRef(0);
  const reprocess = (e = edge) => {
    const { width: w, height: h } = base.current;
    if (!w) return;
    const a = alphaOf(base.current.getContext('2d')!.getImageData(0, 0, w, h));
    maskCanvas(processMask(a, w, h, e), w, h, proc.current);
    force((n) => n + 1);
  };
  const reprocessSoon = (e: EdgeSettings) => {
    clearTimeout(reprocessTimer.current);
    reprocessTimer.current = window.setTimeout(() => reprocess(e), 90);
  };

  /* ---------- AI detection ---------- */
  const detect = async (kind = model) => {
    if (!src.current) return;
    setError('');
    const onP: Progress = (p) => setBusy(p);
    setBusy({ stage: 'Loading model…' });
    try {
      const t0 = performance.now();
      const m = await predictMask(src.current.source, kind, onP);
      snapshot();
      const { width: w, height: h } = base.current;
      maskCanvas(alphaOf(m), w, h, base.current);
      setHasMask(true);
      reprocess();
      toast(`Subject found in ${((performance.now() - t0) / 1000).toFixed(1)} s — on your device`, 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  /* ---------- history ---------- */
  const readBase = () => alphaOf(base.current.getContext('2d')!.getImageData(0, 0, base.current.width, base.current.height));
  const snapshot = () => {
    if (!hasMask && !base.current.width) return;
    undo.current.push(readBase());
    if (undo.current.length > UNDO_LIMIT) undo.current.shift();
    redo.current = [];
  };
  const step = (from: React.MutableRefObject<Uint8ClampedArray[]>, to: React.MutableRefObject<Uint8ClampedArray[]>) => {
    const a = from.current.pop();
    if (!a) return;
    to.current.push(readBase());
    maskCanvas(a, base.current.width, base.current.height, base.current);
    setHasMask(true);
    reprocess();
  };
  const doUndo = () => step(undo, redo);
  const doRedo = () => step(redo, undo);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!img || (e.target as HTMLElement)?.closest('input')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) doRedo();
        else doUndo();
      } else if (e.key === '[') setBrush((b) => Math.max(4, Math.round(b / 1.2)));
      else if (e.key === ']') setBrush((b) => Math.min(400, Math.round(b * 1.2)));
      else if (e.key.toLowerCase() === 'x') setMode((m) => (m === 'erase' ? 'restore' : 'erase'));
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- brush ---------- */
  const onStroke = (phase: 'start' | 'move' | 'end', p: StrokePoint) => {
    if (!hasMask) return;
    if (phase === 'start') {
      snapshot();
      last.current = null;
    }
    if (phase !== 'end') {
      const m = mode === 'erase' ? 'erase' : 'paint';
      paintDab(base.current.getContext('2d')!, last.current, p, hardness, m);
      // live feedback on the processed mask; exact edge settings re-applied on release
      paintDab(proc.current.getContext('2d')!, last.current, p, hardness, m);
      last.current = p;
      render();
    } else {
      last.current = null;
      reprocess();
    }
  };

  /* ---------- apply ---------- */
  const apply = async () => {
    const s = src.current;
    if (!img || !s || !hasMask) return;
    setBusy({ stage: 'Saving cutout…' });
    try {
      const { width: w, height: h } = proc.current;
      const alpha = alphaOf(proc.current.getContext('2d')!.getImageData(0, 0, w, h));
      const blob = await cutoutPNG(s.source, alpha, w, h, { decontaminate: decon });
      // the original must exist as an asset so the cutout can always be undone / refined
      let originalId = s.originalAssetId ?? s.assetId;
      if (!originalId) {
        const ob = await (await fetch(s.source.src)).blob();
        const oa: Asset = { id: uid('a_'), name: s.name, type: ob.type || 'image/png', blob: ob, width: w, height: h, size: ob.size, favorite: false, createdAt: Date.now() };
        await putAsset(oa);
        originalId = oa.id;
      }
      const orig = await getAsset(originalId);
      const asset: Asset = {
        id: uid('a_'),
        name: `${(orig?.name ?? s.name).replace(/ – cutout$/, '')} – cutout`,
        type: 'image/png',
        blob,
        width: w,
        height: h,
        size: blob.size,
        favorite: false,
        createdAt: Date.now(),
        credit: orig?.credit,
      };
      await putAsset(asset);
      await engine.swapImageAsset(img, asset, originalId);
      if (bg.kind !== 'none') await engine.addBehind(img, bg);
      engine.select([img]);
      toast(bg.kind === 'none' ? 'Background removed' : 'Background replaced', 'success');
      close();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  const brushColor = mode === 'erase' ? '#ff4d7a' : '#5ee38f';
  const swatches = useMemo(() => ['#ffffff', '#f4efe6', '#111111', '#e9e4ff', '#ffd9cf', '#d8efe3', '#1d3b5c', '#c9a227'], []);
  if (!img) return null;

  return (
    <div className="modal-back studio-back">
      <div className="modal studio" role="dialog" aria-label="Remove background" onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Sparkles size={15} /> Remove background
          </h3>
          <span className="studio-badge">
            <Cpu size={12} /> On-device AI · free · nothing is uploaded
          </span>
          <button className="icon-btn sm" onClick={close} aria-label="Close" style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
        <div className="studio-body">
          <MaskStage canvasRef={canvasRef} width={size.w} height={size.h} brush={hasMask && !before ? brush : 0} brushColor={brushColor} backdrop={view === 'overlay' || !hasMask || before ? 'none' : view} onStroke={onStroke}>
            {busy && (
              <div className="studio-busy" data-testid="cutout-busy">
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
              <h6>1 · Detect subject</h6>
              <div className="model-list">
                {(Object.keys(SEG_MODELS) as SegModel[]).map((k) => (
                  <button key={k} className={`model-opt ${model === k ? 'on' : ''}`} onClick={() => setModel(k)} data-model={k}>
                    <b>{SEG_MODELS[k].label}</b>
                    <span>{SEG_MODELS[k].hint}</span>
                  </button>
                ))}
              </div>
              <button className="btn primary block" disabled={!!busy || !size.w} onClick={() => detect()} data-testid="detect">
                <Sparkles size={14} /> {hasMask ? 'Detect again' : 'Remove background'}
              </button>
              <p className="faint small">
                {MODEL_LICENSES[model]} · {dl} one-time download, then cached · runs on {device || '…'}
              </p>
              {error && <p className="err small">{error}</p>}
            </section>

            <section className={hasMask ? '' : 'dim'}>
              <h6>2 · Refine</h6>
              <div className="seg">
                <button className={mode === 'erase' ? 'on' : ''} onClick={() => setMode('erase')} title="Erase (X to toggle)">
                  <Eraser size={13} /> Erase
                </button>
                <button className={mode === 'restore' ? 'on' : ''} onClick={() => setMode('restore')} title="Restore (X to toggle)">
                  <Brush size={13} /> Restore
                </button>
              </div>
              <div className="prop-row">
                <span>Brush</span>
                <RangeField value={brush} min={4} max={400} onChange={(v) => setBrush(v)} unit="px" />
              </div>
              <div className="prop-row">
                <span>Hardness</span>
                <RangeField value={Math.round(hardness * 100)} min={0} max={100} onChange={(v) => setHardness(v / 100)} unit="%" />
              </div>
              <div className="prop-row">
                <span>Shift edge</span>
                <RangeField value={edge.shift} min={-20} max={20} onChange={(v, live) => { const e = { ...edge, shift: v }; setEdge(e); live ? reprocessSoon(e) : reprocess(e); }} unit="px" />
              </div>
              <div className="prop-row">
                <span>Smooth</span>
                <RangeField value={Math.round(edge.smooth * 100)} min={0} max={100} onChange={(v, live) => { const e = { ...edge, smooth: v / 100 }; setEdge(e); live ? reprocessSoon(e) : reprocess(e); }} unit="%" />
              </div>
              <div className="prop-row">
                <span>Feather</span>
                <RangeField value={edge.feather} min={0} max={30} onChange={(v, live) => { const e = { ...edge, feather: v }; setEdge(e); live ? reprocessSoon(e) : reprocess(e); }} unit="px" />
              </div>
              <div className="prop-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <span title="Removes the old background's colour from soft edges (hair, fur)">Clean edge colour</span>
                <Toggle on={decon} onChange={setDecon} />
              </div>
              <p className="faint small">[ ] brush size · X erase/restore · Space to pan · ⌘/Ctrl+wheel to zoom</p>
            </section>

            <section className={hasMask ? '' : 'dim'}>
              <h6>3 · Background</h6>
              <div className="bg-opts">
                <button className={bg.kind === 'none' ? 'on' : ''} onClick={() => setBg({ kind: 'none' })}>
                  <i className="chk" />
                  Transparent
                </button>
                <button className={bg.kind === 'color' ? 'on' : ''} onClick={() => setBg({ kind: 'color', color: bg.kind === 'color' ? bg.color : '#f4efe6' })}>
                  <i style={{ background: bg.kind === 'color' ? bg.color : '#f4efe6' }} />
                  Colour
                </button>
                <button className={bg.kind === 'blur' ? 'on' : ''} onClick={() => setBg({ kind: 'blur', amount: 0.35 })}>
                  <i className="blurchip" />
                  Blur original
                </button>
                <button className={bg.kind === 'asset' ? 'on' : ''} onClick={() => assets[0] && setBg({ kind: 'asset', asset: bg.kind === 'asset' ? bg.asset : assets.find((a) => a.id !== src.current?.assetId) ?? assets[0] })} disabled={!assets.length} title={assets.length ? '' : 'Upload a photo first'}>
                  <i className="photochip" />
                  Photo
                </button>
              </div>
              {bg.kind === 'color' && (
                <>
                  <div className="swatch-row">
                    {swatches.map((c) => (
                      <button key={c} className="sw" style={{ background: c }} onClick={() => setBg({ kind: 'color', color: c })} />
                    ))}
                  </div>
                  <ColorField value={bg.color} onChange={(c) => setBg({ kind: 'color', color: c })} />
                </>
              )}
              {bg.kind === 'blur' && (
                <div className="prop-row">
                  <span>Blur</span>
                  <RangeField value={Math.round(bg.amount * 100)} min={5} max={100} onChange={(v) => setBg({ kind: 'blur', amount: v / 100 })} unit="%" />
                </div>
              )}
              {bg.kind === 'asset' && (
                <div className="asset-pick">
                  {assets
                    .filter((a) => a.id !== src.current?.assetId && a.id !== src.current?.originalAssetId)
                    .map((a) => (
                      <button key={a.id} className={bg.asset.id === a.id ? 'on' : ''} onClick={() => setBg({ kind: 'asset', asset: a })} style={{ backgroundImage: `url(${assetURL(a)})` }} title={a.name} />
                    ))}
                </div>
              )}
              <p className="faint small">Added as a separate layer behind the cutout — edit or delete it any time. AI-generated scenes: AI Studio.</p>
            </section>
          </aside>
        </div>
        <div className="modal-foot">
          <button className="icon-btn" title="Undo (⌘Z)" onClick={doUndo} disabled={!undo.current.length}>
            <Undo2 size={15} />
          </button>
          <button className="icon-btn" title="Redo (⇧⌘Z)" onClick={doRedo} disabled={!redo.current.length}>
            <Redo2 size={15} />
          </button>
          <div className="seg compact" style={{ marginLeft: 8 }}>
            {(['checker', 'white', 'black', 'overlay'] as const).map((v) => (
              <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                {v === 'checker' ? 'Transparent' : v === 'overlay' ? 'Mask overlay' : v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn ghost" disabled={!hasMask} onPointerDown={() => setBefore(true)} onPointerUp={() => setBefore(false)} onPointerLeave={() => setBefore(false)} title="Hold to compare">
            Before
          </button>
          <span className="faint small" style={{ marginLeft: 'auto' }}>
            {size.w} × {size.h} px · original kept
          </span>
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={!hasMask || !!busy} onClick={apply} data-testid="apply-cutout">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
