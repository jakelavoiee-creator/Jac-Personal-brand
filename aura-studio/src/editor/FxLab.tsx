/**
 * FX Lab panel (Properties): one-click looks, "Surprise me", and a stack of
 * editable effects on image layers. Other layers can be turned into an image
 * first (the original is kept, hidden).
 */
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Dices, Image as ImageIcon, Plus, Trash2, Wand2 } from 'lucide-react';
import { FabricImage, type FabricObject } from 'fabric';
import { useEngine } from './Editor';
import { useEditor } from './engine';
import { ColorField, RangeField } from '../ui/controls';
import { FX, FX_BY_ID, LOOKS, fxDefaults, randomStack, type FxOpts } from '../lib/fxlab';

const THUMB = 76;

/** Run an FX stack on a small canvas with the CPU implementations (for previews). */
function previewStack(base: HTMLCanvasElement, stack: Partial<FxOpts>[]) {
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(base, 0, 0);
  const img = x.getImageData(0, 0, c.width, c.height);
  const hex = (h: string) => {
    const n = parseInt((h || '#000000').slice(1), 16) || 0;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  for (const s of stack) {
    const o = { ...fxDefaults(s.effect!), ...s, seed: 7 };
    const d = FX_BY_ID[o.effect];
    const src = new Uint8ClampedArray(img.data);
    // previews are tiny; scale pixel-size effects to the thumbnail
    d.cpu({ src, dst: img.data, w: c.width, h: c.height, p1: o.p1, p2: o.p2, amount: o.amount, c1: hex(o.c1), c2: hex(o.c2), seed: o.seed });
    if (!d.strength && o.amount < 1) for (let i = 0; i < img.data.length; i++) img.data[i] = src[i] + (img.data[i] - src[i]) * o.amount;
  }
  x.putImageData(img, 0, 0);
  return c.toDataURL('image/jpeg', 0.8);
}

export default function FxLabSection({ o }: { o: FabricObject }) {
  const engine = useEngine();
  useEditor((s) => s.objVersion);
  if (!(o instanceof FabricImage))
    return (
      <div className="props-section">
        <h6>
          FX Lab <span className="tag">Images</span>
        </h6>
        <p className="faint small" style={{ marginBottom: 8 }}>
          Glitch, halftone, kaleidoscope, twirl, neon and 20 more effects work on image layers. Turn this layer into an image to use them — the original is kept, hidden, underneath.
        </p>
        <button className="btn sm block" onClick={() => engine.rasterize(o)} data-testid="rasterize">
          <ImageIcon size={13} /> Turn into image
        </button>
      </div>
    );
  return <FxStack img={o} />;
}

function FxStack({ img }: { img: FabricImage }) {
  const engine = useEngine();
  const stack = engine.fxStackOf(img);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  // look previews from the unfiltered pixels
  useEffect(() => {
    const el = (img as any)._originalElement ?? img.getElement();
    if (!el) return;
    const base = document.createElement('canvas');
    const k = THUMB / Math.min(el.naturalWidth || el.width, el.naturalHeight || el.height);
    base.width = base.height = THUMB;
    const bx = base.getContext('2d')!;
    const w = (el.naturalWidth || el.width) * k, h = (el.naturalHeight || el.height) * k;
    bx.drawImage(el, (THUMB - w) / 2, (THUMB - h) / 2, w, h);
    const id = setTimeout(() => {
      const out: Record<string, string> = {};
      for (const l of LOOKS) out[l.id] = previewStack(base, l.stack);
      setThumbs(out);
    }, 30);
    return () => clearTimeout(id);
  }, [img, (img as any).assetId]);  

  const set = (next: FxOpts[], live = false) => engine.setFxStack(img, next, live);
  const patch = (i: number, p: Partial<FxOpts>, live = false) => set(stack.map((s, k) => (k === i ? { ...s, ...p } : s)), live);
  const move = (i: number, d: number) => {
    const n = [...stack];
    const [x] = n.splice(i, 1);
    n.splice(Math.max(0, Math.min(n.length, i + d)), 0, x);
    set(n);
  };

  return (
    <div className="props-section fxlab">
      <h6>
        FX Lab <span className="tag">Stackable</span>
      </h6>
      <div className="fx-looks">
        {LOOKS.map((l) => (
          <button key={l.id} title={l.label} onClick={() => set(l.stack.map((s) => ({ ...fxDefaults(s.effect!), ...s })))} data-testid="fx-look">
            {thumbs[l.id] ? <img src={thumbs[l.id]} alt="" /> : <span />}
            <small>{l.label}</small>
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 6, margin: '8px 0' }}>
        <button className="btn sm" onClick={() => set(randomStack())} data-testid="fx-surprise" title="A random stack of effects — click again for another">
          <Dices size={13} /> Surprise me
        </button>
        <select
          className="select"
          style={{ flex: 1 }}
          value=""
          onChange={(e) => e.target.value && set([...stack, fxDefaults(e.target.value)])}
          data-testid="fx-add"
          aria-label="Add effect"
        >
          <option value="">+ Add effect…</option>
          {(['Colour', 'Stylize', 'Distort', 'Blur'] as const).map((g) => (
            <optgroup key={g} label={g}>
              {FX.filter((f) => f.group === g).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {stack.length === 0 && (
        <p className="faint small">
          <Wand2 size={11} /> Pick a look, add an effect, or roll the dice. Effects stack top to bottom and stay editable.
        </p>
      )}
      {stack.map((s, i) => {
        const d = FX_BY_ID[s.effect];
        if (!d) return null;
        return (
          <div key={`${i}-${s.effect}`} className="fx-item" data-testid="fx-item">
            <div className="fx-item-head">
              <b>{d.label}</b>
              <button className="icon-btn sm" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={12} />
              </button>
              <button className="icon-btn sm" title="Move down" disabled={i === stack.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={12} />
              </button>
              <button className="icon-btn sm" title="Remove" onClick={() => set(stack.filter((_, k) => k !== i))}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="prop-row">
              <span>{d.strength ? 'Strength' : 'Mix'}</span>
              <RangeField value={Math.round(s.amount * 100)} min={0} max={100} unit="%" onChange={(v, live) => patch(i, { amount: v / 100 }, live)} />
            </div>
            {d.params.map((p) => (
              <div key={p.key} className="prop-row">
                <span>{p.label}</span>
                <RangeField value={s[p.key]} min={p.min} max={p.max} step={p.step ?? 0.01} precision={(p.step ?? 0.01) < 1 ? 2 : 0} onChange={(v, live) => patch(i, { [p.key]: v }, live)} />
              </div>
            ))}
            {d.colors &&
              (['c1', 'c2'] as const).map((k, j) => (
                <div key={k} className="prop-row">
                  <span>{d.colorLabels?.[j] ?? `Colour ${j + 1}`}</span>
                  <ColorField value={s[k]} onChange={(v, live) => patch(i, { [k]: v }, live)} />
                </div>
              ))}
            {(s.effect === 'glitch' || s.effect === 'vhs' || s.effect === 'noise') && (
              <button className="btn ghost sm" onClick={() => patch(i, { seed: Math.round(Math.random() * 1000) })}>
                <Dices size={12} /> Reroll
              </button>
            )}
          </div>
        );
      })}
      {stack.length > 0 && (
        <button className="btn ghost sm" onClick={() => set([])} data-testid="fx-clear">
          <Plus size={12} style={{ transform: 'rotate(45deg)' }} /> Clear FX
        </button>
      )}
    </div>
  );
}
