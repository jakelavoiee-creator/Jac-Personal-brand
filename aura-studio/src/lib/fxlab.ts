/**
 * FX Lab — stackable, non-destructive image effects for "crazy artwork":
 * glitch, halftone, duotone, posterize, dither, pixelate, neon edges, VHS,
 * twirl, bulge, wave, ripple, kaleidoscope, mirror, motion / zoom blur, …
 *
 * Each effect is one `AuraFX` fabric filter (so effects stack as separate
 * passes, in any order). Every effect has a WebGL shader and a CPU mirror
 * used when WebGL is unavailable or the image exceeds the GPU texture size.
 * Settings serialize with the design.
 */
import { classRegistry, filters } from 'fabric';

export interface FxParam {
  key: 'p1' | 'p2';
  label: string;
  min: number;
  max: number;
  step?: number;
  def: number;
}
export interface FxDef {
  id: string;
  label: string;
  group: 'Colour' | 'Stylize' | 'Distort' | 'Blur';
  params: FxParam[];
  colors?: [string, string];
  colorLabels?: [string, string];
  /** distortions use amount as strength instead of a mix with the original */
  strength?: boolean;
  glsl: string;
  cpu: (ctx: CpuCtx) => void;
}

interface CpuCtx {
  src: Uint8ClampedArray;
  dst: Uint8ClampedArray;
  w: number;
  h: number;
  p1: number;
  p2: number;
  amount: number;
  c1: number[];
  c2: number[];
  seed: number;
}

/* ---------------- shared CPU helpers ---------------- */

function sample(src: Uint8ClampedArray, w: number, h: number, x: number, y: number, out: number[]) {
  // bilinear, clamped to edge; x/y in pixel centres
  x = Math.min(w - 1, Math.max(0, x - 0.5));
  y = Math.min(h - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  for (let c = 0; c < 4; c++) {
    const a = src[(y0 * w + x0) * 4 + c], b = src[(y0 * w + x1) * 4 + c], d = src[(y1 * w + x0) * 4 + c], e = src[(y1 * w + x1) * 4 + c];
    out[c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
  }
}
const lum = (r: number, g: number, b: number) => (r * 0.299 + g * 0.587 + b * 0.114) / 255;
const fract = (v: number) => v - Math.floor(v);
const rand = (x: number, y: number, seed: number) => fract(Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453);
function hsv2rgb(h: number, s: number, v: number) {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const m = ((i % 6) + 6) % 6;
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][m];
}
/** run a per-pixel map from destination pixel → source coordinate */
function warp(c: CpuCtx, map: (x: number, y: number) => [number, number]) {
  const t = [0, 0, 0, 0];
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const [sx, sy] = map(x + 0.5, y + 0.5);
      sample(c.src, c.w, c.h, sx, sy, t);
      const i = (y * c.w + x) * 4;
      c.dst[i] = t[0];
      c.dst[i + 1] = t[1];
      c.dst[i + 2] = t[2];
      c.dst[i + 3] = t[3];
    }
}
function perPixel(c: CpuCtx, f: (r: number, g: number, b: number, x: number, y: number) => number[]) {
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const i = (y * c.w + x) * 4;
      const o = f(c.src[i], c.src[i + 1], c.src[i + 2], x, y);
      c.dst[i] = o[0];
      c.dst[i + 1] = o[1];
      c.dst[i + 2] = o[2];
      c.dst[i + 3] = c.src[i + 3];
    }
}
const px = (c: CpuCtx) => Math.max(c.w, c.h) / 1000; // effect sizes are authored per 1000 px

/* ---------------- effect definitions ---------------- */
// GLSL bodies define `vec4 effect(vec2 uv)`; helpers: src(), lum(), rand(), hsv2rgb(), uSize (px), uP1, uP2, uC1, uC2, uAmount, uSeed

