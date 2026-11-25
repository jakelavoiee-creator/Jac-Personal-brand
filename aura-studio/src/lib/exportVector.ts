/**
 * Vector export: SVG and print-ready PDF.
 *
 * Everything that can stay vector does (shapes, paths, graphics, outlined text).
 * Things SVG/PDF can't express faithfully — Aura effects & textures, drop
 * shadows, blend modes — are rasterised per object at print resolution, so the
 * output always matches the canvas.
 */
import { FabricImage, IText, Path, StaticCanvas, type FabricObject } from 'fabric';
import { enliven } from './render';
import { fxPad, hasFx } from './fx';
import { findFont } from './fontCatalog';
import type { PageData, Project } from './types';

export interface VectorOptions {
  /** convert text to glyph outlines (exact, font-independent) */
  outlineText: boolean;
  /** bleed in document px around the page (PDF) */
  bleed?: number;
  /** resolution multiplier for rasterised objects */
  rasterScale?: number;
}

const toDataURL = (b: Blob) =>
  new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(b);
  });

function needsRaster(o: FabricObject) {
  const gco = (o as any).globalCompositeOperation;
  return hasFx(o) || !!o.shadow || (gco && gco !== 'source-over');
}

/** Render one object (with effects/shadow) to a positioned image. */
async function rasterizeObject(o: FabricObject, scale: number) {
  const pad = fxPad(o) * Math.max(Math.abs(o.scaleX ?? 1), Math.abs(o.scaleY ?? 1));
  const sh = o.shadow as any;
  const shPad = sh ? sh.blur * 2 + Math.max(Math.abs(sh.offsetX), Math.abs(sh.offsetY)) : 0;
  const r = o.getBoundingRect();
  const P = pad + shPad + 2;
  const box = { left: r.left - P, top: r.top - P, width: r.width + P * 2, height: r.height + P * 2 };
  const k = Math.min(scale, 6000 / Math.max(box.width, box.height));
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, { width: Math.ceil(box.width * k), height: Math.ceil(box.height * k), enableRetinaScaling: false, renderOnAddRemove: false });
  const [clone] = await enliven([(o as any).toObject(['id', 'name', 'fx', 'warp', 'assetId'])]);
  sc.add(clone);
  sc.setViewportTransform([k, 0, 0, k, -box.left * k, -box.top * k]);
  sc.renderAll();
  const url = sc.lowerCanvasEl.toDataURL('image/png');
  sc.dispose();
  const img = await FabricImage.fromURL(url);
  img.set({ originX: 'left', originY: 'top', left: box.left, top: box.top, scaleX: 1 / k, scaleY: 1 / k });
  return img;
}

async function outlineText(t: IText) {
  const { textToPathData, toAbsolute } = await import('./vector');
  const d = toAbsolute(await textToPathData(t), t);
  return new Path(d, { fill: t.fill, stroke: t.stroke, strokeWidth: t.strokeWidth, opacity: t.opacity, strokeLineJoin: 'round', paintFirst: (t as any).paintFirst } as any);
}

/** Images reference session blob: URLs — inline them so the file is self-contained. */
async function inlineImage(img: FabricImage) {
  const src = img.getSrc();
  if (!src.startsWith('blob:') || (img.filters && img.filters.length)) return img; // filtered images already export from a canvas
  const data = await toDataURL(await (await fetch(src)).blob());
  const json: any = (img as any).toObject(['id', 'name', 'assetId']);
  json.src = data;
  delete json.assetId; // keep the data URL rather than re-resolving
  const [n] = await enliven([json]);
  return n;
}

async function prepare(objs: FabricObject[], opts: VectorOptions) {
  const out: FabricObject[] = [];
  for (const o of objs) {
    if (!o.visible) continue;
    if (needsRaster(o)) {
      out.push(await rasterizeObject(o, opts.rasterScale ?? 3));
      continue;
    }
    if (o instanceof IText && (opts.outlineText || o.path)) {
      try {
        out.push(await outlineText(o));
      } catch (e) {
        console.warn('outline failed, rasterising text', e);
        out.push(await rasterizeObject(o, opts.rasterScale ?? 3));
      }
      continue;
    }
    if (o instanceof FabricImage) {
      out.push(await inlineImage(o));
      continue;
    }
    out.push(o);
  }
  return out;
}

