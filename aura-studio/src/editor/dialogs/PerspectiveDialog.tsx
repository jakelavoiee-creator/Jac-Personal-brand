/**
 * Place on a photo — packaging, posters, labels, bags, screens: put the
 * current design onto any surface in your own photo with a 4-corner
 * perspective warp and the photo's own lighting. Optional AI lifestyle scene
 * (paid, OpenAI key) built from the finished mockup.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Download, ImagePlus, KeyRound, Loader2, Package, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RangeField } from '../../ui/controls';
import { defaultQuad, warpOnto, type Quad } from '../../lib/perspective';
import { listAssets } from '../../lib/db';
import { assetURL, importFile, ACCEPTED_UPLOADS } from '../../lib/assets';
import { pickFiles, downloadBlob } from '../../lib/download';
import { editImages, hasOpenAI, openaiModel, sizeFor } from '../../lib/ai/openai';
import { saveAIAsset } from '../../lib/ai/save';
import { toast } from '../../store/app';
import type { Asset } from '../../lib/types';

const PREVIEW_MAX = 1400;
const toBlob = (c: HTMLCanvasElement, type = 'image/png') => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Export failed'))), type, 0.95));
const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Could not read this photo.'));
    i.src = src;
  });

export default function PerspectiveDialog() {
  const engine = useEngine();
  const open = useEditor((s) => s.perspective);
  const close = () => useEditor.setState({ perspective: false });
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [photo, setPhoto] = useState<{ asset: Asset; img: HTMLImageElement } | null>(null);
  const [art, setArt] = useState<HTMLCanvasElement | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null); // in photo pixels
  const [blend, setBlend] = useState<'normal' | 'multiply'>('multiply');
  const [lighting, setLighting] = useState(0.6);
  const [opacity, setOpacity] = useState(0.96);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [scenes, setScenes] = useState<Asset[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const [view, setView] = useState({ k: 1 }); // display px per photo px

  useEffect(() => {
    if (!open) return;
    setError('');
    listAssets().then((a) => setPhotos(a.filter((x) => /^image\/(png|jpe?g|webp)$/.test(x.type))));
    const p = engine.project;
    engine.pageCanvas(engine.pageIndex, Math.min(1, 2400 / Math.max(p.width, p.height))).then(setArt);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (a: Asset) => {
    const img = await loadImg(assetURL(a));
    setPhoto({ asset: a, img });
    if (art) setQuad(defaultQuad(img.naturalWidth, img.naturalHeight, art.width, art.height));
  };
  useEffect(() => {
    if (photo && art && !quad) setQuad(defaultQuad(photo.img.naturalWidth, photo.img.naturalHeight, art.width, art.height));
  }, [art, photo, quad]);

  /** Compose at a given scale (preview or full resolution). */
  const compose = (scale: number) => {
    const img = photo!.img;
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0, c.width, c.height);
    const q = quad!.map((p) => ({ x: p.x * scale, y: p.y * scale })) as Quad;
    // keep the artwork sampled at roughly the size it covers
    warpOnto(x, art!, q, { blend, lighting, opacity });
    return c;
  };

  // live preview (downscaled)
  useEffect(() => {
    if (!photo || !art || !quad || !canvasRef.current) return;
    const id = requestAnimationFrame(() => {
      const s = Math.min(1, PREVIEW_MAX / Math.max(photo.img.naturalWidth, photo.img.naturalHeight));
      try {
        const c = compose(s);
        const v = canvasRef.current!;
        v.width = c.width;
        v.height = c.height;
        v.getContext('2d')!.drawImage(c, 0, 0);
        setView({ k: v.getBoundingClientRect().width / photo.img.naturalWidth });
        setError('');
      } catch (e: any) {
        setError(e.message);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [photo, art, quad, blend, lighting, opacity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => photo && canvasRef.current && setView({ k: canvasRef.current.getBoundingClientRect().width / photo.img.naturalWidth });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [photo]);

  const onMove = (e: React.PointerEvent) => {
    if (drag.current === null || !quad || !canvasRef.current || !photo) return;
    const r = canvasRef.current.getBoundingClientRect();
    const k = photo.img.naturalWidth / r.width;
    const next = quad.map((p, i) => (i === drag.current ? { x: Math.max(0, Math.min(photo.img.naturalWidth, (e.clientX - r.left) * k)), y: Math.max(0, Math.min(photo.img.naturalHeight, (e.clientY - r.top) * k)) } : p)) as Quad;
    setQuad(next);
  };

  const finish = async (mode: 'download' | 'save' | 'add') => {
    if (!photo || !art || !quad) return;
    setBusy('Rendering full resolution…');
    try {
      const c = compose(1);
      const blob = await toBlob(c, photo.asset.type === 'image/png' ? 'image/png' : 'image/jpeg');
      const name = `${engine.project.title} mockup`;
      if (mode === 'download') downloadBlob(blob, `${name.replace(/[^\w-]+/g, '-')}.${blob.type === 'image/png' ? 'png' : 'jpg'}`);
      else {
        const asset = await importFile(new File([blob], `${name}.${blob.type === 'image/png' ? 'png' : 'jpg'}`, { type: blob.type }));
        if (mode === 'add') {
          await engine.addAsset(asset);
          close();
        }
        toast(mode === 'add' ? 'Mockup added to the design' : 'Mockup saved to Uploads', 'success');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const aiScene = async () => {
    if (!photo || !art || !quad) return;
    setBusy('Generating a lifestyle scene with OpenAI…');
    setError('');
    try {
      const c = compose(Math.min(1, 1536 / Math.max(photo.img.naturalWidth, photo.img.naturalHeight)));
      const prompt = `Turn this product mockup into a photorealistic lifestyle photograph${scenePrompt.trim() ? `: ${scenePrompt.trim()}` : ''}. Keep the product and its printed design exactly as they are — same artwork, text, colours and proportions. Natural light, realistic shadows and depth of field.`;
      const [b] = await editImages({ prompt, images: [await toBlob(c)], size: sizeFor(c.width, c.height), quality: 'medium' });
      const a = await saveAIAsset(b, { name: `${engine.project.title} scene`, prompt, model: openaiModel(), provider: 'OpenAI' });
      setScenes((s) => [a, ...s]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  if (!open) return null;
  return (
    <div className="modal-back studio-back">
      <div className="modal studio" role="dialog" aria-label="Place on a photo" onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Package size={15} /> Place on a photo
          </h3>
          <span className="studio-badge">Free · runs on your device</span>
          <button className="icon-btn sm" onClick={close} aria-label="Close" style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
        <div className="studio-body">
          <div className="mstage-outer persp-stage" ref={stage} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
            {photo ? (
              <div className="persp-wrap">
                <canvas ref={canvasRef} className="persp-canvas" data-testid="persp-canvas" />
                {quad && (
                  <>
                    <svg className="persp-outline" viewBox={`0 0 ${photo.img.naturalWidth} ${photo.img.naturalHeight}`} preserveAspectRatio="none">
                      <polygon points={quad.map((p) => `${p.x},${p.y}`).join(' ')} vectorEffect="non-scaling-stroke" />
                    </svg>
                    {quad.map((p, i) => (
                      <div key={i} className="persp-handle" style={{ left: p.x * view.k, top: p.y * view.k }} onPointerDown={(e) => ((drag.current = i), (e.target as Element).setPointerCapture(e.pointerId))} data-testid={`persp-h${i}`} />
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="persp-empty">
                <Package size={26} />
                <p>Choose a photo of a box, poster, bag, label, wall or screen — then drag the four corners onto the surface.</p>
              </div>
            )}
            {busy && (
              <div className="studio-busy">
                <Loader2 size={20} className="spin" />
                <div>{busy}</div>
              </div>
            )}
          </div>
          <aside className="studio-side">
            <section>
              <h6>1 · Photo</h6>
              <button
                className="btn sm"
                onClick={async () => {
                  const files = await pickFiles(ACCEPTED_UPLOADS, false);
                  if (!files[0]) return;
                  const a = await importFile(files[0]);
                  setPhotos((p) => [a, ...p]);
                  choose(a);
                }}
                data-testid="persp-upload"
              >
                <Upload size={13} /> Upload a photo
              </button>
              <div className="asset-pick">
                {photos.map((a) => (
                  <button key={a.id} className={photo?.asset.id === a.id ? 'on' : ''} style={{ backgroundImage: `url(${assetURL(a)})` }} title={a.name} onClick={() => choose(a)} data-testid="persp-photo" />
                ))}
              </div>
            </section>
            <section className={photo ? '' : 'dim'}>
              <h6>2 · Fit & blend</h6>
              <p className="faint small">Drag the four corners onto the surface. The current page is the artwork.</p>
              <div className="seg">
                <button className={blend === 'multiply' ? 'on' : ''} onClick={() => setBlend('multiply')} title="Printed look — takes the surface colour and texture">
                  Printed
                </button>
                <button className={blend === 'normal' ? 'on' : ''} onClick={() => setBlend('normal')} title="Opaque — stickers, screens, labels">
                  Opaque
                </button>
              </div>
              <div className="prop-row">
                <span>Lighting</span>
                <RangeField value={Math.round(lighting * 100)} min={0} max={100} onChange={(v) => setLighting(v / 100)} unit="%" />
              </div>
              <div className="prop-row">
                <span>Opacity</span>
                <RangeField value={Math.round(opacity * 100)} min={10} max={100} onChange={(v) => setOpacity(v / 100)} unit="%" />
              </div>
              <button className="btn sm ghost" onClick={() => photo && art && setQuad(defaultQuad(photo.img.naturalWidth, photo.img.naturalHeight, art.width, art.height))}>
                <RotateCcw size={13} /> Reset corners
              </button>
              {error && <p className="err small">{error}</p>}
            </section>
            <section className={photo ? '' : 'dim'}>
              <h6>
                3 · AI lifestyle scene <span className="tag paid">Paid</span>
              </h6>
              {!hasOpenAI() ? (
                <div className="ai-key-note">
                  <KeyRound size={14} />
                  <span>Optional — needs your OpenAI key (Settings), billed per image.</span>
                </div>
              ) : (
                <>
                  <textarea className="input" rows={2} placeholder="e.g. on a marble café table, morning light" value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} onKeyDown={(e) => e.stopPropagation()} data-testid="scene-prompt" />
                  <button className="btn sm" disabled={!!busy} onClick={aiScene} data-testid="scene-run">
                    <Sparkles size={13} /> Generate scene
                  </button>
                </>
              )}
              {scenes.length > 0 && (
                <div className="asset-pick">
                  {scenes.map((a) => (
                    <button key={a.id} style={{ backgroundImage: `url(${assetURL(a)})` }} title="Add to design" onClick={() => engine.addAsset(a).then(close)} data-testid="scene-result" />
                  ))}
                </div>
              )}
              <p className="faint small">The composed mockup is sent to OpenAI; results are saved to Uploads.</p>
            </section>
          </aside>
        </div>
        <div className="modal-foot">
          <span className="faint small" style={{ marginRight: 'auto' }}>
            {photo ? `${photo.img.naturalWidth} × ${photo.img.naturalHeight} px` : ''}
          </span>
          <button className="btn ghost" onClick={close}>
            Close
          </button>
          <button className="btn" disabled={!photo || !!busy} onClick={() => finish('download')} data-testid="persp-download">
            <Download size={14} /> Download
          </button>
          <button className="btn" disabled={!photo || !!busy} onClick={() => finish('save')}>
            <ImagePlus size={14} /> Save to Uploads
          </button>
          <button className="btn primary" disabled={!photo || !!busy} onClick={() => finish('add')} data-testid="persp-add">
            <Check size={14} /> Add to design
          </button>
        </div>
      </div>
    </div>
  );
}
