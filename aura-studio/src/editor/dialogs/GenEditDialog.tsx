/**
 * Generative edit (PAID — the user's OpenAI key):
 *  • Fill / replace — paint an area and describe what should be there
 *  • Background scene — AI-selected background, regenerated from a prompt
 *  • Expand — grow the canvas and let the model continue the picture
 * Only the edited pixels are taken from the model; the rest of the photo keeps
 * its original full-resolution pixels.
 */
import { useEffect, useRef, useState } from 'react';
import { Brush, Check, Eraser, KeyRound, Loader2, Maximize2, Redo2, ScanLine, Sparkles, Trash2, Undo2, UserRound } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RangeField } from '../../ui/controls';
import { toast } from '../../store/app';
import { MaskStage, paintDab, type StrokePoint } from './MaskStage';
import { editImages, hasOpenAI, openaiModel, sizeFor, type Quality } from '../../lib/ai/openai';
import { alphaOf, blurChannel } from '../../lib/ai/mask';
import { maskBounds } from '../../lib/ai/inpaint';
import { predictMask } from '../../lib/ai/segment';
import { getAsset, putAsset } from '../../lib/db';
import { uid } from '../../lib/ids';
import type { Asset } from '../../lib/types';

const PAINT = '#7c5cff';
type Box = { x: number; y: number; w: number; h: number };

const canvasOf = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const toBlob = (c: HTMLCanvasElement, type = 'image/png', q?: number) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), type, q));
const parseSize = (s: string) => s.split('x').map(Number) as [number, number];

/** Crop window around the edit area with exactly the aspect of a supported output size. */
function windowFor(b: Box, W: number, H: number): { box: Box; size: string } {
  const pad = Math.max(b.w, b.h) * 0.6;
  let x0 = Math.max(0, b.x - pad), y0 = Math.max(0, b.y - pad);
  const x1 = Math.min(W, b.x + b.w + pad), y1 = Math.min(H, b.y + b.h + pad);
  const size = sizeFor(x1 - x0, y1 - y0);
  const [sw, sh] = parseSize(size);
  const ar = sw / sh;
  let w = x1 - x0, h = y1 - y0;
  // grow the short side to the target aspect, then shrink if it no longer fits
  if (w / h < ar) w = Math.min(W, h * ar);
  else h = Math.min(H, w / ar);
  if (w / h > ar) w = h * ar;
  else h = w / ar;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  x0 = Math.min(Math.max(0, cx - w / 2), W - w);
  y0 = Math.min(Math.max(0, cy - h / 2), H - h);
  return { box: { x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h) }, size };
}

const ASPECTS: { label: string; r: number | null }[] = [
  { label: 'Free', r: null },
  { label: '1:1', r: 1 },
  { label: '4:5', r: 4 / 5 },
  { label: '9:16', r: 9 / 16 },
  { label: '16:9', r: 16 / 9 },
  { label: '3:2', r: 3 / 2 },
];

