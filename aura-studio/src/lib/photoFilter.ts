/**
 * Aura photo studio filter — one non-destructive pass that does exposure,
 * white balance, tone (highlights/shadows/whites/blacks), clarity, contrast,
 * saturation/vibrance, split toning, monochrome, matte fade, vignette and
 * grain. Runs as a WebGL shader with an identical Canvas 2D fallback, and
 * serialises with the design so the original pixels are never touched.
 */
import { classRegistry, filters } from 'fabric';

export interface Adjust {
  exposure: number; // -2..2 stops
  temperature: number; // -1..1
  tint: number; // -1..1
  highlights: number; // -1..1
  shadows: number; // -1..1
  whites: number; // -1..1
  blacks: number; // -1..1
  contrast: number; // -1..1
  saturation: number; // -1..1
  vibrance: number; // -1..1
  clarity: number; // -1..1
  vignette: number; // -1..1
  grain: number; // 0..1
}

export const NEUTRAL: Adjust = { exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, contrast: 0, saturation: 0, vibrance: 0, clarity: 0, vignette: 0, grain: 0 };

interface Look extends Partial<Adjust> {
  mono?: number;
  fade?: number;
  split?: number;
  splitShadow?: [number, number, number];
  splitHighlight?: [number, number, number];
}

export const PRESETS: { id: string; label: string; look: Look }[] = [
  { id: 'bw', label: 'Black & White', look: { mono: 1, contrast: 0.15, clarity: 0.2 } },
  { id: 'film', label: 'Film', look: { fade: 0.35, grain: 0.35, contrast: 0.1, saturation: -0.12, temperature: 0.08, split: 0.5, splitShadow: [0.45, 0.55, 0.58], splitHighlight: [0.6, 0.55, 0.45] } },
  { id: 'vintage', label: 'Vintage', look: { fade: 0.6, temperature: 0.35, saturation: -0.3, vignette: 0.45, grain: 0.3, split: 0.8, splitShadow: [0.55, 0.5, 0.42], splitHighlight: [0.62, 0.56, 0.42] } },
  { id: 'cinematic', label: 'Cinematic', look: { contrast: 0.25, saturation: -0.05, vignette: 0.3, split: 1, splitShadow: [0.32, 0.55, 0.62], splitHighlight: [0.68, 0.53, 0.38] } },
  { id: 'warm', label: 'Warm', look: { temperature: 0.5, tint: 0.05, saturation: 0.1 } },
  { id: 'cool', label: 'Cool', look: { temperature: -0.5, saturation: -0.05, tint: -0.03 } },
  { id: 'editorial', label: 'Editorial', look: { contrast: 0.2, saturation: -0.25, highlights: -0.2, shadows: 0.15, fade: 0.15 } },
  { id: 'portrait', label: 'Portrait', look: { exposure: 0.1, shadows: 0.2, highlights: -0.15, saturation: -0.05, temperature: 0.1, clarity: -0.3 } },
  { id: 'matte', label: 'Matte', look: { fade: 0.85, contrast: -0.1, saturation: -0.15 } },
  { id: 'contrast', label: 'High Contrast', look: { contrast: 0.55, clarity: 0.4, blacks: 0.3, whites: 0.3, saturation: 0.1 } },
];

const fragmentSource = `
precision highp float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;
uniform float uExposure; uniform float uTemp; uniform float uTint;
uniform float uHighlights; uniform float uShadows; uniform float uWhites; uniform float uBlacks;
uniform float uContrast; uniform float uSaturation; uniform float uVibrance; uniform float uClarity;
uniform float uFade; uniform float uMono; uniform float uSplit;
uniform vec3 uSplitShadow; uniform vec3 uSplitHighlight;
uniform float uVignette; uniform float uGrain; uniform float uAspect;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec4 col = texture2D(uTexture, vTexCoord);
  vec3 c = col.rgb * pow(2.0, uExposure);
  c.r += uTemp * 0.1; c.b -= uTemp * 0.1; c.g += uTint * 0.1;
  float L = luma(c);
  c += uShadows * 0.35 * (1.0 - smoothstep(0.0, 0.5, L));
  c += uHighlights * 0.35 * smoothstep(0.5, 1.0, L);
  float bp = -uBlacks * 0.15; float wp = 1.0 - uWhites * 0.15;
  c = (c - bp) / (wp - bp);
  L = luma(c);
  float mid = 1.0 - clamp(abs(L - 0.5) * 2.0, 0.0, 1.0);
  c = mix(c, (c - 0.5) * (1.0 + uClarity * 0.6) + 0.5, mid);
  c = (c - 0.5) * (1.0 + uContrast) + 0.5;
  L = luma(c);
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c = mix(vec3(L), c, 1.0 + uSaturation + uVibrance * (1.0 - clamp(sat, 0.0, 1.0)));
  L = luma(clamp(c, 0.0, 1.0));
  c += uSplit * ((1.0 - L) * (uSplitShadow - 0.5) + L * (uSplitHighlight - 0.5)) * 0.3;
  c = mix(c, vec3(luma(c)), uMono);
  c = c * (1.0 - uFade * 0.25) + uFade * 0.12;
  vec2 d = (vTexCoord - 0.5) * vec2(uAspect, 1.0);
  float v = smoothstep(0.85, 0.25, length(d) * 1.15);
  if (uVignette >= 0.0) c *= mix(1.0, v, uVignette);
  else c = mix(c, vec3(1.0), (1.0 - v) * -uVignette);
  c += (rand(vTexCoord * 997.0) - 0.5) * uGrain * 0.25;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), col.a);
}`;

