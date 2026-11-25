/**
 * Element-aware smart resize. Instead of scaling the whole composition, each
 * element is classified and re-laid-out for the new aspect ratio:
 *
 *  • backgrounds (cover the page)        → scaled to cover the new page
 *  • bands (full-width or full-height)   → stretched along their long axis
 *  • edge/corner pieces (logos, tags)    → stay pinned to their edges
 *  • everything else (the content block) → scaled as one unit and placed at the
 *                                          same relative position, so the
 *                                          composition keeps its hierarchy
 *
 * Nothing is ever distorted (except plain rectangles/lines used as bands).
 */
import { Point, Rect, type FabricObject } from 'fabric';
import { enliven, CUSTOM_PROPS } from './render';
import type { PageData } from './types';

type Box = { left: number; top: number; width: number; height: number };
type Role = 'background' | 'hband' | 'vband' | 'pinned' | 'content';

const EDGE = 0.06; // within 6% of an edge counts as "pinned to it"

function classify(b: Box, W: number, H: number, o: FabricObject): Role {
  const fw = b.width / W;
  const fh = b.height / H;
  if (fw >= 0.85 && fh >= 0.85) return 'background';
  const stretchable = o instanceof Rect || o.type === 'line' || (o as any).shapeKind === 'line';
  if (fw >= 0.85 && fh < 0.5 && stretchable) return 'hband';
  if (fh >= 0.85 && fw < 0.5 && stretchable) return 'vband';
  const nearL = b.left <= W * EDGE;
  const nearR = b.left + b.width >= W * (1 - EDGE);
  const nearT = b.top <= H * EDGE;
  const nearB = b.top + b.height >= H * (1 - EDGE);
  if ((nearL || nearR || nearT || nearB) && fw * fh < 0.12) return 'pinned';
  return 'content';
}

function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const l = Math.min(...boxes.map((b) => b.left));
  const t = Math.min(...boxes.map((b) => b.top));
  const r = Math.max(...boxes.map((b) => b.left + b.width));
  const bt = Math.max(...boxes.map((b) => b.top + b.height));
  return { left: l, top: t, width: r - l, height: bt - t };
}

/** Scale an object about the scene origin by k and move it so its bbox centre lands at c. */
function place(o: FabricObject, kx: number, ky: number, c: { x: number; y: number }) {
  o.set({ scaleX: (o.scaleX ?? 1) * kx, scaleY: (o.scaleY ?? 1) * ky });
  o.setCoords();
  const b = o.getBoundingRect();
  const cur = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const p = o.getCenterPoint();
  o.setPositionByOrigin(new Point(p.x + (c.x - cur.x), p.y + (c.y - cur.y)), 'center', 'center');
  o.setCoords();
}

export async function smartResizePage(page: PageData, W: number, H: number, W2: number, H2: number): Promise<PageData> {
  const objs = await enliven(page.objects);
  const sx = W2 / W;
  const sy = H2 / H;
  const s = Math.min(sx, sy);
  const S = Math.max(sx, sy);
  const boxes = objs.map((o) => o.getBoundingRect() as Box);
  const roles = objs.map((o, i) => classify(boxes[i], W, H, o));

  // content block: keep internal layout, scale uniformly, keep relative position
  const block = union(boxes.filter((_, i) => roles[i] === 'content'));
  let blockK = s;
  let blockDX = 0;
  let blockDY = 0;
  if (block) {
    // keep the block's share of the page; never overflow the new page (4% margin)
    blockK = Math.min(s, (W2 * 0.92) / block.width, (H2 * 0.92) / block.height);
    const relX = (block.left + block.width / 2) / W;
    const relY = (block.top + block.height / 2) / H;
    let cx = relX * W2;
    let cy = relY * H2;
    const hw = (block.width * blockK) / 2;
    const hh = (block.height * blockK) / 2;
    cx = Math.min(W2 - hw - W2 * 0.04, Math.max(hw + W2 * 0.04, cx));
    cy = Math.min(H2 - hh - H2 * 0.04, Math.max(hh + H2 * 0.04, cy));
    if (hw * 2 > W2 * 0.92) cx = W2 / 2;
    if (hh * 2 > H2 * 0.92) cy = H2 / 2;
    blockDX = cx - (block.left + block.width / 2) * blockK;
    blockDY = cy - (block.top + block.height / 2) * blockK;
  }

  objs.forEach((o, i) => {
    const b = boxes[i];
    const c = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    switch (roles[i]) {
      case 'background':
        place(o, S, S, { x: (c.x / W) * W2, y: (c.y / H) * H2 });
        break;
      case 'hband': {
        // stretch width, keep thickness proportional; stay pinned top/bottom if it was
        const y = b.top <= H * EDGE ? (b.height * s) / 2 + b.top * s : b.top + b.height >= H * (1 - EDGE) ? H2 - (H - (b.top + b.height)) * s - (b.height * s) / 2 : (c.y / H) * H2;
        place(o, sx, s, { x: (c.x / W) * W2, y });
        break;
      }
      case 'vband': {
        const x = b.left <= W * EDGE ? (b.width * s) / 2 + b.left * s : b.left + b.width >= W * (1 - EDGE) ? W2 - (W - (b.left + b.width)) * s - (b.width * s) / 2 : (c.x / W) * W2;
        place(o, s, sy, { x, y: (c.y / H) * H2 });
        break;
      }
      case 'pinned': {
        const right = b.left + b.width >= W * (1 - EDGE);
        const left = b.left <= W * EDGE;
        const bottom = b.top + b.height >= H * (1 - EDGE);
        const top = b.top <= H * EDGE;
        const hw = (b.width * s) / 2;
        const hh = (b.height * s) / 2;
        const x = left ? b.left * s + hw : right ? W2 - (W - b.left - b.width) * s - hw : (c.x / W) * W2;
        const y = top ? b.top * s + hh : bottom ? H2 - (H - b.top - b.height) * s - hh : (c.y / H) * H2;
        place(o, s, s, { x, y });
        break;
      }
      default:
        place(o, blockK, blockK, { x: c.x * blockK + blockDX, y: c.y * blockK + blockDY });
    }
  });

  return { ...page, objects: objs.map((o) => (o as any).toObject(CUSTOM_PROPS)), thumb: undefined };
}

export async function smartResizePages(pages: PageData[], W: number, H: number, W2: number, H2: number) {
  const out: PageData[] = [];
  for (const p of pages) out.push(await smartResizePage(p, W, H, W2, H2));
  return out;
}