export const FX: FxDef[] = [
  {
    id: 'duotone',
    label: 'Duotone',
    group: 'Colour',
    params: [{ key: 'p1', label: 'Contrast', min: 0, max: 1, step: 0.01, def: 0.4 }],
    colors: ['#1b1464', '#ff5fa2'],
    colorLabels: ['Shadows', 'Highlights'],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); float l=lum(c.rgb); l=clamp((l-.5)*(1.+uP1*2.)+.5,0.,1.); return vec4(mix(uC1,uC2,l),c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => { let l = lum(r, g, b); l = Math.min(1, Math.max(0, (l - 0.5) * (1 + c.p1 * 2) + 0.5)); return [0, 1, 2].map((k) => (c.c1[k] + (c.c2[k] - c.c1[k]) * l) * 255); }),
  },
  {
    id: 'acid',
    label: 'Acid colours',
    group: 'Colour',
    params: [
      { key: 'p1', label: 'Bands', min: 1, max: 12, step: 0.1, def: 3 },
      { key: 'p2', label: 'Shift', min: 0, max: 1, step: 0.01, def: 0 },
    ],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); float l=lum(c.rgb); return vec4(hsv2rgb(vec3(fract(l*uP1+uP2),.85,.35+.65*l)),c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => { const l = lum(r, g, b); return hsv2rgb(fract(l * c.p1 + c.p2), 0.85, 0.35 + 0.65 * l).map((v) => v * 255); }),
  },
  {
    id: 'thermal',
    label: 'Thermal',
    group: 'Colour',
    params: [{ key: 'p1', label: 'Heat', min: 0, max: 1, step: 0.01, def: 0.5 }],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); float l=clamp(lum(c.rgb)*(.6+uP1*.8),0.,1.); vec3 a=vec3(.05,0.,.25),b=vec3(.85,0.,.6),d=vec3(1.,.75,0.),e=vec3(1.); vec3 o=l<.33?mix(a,b,l/.33):l<.66?mix(b,d,(l-.33)/.33):mix(d,e,(l-.66)/.34); return vec4(o,c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => { const l = Math.min(1, Math.max(0, lum(r, g, b) * (0.6 + c.p1 * 0.8))); const a = [0.05, 0, 0.25], bb = [0.85, 0, 0.6], d = [1, 0.75, 0], e = [1, 1, 1]; const [p, q, t] = l < 0.33 ? [a, bb, l / 0.33] : l < 0.66 ? [bb, d, (l - 0.33) / 0.33] : [d, e, (l - 0.66) / 0.34]; return p.map((v, i) => (v + (q[i] - v) * (t as number)) * 255); }),
  },
  {
    id: 'posterize',
    label: 'Posterize',
    group: 'Colour',
    params: [{ key: 'p1', label: 'Levels', min: 2, max: 16, step: 1, def: 4 }],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); float n=max(uP1-1.,1.); return vec4(floor(c.rgb*n+.5)/n,c.a); }`,
    cpu: (c) => { const n = Math.max(c.p1 - 1, 1); perPixel(c, (r, g, b) => [r, g, b].map((v) => (Math.floor((v / 255) * n + 0.5) / n) * 255)); },
  },
  {
    id: 'threshold',
    label: 'Threshold',
    group: 'Colour',
    params: [{ key: 'p1', label: 'Level', min: 0, max: 1, step: 0.01, def: 0.5 }],
    colors: ['#111111', '#f4efe6'],
    colorLabels: ['Ink', 'Paper'],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); return vec4(lum(c.rgb)<uP1?uC1:uC2,c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => (lum(r, g, b) < c.p1 ? c.c1 : c.c2).map((v) => v * 255)),
  },
  {
    id: 'solarize',
    label: 'Solarize',
    group: 'Colour',
    params: [{ key: 'p1', label: 'Threshold', min: 0, max: 1, step: 0.01, def: 0.5 }],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); vec3 o=c.rgb; o=mix(o,1.-o,step(uP1,o)); return vec4(o,c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => [r, g, b].map((v) => (v / 255 >= c.p1 ? 255 - v : v))),
  },
  {
    id: 'invert',
    label: 'Invert',
    group: 'Colour',
    params: [],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); return vec4(1.-c.rgb,c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b) => [255 - r, 255 - g, 255 - b]),
  },
  {
    id: 'halftone',
    label: 'Halftone',
    group: 'Stylize',
    params: [
      { key: 'p1', label: 'Dot size', min: 3, max: 60, step: 1, def: 12 },
      { key: 'p2', label: 'Angle', min: 0, max: 90, step: 1, def: 45 },
    ],
    colors: ['#111111', '#f4efe6'],
    colorLabels: ['Ink', 'Paper'],
    glsl: `vec4 effect(vec2 uv){ float s=uP1*max(uSize.x,uSize.y)/1000.; float a=radians(uP2); mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a)); vec2 p=R*(uv*uSize); vec2 cell=floor(p/s)*s+s*.5; vec2 cu=(transpose(R)*cell)/uSize; vec4 c=src(cu); float l=lum(c.rgb); float r=(1.-l)*s*.72; float d=length(p-cell); float ink=1.-smoothstep(r-1.,r+1.,d); return vec4(mix(uC2,uC1,ink),src(uv).a); }`,
    cpu: (c) => {
      const s = c.p1 * px(c), a = (c.p2 * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a), t = [0, 0, 0, 0];
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < c.w; x++) {
          const X = x + 0.5, Y = y + 0.5;
          const rx = co * X + si * Y, ry = -si * X + co * Y; // rotate into screen grid
          const cx = Math.floor(rx / s) * s + s / 2, cy = Math.floor(ry / s) * s + s / 2;
          sample(c.src, c.w, c.h, co * cx - si * cy, si * cx + co * cy, t);
          const l = lum(t[0], t[1], t[2]), r = (1 - l) * s * 0.72, d = Math.hypot(rx - cx, ry - cy);
          const ink = 1 - Math.min(1, Math.max(0, (d - (r - 1)) / 2));
          const i = (y * c.w + x) * 4;
          for (let k = 0; k < 3; k++) c.dst[i + k] = (c.c2[k] + (c.c1[k] - c.c2[k]) * ink) * 255;
          c.dst[i + 3] = c.src[i + 3];
        }
    },
  },
  {
    id: 'pixelate',
    label: 'Pixelate',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Block', min: 2, max: 80, step: 1, def: 16 }],
    glsl: `vec4 effect(vec2 uv){ float s=uP1*max(uSize.x,uSize.y)/1000.; vec2 p=(floor(uv*uSize/s)+.5)*s/uSize; return src(p); }`,
    cpu: (c) => { const s = c.p1 * px(c); warp(c, (x, y) => [(Math.floor(x / s) + 0.5) * s, (Math.floor(y / s) + 0.5) * s]); },
  },
  {
    id: 'dither',
    label: 'Dither',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Pixel', min: 1, max: 12, step: 1, def: 3 }],
    colors: ['#0b0b0b', '#e8f5d0'],
    colorLabels: ['Dark', 'Light'],
    glsl: `float bayer(vec2 p){ int x=int(mod(p.x,4.)),y=int(mod(p.y,4.)); int i=x+y*4; float m=0.; if(i==0)m=0.;else if(i==1)m=8.;else if(i==2)m=2.;else if(i==3)m=10.;else if(i==4)m=12.;else if(i==5)m=4.;else if(i==6)m=14.;else if(i==7)m=6.;else if(i==8)m=3.;else if(i==9)m=11.;else if(i==10)m=1.;else if(i==11)m=9.;else if(i==12)m=15.;else if(i==13)m=7.;else if(i==14)m=13.;else m=5.; return (m+.5)/16.; }