/** Resolve user adjustments + a preset (scaled by amount) into shader parameters. */
export function resolve(adj: Adjust, presetId: string | null, amount: number) {
  const look: Look = (presetId && PRESETS.find((p) => p.id === presetId)?.look) || {};
  const k = presetId ? amount : 0;
  const v = (key: keyof Adjust) => adj[key] + ((look[key] as number) ?? 0) * k;
  return {
    exposure: v('exposure'),
    temperature: v('temperature'),
    tint: v('tint'),
    highlights: v('highlights'),
    shadows: v('shadows'),
    whites: v('whites'),
    blacks: v('blacks'),
    contrast: v('contrast'),
    saturation: v('saturation'),
    vibrance: v('vibrance'),
    clarity: v('clarity'),
    vignette: v('vignette'),
    grain: v('grain'),
    mono: (look.mono ?? 0) * k,
    fade: (look.fade ?? 0) * k,
    split: (look.split ?? 0) * k,
    splitShadow: look.splitShadow ?? [0.5, 0.5, 0.5],
    splitHighlight: look.splitHighlight ?? [0.5, 0.5, 0.5],
  };
}

const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** CPU implementation — mirrors the shader exactly. */
export function applyResolved(data: Uint8ClampedArray, w: number, h: number, p: ReturnType<typeof resolve>) {
  const ex = Math.pow(2, p.exposure);
  const bp = -p.blacks * 0.15;
  const wp = 1 - p.whites * 0.15;
  const aspect = w / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = (data[i] / 255) * ex;
      let g = (data[i + 1] / 255) * ex;
      let b = (data[i + 2] / 255) * ex;
      r += p.temperature * 0.1;
      b -= p.temperature * 0.1;
      g += p.tint * 0.1;
      let L = luma(r, g, b);
      const sh = p.shadows * 0.35 * (1 - smooth(0, 0.5, L));
      const hl = p.highlights * 0.35 * smooth(0.5, 1, L);
      r += sh + hl;
      g += sh + hl;
      b += sh + hl;
      r = (r - bp) / (wp - bp);
      g = (g - bp) / (wp - bp);
      b = (b - bp) / (wp - bp);
      L = luma(r, g, b);
      const mid = 1 - Math.min(1, Math.max(0, Math.abs(L - 0.5) * 2));
      const cl = 1 + p.clarity * 0.6;
      r += ((r - 0.5) * cl + 0.5 - r) * mid;
      g += ((g - 0.5) * cl + 0.5 - g) * mid;
      b += ((b - 0.5) * cl + 0.5 - b) * mid;
      const ct = 1 + p.contrast;
      r = (r - 0.5) * ct + 0.5;
      g = (g - 0.5) * ct + 0.5;
      b = (b - 0.5) * ct + 0.5;
      L = luma(r, g, b);
      const sat = Math.min(1, Math.max(0, Math.max(r, g, b) - Math.min(r, g, b)));
      const sf = 1 + p.saturation + p.vibrance * (1 - sat);
      r = L + (r - L) * sf;
      g = L + (g - L) * sf;
      b = L + (b - L) * sf;
      L = luma(Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, b)));
      r += p.split * ((1 - L) * (p.splitShadow[0] - 0.5) + L * (p.splitHighlight[0] - 0.5)) * 0.3;
      g += p.split * ((1 - L) * (p.splitShadow[1] - 0.5) + L * (p.splitHighlight[1] - 0.5)) * 0.3;
      b += p.split * ((1 - L) * (p.splitShadow[2] - 0.5) + L * (p.splitHighlight[2] - 0.5)) * 0.3;
      const m = luma(r, g, b);
      r += (m - r) * p.mono;
      g += (m - g) * p.mono;
      b += (m - b) * p.mono;
      r = r * (1 - p.fade * 0.25) + p.fade * 0.12;
      g = g * (1 - p.fade * 0.25) + p.fade * 0.12;
      b = b * (1 - p.fade * 0.25) + p.fade * 0.12;
      const dx = (x / w - 0.5) * aspect;
      const dy = y / h - 0.5;
      const v = smooth(0.85, 0.25, Math.hypot(dx, dy) * 1.15);
      if (p.vignette >= 0) {
        const f = 1 + (v - 1) * p.vignette;
        r *= f;
        g *= f;
        b *= f;
      } else {
        const f = (1 - v) * -p.vignette;
        r += (1 - r) * f;
        g += (1 - g) * f;
        b += (1 - b) * f;
      }
      if (p.grain) {
        const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const gn = (Math.abs(n) - 0.5) * p.grain * 0.25;
        r += gn;
        g += gn;
        b += gn;
      }
      data[i] = r * 255;
      data[i + 1] = g * 255;
      data[i + 2] = b * 255;
    }
  }
}

