/**
 * Aura effects engine.
 *
 * Any fabric object (text, shape, vector, image, group) can carry an `fx`
 * description. Instead of baking pixels, the object is re-rendered through
 * an offscreen compositor every time its appearance changes, so effects stay
 * fully editable and export at the target resolution.
 *
 * Pipeline (back → front): long shadow · 3D extrusion · layered copies ·
 * offset copy · glow · outer outlines · main layer (optionally gradient /
 * hollow) — then a print texture is applied to the whole composite.
 */
import { FabricObject, Group } from 'fabric';

export type TextureKind =
  | 'distressed'
  | 'grain'
  | 'film'
  | 'halftone'
  | 'newspaper'
  | 'screenprint'
  | 'worn'
  | 'cracked'
  | 'grunge'
  | 'rough'
  | 'faded'
  | 'vintage'
  | 'paper'
  | 'weathered';

export interface FX {
  extrude?: { depth: number; angle: number; color: string; shade: boolean };
  longShadow?: { length: number; angle: number; color: string; fade: boolean };
  layers?: { count: number; distance: number; angle: number; colors: string[] };
  offset?: { x: number; y: number; color: string; outlineOnly: boolean; width: number };
  glow?: { color: string; blur: number; strength: number };
  outline?: { width: number; color: string };
  outline2?: { width: number; color: string };
  hollow?: { width: number; color: string };
  gradient?: { stops: string[]; angle: number };
  texture?: { kind: TextureKind; intensity: number; scale: number; seed: number; angle: number; color?: string };
}

export const TEXTURES: { kind: TextureKind; label: string; hint: string }[] = [
  { kind: 'distressed', label: 'Distressed print', hint: 'Worn-away ink patches' },
  { kind: 'screenprint', label: 'Screen print', hint: 'Fine ink breakup, plastisol look' },
  { kind: 'worn', label: 'Worn ink', hint: 'Soft, uneven wear' },
  { kind: 'grunge', label: 'Grunge', hint: 'Heavy blotches and speckles' },
  { kind: 'cracked', label: 'Cracked print', hint: 'Dried-ink crack lines' },
  { kind: 'weathered', label: 'Weathered', hint: 'Cracks plus wear' },
  { kind: 'grain', label: 'Vintage grain', hint: 'Speckled ink dropout' },
  { kind: 'film', label: 'Film grain / noise', hint: 'Luminance noise' },
  { kind: 'halftone', label: 'Halftone', hint: 'Dot screen' },
  { kind: 'newspaper', label: 'Newspaper', hint: 'Fine dots + paper grain' },
  { kind: 'rough', label: 'Rough edges', hint: 'Eroded, uneven outlines' },
  { kind: 'faded', label: 'Faded ink', hint: 'Patchy transparency' },
  { kind: 'vintage', label: 'Vintage aging', hint: 'Sepia, faded, grainy' },
  { kind: 'paper', label: 'Paper texture', hint: 'Fibrous tone variation' },
];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

export function hasFx(o: any): boolean {
  const fx: FX | undefined = o?.fx;
  if (!fx) return false;
  for (const k in fx) if ((fx as any)[k]) return true;
  return false;
}

function anyFx(g: Group): boolean {
  return g.getObjects().some((o) => hasFx(o) || (o instanceof Group && anyFx(o)));
}

const rad = (d: number) => (d * Math.PI) / 180;

/** How far (local units) an object's effects can reach beyond its own bounds. */
export function fxPad(o: any) {
  if (!hasFx(o)) return 0;
  return extent(o.fx) + (o.path ? o.fontSize * (o.lineHeight ?? 1.16) * 1.2 : 0);
}

function extent(fx: FX) {
  let e = 2;
  const add = (v: number) => (e = Math.max(e, v));
  if (fx.extrude) add(fx.extrude.depth);
  if (fx.longShadow) add(fx.longShadow.length);
  if (fx.layers) add(fx.layers.count * fx.layers.distance);
  if (fx.offset) add(Math.hypot(fx.offset.x, fx.offset.y) + (fx.offset.outlineOnly ? fx.offset.width : 0));
  const outl = (fx.outline?.width ?? 0) + (fx.outline2?.width ?? 0);
  add(outl + (fx.glow ? fx.glow.blur * 2 : 0));
  if (fx.hollow) add(fx.hollow.width);
  return e + 2;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}

