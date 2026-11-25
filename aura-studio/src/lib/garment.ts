/**
 * Garment mockups from Tapstitch design areas.
 *
 * Tapstitch describes each garment piece as ordered layers on a 700 px canvas
 * (garment colour, the garment photo for that colour, the artwork slot, an
 * outline cover) plus placement rectangles. We compose those layers with the
 * artwork, and add a fabric pass: the garment photo's folds and highlights are
 * measured against a heavily blurred copy of itself, and that ratio shades the
 * print so it sits in the cloth instead of floating on it.
 */
import { blurChannel } from './ai/mask';
import type { TsBox, TsCatalog, TsPlacement, TsPrintArea } from './tapstitch';

/** Garment documents use Tapstitch's 700 px canvas at 10× (7000 px pages). */
export const GARMENT_SCALE = 10;

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(url: string) {
  let p = images.get(url);
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('A garment image could not be loaded from Tapstitch.'));
      im.src = url;
    });
    images.set(url, p);
    p.catch(() => images.delete(url));
  }
  return p;
}

const visible = (l: { visible_color_ids?: string[] }, colorId: string) => !l.visible_color_ids?.length || l.visible_color_ids.includes(colorId);

/** Trace a placement rectangle (rotated about its centre) in canvas units × k. */
function boxPath(ctx: CanvasRenderingContext2D, b: TsBox, k: number) {
  const cx = (b.left + b.width / 2) * k, cy = (b.top + b.height / 2) * k;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((b.angle || 0) * Math.PI) / 180);
  ctx.rect((-b.width / 2) * k, (-b.height / 2) * k, b.width * k, b.height * k);
  ctx.restore();
}

export type Artwork =
  /** a full 700-space page (garment projects) */
  | { kind: 'page'; image: CanvasImageSource }
  /** one design fitted into each placement (try-on) */
  | { kind: 'fit'; image: CanvasImageSource & { width: number; height: number }; scale?: number; dx?: number; dy?: number };

export interface RenderOpts {
  /** output size in px (square) */
  size?: number;
  /** 0–1 strength of the fabric shading on the print */
  realism?: number;
  /** placements to fill (default: all of the piece) */
  placements?: string[];
  /** draw dashed placement outlines (editor backdrop) */
  outlines?: boolean;
  /** skip the artwork entirely (editor backdrop) */
  noArt?: boolean;
}

/** Shading map from the garment photo: local brightness relative to its surroundings. */
function shadingMap(base: ImageData, size: number) {
  const n = base.width * base.height;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = (base.data[i * 4] * 0.3 + base.data[i * 4 + 1] * 0.59 + base.data[i * 4 + 2] * 0.11) / 255 + 0.04;
  const avg = new Float32Array(lum);
  blurChannel(avg, base.width, base.height, Math.max(4, size / 22));
  for (let i = 0; i < n; i++) lum[i] = Math.min(1.45, Math.max(0.45, lum[i] / avg[i]));
  return lum;
}

/** Compose one garment piece with artwork. */
export async function renderPiece(cat: TsCatalog, piece: string, colorId: string, art: Artwork | null, o: RenderOpts = {}) {
  const area = cat.print_areas.find((a) => a.piece === piece) ?? cat.print_areas[0];
  const S = o.size ?? 1400;
  const k = S / cat.canvas.width;
  const color = cat.colors.find((c) => c.id === colorId) ?? cat.colors[0];
  const out = document.createElement('canvas');
  out.width = out.height = S;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  const layers = [...area.mockup_layers].sort((a, b) => a.z_index - b.z_index).filter((l) => visible(l, color.id));
  // fetch everything up front so drawing is synchronous and ordered
  const imgs = await Promise.all(layers.map((l) => (l.url && l.type !== 'user' ? loadImage(l.url) : Promise.resolve(null))));
  const placements = area.placements.filter((p) => !o.placements || o.placements.includes(p.id));
  const masks = await Promise.all(placements.map((p) => (p.mask_url ? loadImage(p.mask_url).catch(() => null) : Promise.resolve(null))));
  let drewArt = false;

  const drawArt = () => {
    drewArt = true;
    if (!art || o.noArt) return;
    const base = ctx.getImageData(0, 0, S, S);
    const layer = document.createElement('canvas');
    layer.width = layer.height = S;
    const lx = layer.getContext('2d', { willReadFrequently: true })!;
    lx.imageSmoothingQuality = 'high';
    placements.forEach((p, i) => {
      lx.save();
      lx.beginPath();
      boxPath(lx, p.design_area, k);
      lx.clip();
      if (art.kind === 'page') lx.drawImage(art.image, 0, 0, S, S);
      else drawFitted(lx, art, p.design_area, k);
      lx.restore();
      const m = masks[i];
      if (m) {
        // placement masks: opaque where printable
        const mc = document.createElement('canvas');
        mc.width = mc.height = S;
        const mx = mc.getContext('2d')!;
        mx.drawImage(m, 0, 0, S, S);
        lx.globalCompositeOperation = 'destination-in';
        lx.drawImage(mc, 0, 0);
        lx.globalCompositeOperation = 'source-over';
      }
    });
    const r = o.realism ?? 0.7;
    if (r > 0) {
      const shade = shadingMap(base, S);
      const d = lx.getImageData(0, 0, S, S);
      for (let i = 0; i < shade.length; i++) {
        const a = d.data[i * 4 + 3];
        if (!a) continue;
        const s = 1 + (shade[i] - 1) * r;
        d.data[i * 4] *= s;
        d.data[i * 4 + 1] *= s;
        d.data[i * 4 + 2] *= s;
        // ink sits slightly into the fabric
        d.data[i * 4 + 3] = a * (1 - 0.06 * r);
      }
      lx.putImageData(d, 0, 0);
    }
    ctx.drawImage(layer, 0, 0);
  };

  layers.forEach((l, i) => {
    if (l.type === 'user') return drawArt();
    if (l.type === 'color' && !l.url) {
      ctx.fillStyle = color.value;
      ctx.fillRect(0, 0, S, S);
      return;
    }
    const im = imgs[i];
    if (im) ctx.drawImage(im, 0, 0, S, S);
  });
  if (!drewArt) drawArt();

  if (o.outlines) {
    ctx.save();
    ctx.setLineDash([S / 120, S / 160]);
    ctx.lineWidth = Math.max(1.5, S / 500);
    ctx.strokeStyle = 'rgba(124,92,255,.95)';
    placements.forEach((p) => {
      ctx.beginPath();
      boxPath(ctx, p.design_area, k);
      ctx.stroke();
    });
    ctx.restore();
  }
  return out;
}