export default function GenEditDialog() {
  const engine = useEngine();
  const tool = useEditor((s) => s.imageTool);
  const img = tool && (tool.kind === 'genfill' || tool.kind === 'expand') ? tool.img : null;
  const kind = tool?.kind;
  const close = () => useEditor.setState({ imageTool: null });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meta = useRef<{ name: string; assetId?: string; prev?: Asset } | null>(null);
  const work = useRef<HTMLCanvasElement[]>([]);
  const redo = useRef<HTMLCanvasElement[]>([]);
  const strokes = useRef<HTMLCanvasElement>(canvasOf(1, 1));
  const last = useRef<StrokePoint | null>(null);
  const abort = useRef<AbortController | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [prompt, setPrompt] = useState('');
  const [brush, setBrush] = useState(80);
  const [erasing, setErasing] = useState(false);
  const [painted, setPainted] = useState(false);
  const [quality, setQuality] = useState<Quality>('medium');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [before, setBefore] = useState(false);
  const [, force] = useState(0);
  // expand
  const [aspect, setAspect] = useState<number | null>(null);
  const [extra, setExtra] = useState(30);

  useEffect(() => {
    if (!img) return;
    setError('');
    setPrompt('');
    (async () => {
      const s = await engine.imageSources(img);
      // work on the visible (cropped) region
      const cx = Math.round(img.cropX ?? 0), cy = Math.round(img.cropY ?? 0);
      const w = Math.round(img.width), h = Math.round(img.height);
      const c = canvasOf(w, h);
      c.getContext('2d')!.drawImage(s.current, cx, cy, w, h, 0, 0, w, h);
      meta.current = { name: s.name, assetId: s.assetId, prev: s.assetId ? await getAsset(s.assetId) : undefined };
      work.current = [c];
      redo.current = [];
      strokes.current = canvasOf(w, h);
      setPainted(false);
      setSize({ w, h });
    })().catch((e) => setError(e?.message ?? String(e)));
  }, [img]);  

  const current = () => work.current[work.current.length - 1];

  /* expand geometry: new canvas size and where the picture sits in it */
  const expandGeom = () => {
    const { w, h } = size;
    let W = w * (1 + extra / 100), H = h * (1 + extra / 100);
    if (aspect) {
      // smallest frame of that aspect that contains the picture plus the margin
      const base = Math.max(w * (1 + extra / 100) / aspect, h * (1 + extra / 100));
      H = Math.max(base, h);
      W = Math.max(H * aspect, w);
      H = W / aspect;
    }
    W = Math.round(W);
    H = Math.round(H);
    return { W, H, ox: Math.round((W - w) / 2), oy: Math.round((H - h) / 2) };
  };

  const viewSize = kind === 'expand' && size.w && work.current.length < 2 ? expandGeom() : { W: size.w, H: size.h, ox: 0, oy: 0 };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w || !work.current.length) return;
    const { W, H, ox, oy } = viewSize;
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, W, H);
    if (before) {
      const f = work.current[0];
      x.drawImage(f, ox + (W - ox * 2 - f.width) / 2, oy + (H - oy * 2 - f.height) / 2);
    } else x.drawImage(current(), ox, oy);
    if (kind === 'expand' && ox + oy > 0) {
      x.strokeStyle = 'rgba(124,92,255,.9)';
      x.lineWidth = Math.max(2, W / 400);
      x.setLineDash([W / 80, W / 120]);
      x.strokeRect(ox, oy, size.w, size.h);
    }
    if (!before && kind === 'genfill') {
      x.globalAlpha = 0.5;
      x.drawImage(strokes.current, 0, 0);
      x.globalAlpha = 1;
    }
  });

  const clearStrokes = () => {
    strokes.current.getContext('2d')!.clearRect(0, 0, size.w, size.h);
    setPainted(false);
  };

  const onStroke = (phase: 'start' | 'move' | 'end', p: StrokePoint) => {
    if (busy || kind !== 'genfill') return;
    if (phase === 'start') last.current = null;
    if (phase === 'end') return void (last.current = null);
    paintDab(strokes.current.getContext('2d')!, last.current, p, 1, erasing ? 'erase' : 'paint', PAINT);
    last.current = p;
    setPainted(true);
    force((n) => n + 1);
  };

  /** Fill the stroke canvas from an AI subject mask (background = inverse). */
  const autoSelect = async (part: 'background' | 'subject') => {
    setError('');
    setBusy('Finding the subject on your device…');
    try {
      const m = await predictMask(current(), 'general');
      const ctx = strokes.current.getContext('2d')!;
      const d = ctx.createImageData(size.w, size.h);
      const [r, g, b] = [124, 92, 255];
      for (let i = 0; i < size.w * size.h; i++) {
        const a = m.data[i * 4 + 3];
        const v = part === 'background' ? 255 - a : a;
        // grow the selection slightly so seams fall inside the generated area
        d.data[i * 4] = r;
        d.data[i * 4 + 1] = g;
        d.data[i * 4 + 2] = b;
        d.data[i * 4 + 3] = v > 40 ? 255 : 0;
      }
      ctx.putImageData(d, 0, 0);
      setPainted(true);
      if (part === 'background' && !prompt) setPrompt('A bright, minimal studio backdrop with soft natural shadows');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy('');
    }
  };

  const runFill = async () => {
    const { w, h } = size;
    const mask = alphaOf(strokes.current.getContext('2d')!.getImageData(0, 0, w, h));
    const b = maskBounds(mask, w, h);
    if (!b) return;
    const { box, size: out } = windowFor(b, w, h);
    const [sw, sh] = parseSize(out);
    // image + mask at the output size (mask: transparent = area to generate)
    const ic = canvasOf(sw, sh);
    const ix = ic.getContext('2d')!;
    ix.imageSmoothingQuality = 'high';
    ix.drawImage(current(), box.x, box.y, box.w, box.h, 0, 0, sw, sh);
    const mc = canvasOf(sw, sh);
    const mx = mc.getContext('2d')!;
    mx.fillStyle = '#000';
    mx.fillRect(0, 0, sw, sh);
    mx.globalCompositeOperation = 'destination-out';
    mx.drawImage(strokes.current, box.x, box.y, box.w, box.h, 0, 0, sw, sh);
    const [res] = await editImages({
      prompt: prompt.trim() ? `${prompt.trim()}. Blend seamlessly with the surrounding photo: match lighting, perspective, grain and colour.` : 'Remove the masked content and continue the surrounding background naturally, matching lighting, texture and grain.',
      images: [await toBlob(ic)],
      mask: await toBlob(mc),
      size: out,
      quality,
      signal: abort.current?.signal,
    });
    const gen = await createImageBitmap(res);
    // paste back only the painted area, feathered, at full resolution
    const patch = canvasOf(box.w, box.h);
    const px = patch.getContext('2d', { willReadFrequently: true })!;
    px.imageSmoothingQuality = 'high';
    px.drawImage(gen, 0, 0, box.w, box.h);
    const sub = new Float32Array(box.w * box.h);
    for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) sub[y * box.w + x] = mask[(box.y + y) * w + box.x + x] > 16 ? 1 : 0;
    blurChannel(sub, box.w, box.h, Math.max(2, Math.round(Math.max(box.w, box.h) / 200)));
    const pd = px.getImageData(0, 0, box.w, box.h);
    for (let i = 0; i < sub.length; i++) pd.data[i * 4 + 3] = Math.min(1, sub[i] * 2) * 255;
    px.putImageData(pd, 0, 0);
    const outC = canvasOf(w, h);
    const ox = outC.getContext('2d')!;
    ox.drawImage(current(), 0, 0);
    ox.drawImage(patch, box.x, box.y);
    return outC;
  };

  const runExpand = async () => {
    const { W, H, ox, oy } = expandGeom();
    const out = sizeFor(W, H);
    const [sw, sh] = parseSize(out);
    const k = Math.min(sw / W, sh / H);
    const dx = (sw - W * k) / 2, dy = (sh - H * k) / 2;
    const ic = canvasOf(sw, sh);
    const ix = ic.getContext('2d')!;
    ix.imageSmoothingQuality = 'high';
    ix.drawImage(current(), dx + ox * k, dy + oy * k, size.w * k, size.h * k);
    // mask: the picture itself is kept (opaque), everything else is generated
    const mc = canvasOf(sw, sh);
    const mx = mc.getContext('2d')!;
    const inset = 2;
    mx.fillStyle = '#000';
    mx.fillRect(dx + ox * k + inset, dy + oy * k + inset, size.w * k - inset * 2, size.h * k - inset * 2);
    const [res] = await editImages({
      prompt: `${prompt.trim() ? prompt.trim() + '. ' : ''}Extend this photo outward beyond its edges, continuing the scene naturally with consistent perspective, lighting, colour and grain. Keep the original content unchanged.`,
      images: [await toBlob(ic)],
      mask: await toBlob(mc),
      size: out,
      quality,
      signal: abort.current?.signal,
    });
    const gen = await createImageBitmap(res);
    const outC = canvasOf(W, H);
    const x = outC.getContext('2d')!;
    x.imageSmoothingQuality = 'high';
    x.drawImage(gen, dx, dy, W * k, H * k, 0, 0, W, H);
    // original pixels back on top with a soft edge so the seam disappears
    const f = Math.max(4, Math.round(Math.min(size.w, size.h) / 60));
    const orig = canvasOf(size.w, size.h);
    const o = orig.getContext('2d', { willReadFrequently: true })!;
    o.drawImage(current(), 0, 0);
    const d = o.getImageData(0, 0, size.w, size.h);
    for (let yy = 0; yy < size.h; yy++)
      for (let xx = 0; xx < size.w; xx++) {
        const e = Math.min(xx, yy, size.w - 1 - xx, size.h - 1 - yy);
        if (e < f) d.data[(yy * size.w + xx) * 4 + 3] *= e / f;
      }
    o.putImageData(d, 0, 0);
    x.drawImage(orig, ox, oy);
    return outC;
  };

  const run = async () => {
    setError('');
    abort.current = new AbortController();
    setBusy(kind === 'expand' ? 'Expanding with OpenAI…' : 'Generating with OpenAI…');
    try {
      const out = kind === 'expand' ? await runExpand() : await runFill();
      if (!out) return;
      work.current.push(out);
      redo.current = [];
      if (kind === 'expand') setSize({ w: out.width, h: out.height });
      clearStrokes();
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? String(e));
    } finally {
      abort.current = null;
      setBusy('');
    }
  };

  const undo = () => {
    if (painted) return clearStrokes();
    if (work.current.length < 2) return;
    redo.current.push(work.current.pop()!);
    const c = current();
    if (c.width !== size.w || c.height !== size.h) {
      setSize({ w: c.width, h: c.height });
      strokes.current = canvasOf(c.width, c.height);
    }
    force((n) => n + 1);
  };
  const redoStep = () => {
    const r = redo.current.pop();
    if (!r) return;
    work.current.push(r);
    if (r.width !== size.w || r.height !== size.h) setSize({ w: r.width, h: r.height });
    force((n) => n + 1);
  };

  const apply = async () => {
    const m = meta.current;
    if (!img || !m || work.current.length < 2) return;
    setBusy('Saving…');
    try {
      const out = current();
      const type = m.prev?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await toBlob(out, type, 0.95);
      const asset: Asset = { id: uid('a_'), name: `${(m.prev?.name ?? m.name).replace(/ – (generative edit|expanded)$/, '')} – ${kind === 'expand' ? 'expanded' : 'generative edit'}`, type, blob, width: out.width, height: out.height, size: blob.size, favorite: false, createdAt: Date.now(), credit: { title: prompt || (kind === 'expand' ? 'Expanded' : 'Generative edit'), author: `AI · ${openaiModel()}`, license: 'AI-edited — usage per provider terms', source: 'OpenAI', sourceUrl: 'https://openai.com/policies/' } };
      await putAsset(asset);
      const first = work.current[0];
      const off = kind === 'expand' ? { x: (out.width - first.width) / 2, y: (out.height - first.height) / 2 } : { x: 0, y: 0 };
      await engine.swapImageReframed(img, asset, off);
      engine.select([img]);
      toast(kind === 'expand' ? 'Image expanded' : 'Generative edit applied', 'success');
      close();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy('');
    }
  };

  if (!img) return null;
  const keyed = hasOpenAI();
  const steps = work.current.length - 1;
  const canRun = keyed && !busy && (kind === 'expand' ? steps === 0 : painted);
  return (
    <div className="modal-back studio-back">
      <div className="modal studio" role="dialog" aria-label={kind === 'expand' ? 'Expand image' : 'Generative fill'} onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            {kind === 'expand' ? <Maximize2 size={15} /> : <Sparkles size={15} />} {kind === 'expand' ? 'Expand image' : 'Generative fill'}
          </h3>
          <span className="studio-badge paid">
            <KeyRound size={12} /> Paid · your OpenAI key · {openaiModel()}
          </span>
          <button className="icon-btn sm" onClick={close} aria-label="Close" style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
        <div className="studio-body">
          <MaskStage canvasRef={canvasRef} width={viewSize.W} height={viewSize.H} brush={kind === 'genfill' && !busy && !before ? brush : 0} brushColor={PAINT} backdrop="checker" onStroke={onStroke}>
            {busy && (
              <div className="studio-busy" data-testid="gen-busy">
                <Loader2 size={20} className="spin" />
                <div>{busy}</div>
                {abort.current && (
                  <button className="btn sm ghost" onClick={() => abort.current?.abort()}>
                    Cancel
                  </button>
                )}
              </div>
            )}
          </MaskStage>
          <aside className="studio-side">
            {!keyed && (
              <section>
                <div className="ai-key-note">
                  <KeyRound size={14} />
                  <span>
                    Needs <b>your OpenAI API key</b> (Settings). Each generation is billed by OpenAI.
                  </span>
                </div>
              </section>
            )}
            {kind === 'genfill' ? (
              <section>
                <h6>1 · Select the area</h6>
                <div className="seg">
                  <button className={!erasing ? 'on' : ''} onClick={() => setErasing(false)}>
                    <Brush size={13} /> Paint
                  </button>
                  <button className={erasing ? 'on' : ''} onClick={() => setErasing(true)}>
                    <Eraser size={13} /> Unpaint
                  </button>
                </div>
                <div className="prop-row">
                  <span>Brush</span>
                  <RangeField value={brush} min={4} max={400} onChange={(v) => setBrush(v)} unit="px" />
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn sm" style={{ flex: 1 }} disabled={!!busy} onClick={() => autoSelect('background')} title="On-device AI selects everything except the subject">
                    <ScanLine size={13} /> Background
                  </button>
                  <button className="btn sm" style={{ flex: 1 }} disabled={!!busy} onClick={() => autoSelect('subject')} title="On-device AI selects the main subject">
                    <UserRound size={13} /> Subject
                  </button>
                  <button className="btn sm" disabled={!painted || !!busy} onClick={clearStrokes} title="Clear selection">
                    <Trash2 size={13} />
                  </button>
                </div>
              </section>
            ) : (
              <section>
                <h6>1 · New frame</h6>
                <div className="chips">
                  {ASPECTS.map((a) => (
                    <button key={a.label} className={`chip ${aspect === a.r ? 'on' : ''}`} onClick={() => setAspect(a.r)} disabled={steps > 0}>
                      {a.label}
                    </button>
                  ))}
                </div>
                <div className="prop-row">
                  <span>Extra space</span>
                  <RangeField value={extra} min={10} max={100} onChange={(v) => setExtra(v)} unit="%" />
                </div>
                <p className="faint small">
                  {size.w} × {size.h} → {expandGeom().W} × {expandGeom().H} px. The original pixels stay untouched in the middle.
                </p>
              </section>
            )}
            <section>
              <h6>2 · Describe</h6>
              <textarea className="input prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder={kind === 'expand' ? 'Optional — e.g. more of the beach and sky' : 'What should be there? Leave empty to remove the object.'} data-testid="gen-prompt" />
              <div className="field">
                <span>Quality</span>
                <div className="seg">
                  {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                    <button key={q} className={quality === q ? 'on' : ''} onClick={() => setQuality(q)}>
                      {q[0].toUpperCase() + q.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn primary block" disabled={!canRun} onClick={run} data-testid="gen-run">
                <Sparkles size={14} /> {kind === 'expand' ? 'Expand' : prompt.trim() ? 'Generate' : 'Remove'}
              </button>
              <p className="faint small">The selected area and prompt are sent to OpenAI. Only the selected pixels are replaced — the rest of the photo is untouched.</p>
              {error && <p className="err small">{error}</p>}
            </section>
          </aside>
        </div>
        <div className="modal-foot">
          <button className="icon-btn" title="Undo" onClick={undo} disabled={!painted && steps < 1}>
            <Undo2 size={15} />
          </button>
          <button className="icon-btn" title="Redo" onClick={redoStep} disabled={!redo.current.length}>
            <Redo2 size={15} />
          </button>
          <button className="btn ghost" disabled={steps < 1} onPointerDown={() => setBefore(true)} onPointerUp={() => setBefore(false)} onPointerLeave={() => setBefore(false)}>
            Before
          </button>
          <span className="faint small" style={{ marginLeft: 'auto' }} data-testid="gen-steps">
            {steps} {steps === 1 ? 'edit' : 'edits'}
          </span>
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={steps < 1 || !!busy} onClick={apply} data-testid="gen-apply">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
