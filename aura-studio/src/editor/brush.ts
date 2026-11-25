/**
 * Brush studio — expressive raster painting on paint layers.
 *
 * A paint layer is an image layer whose pixels live in a canvas while you
 * paint (smooth, live strokes). Each finished stroke is saved as a hidden
 * internal asset, so undo works per stroke and the design stays small.
 * Symmetry (mirror / quad / radial) is mirrored around the page centre.
 */
import { FabricImage, Point, util } from 'fabric';
import type { Engine } from './engine';
import { putAsset } from '../lib/db';
import { assetURL } from '../lib/assets';
import { uid } from '../lib/ids';
import type { Asset } from '../lib/types';

export type BrushKind = 'round' | 'airbrush' | 'spray' | 'chalk' | 'marker' | 'neon' | 'calligraphy' | 'stars' | 'confetti' | 'bubbles' | 'eraser' | 'smudge';
export type Symmetry = 'none' | 'x' | 'y' | 'quad' | 'radial';

export interface BrushStyle {
  kind: BrushKind;
  /** diameter in document px */
  size: number;
  opacity: number;
  hardness: number;
  /** dab spacing as a fraction of the size */
  spacing: number;
  color: string;
  rainbow: boolean;
  /** 0–1 random size / angle / hue variation */
  jitter: number;
  symmetry: Symmetry;
  radial: number;
}

export const BRUSH_DEFAULT: BrushStyle = { kind: 'round', size: 40, opacity: 1, hardness: 0.7, spacing: 0.12, color: '#ff2bd6', rainbow: false, jitter: 0, symmetry: 'none', radial: 6 };

export const BRUSHES: { kind: BrushKind; label: string; spacing: number; hint: string }[] = [
  { kind: 'round', label: 'Round', spacing: 0.12, hint: 'Clean round brush — hardness sets the edge' },
  { kind: 'airbrush', label: 'Airbrush', spacing: 0.06, hint: 'Soft, builds up gradually' },
  { kind: 'spray', label: 'Spray can', spacing: 0.08, hint: 'Street-art spray speckle' },
  { kind: 'chalk', label: 'Chalk', spacing: 0.1, hint: 'Grainy, dry texture' },
  { kind: 'marker', label: 'Marker', spacing: 0.08, hint: 'Flat chisel marker, layers like ink' },
  { kind: 'neon', label: 'Neon', spacing: 0.08, hint: 'Glowing tube with a bright core' },
  { kind: 'calligraphy', label: 'Calligraphy', spacing: 0.05, hint: 'Angled nib — thick and thin strokes' },
  { kind: 'stars', label: 'Stars', spacing: 1.1, hint: 'Scatters stars' },
  { kind: 'confetti', label: 'Confetti', spacing: 0.9, hint: 'Scatters colourful confetti' },
  { kind: 'bubbles', label: 'Bubbles', spacing: 1.2, hint: 'Scatters outlined bubbles' },
  { kind: 'smudge', label: 'Smudge', spacing: 0.08, hint: 'Pushes paint along the stroke' },
  { kind: 'eraser', label: 'Eraser', spacing: 0.1, hint: 'Erases paint' },
];

const MAX_SIDE = 2400;

