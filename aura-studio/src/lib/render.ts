import { FabricObject, StaticCanvas, cache, util } from 'fabric';
import { resolveAssetSources } from './assets';
import { ensureFontsForObjects, setFontLoadedHook } from './fonts';
import { installEffects } from './fx';
import type { PageData, Project } from './types';

/** Extra properties persisted with every object. */
export const CUSTOM_PROPS = ['id', 'name', 'locked', 'assetId', 'shapeKind', 'fx', 'warp'];
FabricObject.customProperties = CUSTOM_PROPS;
installEffects();
setFontLoadedHook((family) => cache.clearFontCache(family));

export function applyLock(o: FabricObject, locked: boolean) {
  (o as any).locked = locked;
  o.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    editable: locked ? false : (o as any).editable,
  } as any);
}

export async function enliven(objects: any[]): Promise<FabricObject[]> {
  const resolved = await resolveAssetSources(objects);
  await ensureFontsForObjects(resolved);
  const objs = (await util.enlivenObjects(resolved)) as FabricObject[];
  objs.forEach((o) => applyLock(o, !!(o as any).locked));
  return objs;
}

export type RasterFormat = 'png' | 'jpeg' | 'webp';

export interface RenderOptions {
  scale: number;
  format: RasterFormat;
  quality?: number;
  transparent?: boolean;
}

/**
 * Render a page off-screen at `scale`. The output canvas is allocated at the
 * final size only (no oversized intermediate), so large print docs stay cheap.
 */
export async function renderPage(project: Pick<Project, 'width' | 'height'>, page: PageData, opts: RenderOptions) {
  const w = Math.max(1, Math.round(project.width * opts.scale));
  const h = Math.max(1, Math.round(project.height * opts.scale));
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, { width: w, height: h, enableRetinaScaling: false, renderOnAddRemove: false });
  const objs = await enliven(page.objects);
  objs.forEach((o) => sc.add(o));
  sc.setViewportTransform([opts.scale, 0, 0, opts.scale, 0, 0]);
  const keepAlpha = opts.transparent && opts.format !== 'jpeg';
  const bg = page.background;
  if (!keepAlpha) sc.backgroundColor = bg ?? (opts.format === 'jpeg' ? '#ffffff' : '');
  if (opts.format === 'jpeg' && !bg) sc.backgroundColor = '#ffffff';
  sc.renderAll();
  const mime = `image/${opts.format}`;
  const blob: Blob = await new Promise((res, rej) =>
    sc.lowerCanvasEl.toBlob((b) => (b ? res(b) : rej(new Error('Canvas export failed — the image may be too large for this browser.'))), mime, opts.quality ?? 0.92),
  );
  sc.dispose();
  return { blob, width: w, height: h };
}

export async function renderThumb(project: Pick<Project, 'width' | 'height'>, page: PageData, max = 320) {
  const scale = max / Math.max(project.width, project.height);
  const { blob } = await renderPage(project, page, { scale, format: 'webp', quality: 0.8 });
  return await new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(blob);
  });
}