function parseColor(c: string): [number, number, number] {
  const ctx = canvas(1, 1).getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillStyle = c;
  const v = ctx.fillStyle as string;
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)) as any;
  const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(v);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
}

export function shade(color: string, amt: number) {
  const [r, g, b] = parseColor(color);
  const f = (v: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function mix(a: string, b: string, t: number) {
  const A = parseColor(a);
  const B = parseColor(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

/* ---------------- seeded noise ---------------- */

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number, oct = 4) {
  let t = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    t += amp * vnoise(x * f, y * f, s + i * 17);
    f *= 2;
    amp *= 0.5;
  }
  return t / (1 - Math.pow(0.5, oct));
}
/** Worley noise: returns F2 - F1 (small near cell borders → crack lines). */
function worleyEdge(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i + hash(xi + i, yi + j, s);
      const cy = yi + j + hash(xi + i, yi + j, s + 1);
      const d = Math.hypot(cx - x, cy - y);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) f2 = d;
    }
  return f2 - f1;
}

/* ------------------------------------------------------------------ */
/* compositing                                                         */
/* ------------------------------------------------------------------ */

interface Ctx {
  res: number;
  w: number;
  h: number;
  base: HTMLCanvasElement;
  originX: number; // local-units coordinate of pixel 0
  originY: number;
}

function silhouette(c: Ctx, color: string) {
  const s = canvas(c.w, c.h);
  const x = s.getContext('2d')!;
  x.drawImage(c.base, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.w, c.h);
  return s;
}

/** Morphological dilation approximated by stamping the silhouette around rings. */
function dilate(c: Ctx, src: HTMLCanvasElement, rLocal: number) {
  const out = canvas(c.w, c.h);
  const x = out.getContext('2d')!;
  const r = rLocal * c.res;
  if (r < 0.5) {
    x.drawImage(src, 0, 0);
    return out;
  }
  const rings = r > 6 ? [1, 0.7, 0.4] : [1];
  for (const k of rings) {
    const rr = r * k;
    const n = Math.min(72, Math.max(12, Math.ceil((2 * Math.PI * rr) / 2)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      x.drawImage(src, Math.cos(a) * rr, Math.sin(a) * rr);
    }
  }
  x.drawImage(src, 0, 0);
  return out;
}

function ring(c: Ctx, color: string, widthLocal: number, inner: HTMLCanvasElement = c.base) {
  const sil = silhouette(c, color);
  const d = dilate(c, sil, widthLocal);
  const x = d.getContext('2d')!;
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(inner, 0, 0);
  return d;
}

function gradientLayer(c: Ctx, src: HTMLCanvasElement, g: NonNullable<FX['gradient']>) {
  const out = canvas(c.w, c.h);
  const x = out.getContext('2d')!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  const a = rad(g.angle);
  const cx = c.w / 2;
  const cy = c.h / 2;
  const L = (Math.abs(Math.cos(a)) * c.w + Math.abs(Math.sin(a)) * c.h) / 2;
  const grad = x.createLinearGradient(cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
  const stops = g.stops.length ? g.stops : ['#fff', '#000'];
  stops.forEach((s, i) => grad.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), s));
  x.fillStyle = grad;
  x.fillRect(0, 0, c.w, c.h);
  return out;
}

