/**
 * Perspective mockups: warp artwork onto any four-cornered surface in a photo
 * (box faces, posters, labels, bags, screens) with a true projective
 * transform, then blend it with the photo's own lighting.
 */
import { blurChannel } from './ai/mask';

export type Pt = { x: number; y: number };
export type Quad = [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL

/** Solve the 3×3 homography mapping 4 source points onto 4 destination points. */
export function homography(src: Quad, dst: Quad): number[] {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    if (Math.abs(A[c][c]) < 1e-12) throw new Error('Those corners don’t form a usable shape — spread them apart.');
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const h = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * h[k];
    h[r] = s / A[r][r];
  }
  return [...h, 1];
}

export const applyH = (H: number[], x: number, y: number): Pt => {
  const w = H[6] * x + H[7] * y + H[8];
  return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w };
};

export interface WarpOpts {
  blend: 'normal' | 'multiply';
  /** 0–1: shade the artwork with the photo's local lighting */
  lighting: number;
  opacity: number;
}

/**
 * Draw `art` warped into `quad` on top of the photo already in `ctx`.
 * Inverse mapping with bilinear sampling, limited to the quad's bounding box.
 */
export function warpOnto(ctx: CanvasRenderingContext2D, art: HTMLCanvasElement, quad: Quad, o: WarpOpts) {
  const W = ctx.canvas.width, Hh = ctx.canvas.height;
  const aw = art.width, ah = art.height;
  // destination → source mapping
  const Hinv = homography(quad, [{ x: 0, y: 0 }, { x: aw, y: 0 }, { x: aw, y: ah }, { x: 0, y: ah }]);
  const x0 = Math.max(0, Math.floor(Math.min(...quad.map((p) => p.x)))), x1 = Math.min(W, Math.ceil(Math.max(...quad.map((p) => p.x))));
  const y0 = Math.max(0, Math.floor(Math.min(...quad.map((p) => p.y)))), y1 = Math.min(Hh, Math.ceil(Math.max(...quad.map((p) => p.y))));
  const bw = x1 - x0, bh = y1 - y0;
  if (bw <= 0 || bh <= 0) return;
  const base = ctx.getImageData(x0, y0, bw, bh);
  const src = art.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, aw, ah).data;
  // local lighting of the photo, relative to its surroundings
  let shade: Float32Array | null = null;
  if (o.lighting > 0) {
    const n = bw * bh;
    shade = new Float32Array(n);
    for (let i = 0; i < n; i++) shade[i] = (base.data[i * 4] * 0.3 + base.data[i * 4 + 1] * 0.59 + base.data[i * 4 + 2] * 0.11) / 255 + 0.04;
    const avg = new Float32Array(shade);
    blurChannel(avg, bw, bh, Math.max(6, Math.max(bw, bh) / 14));
    for (let i = 0; i < n; i++) shade[i] = Math.min(1.5, Math.max(0.4, shade[i] / avg[i]));
  }
  const d = base.data;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const p = applyH(Hinv, x0 + x + 0.5, y0 + y + 0.5);
      const sx = p.x - 0.5, sy = p.y - 0.5;
      if (sx < -0.5 || sy < -0.5 || sx > aw - 0.5 || sy > ah - 0.5) continue;
      const ix = Math.max(0, Math.min(aw - 2, Math.floor(sx))), iy = Math.max(0, Math.min(ah - 2, Math.floor(sy)));
      const fx = Math.min(1, Math.max(0, sx - ix)), fy = Math.min(1, Math.max(0, sy - iy));
      const i00 = (iy * aw + ix) * 4, i10 = i00 + 4, i01 = i00 + aw * 4, i11 = i01 + 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      const a = (src[i00 + 3] * w00 + src[i10 + 3] * w10 + src[i01 + 3] * w01 + src[i11 + 3] * w11) / 255;
      if (a <= 0.003) continue;
      const k = (y * bw + x) * 4;
      const s = shade ? 1 + (shade[y * bw + x] - 1) * o.lighting : 1;
      const alpha = a * o.opacity;
      for (let c = 0; c < 3; c++) {
        // premultiplied sample → straight colour
        let v = (src[i00 + c] * src[i00 + 3] * w00 + src[i10 + c] * src[i10 + 3] * w10 + src[i01 + c] * src[i01 + 3] * w01 + src[i11 + c] * src[i11 + 3] * w11) / (a * 255);
        if (o.blend === 'multiply') v = (v * d[k + c]) / 255;
        v *= s;
        d[k + c] = d[k + c] + (v - d[k + c]) * alpha;
      }
    }
  }
  ctx.putImageData(base, x0, y0);
}

/** A sensible starting quad: the artwork's aspect, centred, 50% of the photo. */
export function defaultQuad(pw: number, ph: number, aw: number, ah: number): Quad {
  const s = Math.min((pw * 0.5) / aw, (ph * 0.5) / ah);
  const w = aw * s, h = ah * s, x = (pw - w) / 2, y = (ph - h) / 2;
  return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
}