export class AuraAdjust extends (filters.BaseFilter as any) {
  static type = 'AuraAdjust';
  static defaults = { adjust: { ...NEUTRAL }, preset: null as string | null, amount: 1 };
  static uniformLocations = ['uExposure', 'uTemp', 'uTint', 'uHighlights', 'uShadows', 'uWhites', 'uBlacks', 'uContrast', 'uSaturation', 'uVibrance', 'uClarity', 'uFade', 'uMono', 'uSplit', 'uSplitShadow', 'uSplitHighlight', 'uVignette', 'uGrain', 'uAspect'];
  declare adjust: Adjust;
  declare preset: string | null;
  declare amount: number;
  private aspect = 1;

  constructor(opts: Partial<{ adjust: Adjust; preset: string | null; amount: number }> = {}) {
    super(opts);
    this.adjust = { ...NEUTRAL, ...(opts.adjust ?? {}) }; // never share the defaults object
  }

  getFragmentSource() {
    return fragmentSource;
  }
  isNeutralState() {
    return !this.preset && Object.values(this.adjust).every((v) => v === 0);
  }
  applyTo(options: any) {
    this.aspect = options.sourceWidth / options.sourceHeight || 1;
    return super.applyTo(options);
  }
  applyTo2d({ imageData }: { imageData: ImageData }) {
    applyResolved(imageData.data, imageData.width, imageData.height, resolve(this.adjust, this.preset, this.amount));
  }
  sendUniformData(gl: WebGLRenderingContext, u: Record<string, WebGLUniformLocation>) {
    const p = resolve(this.adjust, this.preset, this.amount);
    gl.uniform1f(u.uExposure, p.exposure);
    gl.uniform1f(u.uTemp, p.temperature);
    gl.uniform1f(u.uTint, p.tint);
    gl.uniform1f(u.uHighlights, p.highlights);
    gl.uniform1f(u.uShadows, p.shadows);
    gl.uniform1f(u.uWhites, p.whites);
    gl.uniform1f(u.uBlacks, p.blacks);
    gl.uniform1f(u.uContrast, p.contrast);
    gl.uniform1f(u.uSaturation, p.saturation);
    gl.uniform1f(u.uVibrance, p.vibrance);
    gl.uniform1f(u.uClarity, p.clarity);
    gl.uniform1f(u.uFade, p.fade);
    gl.uniform1f(u.uMono, p.mono);
    gl.uniform1f(u.uSplit, p.split);
    gl.uniform3fv(u.uSplitShadow, p.splitShadow);
    gl.uniform3fv(u.uSplitHighlight, p.splitHighlight);
    gl.uniform1f(u.uVignette, p.vignette);
    gl.uniform1f(u.uGrain, p.grain);
    gl.uniform1f(u.uAspect, this.aspect);
  }
  toObject() {
    return { type: 'AuraAdjust', adjust: { ...this.adjust }, preset: this.preset, amount: this.amount };
  }
  static async fromObject({ type: _t, ...opts }: any) {
    return new AuraAdjust(opts);
  }
}
classRegistry.setClass(AuraAdjust as any);

/** Small preview of a preset applied to an image (for the filter grid). */
export function presetPreview(src: CanvasImageSource, w: number, h: number, presetId: string | null, size = 84) {
  const s = size / Math.max(w, h);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s));
  c.height = Math.max(1, Math.round(h * s));
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  applyResolved(img.data, c.width, c.height, resolve(NEUTRAL, presetId, 1));
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/jpeg', 0.85);
}