function drawFitted(ctx: CanvasRenderingContext2D, art: Extract<Artwork, { kind: 'fit' }>, b: TsBox, k: number) {
  const w = b.width * k, h = b.height * k;
  const s = Math.min(w / art.image.width, h / art.image.height) * (art.scale ?? 1);
  const cx = (b.left + b.width / 2) * k + (art.dx ?? 0) * w;
  const cy = (b.top + b.height / 2) * k + (art.dy ?? 0) * h;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((b.angle || 0) * Math.PI) / 180);
  ctx.drawImage(art.image, (-art.image.width * s) / 2, (-art.image.height * s) / 2, art.image.width * s, art.image.height * s);
  ctx.restore();
}

/**
 * Print-ready file for one placement: the page region inside the placement
 * box, rotated upright, at full document resolution (transparent background).
 */
export function printFile(page: CanvasImageSource, p: TsPlacement, scale = GARMENT_SCALE) {
  const b = p.design_area;
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * scale);
  c.height = Math.round(b.height * scale);
  const x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  x.translate(c.width / 2, c.height / 2);
  x.rotate((-(b.angle || 0) * Math.PI) / 180);
  x.translate(-(b.left + b.width / 2) * scale, -(b.top + b.height / 2) * scale);
  x.drawImage(page, 0, 0);
  return c;
}

/** Placement on a piece whose box contains a page point (700-space). */
export function placementAt(area: TsPrintArea, x: number, y: number) {
  return area.placements.find((p) => {
    const b = p.design_area;
    return x >= b.left && x <= b.left + b.width && y >= b.top && y <= b.top + b.height;
  });
}

/** Is the page empty inside every placement? (warns before exporting blank prints) */
export function hasInk(page: HTMLCanvasElement, p: TsPlacement, scale: number) {
  const f = printFile(page, p, scale);
  const d = f.getContext('2d')!.getImageData(0, 0, f.width, f.height).data;
  for (let i = 3; i < d.length; i += 16) if (d[i] > 8) return true;
  return false;
}

/* ---------------- garment projects ---------------- */

import { createProject } from './projects';
import { putProject } from './db';
import type { Project } from './types';
import type { TsProduct } from './tapstitch';

/** A project with one transparent 7000 px page per printable garment piece. */
export async function createGarmentProject(p: TsProduct, cat: TsCatalog, colorId: string): Promise<Project> {
  const side = cat.canvas.width * GARMENT_SCALE;
  const proj = await createProject({ title: p.title, width: side, height: side, transparent: true, pages: cat.print_areas.length, dpi: 300 });
  const pages: Record<string, string> = {};
  cat.print_areas.forEach((a, i) => (pages[proj.pages[i].id] = a.piece));
  proj.garment = { provider: 'tapstitch', productId: p.id, styleCode: p.style_code, title: p.title, technique: cat.technique, colorId, realism: 0.7, catalog: cat, pages };
  await putProject(proj);
  return proj;
}

export const pieceOf = (proj: Project, pageId: string) => {
  const g = proj.garment!;
  const piece = g.pages[pageId];
  return g.catalog.print_areas.find((a) => a.piece === piece);
};
