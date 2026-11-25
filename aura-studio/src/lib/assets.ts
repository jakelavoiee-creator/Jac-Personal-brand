import { getAsset, putAsset } from './db';
import { uid } from './ids';
import type { Asset } from './types';

const urlCache = new Map<string, string>();

export const ACCEPTED_UPLOADS = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg,application/pdf';

export function assetURL(a: Asset) {
  let u = urlCache.get(a.id);
  if (!u) {
    u = URL.createObjectURL(a.blob);
    urlCache.set(a.id, u);
  }
  return u;
}

export async function assetURLById(id: string) {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const a = await getAsset(id);
  return a ? assetURL(a) : null;
}

export function forgetAssetURL(id: string) {
  const u = urlCache.get(id);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(id);
}

function measure(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1000, height: img.naturalHeight || 1000 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be decoded as an image.'));
    };
    img.src = url;
  });
}

export class UploadError extends Error {}

/** Validate, measure and persist an uploaded file. */
export async function importFile(file: File): Promise<Asset> {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    // each page becomes its own image asset; the first is returned
    const { importPdf } = await import('./pdf');
    const pages = await importPdf(file);
    if (!pages.length) throw new UploadError(`${file.name}: this PDF has no pages.`);
    return pages[0];
  }
  if (!isSvg && !/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    throw new UploadError(`${file.name}: unsupported type. Use PNG, JPG, WEBP, GIF or SVG.`);
  }
  if (file.size > 60 * 1024 * 1024) throw new UploadError(`${file.name}: larger than 60 MB.`);
  const blob = isSvg && !file.type ? new Blob([file], { type: 'image/svg+xml' }) : file;
  const { width, height } = await measure(blob);
  const asset: Asset = {
    id: uid('a_'),
    name: file.name.replace(/\.[^.]+$/, '') || 'Upload',
    type: isSvg ? 'image/svg+xml' : file.type,
    blob,
    width,
    height,
    size: file.size,
    favorite: false,
    createdAt: Date.now(),
  };
  await putAsset(asset);
  return asset;
}

/** Re-point every serialized image at a live object URL for its stored asset. */
export async function resolveAssetSources(objects: any[]): Promise<any[]> {
  const out = structuredClone(objects);
  const jobs: Promise<void>[] = [];
  const walk = (list: any[]) => {
    for (const o of list || []) {
      if (o.assetId && (o.type === 'Image' || o.type === 'image')) {
        jobs.push(
          assetURLById(o.assetId).then((u) => {
            if (u) o.src = u;
          }),
        );
      }
      if (o.objects) walk(o.objects);
    }
  };
  walk(out);
  await Promise.all(jobs);
  return out;
}