function composite(c: Ctx, fx: FX, isImage: boolean) {
  const out = canvas(c.w, c.h);
  const o = out.getContext('2d')!;
  const R = c.res;

  if (fx.longShadow) {
    const { length, angle, color, fade } = fx.longShadow;
    const sil = silhouette(c, color);
    const steps = Math.min(400, Math.ceil(length * R));
    const dx = Math.cos(rad(angle));
    const dy = Math.sin(rad(angle));
    for (let i = steps; i >= 1; i--) {
      o.globalAlpha = fade ? Math.pow(1 - i / (steps + 1), 1.2) : 1;
      o.drawImage(sil, dx * i, dy * i);
    }
    o.globalAlpha = 1;
  }

  if (fx.extrude) {
    const { depth, angle, color, shade: doShade } = fx.extrude;
    const steps = Math.min(300, Math.ceil(depth * R));
    const dx = Math.cos(rad(angle));
    const dy = Math.sin(rad(angle));
    const back = doShade ? shade(color, -0.45) : color;
    // pre-tint a few bands instead of one silhouette per step
    const bands = doShade ? 8 : 1;
    const sils = Array.from({ length: bands }, (_, b) => silhouette(c, bands === 1 ? color : mix(color, back, b / (bands - 1))));
    for (let i = steps; i >= 1; i--) {
      const b = Math.min(bands - 1, Math.floor((i / steps) * bands));
      o.drawImage(sils[b], dx * i, dy * i);
    }
  }

  if (fx.layers) {
    const { count, distance, angle, colors } = fx.layers;
    const dx = Math.cos(rad(angle)) * distance * R;
    const dy = Math.sin(rad(angle)) * distance * R;
    for (let k = count; k >= 1; k--) o.drawImage(silhouette(c, colors[(k - 1) % colors.length] || '#000'), dx * k, dy * k);
  }

  if (fx.offset) {
    const { x, y, color, outlineOnly, width } = fx.offset;
    const layer = outlineOnly ? ring(c, color, width) : silhouette(c, color);
    o.drawImage(layer, x * R, y * R);
  }

  if (fx.glow) {
    const { color, blur, strength } = fx.glow;
    const sil = silhouette(c, color);
    const BIG = c.w + c.h + 100;
    o.save();
    o.shadowColor = color;
    o.shadowBlur = blur * R;
    o.shadowOffsetX = BIG;
    for (let i = 0; i < Math.max(1, Math.round(strength)); i++) o.drawImage(sil, -BIG, 0);
    o.restore();
  }

  if (fx.outline2) {
    const w = (fx.outline?.width ?? 0) + fx.outline2.width;
    o.drawImage(dilate(c, silhouette(c, fx.outline2.color), w), 0, 0);
  }
  if (fx.outline) o.drawImage(dilate(c, silhouette(c, fx.outline.color), fx.outline.width), 0, 0);

  if (fx.hollow) {
    // outline ring only — the object itself is cut out
    o.globalCompositeOperation = 'destination-out';
    o.drawImage(c.base, 0, 0);
    o.globalCompositeOperation = 'source-over';
    o.drawImage(ring(c, fx.hollow.color, fx.hollow.width), 0, 0);
  } else {
    o.drawImage(fx.gradient ? gradientLayer(c, c.base, fx.gradient) : c.base, 0, 0);
  }

  if (fx.texture) applyTexture(c, out, fx.texture, isImage);
  return out;
}

/* ------------------------------------------------------------------ */
/* textures                                                            */
/* ------------------------------------------------------------------ */

function applyTexture(c: Ctx, out: HTMLCanvasElement, t: NonNullable<FX['texture']>, isImage: boolean) {
  if (t.kind === 'halftone' || t.kind === 'newspaper') {
    halftone(c, out, t, isImage);
    if (t.kind === 'newspaper') pixelPass(c, out, { ...t, kind: 'grain', intensity: t.intensity * 0.35 });
    return;
  }
  pixelPass(c, out, t);
}

