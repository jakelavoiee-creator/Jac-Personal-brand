/**
 * AI enhance — 2× super-resolution with Swin2SR (Apache-2.0), on device.
 * The image is processed in overlapping tiles (attention cost grows with
 * tile area) and the tiles are feather-blended so no seams show.
 */
import { gpuInfo, progressReporter, transformers, type Progress } from './runtime';

export type EnhanceModel = 'fast' | 'best';
export const ENHANCE_MODELS: Record<EnhanceModel, { id: string; label: string; hint: string; size: string }> = {
  fast: { id: 'Xenova/swin2SR-lightweight-x2-64', label: 'Fast', hint: 'Lightweight Swin2SR — about 2.5× quicker', size: '8 MB' },
  best: { id: 'Xenova/swin2SR-classical-sr-x2-64', label: 'Best detail', hint: 'Classical Swin2SR — finest texture', size: '54 MB' },
};
export const ENHANCE = {
  license: 'Swin2SR · Apache-2.0',
  /** longest input side we accept (output = 2×) */
  maxInput: 2048,
};
const TILE = 192;
const OVERLAP = 16;

const pipes = new Map<EnhanceModel, Promise<any>>();
async function getPipe(model: EnhanceModel, onProgress?: Progress) {
  let p = pipes.get(model);
  if (!p) {
    p = (async () => {
      const t = await transformers();
      const g = await gpuInfo();
      const gpu = g.webgpu && g.f16;
      return t.pipeline('image-to-image', ENHANCE_MODELS[model].id, { device: gpu ? 'webgpu' : 'wasm', dtype: gpu ? 'fp16' : 'fp32', progress_callback: progressReporter(onProgress) } as any);
    })();
    pipes.set(model, p);
    p.catch(() => pipes.delete(model));
  }
  return p;
}

/** Recommended model for this device: GPUs have headroom for the big one. */
export async function defaultEnhanceModel(): Promise<EnhanceModel> {
  const g = await gpuInfo();
  return g.webgpu && g.f16 ? 'best' : 'fast';
}

function tiles(n: number) {
  const out: number[] = [];
  if (n <= TILE) return [0];
  for (let p = 0; ; p += TILE - OVERLAP * 2) {
    if (p + TILE >= n) {
      out.push(n - TILE);
      break;
    }
    out.push(p);
  }
  return out;
}

/** Upscale 2× — returns a canvas twice the size of the input. */
export async function upscale2x(src: CanvasImageSource & { width: number; height: number }, w: number, h: number, model: EnhanceModel, onProgress?: Progress, signal?: AbortSignal): Promise<HTMLCanvasElement> {
  if (Math.max(w, h) > ENHANCE.maxInput) throw new Error(`This image is already ${w} × ${h}px — enhance works on images up to ${ENHANCE.maxInput}px on the long side.`);
  const pipe = await getPipe(model, onProgress);
  const t = await transformers();
  const srcC = document.createElement('canvas');
  srcC.width = w;
  srcC.height = h;
  const sx = srcC.getContext('2d', { willReadFrequently: true })!;
  sx.drawImage(src, 0, 0, w, h);
  // super-resolve colour; alpha (if any) is upscaled separately with smooth resampling
  const alpha = sx.getImageData(0, 0, w, h);
  let hasAlpha = false;
  for (let i = 3; i < alpha.data.length; i += 4) if (alpha.data[i] < 255) { hasAlpha = true; break; }

  const W = w * 2, H = h * 2;
  const acc = new Float32Array(W * H * 3);
  const wsum = new Float32Array(W * H);
  const xs = tiles(w), ys = tiles(h);
  const total = xs.length * ys.length;
  let done = 0;
  const t0 = performance.now();
  const tc = document.createElement('canvas');
  for (const y0 of ys)
    for (const x0 of xs) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      const tw = Math.min(TILE, w), th = Math.min(TILE, h);
      tc.width = tw;
      tc.height = th;
      const tx = tc.getContext('2d', { willReadFrequently: true })!;
      tx.fillStyle = '#fff';
      tx.fillRect(0, 0, tw, th);
      tx.drawImage(srcC, x0, y0, tw, th, 0, 0, tw, th);
      const raw = await t.RawImage.fromCanvas(tc);
      const res = await pipe(raw);
      const out = (Array.isArray(res) ? res[0] : res).rgb();
      const ow = out.width, oh = out.height;
      // feather weights fall off inside the overlap so seams vanish
      const F = OVERLAP * 2;
      for (let y = 0; y < th * 2 && y < oh; y++) {
        const wy = Math.min(1, (y0 === 0 ? F : y + 1) / F, (y0 + th >= h ? F : th * 2 - y) / F);
        for (let x = 0; x < tw * 2 && x < ow; x++) {
          const wx = Math.min(1, (x0 === 0 ? F : x + 1) / F, (x0 + tw >= w ? F : tw * 2 - x) / F);
          const wgt = wx * wy;
          const gi = (y0 * 2 + y) * W + (x0 * 2 + x);
          const si = (y * ow + x) * 3;
          acc[gi * 3] += out.data[si] * wgt;
          acc[gi * 3 + 1] += out.data[si + 1] * wgt;
          acc[gi * 3 + 2] += out.data[si + 2] * wgt;
          wsum[gi] += wgt;
        }
      }
      done++;
      const left = ((performance.now() - t0) / done) * (total - done) / 1000;
      onProgress?.({ stage: `Enhancing… ${Math.round((done / total) * 100)}%${done < total ? ` · about ${left < 60 ? `${Math.ceil(left)} s` : `${Math.ceil(left / 60)} min`} left` : ''}`, pct: (done / total) * 100 });
      await new Promise((r) => setTimeout(r)); // keep the UI responsive
    }
  const outC = document.createElement('canvas');
  outC.width = W;
  outC.height = H;
  const ox = outC.getContext('2d')!;
  let aBig: Uint8ClampedArray | null = null;
  if (hasAlpha) {
    const ac = document.createElement('canvas');
    ac.width = W;
    ac.height = H;
    const ax = ac.getContext('2d', { willReadFrequently: true })!;
    ax.imageSmoothingQuality = 'high';
    ax.drawImage(srcC, 0, 0, W, H);
    aBig = ax.getImageData(0, 0, W, H).data;
  }
  const d = new ImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const k = wsum[i] || 1;
    d.data[i * 4] = acc[i * 3] / k;
    d.data[i * 4 + 1] = acc[i * 3 + 1] / k;
    d.data[i * 4 + 2] = acc[i * 3 + 2] / k;
    d.data[i * 4 + 3] = aBig ? aBig[i * 4 + 3] : 255;
  }
  ox.putImageData(d, 0, 0);
  onProgress?.({ stage: 'Done' });
  return outC;
}