function hexToRgb(h: string) {
  const n = parseInt((h || '#000000').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hsl = (h: number, s = 90, l = 58) => `hsl(${((h % 360) + 360) % 360},${s}%,${l}%)`;

type P = { x: number; y: number };

export class BrushSession {
  layer: FabricImage | null = null;
  paint: HTMLCanvasElement | null = null;
  private last: P[] | null = null; // last dab per symmetry copy (layer px)
  private travelled = 0;
  private hue0 = 0;
  private smudgeBuf: HTMLCanvasElement[] = [];
  private saving: Promise<void> = Promise.resolve();
  cursor: P | null = null;

  constructor(private engine: Engine, private style: () => BrushStyle) {}

  /** The paint layer to draw on: the selected one, or a fresh one on top. */
  private ensureLayer() {
    const c = this.engine.canvas;
    const objs = c.getObjects();
    // reacquire after undo/redo replaced the object
    if (this.layer && !objs.includes(this.layer)) this.layer = (objs.find((o: any) => o.id === (this.layer as any).id) as FabricImage) ?? null;
    const sel = c.getActiveObject() as any;
    if (sel?.paintLayer && sel !== this.layer) this.layer = sel;
    if (!this.layer) this.layer = this.newLayer();
    const el = this.layer.getElement() as HTMLCanvasElement | HTMLImageElement;
    if (!(el instanceof HTMLCanvasElement) || el !== this.paint) {
      const cv = document.createElement('canvas');
      cv.width = (el as HTMLImageElement).naturalWidth || el.width;
      cv.height = (el as HTMLImageElement).naturalHeight || el.height;
      cv.getContext('2d')!.drawImage(el, 0, 0);
      this.paint = cv;
      this.layer.setElement(cv);
      this.layer.objectCaching = false;
      // serialize as the saved asset, never as a giant data URL
      const layer = this.layer as any;
      layer.getSrc = () => (layer.__paintURL as string) || '';
    }
    return this.layer;
  }

  newLayer() {
    const { width, height } = this.engine.project;
    const s = Math.min(1, MAX_SIDE / Math.max(width, height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(width * s);
    cv.height = Math.round(height * s);
    const img = new FabricImage(cv, { originX: 'center', originY: 'center', scaleX: 1 / s, scaleY: 1 / s, objectCaching: false });
    img.setPositionByOrigin(new Point(width / 2, height / 2), 'center', 'center');
    const n = this.engine.canvas.getObjects().filter((o: any) => o.paintLayer).length + 1;
    Object.assign(img as any, { id: uid('o_'), name: `Paint ${n}`, paintLayer: true });
    (img as any).getSrc = () => (img as any).__paintURL || '';
    this.engine.canvas.add(img);
    this.engine.canvas.setActiveObject(img);
    this.layer = img;
    this.paint = cv;
    return img;
  }

  /** document point → layer pixel */
  private toLayer(p: P): P {
    const l = this.layer!;
    const inv = util.invertTransform(l.calcTransformMatrix());
    const q = util.transformPoint(new Point(p.x, p.y), inv);
    return { x: q.x + l.width / 2, y: q.y + l.height / 2 };
  }

  /** symmetric copies of a document point around the page centre */
  private mirrors(p: P): P[] {
    const st = this.style();
    const cx = this.engine.project.width / 2, cy = this.engine.project.height / 2;
    switch (st.symmetry) {
      case 'x':
        return [p, { x: 2 * cx - p.x, y: p.y }];
      case 'y':
        return [p, { x: p.x, y: 2 * cy - p.y }];
      case 'quad':
        return [p, { x: 2 * cx - p.x, y: p.y }, { x: p.x, y: 2 * cy - p.y }, { x: 2 * cx - p.x, y: 2 * cy - p.y }];
      case 'radial': {
        const n = Math.max(2, Math.round(st.radial));
        const dx = p.x - cx, dy = p.y - cy;
        return Array.from({ length: n }, (_, k) => {
          const a = (k * 2 * Math.PI) / n;
          return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
        });
      }
      default:
        return [p];
    }
  }

  down(p: P, pressure = 1) {
    this.ensureLayer();
    this.last = null;
    this.travelled = 0;
    this.hue0 = Math.random() * 360;
    this.smudgeBuf = [];
    this.move(p, pressure, true);
  }

  move(p: P, pressure = 1, first = false) {
    this.cursor = p;
    if (!this.layer || !this.paint || (!first && !this.last)) return;
    const st = this.style();
    const k = this.paint.width / this.layer.getScaledWidth(); // layer px per document px
    const size = Math.max(1, st.size * k);
    const pts = this.mirrors(p).map((q) => this.toLayer(q));
    const ctx = this.paint.getContext('2d', { willReadFrequently: st.kind === 'smudge' })!;
    const step = Math.max(1, size * Math.max(0.02, st.spacing));
    pts.forEach((to, i) => {
      const from = this.last?.[i];
      if (!from) {
        this.dab(ctx, to, to, size, pressure, i);
        return;
      }
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const n = Math.floor(dist / step);
      for (let s = 1; s <= n; s++) {
        const t = s / n;
        this.dab(ctx, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, from, size, pressure, i);
      }
    });
    if (this.last) this.travelled += Math.hypot(pts[0].x - this.last[0].x, pts[0].y - this.last[0].y);
    // only advance the anchor once a dab was placed, so slow strokes still paint
    if (!this.last || pts.every((q, i) => Math.hypot(q.x - this.last![i].x, q.y - this.last![i].y) >= step)) this.last = pts;
    this.layer.dirty = true;
    this.engine.canvas.requestRenderAll();
  }

  private dab(ctx: CanvasRenderingContext2D, at: P, prev: P, size: number, pressure: number, copy: number) {
    const st = this.style();
    const j = st.jitter;
    const r = (size / 2) * pressure * (1 - j * 0.5 * Math.random());
    const color = st.rainbow ? hsl(this.hue0 + this.travelled * 0.6 + copy * 40) : j > 0 ? jitterColor(st.color, j) : st.color;
    ctx.save();
    ctx.globalAlpha = st.opacity;
    switch (st.kind) {
      case 'round':
      case 'airbrush': {
        const hard = st.kind === 'airbrush' ? 0 : st.hardness;
        if (st.kind === 'airbrush') ctx.globalAlpha = st.opacity * 0.08;
        softDisc(ctx, at.x, at.y, r, hard, color);
        break;
      }
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        softDisc(ctx, at.x, at.y, r, st.hardness, '#000');
        break;
      case 'spray': {
        ctx.fillStyle = color;
        const n = Math.max(6, Math.round(r * 0.9));
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
          const s = Math.max(0.6, r * 0.035 * (0.5 + Math.random()));
          ctx.globalAlpha = st.opacity * (0.4 + Math.random() * 0.6);
          ctx.fillRect(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, s, s);
        }
        break;
      }
      case 'chalk': {
        ctx.fillStyle = color;
        const n = Math.max(10, Math.round(r * 1.6));
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
          ctx.globalAlpha = st.opacity * 0.35 * Math.random();
          const s = Math.max(1, r * 0.12 * Math.random());
          ctx.fillRect(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d, s, s * 0.6);
        }
        break;
      }
      case 'marker': {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = st.opacity * 0.25;
        ctx.translate(at.x, at.y);
        ctx.rotate(-Math.PI / 5);
        ctx.fillStyle = color;
        ctx.fillRect(-r * 0.35, -r, r * 0.7, r * 2);
        break;
      }
      case 'neon': {
        ctx.globalCompositeOperation = 'lighter';
        softDisc(ctx, at.x, at.y, r * 1.8, 0, color, 0.12);
        ctx.globalAlpha = st.opacity;
        softDisc(ctx, at.x, at.y, r * 0.55, 0.6, color);
        softDisc(ctx, at.x, at.y, r * 0.22, 0.8, '#ffffff');
        break;
      }
      case 'calligraphy': {
        ctx.translate(at.x, at.y);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, Math.max(1, r * 0.18), 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'stars':
        stamp(ctx, at, r * (0.5 + Math.random() * 0.8), Math.random() * Math.PI, st.rainbow ? color : jitterColor(st.color, Math.max(j, 0.25)), 'star');
        break;
      case 'confetti': {
        const palette = ['#ff2bd6', '#3cf2ff', '#ffe66d', '#7c5cff', '#00ffa3', '#ff6f61'];
        const c = st.rainbow ? color : Math.random() < 0.5 ? st.color : palette[Math.floor(Math.random() * palette.length)];
        const off = { x: at.x + (Math.random() - 0.5) * r * 2, y: at.y + (Math.random() - 0.5) * r * 2 };
        stamp(ctx, off, r * (0.25 + Math.random() * 0.4), Math.random() * Math.PI, c, Math.random() < 0.5 ? 'rect' : 'circle');
        break;
      }
      case 'bubbles':
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        ctx.arc(at.x + (Math.random() - 0.5) * r, at.y + (Math.random() - 0.5) * r, r * (0.2 + Math.random() * 0.6), 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'smudge': {
        // carry pixels from the previous dab to this one
        const d = Math.ceil(r * 2);
        let buf = this.smudgeBuf[copy];
        if (!buf) {
          buf = document.createElement('canvas');
          buf.width = buf.height = d;
          buf.getContext('2d')!.drawImage(ctx.canvas, prev.x - r, prev.y - r, d, d, 0, 0, d, d);
          this.smudgeBuf[copy] = buf;
        }
        ctx.globalAlpha = 0.55 * st.opacity;
        const m = document.createElement('canvas');
        m.width = m.height = d;
        const mx = m.getContext('2d')!;
        mx.drawImage(buf, 0, 0);
        mx.globalCompositeOperation = 'destination-in';
        softDisc(mx, d / 2, d / 2, r, 0.3, '#000');
        ctx.drawImage(m, at.x - r, at.y - r);
        // pick up some of what is here now
        const bx = buf.getContext('2d')!;
        bx.globalAlpha = 0.35;
        bx.drawImage(ctx.canvas, at.x - r, at.y - r, d, d, 0, 0, d, d);
        bx.globalAlpha = 1;
        break;
      }
    }
    ctx.restore();
  }

  /** Stroke finished: save the layer pixels as an internal asset and record one undo step. */
  up() {
    const layer = this.layer, paint = this.paint;
    this.last = null;
    if (!layer || !paint) return Promise.resolve();
    this.saving = this.saving.then(async () => {
      const blob: Blob = await new Promise((res, rej) => paint.toBlob((b) => (b ? res(b) : rej(new Error('Could not save paint'))), 'image/png'));
      const asset: Asset = { id: uid('a_'), name: (layer as any).name || 'Paint', type: 'image/png', blob, width: paint.width, height: paint.height, size: blob.size, favorite: false, createdAt: Date.now(), internal: true };
      await putAsset(asset);
      (layer as any).assetId = asset.id;
      (layer as any).__paintURL = assetURL(asset);
      if (layer.filters?.length) layer.applyFilters();
      this.engine.commit();
    });
    return this.saving;
  }
}

function softDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hardness: number, color: string, alphaScale = 1) {
  const [R, G, B] = color.startsWith('#') ? hexToRgb(color) : [0, 0, 0];
  if (!color.startsWith('#')) {
    // hsl() colours: draw with a radial gradient using the CSS colour directly
    const g = ctx.createRadialGradient(x, y, r * Math.min(0.99, hardness), x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha *= alphaScale;
    ctx.fillStyle = hardness >= 0.99 ? color : g;
  } else if (hardness >= 0.99) {
    ctx.fillStyle = `rgba(${R},${G},${B},${alphaScale})`;
  } else {
    const g = ctx.createRadialGradient(x, y, r * hardness, x, y, r);
    g.addColorStop(0, `rgba(${R},${G},${B},${alphaScale})`);
    g.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function stamp(ctx: CanvasRenderingContext2D, at: P, r: number, rot: number, color: string, shape: 'star' | 'rect' | 'circle') {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  } else if (shape === 'rect') ctx.rect(-r, -r * 0.45, r * 2, r * 0.9);
  else ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function jitterColor(hex: string, j: number) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255, l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r / 255 ? ((g - b) / 255 / d + (g < b ? 6 : 0)) / 6 : max === g / 255 ? ((b - r) / 255 / d + 2) / 6 : ((r - g) / 255 / d + 4) / 6;
  }
  return hsl(h * 360 + (Math.random() - 0.5) * 140 * j, s * 100, l * 100);
}