function fontImports(objs: FabricObject[]) {
  const fams = new Set<string>();
  objs.forEach((o) => o instanceof IText && fams.add(o.fontFamily));
  const urls: string[] = [];
  for (const f of fams) {
    const info = findFont(f);
    if (!info || info.custom) continue;
    urls.push(info.source === 'fontshare' && info.slug ? `https://api.fontshare.com/v2/css?f[]=${info.slug}@${info.weights.join(',')}` : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@${info.weights.join(';')}`);
  }
  return urls.map((u) => `@import url('${u.replace(/&/g, '&amp;')}');`).join('');
}

/** Build a self-contained SVG for one page. */
export async function pageToSVG(project: Pick<Project, 'width' | 'height'>, page: PageData, opts: VectorOptions) {
  const b = opts.bleed ?? 0;
  const W = project.width + b * 2;
  const H = project.height + b * 2;
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, { width: W, height: H, enableRetinaScaling: false, renderOnAddRemove: false });
  const objs = await enliven(page.objects);
  const ready = await prepare(objs, opts);
  ready.forEach((o) => sc.add(o));
  if (page.background) sc.backgroundColor = page.background;
  let svg = sc.toSVG({ width: `${W}`, height: `${H}`, viewBox: { x: -b, y: -b, width: W, height: H } } as any);
  sc.dispose();
  if (!opts.outlineText) {
    const css = fontImports(objs);
    if (css) svg = svg.replace(/<defs>/, `<defs><style type="text/css">${css}</style>`);
  }
  if (page.background) {
    // fabric paints the background only over the canvas size — cover the bleed too
    svg = svg.replace(/(<svg[^>]*>)/, `$1<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="${page.background}"/>`);
  }
  return svg;
}

export interface PdfOptions {
  mode: 'vector' | 'raster';
  /** print resolution for raster mode / rasterised objects */
  dpi: number;
  /** bleed in millimetres (0 = none) */
  bleedMM: number;
  cropMarks: boolean;
}

/** Multi-page, print-ready PDF. Page size follows the document's physical size. */
export async function exportPDF(project: Project, pages: PageData[], opts: PdfOptions, onProgress?: (msg: string) => void) {
  const { jsPDF } = await import('jspdf');
  await import('svg2pdf.js');
  const docDpi = project.dpi ?? 96; // social formats: 1 px = 1/96 in (CSS px)
  const pt = (px: number) => (px * 72) / docDpi;
  const bleedPx = (opts.bleedMM / 25.4) * docDpi;
  const marks = opts.cropMarks ? 18 : 0; // pt of slug area for crop marks
  const pageW = pt(project.width + bleedPx * 2) + marks * 2;
  const pageH = pt(project.height + bleedPx * 2) + marks * 2;
  const pdf = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation: pageW > pageH ? 'landscape' : 'portrait', compress: true });
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(`Page ${i + 1} of ${pages.length}…`);
    if (i > 0) pdf.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
    const x = marks;
    const y = marks;
    const w = pt(project.width + bleedPx * 2);
    const h = pt(project.height + bleedPx * 2);
    if (opts.mode === 'vector') {
      const svg = await pageToSVG(project, pages[i], { outlineText: true, bleed: bleedPx, rasterScale: Math.max(2, opts.dpi / docDpi) });
      const el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
      // svg2pdf measures in a live document
      el.style.position = 'absolute';
      el.style.left = '-99999px';
      document.body.appendChild(el);
      try {
        await pdf.svg(el, { x, y, width: w, height: h });
      } finally {
        el.remove();
      }
    } else {
      const { renderPage } = await import('./render');
      const scale = Math.min(opts.dpi / docDpi, 12000 / Math.max(project.width, project.height));
      const { blob } = await renderPage(project, pages[i], { scale, format: 'jpeg', quality: 0.95, bleed: bleedPx });
      const data = new Uint8Array(await blob.arrayBuffer());
      pdf.addImage(data, 'JPEG', x, y, w, h, undefined, 'FAST');
    }
    if (opts.cropMarks) {
      // trim marks at the trim box corners, outside the bleed
      const tx = x + pt(bleedPx);
      const ty = y + pt(bleedPx);
      const tw = pt(project.width);
      const th = pt(project.height);
      const len = 12;
      const gap = pt(bleedPx) + 3;
      pdf.setLineWidth(0.25);
      pdf.setDrawColor(0, 0, 0);
      for (const cx of [tx, tx + tw])
        for (const cy of [ty, ty + th]) {
          const sx = cx === tx ? -1 : 1;
          const sy = cy === ty ? -1 : 1;
          pdf.line(cx + sx * gap, cy, cx + sx * (gap + len), cy);
          pdf.line(cx, cy + sy * gap, cx, cy + sy * (gap + len));
        }
    }
  }
  return pdf.output('blob') as Blob;
}
