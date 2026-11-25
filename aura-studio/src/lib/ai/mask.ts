/**
 * Alpha-mask processing for cutouts — pure functions over a single 8-bit
 * channel. Blurs are separable running-sum box blurs (3 passes ≈ Gaussian),
 * O(pixels) regardless of radius, so they stay fast on 8-megapixel photos.
 */

export interface EdgeSettings {
  /** px; negative contracts the edge, positive expands it */
  shift: number;
  /** 0–1; rounds jagged edges */
  smooth: number;
  /** px; softens the edge */
  feather: number;
}
export const EDGE_DEFAULT: EdgeSettings = { shift: 0, smooth: 0, feather: 0 };

function boxPass(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, horizontal: boolean) {
  const n = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 1 : w;
  const inv = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = horizontal ? l * w : l;
    // edge-extended running sum
    let acc = src[base] * (r + 1);
    for (let i = 1; i <= r; i++) acc += src[base + Math.min(i, n - 1) * step];
    for (let i = 0; i < n; i++) {
      dst[base + i * step] = acc * inv;
      const add = Math.min(i + r + 1, n - 1);
      const sub = Math.max(i - r, 0);
      acc += src[base + add * step] - src[base + sub * step];
    }
  }
}

/** Approximate Gaussian blur of a float channel (in place). */
export function blurChannel(ch: Float32Array, w: number, h: number, radius: number) {
  if (radius < 0.5) return ch;
  const tmp = new Float32Array(ch.length);
  // three box passes with radius ≈ σ·√(12/3+1)/2 give a close Gaussian
  const r = Math.max(1, Math.round(radius / 1.6));
  for (let k = 0; k < 3; k++) {
    boxPass(ch, tmp, w, h, r, true);
    boxPass(tmp, ch, w, h, r, false);
  }
  return ch;
}

/** Apply edge settings to a base alpha mask (0–255). Returns a new mask. */
export function processMask(base: Uint8ClampedArray | Uint8Array, w: number, h: number, e: EdgeSettings): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base.length);
  if (!e.shift && !e.smooth && !e.feather) {
    out.set(base);
    return out;
  }
  const ch = new Float32Array(base.length);
  for (let i = 0; i < base.length; i++) ch[i] = base[i] / 255;

  if (e.shift) {
    // morphological grow/shrink approximated by blur + re-threshold
    const r = Math.abs(e.shift);
    blurChannel(ch, w, h, r);
    const t = e.shift > 0 ? 0.08 : 0.92;
    for (let i = 0; i < ch.length; i++) ch[i] = e.shift > 0 ? Math.min(1, ch[i] / (t * 2)) : Math.max(0, (ch[i] - (1 - (1 - t) * 2)) / ((1 - t) * 2));
  }
  if (e.smooth > 0) {
    blurChannel(ch, w, h, 1 + e.smooth * 6);
    // soft re-threshold around 0.5 keeps the edge crisp but rounded
    const k = 0.5 - e.smooth * 0.35;
    for (let i = 0; i < ch.length; i++) {
      const x = Math.min(1, Math.max(0, (ch[i] - k) / (1 - 2 * k)));
      ch[i] = x * x * (3 - 2 * x);
    }
  }
  if (e.feather > 0) blurChannel(ch, w, h, e.feather);

  for (let i = 0; i < ch.length; i++) out[i] = ch[i] * 255 + 0.5;
  return out;
}

/** Pull the alpha channel out of RGBA pixels. */
export function alphaOf(img: ImageData): Uint8ClampedArray {
  const a = new Uint8ClampedArray(img.width * img.height);
  for (let i = 0, j = 3; i < a.length; i++, j += 4) a[i] = img.data[j];
  return a;
}

/** White RGBA canvas whose alpha is the mask (for drawing / compositing). */
export function maskCanvas(alpha: Uint8ClampedArray, w: number, h: number, into?: HTMLCanvasElement) {
  const c = into ?? document.createElement('canvas');
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const d = new ImageData(w, h);
  for (let i = 0, j = 0; i < alpha.length; i++, j += 4) {
    d.data[j] = d.data[j + 1] = d.data[j + 2] = 255;
    d.data[j + 3] = alpha[i];
  }
  c.getContext('2d')!.putImageData(d, 0, 0);
  return c;
}

/**
 * Colour decontamination: semi-transparent edge pixels still carry the old
 * background's colour (a halo). Replace their colour with an estimate of the
 * nearby *solid* subject colour — an alpha-weighted blur of opaque pixels.
 */
export function decontaminate(d: ImageData, alpha: Uint8ClampedArray, radius = 6) {
  const { width: w, height: h, data } = d;
  const n = w * h;
  const wgt = new Float32Array(n);
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    // only near-opaque pixels contribute true subject colour
    const a = alpha[i] > 235 ? 1 : 0;
    wgt[i] = a;
    r[i] = data[j] * a;
    g[i] = data[j + 1] * a;
    b[i] = data[j + 2] * a;
  }
  for (const ch of [wgt, r, g, b]) blurChannel(ch, w, h, radius);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const a = alpha[i];
    if (a === 0 || a > 235 || wgt[i] < 1e-3) continue;
    // blend toward the subject colour the more transparent the pixel is
    const t = Math.min(1, (1 - a / 250) * 1.8);
    data[j] += (r[i] / wgt[i] - data[j]) * t;
    data[j + 1] += (g[i] / wgt[i] - data[j + 1]) * t;
    data[j + 2] += (b[i] / wgt[i] - data[j + 2]) * t;
  }
}

/** Composite the source pixels through a mask into a transparent PNG. */
export async function cutoutPNG(source: CanvasImageSource, alpha: Uint8ClampedArray, w: number, h: number, opts: { decontaminate?: boolean } = {}): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.drawImage(source, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h);
  if (opts.decontaminate) decontaminate(d, alpha, Math.max(4, Math.round(Math.max(w, h) / 140)));
  for (let i = 0, j = 3; i < alpha.length; i++, j += 4) d.data[j] = Math.min(d.data[j], alpha[i]);
  x.putImageData(d, 0, 0);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode PNG'))), 'image/png'));
}

/** Fraction of pixels that are (mostly) kept — used for sanity checks and UI. */
export function coverage(alpha: Uint8ClampedArray) {
  let n = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] > 127) n++;
  return n / alpha.length;
}
