/**
 * Turns a template description into real, editable fabric layers — live text,
 * warped text, effects, vector graphics, shapes and photo frames. Nothing is
 * flattened: every element stays independently editable after "Use template".
 */
import { Circle, IText, Path, Rect, Textbox, loadSVGFromString, util, Point, type FabricObject } from 'fabric';
import { ensureFont } from '../lib/fonts';
import '../lib/fontCatalog'; // registers font sources (Google vs Fontshare) for ensureFont
import { CUSTOM_PROPS } from '../lib/render';
import { warpPath, type Warp } from '../lib/warp';
import { makeShape, type ShapeKind } from '../editor/shapes';
import { GRAPHICS } from '../data/graphics';
import { uid } from '../lib/ids';
import type { FX } from '../lib/fx';
import type { PageData } from '../lib/types';

/* ---------------- template DSL (design units, x/y = element centre) ---------------- */

export type El =
  | {
      t: 'text';
      text: string;
      font: string;
      weight?: number;
      size: number;
      x: number;
      y: number;
      color: string;
      align?: 'left' | 'center' | 'right';
      tracking?: number;
      lineHeight?: number;
      width?: number;
      italic?: boolean;
      warp?: Warp;
      fx?: FX;
      angle?: number;
      opacity?: number;
      name?: string;
    }
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; rx?: number; stroke?: string; sw?: number; opacity?: number; angle?: number; fx?: FX; name?: string }
  | { t: 'circle'; x: number; y: number; r: number; fill: string; stroke?: string; sw?: number; opacity?: number; fx?: FX; name?: string }
  | { t: 'shape'; kind: ShapeKind; x: number; y: number; w: number; h?: number; fill: string; angle?: number; opacity?: number; fx?: FX }
  | { t: 'graphic'; id: string; x: number; y: number; w: number; ink: string; accent?: string; angle?: number; opacity?: number; fx?: FX }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number; dash?: number[] }
  | { t: 'photo'; x: number; y: number; w: number; h: number; tone?: string; rx?: number };

export interface Template {
  id: string;
  name: string;
  category: string;
  /** design-unit size; multiplied by `k` for the real document */
  w: number;
  h: number;
  k?: number;
  dpi?: number;
  bg: string | null;
  /** backdrop for gallery previews of transparent prints (garment colour) */
  preview?: string;
  tags: string;
  pages: El[][];
}

const NUMERIC_FX_SKIP = new Set(['angle', 'intensity', 'count', 'strength', 'seed']);

/** Effect distances are authored in design units; scale them with the document. */
function scaleFx(fx: FX | undefined, k: number): FX | undefined {
  if (!fx || k === 1) return fx;
  const out: any = {};
  for (const [key, val] of Object.entries(fx)) {
    if (!val) continue;
    const v: any = { ...val };
    for (const [p, n] of Object.entries(v)) if (typeof n === 'number' && !NUMERIC_FX_SKIP.has(p)) v[p] = n * k;
    out[key] = v;
  }
  return out;
}

function at(o: FabricObject, x: number, y: number) {
  o.setPositionByOrigin(new Point(x, y), 'center', 'center');
  o.setCoords();
}

async function buildText(el: Extract<El, { t: 'text' }>, k: number) {
  await ensureFont(el.font, el.weight ?? 400, el.italic ? 'italic' : 'normal');
  const common = {
    fontFamily: el.font,
    fontWeight: el.weight ?? 400,
    fontSize: el.size * k,
    fill: el.color,
    textAlign: el.align ?? 'center',
    charSpacing: el.tracking ?? 0,
    lineHeight: el.lineHeight ?? 1.05,
    fontStyle: el.italic ? 'italic' : 'normal',
    opacity: el.opacity ?? 1,
  } as any;
  let t: any;
  if (el.warp) {
    t = new IText(el.text, common);
    t.initDimensions();
    const w = t.calcTextWidth();
    t.set({ path: new Path(warpPath(el.warp, w, t.fontSize), { visible: false, fill: '', stroke: '' }), pathAlign: 'center', textAlign: 'center' } as any);
    t.setPathInfo();
    t.initDimensions();
    (t as any).warp = el.warp;
  } else {
    const tb = new Textbox(el.text, { ...common, width: el.width ? el.width * k : 1e5 });
    if (!el.width) {
      tb.initDimensions();
      const natural = Math.max(...(tb as any)._textLines.map((_: any, i: number) => tb.getLineWidth(i)));
      tb.set({ width: natural + el.size * k * 0.12 });
    }
    tb.initDimensions();
    t = tb;
  }
  if (el.angle) t.set('angle', el.angle);
  (t as any).name = el.name ?? (el.size >= 60 ? 'Heading' : 'Text');
  return t;
}