function pixelPass(c: Ctx, out: HTMLCanvasElement, t: NonNullable<FX['texture']>) {
  const x = out.getContext('2d', { willReadFrequently: true })!;
  const img = x.getImageData(0, 0, c.w, c.h);
  const d = img.data;
  const I = Math.max(0, Math.min(1, t.intensity));
  const S = Math.max(0.5, t.scale); // feature size in local px
  const seed = t.seed | 0;
  const R = c.res;
  let alpha: Float32Array | null = null;

  if (t.kind === 'rough') {
    // blur alpha so the edge band is wide enough to erode with noise
    alpha = new Float32Array(c.w * c.h);
    for (let i = 0; i < alpha.length; i++) alpha[i] = d[i * 4 + 3] / 255;
    boxBlur(alpha, c.w, c.h, Math.max(1, Math.round(S * 0.35 * R)));
  }
  const tint = t.kind === 'vintage' ? parseColor(t.color || '#704214') : null;

  for (let py = 0; py < c.h; py++) {
    const ly = py / R + c.originY;
    for (let px = 0; px < c.w; px++) {
      const i = (py * c.w + px) * 4;
      const a = d[i + 3];
      if (a === 0) continue;
      const lx = px / R + c.originX;
      let keep = 1;
      switch (t.kind) {
        case 'grain': {
          const g = Math.max(0.6, S * 0.12);
          keep = hash(Math.floor(lx / g), Math.floor(ly / g), seed) < I * 0.55 ? 0 : 1;
          break;
        }
        case 'film': {
          const n = (hash(Math.floor(lx / Math.max(0.5, S * 0.08)), Math.floor(ly / Math.max(0.5, S * 0.08)), seed) - 0.5) * 2 * I * 90;
          d[i] = clamp255(d[i] + n);
          d[i + 1] = clamp255(d[i + 1] + n);
          d[i + 2] = clamp255(d[i + 2] + n);
          continue;
        }
        case 'distressed': {
          const n = fbm(lx / (S * 2), ly / (S * 2), seed, 4);
          const spk = vnoise(lx / (S * 0.09), ly / (S * 0.09), seed + 9);
          keep = n < 0.22 + I * 0.33 || spk > 1 - I * 0.12 ? 0 : 1;
          break;
        }
        case 'screenprint': {
          const n = fbm(lx / (S * 0.6), ly / (S * 0.6), seed, 3);
          const spk = vnoise(lx / (S * 0.06), ly / (S * 0.06), seed + 3);
          keep = n < 0.18 + I * 0.32 || spk > 1 - I * 0.16 ? 0 : 1;
          break;
        }
        case 'worn': {
          const n = fbm(lx / (S * 3), ly / (S * 3), seed, 5);
          const f = Math.max(0, Math.min(1, (n - (0.25 + I * 0.35)) / 0.12));
          d[i + 3] = a * f;
          continue;
        }
        case 'grunge': {
          const n = fbm(lx / (S * 1.5), ly / (S * 1.5), seed, 5);
          const spk = fbm(lx / (S * 0.18), ly / (S * 0.18), seed + 5, 2);
          keep = n < 0.25 + I * 0.4 || spk > 1 - I * 0.22 ? 0 : 1;
          break;
        }
        case 'cracked':
        case 'weathered': {
          const e = worleyEdge(lx / (S * 3), ly / (S * 3), seed);
          keep = e < 0.03 + I * 0.09 ? 0 : 1;
          if (t.kind === 'weathered' && keep) keep = fbm(lx / (S * 2.5), ly / (S * 2.5), seed + 7, 4) < 0.2 + I * 0.3 ? 0 : 1;
          break;
        }
        case 'rough': {
          const n = fbm(lx / S, ly / S, seed, 3);
          const th = 0.5 + (n - 0.5) * (0.4 + I * 1.1);
          keep = alpha![py * c.w + px] > th ? 1 : 0;
          break;
        }
        case 'faded': {
          const n = fbm(lx / (S * 4), ly / (S * 4), seed, 4);
          d[i + 3] = a * Math.max(0, Math.min(1, 1 - I * 0.9 * (1 - n) - I * 0.15));
          continue;
        }
        case 'vintage': {
          const n = fbm(lx / (S * 4), ly / (S * 4), seed, 4);
          const g = hash(Math.floor(lx / (S * 0.12)), Math.floor(ly / (S * 0.12)), seed);
          const k = I * 0.55;
          d[i] = d[i] + (tint![0] - d[i]) * k;
          d[i + 1] = d[i + 1] + (tint![1] - d[i + 1]) * k;
          d[i + 2] = d[i + 2] + (tint![2] - d[i + 2]) * k;
          d[i + 3] = a * Math.max(0, Math.min(1, 1 - I * 0.5 * (1 - n))) * (g < I * 0.25 ? 0 : 1);
          continue;
        }
        case 'paper': {
          const fib = fbm(lx / (S * 0.6), ly / (S * 6), seed, 3) * 0.6 + fbm(lx / (S * 5), ly / (S * 5), seed + 2, 4) * 0.4;
          const spk = hash(Math.floor(lx / (S * 0.2)), Math.floor(ly / (S * 0.2)), seed + 1) < 0.004 * I ? -60 : 0;
          const k = (fib - 0.5) * I * 70 + spk;
          d[i] = clamp255(d[i] + k);
          d[i + 1] = clamp255(d[i + 1] + k);
          d[i + 2] = clamp255(d[i + 2] + k * 1.1);
          continue;
        }
      }
      if (!keep) d[i + 3] = 0;
    }
  }
  x.putImageData(img, 0, 0);
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

function boxBlur(a: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(a.length);
  for (let y = 0; y < h; y++) {
    let s = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = s / (2 * r + 1);
      s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      a[y * w + x] = s / (2 * r + 1);
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}

/** True amplitude-modulated halftone: each cell becomes one dot sized by ink coverage. */
function halftone(c: Ctx, out: HTMLCanvasElement, t: NonNullable<FX['texture']>, isImage: boolean) {
  const x = out.getContext('2d', { willReadFrequently: true })!;
  const src = x.getImageData(0, 0, c.w, c.h).data;
  const cell = Math.max(2, (t.kind === 'newspaper' ? t.scale * 0.5 : t.scale) * c.res);
  const ang = rad(t.angle ?? 45);
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  x.clearRect(0, 0, c.w, c.h);
  const diag = Math.hypot(c.w, c.h);
  const n = Math.ceil(diag / cell) + 2;
  const cx = c.w / 2;
  const cy = c.h / 2;
  const gain = 0.6 + t.intensity * 0.8;
  for (let j = -n / 2; j <= n / 2; j++)
    for (let i = -n / 2; i <= n / 2; i++) {
      const u = i * cell;
      const v = j * cell;
      const px = cx + u * cos - v * sin;
      const py = cy + u * sin + v * cos;
      if (px < -cell || py < -cell || px > c.w + cell || py > c.h + cell) continue;
      // sample a small neighbourhood
      let A = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let k = 0;
      const step = Math.max(1, Math.floor(cell / 3));
      for (let sy = -1; sy <= 1; sy++)
        for (let sx = -1; sx <= 1; sx++) {
          const qx = Math.round(px + sx * step);
          const qy = Math.round(py + sy * step);
          if (qx < 0 || qy < 0 || qx >= c.w || qy >= c.h) {
            k++;
            continue;
          }
          const q = (qy * c.w + qx) * 4;
          const al = src[q + 3] / 255;
          A += al;
          r += src[q] * al;
          g += src[q + 1] * al;
          b += src[q + 2] * al;
          k++;
        }
      if (A < 0.02) continue;
      const cov = A / k;
      r /= A;
      g /= A;
      b /= A;
      let ink = cov;
      if (isImage) ink *= 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const radius = Math.min(cell * 0.72, Math.sqrt(Math.max(0, ink)) * cell * 0.62 * gain);
      if (radius < 0.3) continue;
      x.fillStyle = t.color || (isImage ? '#111' : `rgb(${r | 0},${g | 0},${b | 0})`);
      x.beginPath();
      x.arc(px, py, radius, 0, Math.PI * 2);
      x.fill();
    }
}

/* ------------------------------------------------------------------ */
/* fabric integration                                                  */
/* ------------------------------------------------------------------ */

const SKIP = new Set(['left', 'top', 'angle', 'flipX', 'flipY', 'opacity', 'globalCompositeOperation', 'shadow', 'visible', 'skewX', 'skewY', 'name', 'locked', 'id', 'originX', 'originY']);

function stateKey(o: any, res: number) {
  const obj = o.toObject();
  for (const k of SKIP) delete obj[k];
  // scale changes the render resolution only, never the composite
  delete obj.scaleX;
  delete obj.scaleY;
  return JSON.stringify(obj) + '|' + res + '|' + (o._element?.__fxId ?? '');
}

let elementIds = 0;
const MAX_SIDE = 4096;

function renderWithFx(o: any, ctx: CanvasRenderingContext2D, draw: (c: CanvasRenderingContext2D) => void) {
  const fx: FX = o.fx;
  const m = ctx.getTransform();
  let res = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) || 1;
  // quantize so zooming doesn't rebuild every frame; round up for crispness
  res = Math.pow(2, Math.ceil(Math.log2(res) * 3) / 3);
  const dims = o._getNonTransformedDimensions();
  // text on a path reports the path's box; glyphs rise above it by up to a line height
  const pad = extent(fx) + (o.path ? o.fontSize * (o.lineHeight ?? 1.16) * 1.2 : 0);
  const W = dims.x + pad * 2;
  const H = dims.y + pad * 2;
  if (Math.max(W, H) * res > MAX_SIDE) res = MAX_SIDE / Math.max(W, H);
  if (o._element && !o._element.__fxId) o._element.__fxId = ++elementIds;
  const key = stateKey(o, res);
  let cached = o.__fxCache as { key: string; canvas: HTMLCanvasElement } | undefined;
  if (!cached || cached.key !== key) {
    const w = Math.ceil(W * res);
    const h = Math.ceil(H * res);
    const base = canvas(w, h);
    const b = base.getContext('2d')!;
    b.setTransform(res, 0, 0, res, (pad + dims.x / 2) * res, (pad + dims.y / 2) * res);
    draw(b);
    const c: Ctx = { res, w, h, base, originX: -dims.x / 2 - pad, originY: -dims.y / 2 - pad };
    cached = { key, canvas: composite(c, fx, o.type === 'image') };
    o.__fxCache = cached;
  }
  ctx.drawImage(cached.canvas, -dims.x / 2 - pad, -dims.y / 2 - pad, W, H);
}

let installed = false;
export function installEffects() {
  if (installed) return;
  installed = true;
  for (const proto of [FabricObject.prototype, Group.prototype] as any[]) {
    const drawObject = proto.drawObject;
    proto.drawObject = function (ctx: CanvasRenderingContext2D, forClipping: boolean, context: any) {
      if (forClipping || !hasFx(this)) return drawObject.call(this, ctx, forClipping, context);
      renderWithFx(this, ctx, (c) => drawObject.call(this, c, forClipping, context));
    };
    const shouldCache = proto.shouldCache;
    proto.shouldCache = function () {
      // effects extend beyond the object's bounds; fabric's cache would clip them
      if (hasFx(this) || (this instanceof Group && anyFx(this))) {
        this.ownCaching = false;
        return false;
      }
      return shouldCache.call(this);
    };
  }
}

/** Small rendered preview of a texture, for the Textures panel. */
const swatchCache = new Map<string, string>();
export function textureSwatch(kind: TextureKind, size = 88) {
  const k = kind + size;
  const hit = swatchCache.get(k);
  if (hit) return hit;
  const base = canvas(size, size);
  const b = base.getContext('2d')!;
  b.fillStyle = '#ece6da';
  b.fillRect(0, 0, size, size);
  b.fillStyle = '#1b1b1b';
  b.beginPath();
  b.arc(size * 0.5, size * 0.5, size * 0.36, 0, Math.PI * 2);
  b.fill();
  const c: Ctx = { res: 1, w: size, h: size, base, originX: 0, originY: 0 };
  const out = canvas(size, size);
  const o = out.getContext('2d')!;
  o.drawImage(base, 0, 0);
  if (kind !== 'paper') {
    // texture only the ink, keep the paper visible
    o.clearRect(0, 0, size, size);
    o.drawImage(base, 0, 0);
    const ink = canvas(size, size);
    const ix = ink.getContext('2d')!;
    ix.fillStyle = '#1b1b1b';
    ix.beginPath();
    ix.arc(size * 0.5, size * 0.5, size * 0.36, 0, Math.PI * 2);
    ix.fill();
    applyTexture({ ...c, base: ink }, ink, { kind, intensity: 0.6, scale: kind === 'halftone' ? 7 : 10, seed: 7, angle: 45 }, false);
    o.fillStyle = '#ece6da';
    o.fillRect(0, 0, size, size);
    o.drawImage(ink, 0, 0);
  } else applyTexture(c, out, { kind, intensity: 0.8, scale: 10, seed: 7, angle: 0 }, false);
  const url = out.toDataURL();
  swatchCache.set(k, url);
  return url;
}
