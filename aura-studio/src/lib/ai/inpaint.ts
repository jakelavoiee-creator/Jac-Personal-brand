/**
 * Object removal (inpainting), on device.
 *  • 'ai'    — LaMa (big-lama, Apache-2.0) via ONNX Runtime Web. 208 MB once,
 *              cached in the browser. Fixed 512² input, so we crop a context
 *              window around the brushed area, inpaint it and paste back only
 *              the brushed pixels — the rest of the photo stays untouched.
 *  • 'quick' — classical push-pull fill, instant and offline; best for small
 *              blemishes, dust and thin wires.
 */
import { blurChannel } from './mask';
import { wasmThreads, type Progress } from './runtime';

export type InpaintMode = 'ai' | 'quick';
export const LAMA = {
  url: 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx',
  size: '208 MB',
  license: 'LaMa · Apache-2.0',
};
const SIDE = 512;
const MODEL_CACHE = 'aura-models';

/** Download (once) with progress; afterwards served from Cache Storage. */
export async function cachedModel(url: string, onProgress?: Progress, label = 'Downloading model'): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(url);
    if (hit) return hit.arrayBuffer();
  } catch {
    /* private mode etc. — download without caching */
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status}).`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    got += value.length;
    onProgress?.({ stage: `${label} (${(total / 1e6 || got / 1e6).toFixed(0)} MB, one time)`, pct: total ? (got / total) * 100 : undefined });
  }
  const blob = new Blob(parts as BlobPart[]);
  try {
    await cache?.put(url, new Response(blob, { headers: { 'content-type': 'application/octet-stream' } }));
  } catch {
    /* quota — still usable this session */
  }
  return blob.arrayBuffer();
}

export async function isCached(url: string) {
  try {
    return !!(await (await caches.open(MODEL_CACHE)).match(url));
  } catch {
    return false;
  }
}

let ortP: Promise<any> | null = null;
/** The same ONNX Runtime instance transformers.js uses (one wasm runtime). */
export function ort() {
  ortP ??= import('onnxruntime-web/webgpu').then((o: any) => {
    o.env.wasm.wasmPaths = '/ort/';
    o.env.wasm.numThreads = wasmThreads();
    return o;
  });
  return ortP;
}

let lamaP: Promise<any> | null = null;
async function lama(onProgress?: Progress) {
  lamaP ??= (async () => {
    const o = await ort();
    const buf = await cachedModel(LAMA.url, onProgress);
    onProgress?.({ stage: 'Preparing model…' });
    return o.InferenceSession.create(buf, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  })();
  lamaP.catch(() => (lamaP = null));
  return lamaP;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bounding box of mask pixels above a threshold. */
export function maskBounds(mask: Uint8ClampedArray, w: number, h: number): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (mask[row + x] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Square-ish context window around the hole (≈2.2× the hole, at least 512 px when possible). */
export function contextBox(b: Box, w: number, h: number): Box {
  let side = Math.max(b.w, b.h) * 2.2;
  side = Math.max(side, Math.min(SIDE, Math.max(w, h)));
  const sw = Math.min(w, side);
  const sh = Math.min(h, side);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const x = Math.round(Math.min(Math.max(0, cx - sw / 2), w - sw));
  const y = Math.round(Math.min(Math.max(0, cy - sh / 2), h - sh));
  return { x, y, w: Math.round(sw), h: Math.round(sh) };
}

/** Grow a mask by r px (blur + low threshold), keeping a soft edge for blending. */
function grow(mask: Uint8ClampedArray, w: number, h: number, r: number) {
  const ch = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) ch[i] = mask[i] / 255;
  blurChannel(ch, w, h, r);
  const out = new Uint8ClampedArray(mask.length);
  for (let i = 0; i < ch.length; i++) out[i] = Math.min(1, ch[i] * 6) * 255;
  return out;
}

function crop(src: CanvasImageSource, b: Box, tw: number, th: number) {
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, b.x, b.y, b.w, b.h, 0, 0, tw, th);
  return c;
}

function maskCrop(mask: Uint8ClampedArray, w: number, b: Box, tw: number, th: number) {
  const out = new Uint8ClampedArray(tw * th);
  const sx = b.w / tw;
  const sy = b.h / th;
  // max-sample so thin strokes survive downscaling
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      let m = 0;
      const y0 = Math.floor(b.y + y * sy), y1 = Math.max(y0 + 1, Math.floor(b.y + (y + 1) * sy));
      const x0 = Math.floor(b.x + x * sx), x1 = Math.max(x0 + 1, Math.floor(b.x + (x + 1) * sx));
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) m = Math.max(m, mask[yy * w + xx]);
      out[y * tw + x] = m;
    }
  return out;
}

/** LaMa on a 512² crop. Returns RGBA ImageData at 512². */
async function runLama(img: ImageData, mask: Uint8ClampedArray, onProgress?: Progress) {
  const sess = await lama(onProgress);
  const o = await ort();
  onProgress?.({ stage: 'Removing…' });
  const n = SIDE * SIDE;
  const image = new Float32Array(3 * n);
  const m = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    image[i] = img.data[i * 4] / 255;
    image[n + i] = img.data[i * 4 + 1] / 255;
    image[2 * n + i] = img.data[i * 4 + 2] / 255;
    m[i] = mask[i] > 16 ? 1 : 0;
  }
  const [inImg, inMask] = sess.inputNames as string[];
  const out = await sess.run({ [inImg]: new o.Tensor('float32', image, [1, 3, SIDE, SIDE]), [inMask]: new o.Tensor('float32', m, [1, 1, SIDE, SIDE]) });
  const t = out[sess.outputNames[0]];
  const d = t.data as Float32Array;
  let max = 0;
  for (let i = 0; i < d.length; i += 97) max = Math.max(max, d[i]);
  const k = max > 2 ? 1 : 255; // export outputs 0–255; guard against 0–1 builds
  const res = new ImageData(SIDE, SIDE);
  for (let i = 0; i < n; i++) {
    res.data[i * 4] = d[i] * k;
    res.data[i * 4 + 1] = d[n + i] * k;
    res.data[i * 4 + 2] = d[2 * n + i] * k;
    res.data[i * 4 + 3] = 255;
  }
  t.dispose?.();
  return res;
}

/**
 * Classical push-pull fill: build a pyramid of known-pixel averages, then pull
 * colour from coarse levels into the hole. Smooth, instant, no download.
 */
export function pushPullFill(img: ImageData, mask: Uint8ClampedArray) {
  const { width: w, height: h } = img;
  type Lvl = { w: number; h: number; c: Float32Array; a: Float32Array };
  const base: Lvl = { w, h, c: new Float32Array(w * h * 3), a: new Float32Array(w * h) };
  for (let i = 0; i < w * h; i++) {
    const k = mask[i] > 16 ? 0 : 1;
    base.a[i] = k;
    base.c[i * 3] = img.data[i * 4] * k;
    base.c[i * 3 + 1] = img.data[i * 4 + 1] * k;
    base.c[i * 3 + 2] = img.data[i * 4 + 2] * k;
  }
  const levels: Lvl[] = [base];
  while (levels[levels.length - 1].w > 1 || levels[levels.length - 1].h > 1) {
    const p = levels[levels.length - 1];
    const nw = Math.max(1, Math.ceil(p.w / 2)), nh = Math.max(1, Math.ceil(p.h / 2));
    const q: Lvl = { w: nw, h: nh, c: new Float32Array(nw * nh * 3), a: new Float32Array(nw * nh) };
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const i = y * p.w + x, j = (y >> 1) * nw + (x >> 1);
        q.a[j] += p.a[i];
        q.c[j * 3] += p.c[i * 3];
        q.c[j * 3 + 1] += p.c[i * 3 + 1];
        q.c[j * 3 + 2] += p.c[i * 3 + 2];
      }
    // normalise to premultiplied averages with coverage clamped to 1
    for (let j = 0; j < nw * nh; j++) {
      const a = q.a[j];
      if (a > 0) {
        const s = Math.min(1, a) / a;
        q.a[j] = Math.min(1, a);
        q.c[j * 3] *= s;
        q.c[j * 3 + 1] *= s;
        q.c[j * 3 + 2] *= s;
      }
    }
    levels.push(q);
  }
  // pull: fill missing coverage from the coarser level (bilinear)
  for (let l = levels.length - 2; l >= 0; l--) {
    const p = levels[l], q = levels[l + 1];
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const i = y * p.w + x;
        const miss = 1 - p.a[i];
        if (miss <= 0) continue;
        const fx = Math.min(q.w - 1, Math.max(0, (x - 0.5) / 2)), fy = Math.min(q.h - 1, Math.max(0, (y - 0.5) / 2));
        const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(q.w - 1, x0 + 1), y1 = Math.min(q.h - 1, y0 + 1);
        const tx = fx - x0, ty = fy - y0;
        for (let c = 0; c < 4; c++) {
          const get = (xx: number, yy: number) => (c === 3 ? q.a[yy * q.w + xx] : q.c[(yy * q.w + xx) * 3 + c]);
          const v = (get(x0, y0) * (1 - tx) + get(x1, y0) * tx) * (1 - ty) + (get(x0, y1) * (1 - tx) + get(x1, y1) * tx) * ty;
          if (c === 3) p.a[i] += v * miss;
          else p.c[i * 3 + c] += v * miss;
        }
      }
  }
  const out = new ImageData(new Uint8ClampedArray(img.data), w, h);
  for (let i = 0; i < w * h; i++) {
    if (mask[i] <= 16) continue;
    const a = base.a[i] || 1;
    out.data[i * 4] = base.c[i * 3] / a;
    out.data[i * 4 + 1] = base.c[i * 3 + 1] / a;
    out.data[i * 4 + 2] = base.c[i * 3 + 2] / a;
  }
  return out;
}

/**
 * Separate painted regions (connected components on a coarse grid, merging
 * strokes that nearly touch) so each hole gets its own tight, high-resolution
 * context window instead of one huge downscaled one.
 */
export function holeRegions(mask: Uint8ClampedArray, w: number, h: number): Box[] {
  const cell = Math.max(1, Math.ceil(Math.max(w, h) / 256));
  const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  const g = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x] > 16) g[((y / cell) | 0) * gw + ((x / cell) | 0)] = 1;
  const seen = new Uint8Array(gw * gh);
  const boxes: Box[] = [];
  const reach = 2; // cells: strokes this close are treated as one hole
  for (let i = 0; i < g.length; i++) {
    if (!g[i] || seen[i]) continue;
    let x0 = gw, y0 = gh, x1 = 0, y1 = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop()!;
      const x = j % gw, y = (j / gw) | 0;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (let dy = -reach; dy <= reach; dy++)
        for (let dx = -reach; dx <= reach; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const k = ny * gw + nx;
          if (g[k] && !seen[k]) {
            seen[k] = 1;
            stack.push(k);
          }
        }
    }
    const bx = x0 * cell, by = y0 * cell;
    boxes.push({ x: bx, y: by, w: Math.min(w, (x1 + 1) * cell) - bx, h: Math.min(h, (y1 + 1) * cell) - by });
  }
  return boxes;
}

/** Noise level (std of the high-frequency residual) of the known pixels around a hole. */
function grainLevel(d: ImageData, hole: Uint8ClampedArray) {
  const { width: w, height: h, data } = d;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < lum.length; i++) lum[i] = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11;
  const sm = new Float32Array(lum);
  blurChannel(sm, w, h, 2);
  let s = 0, n = 0;
  for (let i = 0; i < lum.length; i += 3) {
    if (hole[i] > 4) continue;
    const r = lum[i] - sm[i];
    s += r * r;
    n++;
  }
  return n ? Math.sqrt(s / n) : 0;
}

function addGrain(d: ImageData, alpha: Uint8ClampedArray, sigma: number, seed = 1) {
  if (sigma < 0.5) return;
  let st = seed >>> 0 || 1;
  const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i] / 255;
    if (a <= 0) continue;
    // Box–Muller gaussian, mostly luminance with a little chroma like real sensor/film grain
    const g = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2831853 * rnd()) * sigma * a;
    const j = i * 4;
    d.data[j] += g + (rnd() - 0.5) * sigma * 0.3 * a;
    d.data[j + 1] += g + (rnd() - 0.5) * sigma * 0.3 * a;
    d.data[j + 2] += g + (rnd() - 0.5) * sigma * 0.3 * a;
  }
}

async function inpaintRegion(out: HTMLCanvasElement, mask: Uint8ClampedArray, w: number, h: number, bounds: Box, mode: InpaintMode, onProgress?: Progress) {
  const ox = out.getContext('2d', { willReadFrequently: true })!;
  const ctxBox = contextBox(bounds, w, h);
  // work size: LaMa needs exactly 512²; quick fill works at ≤ 1024
  const tw = mode === 'ai' ? SIDE : Math.min(ctxBox.w, 1024);
  const th = mode === 'ai' ? SIDE : Math.round((tw / ctxBox.w) * ctxBox.h);
  const crop1 = crop(out, ctxBox, tw, th);
  const img = crop1.getContext('2d')!.getImageData(0, 0, tw, th);
  const m = grow(maskCrop(mask, w, ctxBox, tw, th), tw, th, 2);
  const filled = mode === 'ai' ? await runLama(img, m, onProgress) : pushPullFill(img, m);

  // scale the filled crop back and paste only the masked area, feathered
  const fc = document.createElement('canvas');
  fc.width = tw;
  fc.height = th;
  fc.getContext('2d')!.putImageData(filled, 0, 0);
  const patch = document.createElement('canvas');
  patch.width = ctxBox.w;
  patch.height = ctxBox.h;
  const px = patch.getContext('2d', { willReadFrequently: true })!;
  px.imageSmoothingQuality = 'high';
  px.drawImage(fc, 0, 0, ctxBox.w, ctxBox.h);
  const full = new Uint8ClampedArray(ctxBox.w * ctxBox.h);
  for (let y = 0; y < ctxBox.h; y++) for (let x = 0; x < ctxBox.w; x++) full[y * ctxBox.w + x] = mask[(ctxBox.y + y) * w + ctxBox.x + x];
  const soft = grow(full, ctxBox.w, ctxBox.h, Math.max(2, Math.round(Math.max(ctxBox.w, ctxBox.h) / 256)));
  const pd = px.getImageData(0, 0, ctxBox.w, ctxBox.h);
  // re-grain: the fill is smoother than the photo's own noise (and upscaled when the window was > 512)
  const orig = ox.getImageData(ctxBox.x, ctxBox.y, ctxBox.w, ctxBox.h);
  const target = grainLevel(orig, soft);
  const have = grainLevel(pd, new Uint8ClampedArray(soft.length).map((_, i) => 255 - soft[i]));
  addGrain(pd, soft, Math.sqrt(Math.max(0, target * target - have * have)), bounds.x * 31 + bounds.y);
  for (let i = 0; i < soft.length; i++) pd.data[i * 4 + 3] = soft[i];
  px.putImageData(pd, 0, 0);
  ox.drawImage(patch, ctxBox.x, ctxBox.y);
}

/**
 * Remove whatever is painted in `mask` (0–255, image-sized) from `source`.
 * Returns a full-resolution canvas; only the (slightly grown, feathered)
 * masked pixels differ from the source.
 */
export async function inpaint(source: CanvasImageSource & { width: number; height: number }, mask: Uint8ClampedArray, w: number, h: number, mode: InpaintMode, onProgress?: Progress) {
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d', { willReadFrequently: true })!.drawImage(source, 0, 0, w, h);
  const regions = holeRegions(mask, w, h);
  for (let i = 0; i < regions.length; i++) {
    const p: Progress | undefined = onProgress && ((e) => onProgress({ ...e, stage: regions.length > 1 && e.stage === 'Removing…' ? `Removing ${i + 1} of ${regions.length}…` : e.stage }));
    await inpaintRegion(out, mask, w, h, regions[i], mode, p);
  }
  onProgress?.({ stage: 'Done' });
  return out;
}