vec4 effect(vec2 uv){ float s=max(1.,uP1*max(uSize.x,uSize.y)/1000.); vec2 cell=floor(uv*uSize/s); vec4 c=src((cell+.5)*s/uSize); return vec4(lum(c.rgb)>bayer(cell)?uC2:uC1,src(uv).a); }`,
    cpu: (c) => {
      const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], s = Math.max(1, c.p1 * px(c)), t = [0, 0, 0, 0];
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < c.w; x++) {
          const cx = Math.floor((x + 0.5) / s), cy = Math.floor((y + 0.5) / s);
          sample(c.src, c.w, c.h, (cx + 0.5) * s, (cy + 0.5) * s, t);
          const th = (B[(cx % 4) + (cy % 4) * 4] + 0.5) / 16, col = lum(t[0], t[1], t[2]) > th ? c.c2 : c.c1;
          const i = (y * c.w + x) * 4;
          c.dst[i] = col[0] * 255;
          c.dst[i + 1] = col[1] * 255;
          c.dst[i + 2] = col[2] * 255;
          c.dst[i + 3] = c.src[i + 3];
        }
    },
  },
  {
    id: 'neon',
    label: 'Neon edges',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Glow', min: 0.5, max: 6, step: 0.1, def: 2.5 }],
    colors: ['#3cf2ff', '#ff2bd6'],
    colorLabels: ['Glow', 'Accent'],
    glsl: `vec4 effect(vec2 uv){ vec2 t=1./uSize; float tl=lum(src(uv+t*vec2(-1,-1)).rgb),tc=lum(src(uv+t*vec2(0,-1)).rgb),tr=lum(src(uv+t*vec2(1,-1)).rgb),ml=lum(src(uv+t*vec2(-1,0)).rgb),mr=lum(src(uv+t*vec2(1,0)).rgb),bl=lum(src(uv+t*vec2(-1,1)).rgb),bc=lum(src(uv+t*vec2(0,1)).rgb),br=lum(src(uv+t*vec2(1,1)).rgb); float gx=-tl-2.*ml-bl+tr+2.*mr+br, gy=-tl-2.*tc-tr+bl+2.*bc+br; float e=clamp(length(vec2(gx,gy))*uP1,0.,1.); return vec4(mix(uC1,uC2,uv.y)*e,src(uv).a); }`,
    cpu: (c) => {
      const L = (x: number, y: number) => { const i = (Math.min(c.h - 1, Math.max(0, y)) * c.w + Math.min(c.w - 1, Math.max(0, x))) * 4; return lum(c.src[i], c.src[i + 1], c.src[i + 2]); };
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < c.w; x++) {
          const gx = -L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1) + L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1);
          const gy = -L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1) + L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1);
          const e = Math.min(1, Math.hypot(gx, gy) * c.p1), v = y / c.h, i = (y * c.w + x) * 4;
          for (let k = 0; k < 3; k++) c.dst[i + k] = (c.c1[k] + (c.c2[k] - c.c1[k]) * v) * e * 255;
          c.dst[i + 3] = c.src[i + 3];
        }
    },
  },
  {
    id: 'emboss',
    label: 'Emboss',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Depth', min: 0.5, max: 6, step: 0.1, def: 2 }],
    glsl: `vec4 effect(vec2 uv){ vec2 t=uP1/uSize; float d=lum(src(uv-t).rgb)-lum(src(uv+t).rgb); return vec4(vec3(.5+d*2.),src(uv).a); }`,
    cpu: (c) => { const t = [0, 0, 0, 0], u = [0, 0, 0, 0]; for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { sample(c.src, c.w, c.h, x + 0.5 - c.p1, y + 0.5 - c.p1, t); sample(c.src, c.w, c.h, x + 0.5 + c.p1, y + 0.5 + c.p1, u); const v = Math.min(1, Math.max(0, 0.5 + (lum(t[0], t[1], t[2]) - lum(u[0], u[1], u[2])) * 2)) * 255, i = (y * c.w + x) * 4; c.dst[i] = c.dst[i + 1] = c.dst[i + 2] = v; c.dst[i + 3] = c.src[i + 3]; } },
  },
  {
    id: 'vhs',
    label: 'VHS / scanlines',
    group: 'Stylize',
    params: [
      { key: 'p1', label: 'Lines', min: 100, max: 1200, step: 10, def: 420 },
      { key: 'p2', label: 'Noise', min: 0, max: 1, step: 0.01, def: 0.35 },
    ],
    glsl: `vec4 effect(vec2 uv){ float o=3./uSize.x; float r=src(uv+vec2(o,0)).r, g=src(uv).g, b=src(uv-vec2(o,0)).b; float line=.78+.22*sin(uv.y*uP1*3.14159); float n=(rand(uv*uSize)-.5)*uP2*.5; return vec4(vec3(r,g,b)*line+n,src(uv).a); }`,
    cpu: (c) => {
      const o = (3 / c.w) * c.w, t = [0, 0, 0, 0];
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < c.w; x++) {
          const i = (y * c.w + x) * 4, line = 0.78 + 0.22 * Math.sin(((y + 0.5) / c.h) * c.p1 * Math.PI), n = (rand(x, y, c.seed) - 0.5) * c.p2 * 0.5 * 255;
          sample(c.src, c.w, c.h, x + 0.5 + o, y + 0.5, t);
          c.dst[i] = t[0] * line + n;
          c.dst[i + 1] = c.src[i + 1] * line + n;
          sample(c.src, c.w, c.h, x + 0.5 - o, y + 0.5, t);
          c.dst[i + 2] = t[2] * line + n;
          c.dst[i + 3] = c.src[i + 3];
        }
    },
  },
  {
    id: 'glitch',
    label: 'Glitch',
    group: 'Stylize',
    params: [
      { key: 'p1', label: 'RGB split', min: 0, max: 60, step: 1, def: 14 },
      { key: 'p2', label: 'Slices', min: 0, max: 1, step: 0.01, def: 0.5 },
    ],
    glsl: `vec4 effect(vec2 uv){ float band=floor(uv.y*28.); float r0=rand(vec2(band,uSeed)); float shift=(r0>1.-uP2*.6)?(rand(vec2(band,uSeed+1.))-.5)*.18*uP2:0.; vec2 p=uv+vec2(shift,0.); float o=uP1/1000.; return vec4(src(p+vec2(o,0)).r,src(p).g,src(p-vec2(o,0)).b,src(p).a); }`,
    cpu: (c) => {
      const t = [0, 0, 0, 0], o = (c.p1 / 1000) * c.w;
      for (let y = 0; y < c.h; y++) {
        const band = Math.floor(((y + 0.5) / c.h) * 28);
        const shift = rand(band, c.seed, c.seed) > 1 - c.p2 * 0.6 ? (rand(band, c.seed + 1, c.seed) - 0.5) * 0.18 * c.p2 * c.w : 0;
        for (let x = 0; x < c.w; x++) {
          const i = (y * c.w + x) * 4, X = x + 0.5 + shift, Y = y + 0.5;
          sample(c.src, c.w, c.h, X + o, Y, t);
          c.dst[i] = t[0];
          sample(c.src, c.w, c.h, X, Y, t);
          c.dst[i + 1] = t[1];
          c.dst[i + 3] = t[3];
          sample(c.src, c.w, c.h, X - o, Y, t);
          c.dst[i + 2] = t[2];
        }
      }
    },
  },
  {
    id: 'chroma',
    label: 'Chromatic aberration',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Spread', min: 0, max: 40, step: 0.5, def: 10 }],
    glsl: `vec4 effect(vec2 uv){ vec2 d=(uv-.5)*uP1/500.; return vec4(src(uv+d).r,src(uv).g,src(uv-d).b,src(uv).a); }`,
    cpu: (c) => { const t = [0, 0, 0, 0]; for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (y * c.w + x) * 4, dx = ((x + 0.5) / c.w - 0.5) * (c.p1 / 500) * c.w, dy = ((y + 0.5) / c.h - 0.5) * (c.p1 / 500) * c.h; sample(c.src, c.w, c.h, x + 0.5 + dx, y + 0.5 + dy, t); c.dst[i] = t[0]; sample(c.src, c.w, c.h, x + 0.5 - dx, y + 0.5 - dy, t); c.dst[i + 2] = t[2]; c.dst[i + 1] = c.src[i + 1]; c.dst[i + 3] = c.src[i + 3]; } },
  },
  {
    id: 'noise',
    label: 'Grain',
    group: 'Stylize',
    params: [{ key: 'p1', label: 'Amount', min: 0, max: 1, step: 0.01, def: 0.4 }],
    glsl: `vec4 effect(vec2 uv){ vec4 c=src(uv); return vec4(c.rgb+(rand(uv*uSize)-.5)*uP1*.6,c.a); }`,
    cpu: (c) => perPixel(c, (r, g, b, x, y) => { const n = (rand(x, y, c.seed) - 0.5) * c.p1 * 0.6 * 255; return [r + n, g + n, b + n]; }),
  },
  {
    id: 'twirl',
    label: 'Twirl',
    group: 'Distort',
    strength: true,
    params: [
      { key: 'p1', label: 'Angle', min: -720, max: 720, step: 1, def: 240 },
      { key: 'p2', label: 'Radius', min: 0.1, max: 1, step: 0.01, def: 0.6 },
    ],
    glsl: `vec4 effect(vec2 uv){ vec2 a=vec2(uSize.x/uSize.y,1.); vec2 d=(uv-.5)*a; float r=length(d); float R=uP2*.7; if(r<R){ float k=1.-r/R; float t=radians(uP1)*k*k*uAmount; d=mat2(cos(t),-sin(t),sin(t),cos(t))*d; } return src(d/a+.5); }`,
    cpu: (c) => { const R = c.p2 * 0.7 * c.h, cx = c.w / 2, cy = c.h / 2; warp(c, (x, y) => { let dx = x - cx, dy = y - cy; const r = Math.hypot(dx, dy); if (r < R) { const k = 1 - r / R, t = ((c.p1 * Math.PI) / 180) * k * k * c.amount, co = Math.cos(t), si = Math.sin(t); [dx, dy] = [co * dx + si * dy, -si * dx + co * dy]; } return [cx + dx, cy + dy]; }); },
  },
  {
    id: 'bulge',
    label: 'Bulge / pinch',
    group: 'Distort',
    strength: true,
    params: [
      { key: 'p1', label: 'Amount', min: -1, max: 1, step: 0.01, def: 0.6 },
      { key: 'p2', label: 'Radius', min: 0.1, max: 1, step: 0.01, def: 0.55 },
    ],
    glsl: `vec4 effect(vec2 uv){ vec2 a=vec2(uSize.x/uSize.y,1.); vec2 d=(uv-.5)*a; float r=length(d); float R=uP2*.7; if(r<R){ float k=r/R; float f=pow(k, 1.+uP1*uAmount*.9)/max(k,1e-4); d*=f; } return src(d/a+.5); }`,
    cpu: (c) => { const R = c.p2 * 0.7 * c.h, cx = c.w / 2, cy = c.h / 2; warp(c, (x, y) => { let dx = x - cx, dy = y - cy; const r = Math.hypot(dx, dy); if (r < R) { const k = r / R, f = Math.pow(k, 1 + c.p1 * c.amount * 0.9) / Math.max(k, 1e-4); dx *= f; dy *= f; } return [cx + dx, cy + dy]; }); },
  },
  {
    id: 'wave',
    label: 'Wave',
    group: 'Distort',
    strength: true,
    params: [
      { key: 'p1', label: 'Height', min: 0, max: 80, step: 1, def: 24 },
      { key: 'p2', label: 'Waves', min: 1, max: 40, step: 0.5, def: 6 },
    ],
    glsl: `vec4 effect(vec2 uv){ float a=uP1/1000.*uAmount; return src(uv+vec2(sin(uv.y*uP2*6.2832)*a, sin(uv.x*uP2*6.2832)*a*.5)); }`,
    cpu: (c) => { const a = (c.p1 / 1000) * c.amount; warp(c, (x, y) => [x + Math.sin((y / c.h) * c.p2 * 2 * Math.PI) * a * c.w, y + Math.sin((x / c.w) * c.p2 * 2 * Math.PI) * a * 0.5 * c.h]); },
  },
  {
    id: 'ripple',
    label: 'Ripple',
    group: 'Distort',
    strength: true,
    params: [
      { key: 'p1', label: 'Height', min: 0, max: 60, step: 1, def: 14 },
      { key: 'p2', label: 'Rings', min: 2, max: 60, step: 1, def: 18 },
    ],
    glsl: `vec4 effect(vec2 uv){ vec2 a=vec2(uSize.x/uSize.y,1.); vec2 d=(uv-.5)*a; float r=length(d); float o=sin(r*uP2*6.2832)*uP1/1000.*uAmount; return src((d+normalize(d+1e-5)*o)/a+.5); }`,
    cpu: (c) => { const cx = c.w / 2, cy = c.h / 2; warp(c, (x, y) => { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) + 1e-5, o = Math.sin((r / c.h) * c.p2 * 2 * Math.PI) * (c.p1 / 1000) * c.amount * c.h; return [x + (dx / r) * o, y + (dy / r) * o]; }); },
  },
  {
    id: 'kaleido',
    label: 'Kaleidoscope',
    group: 'Distort',
    params: [
      { key: 'p1', label: 'Segments', min: 2, max: 16, step: 1, def: 6 },
      { key: 'p2', label: 'Rotate', min: 0, max: 360, step: 1, def: 0 },
    ],
    glsl: `vec4 effect(vec2 uv){ vec2 a=vec2(uSize.x/uSize.y,1.); vec2 d=(uv-.5)*a; float r=length(d); float t=atan(d.y,d.x)+radians(uP2); float s=6.2832/uP1; t=mod(t,s); t=abs(t-s*.5)-1.5708+s*.25; return src(vec2(cos(t),sin(t))*r/a+.5); }`,
    cpu: (c) => { const cx = c.w / 2, cy = c.h / 2, s = (2 * Math.PI) / c.p1; warp(c, (x, y) => { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy); let t = Math.atan2(dy, dx) + (c.p2 * Math.PI) / 180; t = ((t % s) + s) % s; t = Math.abs(t - s / 2) - Math.PI / 2 + s / 4; return [cx + Math.cos(t) * r, cy + Math.sin(t) * r]; }); },
  },
  {
    id: 'mirror',
    label: 'Mirror',
    group: 'Distort',
    params: [{ key: 'p1', label: 'Mode', min: 0, max: 3, step: 1, def: 0 }],
    glsl: `vec4 effect(vec2 uv){ vec2 p=uv; if(uP1<.5||uP1>2.5) p.x=.5-abs(p.x-.5); if(uP1>.5) p.y=.5-abs(p.y-.5); return src(p); }`,
    cpu: (c) => warp(c, (x, y) => { let X = x, Y = y; if (c.p1 < 0.5 || c.p1 > 2.5) X = c.w / 2 - Math.abs(x - c.w / 2); if (c.p1 > 0.5) Y = c.h / 2 - Math.abs(y - c.h / 2); return [X, Y]; }),
  },
  {
    id: 'motion',
    label: 'Motion blur',
    group: 'Blur',
    params: [
      { key: 'p1', label: 'Length', min: 0, max: 120, step: 1, def: 30 },
      { key: 'p2', label: 'Angle', min: 0, max: 180, step: 1, def: 0 },
    ],
    glsl: `vec4 effect(vec2 uv){ float a=radians(uP2); vec2 d=vec2(cos(a),sin(a))*uP1/1000.*vec2(1.,uSize.x/uSize.y); vec4 s=vec4(0.); for(int i=0;i<24;i++){ float t=float(i)/23.-.5; s+=src(uv+d*t); } return s/24.; }`,
    cpu: (c) => { const a = (c.p2 * Math.PI) / 180, L = (c.p1 / 1000) * c.w, dx = Math.cos(a) * L, dy = Math.sin(a) * L, t = [0, 0, 0, 0]; for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const acc = [0, 0, 0, 0]; for (let i = 0; i < 24; i++) { const k = i / 23 - 0.5; sample(c.src, c.w, c.h, x + 0.5 + dx * k, y + 0.5 + dy * k, t); for (let q = 0; q < 4; q++) acc[q] += t[q]; } const o = (y * c.w + x) * 4; for (let q = 0; q < 4; q++) c.dst[o + q] = acc[q] / 24; } },
  },
  {
    id: 'zoom',
    label: 'Zoom blur',
    group: 'Blur',
    params: [{ key: 'p1', label: 'Strength', min: 0, max: 0.6, step: 0.01, def: 0.18 }],
    glsl: `vec4 effect(vec2 uv){ vec2 d=uv-.5; vec4 s=vec4(0.); for(int i=0;i<24;i++){ float t=1.-uP1*float(i)/23.; s+=src(.5+d*t); } return s/24.; }`,
    cpu: (c) => { const t = [0, 0, 0, 0], cx = c.w / 2, cy = c.h / 2; for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const acc = [0, 0, 0, 0]; for (let i = 0; i < 24; i++) { const k = 1 - (c.p1 * i) / 23; sample(c.src, c.w, c.h, cx + (x + 0.5 - cx) * k, cy + (y + 0.5 - cy) * k, t); for (let q = 0; q < 4; q++) acc[q] += t[q]; } const o = (y * c.w + x) * 4; for (let q = 0; q < 4; q++) c.dst[o + q] = acc[q] / 24; } },
  },
];
export const FX_BY_ID = Object.fromEntries(FX.map((f) => [f.id, f]));

const HEADER = `precision highp float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;
uniform float uAmount, uP1, uP2, uSeed;
uniform vec2 uSize;
uniform vec3 uC1, uC2;
vec4 src(vec2 p){ return texture2D(uTexture, clamp(p, 0., 1.)); }
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233)) + uSeed) * 43758.5453); }
vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.,2./3.,1./3.,3.); vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www); return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y); }
mat2 transpose(mat2 m){ return mat2(m[0][0], m[1][0], m[0][1], m[1][1]); }
`;

const hex = (h: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  const n = m ? parseInt(m[1], 16) : 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export interface FxOpts {
  effect: string;
  amount: number;
  p1: number;
  p2: number;
  c1: string;
  c2: string;
  seed: number;
}

export function fxDefaults(id: string): FxOpts {
  const d = FX_BY_ID[id];
  const v = (k: 'p1' | 'p2') => d.params.find((p) => p.key === k)?.def ?? 0;
  return { effect: id, amount: 1, p1: v('p1'), p2: v('p2'), c1: d.colors?.[0] ?? '#000000', c2: d.colors?.[1] ?? '#ffffff', seed: Math.round(Math.random() * 1000) };
}

export class AuraFX extends (filters.BaseFilter as any) {
  static type = 'AuraFX';
  static defaults = { effect: 'duotone', amount: 1, p1: 0, p2: 0, c1: '#000000', c2: '#ffffff', seed: 1 };
  static uniformLocations = ['uAmount', 'uP1', 'uP2', 'uSeed', 'uSize', 'uC1', 'uC2'];
  declare effect: string;
  declare amount: number;
  declare p1: number;
  declare p2: number;
  declare c1: string;
  declare c2: string;
  declare seed: number;
  private size = [1, 1];

  constructor(opts: Partial<FxOpts> = {}) {
    super(opts);
  }
  /** one compiled program per effect */
  getCacheKey() {
    return `AuraFX_${this.effect}`;
  }
  getFragmentSource() {
    const d = FX_BY_ID[this.effect] ?? FX[0];
    return `${HEADER}${d.glsl}