async function buildGraphic(el: Extract<El, { t: 'graphic' }>, k: number) {
  const g = GRAPHICS.find((x) => x.id === el.id);
  if (!g) throw new Error(`Unknown graphic ${el.id}`);
  const { objects, options } = await loadSVGFromString(g.svg(el.ink, el.accent ?? el.ink));
  const obj = util.groupSVGElements(objects.filter(Boolean) as FabricObject[], options);
  const s = (el.w * k) / obj.width;
  obj.set({ scaleX: s, scaleY: s, angle: el.angle ?? 0, opacity: el.opacity ?? 1 });
  (obj as any).name = g.name;
  return obj;
}

async function buildEl(el: El, k: number): Promise<FabricObject> {
  let o: FabricObject;
  switch (el.t) {
    case 'text':
      o = await buildText(el, k);
      at(o, el.x * k, el.y * k);
      break;
    case 'rect':
      o = new Rect({ width: el.w * k, height: el.h * k, rx: (el.rx ?? 0) * k, ry: (el.rx ?? 0) * k, fill: el.fill, stroke: el.stroke, strokeWidth: (el.sw ?? 0) * k, opacity: el.opacity ?? 1, angle: el.angle ?? 0, strokeUniform: true });
      (o as any).name = el.name ?? 'Rectangle';
      at(o, el.x * k, el.y * k);
      break;
    case 'circle':
      o = new Circle({ radius: el.r * k, fill: el.fill, stroke: el.stroke, strokeWidth: (el.sw ?? 0) * k, opacity: el.opacity ?? 1, strokeUniform: true });
      (o as any).name = el.name ?? 'Circle';
      at(o, el.x * k, el.y * k);
      break;
    case 'shape': {
      o = makeShape(el.kind, 100);
      o.set({ fill: el.fill, scaleX: (el.w * k) / o.width, scaleY: ((el.h ?? el.w) * k) / o.height, angle: el.angle ?? 0, opacity: el.opacity ?? 1 });
      at(o, el.x * k, el.y * k);
      break;
    }
    case 'graphic':
      o = await buildGraphic(el, k);
      at(o, el.x * k, el.y * k);
      break;
    case 'line':
      o = new Path(`M ${el.x1 * k} ${el.y1 * k} L ${el.x2 * k} ${el.y2 * k}`, { stroke: el.stroke, strokeWidth: el.sw * k, fill: '', strokeLineCap: 'round', strokeDashArray: el.dash?.map((d) => d * k) ?? null, strokeUniform: true } as any);
      (o as any).name = 'Line';
      break;
    case 'photo':
      o = new Rect({ width: el.w * k, height: el.h * k, rx: (el.rx ?? 0) * k, ry: (el.rx ?? 0) * k, fill: el.tone ?? '#cfc8bb' });
      (o as any).placeholder = true;
      (o as any).name = 'Photo frame';
      at(o, el.x * k, el.y * k);
      break;
  }
  if ('fx' in el && el.fx) (o as any).fx = scaleFx(el.fx, k);
  (o as any).id = uid('o_');
  return o;
}

/** Build every page of a template into serialized, editable objects. */
export async function buildTemplatePages(tpl: Template): Promise<PageData[]> {
  const k = tpl.k ?? 1;
  const pages: PageData[] = [];
  for (const els of tpl.pages) {
    const objs: any[] = [];
    for (const el of els) objs.push((await buildEl(el, k) as any).toObject(CUSTOM_PROPS));
    pages.push({ id: uid('pg_'), background: tpl.bg, objects: objs });
  }
  return pages;
}

export function templateSize(tpl: Template) {
  const k = tpl.k ?? 1;
  return { width: Math.round(tpl.w * k), height: Math.round(tpl.h * k) };
}
