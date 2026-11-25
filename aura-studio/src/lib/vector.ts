/**
 * Vector operations: boolean shape ops (paper.js) and text → outlines (opentype.js).
 * Both libraries are loaded lazily the first time one of these tools is used.
 */
import { IText, util, type FabricObject } from 'fabric';
import { findFont, closestWeight, fontFileURL } from './fontCatalog';
import { listAssets } from './db';

export type BoolOp = 'unite' | 'subtract' | 'intersect' | 'exclude';

/* ---------------- fonts → glyph outlines ---------------- */

let ttfIndex: Promise<Record<string, Record<string, string>>> | null = null;
const fontCache = new Map<string, Promise<any>>();

async function opentype() {
  return (await import('opentype.js')).default ?? (await import('opentype.js'));
}

/** Load the actual font file (Google TTF or an uploaded font) and parse it. */
export async function loadFontFile(family: string, weight: number, italic: boolean) {
  const key = `${family}|${weight}|${italic}`;
  let p = fontCache.get(key);
  if (!p) {
    p = (async () => {
      const ot: any = await opentype();
      const info = findFont(family);
      let buf: ArrayBuffer;
      if (info?.custom) {
        const a = (await listAssets()).find((x) => x.type.startsWith('font/') && x.name === family);
        if (!a) throw new Error(`Uploaded font “${family}” is missing.`);
        if (a.type === 'font/woff2') throw new Error('WOFF2 uploads can be used for text but not converted to outlines yet — upload TTF/OTF to convert.');
        buf = await a.blob.arrayBuffer();
      } else if (info?.source === 'fontshare') {
        const url = await fontFileURL(family, weight, 'truetype');
        if (!url) throw new Error(`No outline file for “${family}”.`);
        buf = await (await fetch(url)).arrayBuffer();
      } else {
        ttfIndex ??= fetch('/fonts/ttf-index.json').then((r) => r.json());
        const idx = (await ttfIndex)[family];
        if (!idx) throw new Error(`No outline data for “${family}”.`);
        const w = closestWeight(info?.weights ?? [400], weight);
        const path = idx[`${w}${italic ? 'i' : ''}`] ?? idx[`${w}`] ?? Object.values(idx)[0];
        const res = await fetch(`https://fonts.gstatic.com/s/${path}`);
        if (!res.ok) throw new Error(`Could not download ${family} (${res.status}).`);
        buf = await res.arrayBuffer();
      }
      return ot.parse(buf);
    })();
    fontCache.set(key, p);
    p.catch(() => fontCache.delete(key));
  }
  return p;
}

/**
 * Rebuild the text's glyphs as vector path data in the object's local space,
 * reusing fabric's own layout (line breaks, alignment, kerning, tracking, paths).
 */
export async function textToPathData(t: IText): Promise<string> {
  const font = await loadFontFile(t.fontFamily, Number(t.fontWeight) || 400, t.fontStyle === 'italic');
  t.initDimensions();
  const size = t.fontSize;
  const scale = size / font.unitsPerEm;
  const parts: string[] = [];
  const anyT = t as any;
  const left0 = anyT._getLeftOffset();
  const top0 = anyT._getTopOffset();
  let lineHeights = 0;
  const lines: string[][] = anyT._textLines;
  for (let i = 0; i < lines.length; i++) {
    const hImpl = t.getHeightOfLine(i) / t.lineHeight;
    const lineLeft = left0 + anyT._getLineLeftOffset(i);
    const baseline = top0 + lineHeights + hImpl - hImpl * anyT._fontSizeFraction;
    const bounds = anyT.__charBounds[i];
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (!ch.trim()) continue;
      const box = bounds[j];
      let glyph;
      if (t.path) {
        // glyph centred on its path position, baseline 'middle' of the em box
        const mid = ((font.ascender + font.descender) / 2) * scale;
        glyph = font.getPath(ch, -box.width / 2, mid, size);
        const cos = Math.cos(box.angle);
        const sin = Math.sin(box.angle);
        glyph.commands.forEach((c: any) => {
          for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
            if (c[kx] === undefined) continue;
            const x = c[kx];
            const y = c[ky];
            c[kx] = x * cos - y * sin + box.renderLeft;
            c[ky] = x * sin + y * cos + box.renderTop;
          }
        });
      } else {
        glyph = font.getPath(ch, lineLeft + box.left, baseline, size);
      }
      const d = glyph.toPathData(3);
      if (d) parts.push(d);
    }
    lineHeights += t.getHeightOfLine(i);
  }
  if (!parts.length) throw new Error('This text has no visible glyphs to convert.');
  return parts.join(' ');
}

/** Local path data → absolute canvas coordinates using the object's transform. */
export function toAbsolute(d: string, o: FabricObject) {
  const parsed = util.parsePath(d);
  const abs = util.transformPath(parsed as any, o.calcTransformMatrix(), { x: 0, y: 0 } as any);
  return util.joinPath(abs as any);
}

/* ---------------- boolean operations ---------------- */

let paperP: Promise<any> | null = null;
async function getPaper() {
  paperP ??= import('paper/dist/paper-core').then((m: any) => {
    const paper = m.default ?? m;
    paper.setup(new paper.Size(1, 1));
    return paper;
  });
  return paperP;
}

/** Convert a fabric object (any shape, path, group or outlined text) into one paper PathItem. */
async function toPaper(paper: any, o: FabricObject, outlineD?: string) {
  let item: any;
  if (outlineD) {
    item = new paper.CompoundPath({ pathData: outlineD, insert: false });
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${o.toSVG()}</svg>`;
    const imported = paper.project.importSVG(svg, { expandShapes: true, insert: false });
    const paths: any[] = [];
    const collect = (it: any) => {
      if (it instanceof paper.Path || it instanceof paper.CompoundPath) paths.push(it);
      it.children?.forEach(collect);
    };
    collect(imported);
    if (!paths.length) throw new Error(`“${(o as any).name ?? o.type}” has no fill area to combine.`);
    item = paths.reduce((acc, p) => (acc ? acc.unite(p, { insert: false }) : p.clone({ insert: false })), null);
  }
  return item;
}

/**
 * Combine shapes. Order follows the stack: the bottom-most object is the base
 * (it keeps its style), the others are united and applied to it.
 */
export async function booleanPathData(objs: FabricObject[], op: BoolOp, outlines: Map<FabricObject, string>) {
  const paper = await getPaper();
  const items = [];
  for (const o of objs) items.push(await toPaper(paper, o, outlines.get(o)));
  let result = items[0];
  if (op === 'unite') for (const it of items.slice(1)) result = result.unite(it, { insert: false });
  else if (op === 'subtract') {
    const cutter = items.slice(1).reduce((a: any, b: any) => a.unite(b, { insert: false }));
    result = result.subtract(cutter, { insert: false });
  } else if (op === 'intersect') for (const it of items.slice(1)) result = result.intersect(it, { insert: false });
  else for (const it of items.slice(1)) result = result.exclude(it, { insert: false });
  const d: string = result.pathData;
  if (!d) throw new Error('The result is empty — the shapes may not overlap.');
  return d;
}
