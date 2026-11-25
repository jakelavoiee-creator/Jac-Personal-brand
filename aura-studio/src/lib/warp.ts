/** Text transforms expressed as paths that fabric lays glyphs along. */
export type WarpType = 'arc' | 'circle' | 'wave' | 'path';
// NB: the discriminator is `kind`, never `type` — fabric's loader would try to
// instantiate any nested `{ type }` object as a fabric class.
export interface Warp {
  kind: WarpType;
  /** -100..100 — bend for arc, spacing for circle, amplitude for wave */
  amount: number;
  /** wave only: number of crests across the text */
  cycles?: number;
}

export const WARPS: { kind: WarpType | 'none'; label: string }[] = [
  { kind: 'none', label: 'None' },
  { kind: 'arc', label: 'Arch' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'wave', label: 'Wave' },
];

const f = (n: number) => n.toFixed(2);

/** Build SVG path data for a text of advance width `w`. Coordinates are centred on 0,0. */
export function warpPath(warp: Warp, w: number, fontSize: number): string {
  const len = w * 1.04; // a little slack so the last glyph never runs off the end
  if (warp.kind === 'arc') {
    const a = Math.max(-100, Math.min(100, warp.amount || 1));
    const th = Math.max(0.04, (Math.abs(a) / 100) * Math.PI * 1.9);
    const R = len / th;
    const large = th > Math.PI ? 1 : 0;
    if (a > 0) {
      const a0 = -Math.PI / 2 - th / 2;
      const a1 = -Math.PI / 2 + th / 2;
      return `M ${f(R * Math.cos(a0))} ${f(R * Math.sin(a0) + R)} A ${f(R)} ${f(R)} 0 ${large} 1 ${f(R * Math.cos(a1))} ${f(R * Math.sin(a1) + R)}`;
    }
    const a0 = Math.PI / 2 + th / 2;
    const a1 = Math.PI / 2 - th / 2;
    return `M ${f(R * Math.cos(a0))} ${f(R * Math.sin(a0) - R)} A ${f(R)} ${f(R)} 0 ${large} 0 ${f(R * Math.cos(a1))} ${f(R * Math.sin(a1) - R)}`;
  }
  if (warp.kind === 'circle') {
    // spacing > 0 opens the circle up; text is centred at the top
    const R = (len / (2 * Math.PI)) * (1 + Math.max(0, warp.amount) / 100);
    return `M 0 ${f(R)} A ${f(R)} ${f(R)} 0 1 1 0 ${f(-R)} A ${f(R)} ${f(R)} 0 1 1 0 ${f(R)}`;
  }
  // wave — smooth cubic segments through sampled sine points
  const amp = (warp.amount / 100) * fontSize * 0.7;
  const cycles = warp.cycles ?? 1.5;
  const n = Math.max(16, Math.round(cycles * 16));
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: -len / 2 + t * len, y: -Math.sin(t * cycles * Math.PI * 2) * amp };
  });
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n, i + 2)];
    d += ` C ${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}