void main(){ vec4 o=src(vTexCoord); vec4 e=effect(vTexCoord); gl_FragColor=${d.strength ? 'e' : 'mix(o, e, uAmount)'}; }`;
  }
  isNeutralState() {
    return this.amount <= 0;
  }
  applyTo(options: any) {
    this.size = [options.sourceWidth || 1, options.sourceHeight || 1];
    return super.applyTo(options);
  }
  applyTo2d({ imageData }: { imageData: ImageData }) {
    const d = FX_BY_ID[this.effect];
    if (!d) return;
    const w = imageData.width, h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;
    // CPU sizes are authored per 1000 px of the long side, like the shaders
    d.cpu({ src, dst, w, h, p1: this.p1, p2: this.p2, amount: this.amount, c1: hex(this.c1), c2: hex(this.c2), seed: this.seed });
    if (!d.strength && this.amount < 1) for (let i = 0; i < dst.length; i++) dst[i] = src[i] + (dst[i] - src[i]) * this.amount;
  }
  sendUniformData(gl: WebGLRenderingContext, u: Record<string, WebGLUniformLocation>) {
    gl.uniform1f(u.uAmount, this.amount);
    gl.uniform1f(u.uP1, this.p1);
    gl.uniform1f(u.uP2, this.p2);
    gl.uniform1f(u.uSeed, this.seed);
    gl.uniform2fv(u.uSize, this.size);
    gl.uniform3fv(u.uC1, hex(this.c1));
    gl.uniform3fv(u.uC2, hex(this.c2));
  }
  toObject() {
    return { type: 'AuraFX', effect: this.effect, amount: this.amount, p1: this.p1, p2: this.p2, c1: this.c1, c2: this.c2, seed: this.seed };
  }
  static async fromObject({ type: _t, ...opts }: any) {
    return new AuraFX(opts);
  }
}
classRegistry.setClass(AuraFX as any);

/* ---------------- one-click looks ---------------- */

export const LOOKS: { id: string; label: string; stack: Partial<FxOpts>[] }[] = [
  { id: 'acid', label: 'Acid trip', stack: [{ effect: 'twirl', p1: 300, p2: 0.75 }, { effect: 'acid', p1: 4 }, { effect: 'chroma', p1: 12 }] },
  { id: 'vhs', label: 'VHS tape', stack: [{ effect: 'glitch', p1: 10, p2: 0.4 }, { effect: 'vhs', p1: 380, p2: 0.4 }] },
  { id: 'riso', label: 'Riso print', stack: [{ effect: 'duotone', c1: '#2d3a8c', c2: '#ff6f61', p1: 0.5 }, { effect: 'noise', p1: 0.35 }] },
  { id: 'comic', label: 'Comic halftone', stack: [{ effect: 'posterize', p1: 5 }, { effect: 'halftone', p1: 10, p2: 45, c1: '#111111', c2: '#ffe66d', amount: 0.85 }] },
  { id: 'neon', label: 'Neon noir', stack: [{ effect: 'neon', p1: 3, c1: '#3cf2ff', c2: '#ff2bd6' }] },
  { id: 'vapor', label: 'Vaporwave', stack: [{ effect: 'duotone', c1: '#2b0f54', c2: '#ff71ce', p1: 0.3 }, { effect: 'wave', p1: 10, p2: 4 }, { effect: 'vhs', p1: 300, p2: 0.2, amount: 0.7 }] },
  { id: 'kaleido', label: 'Mandala', stack: [{ effect: 'kaleido', p1: 8 }, { effect: 'chroma', p1: 6 }] },
  { id: 'pixel', label: 'Retro pixel', stack: [{ effect: 'pixelate', p1: 14 }, { effect: 'posterize', p1: 6 }] },
  { id: 'gameboy', label: 'Game Boy', stack: [{ effect: 'dither', p1: 4, c1: '#0f380f', c2: '#9bbc0f' }] },
  { id: 'thermal', label: 'Thermal cam', stack: [{ effect: 'thermal', p1: 0.6 }, { effect: 'noise', p1: 0.2 }] },
  { id: 'liquid', label: 'Liquid', stack: [{ effect: 'ripple', p1: 18, p2: 14 }, { effect: 'twirl', p1: -160, p2: 0.9 }] },
  { id: 'stamp', label: 'Rubber stamp', stack: [{ effect: 'threshold', p1: 0.55, c1: '#b3001b', c2: '#f4efe6' }, { effect: 'noise', p1: 0.5 }] },
  { id: 'speed', label: 'Speed', stack: [{ effect: 'motion', p1: 60, p2: 0 }, { effect: 'chroma', p1: 8 }] },
  { id: 'warp', label: 'Warp zoom', stack: [{ effect: 'zoom', p1: 0.25 }, { effect: 'bulge', p1: 0.5, p2: 0.7 }] },
];

/** A random stack of 2–3 effects with random settings — "Surprise me". */
export function randomStack(): FxOpts[] {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const groups = [FX.filter((f) => f.group === 'Distort'), FX.filter((f) => f.group === 'Colour'), FX.filter((f) => f.group === 'Stylize')];
  const n = 2 + Math.floor(Math.random() * 2);
  const palette = ['#ff2bd6', '#3cf2ff', '#ffe66d', '#2d3a8c', '#ff6f61', '#0f380f', '#9bbc0f', '#111111', '#f4efe6', '#7c5cff', '#00ffa3'];
  return groups.slice(0, n).map((g) => {
    const d = pick(g);
    const o = fxDefaults(d.id);
    for (const p of d.params) o[p.key] = Math.round((p.min + Math.random() * (p.max - p.min)) / (p.step ?? 0.01)) * (p.step ?? 0.01);
    if (d.colors) [o.c1, o.c2] = [pick(palette), pick(palette)];
    return o;
  });
}
