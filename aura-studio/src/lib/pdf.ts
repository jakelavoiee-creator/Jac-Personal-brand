/**
 * PDF import via pdf.js (Apache-2.0), loaded on demand. Each page is rendered to
 * a PNG at print-friendly resolution and stored as a reusable image asset.
 * Scripting is disabled: PDFs are rendered, never executed.
 */
import { putAsset } from './db';
import { uid } from './ids';
import type { Asset } from './types';

async function pdfjs() {
  const lib = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  lib.GlobalWorkerOptions.workerSrc = worker;
  return lib;
}

export interface PdfPageImage {
  blob: Blob;
  width: number;
  height: number;
}

/** Render every page (up to `maxPages`) so the longest side is about `targetPx`. */
export async function renderPdfPages(data: ArrayBuffer, targetPx = 2400, maxPages = 40, onProgress?: (i: number, n: number) => void) {
  const lib = await pdfjs();
  const task = lib.getDocument({ data: new Uint8Array(data), isEvalSupported: false, enableXfa: false } as any);
  const doc = await task.promise;
  const n = Math.min(doc.numPages, maxPages);
  const out: PdfPageImage[] = [];
  for (let i = 1; i <= n; i++) {
    onProgress?.(i, n);
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(6, targetPx / Math.max(base.width, base.height));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp } as any).promise;
    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not render PDF page'))), 'image/png'));
    out.push({ blob, width: canvas.width, height: canvas.height });
    page.cleanup();
  }
  const total = doc.numPages;
  await task.destroy();
  return { pages: out, total };
}

/** Import a PDF as one image asset per page. */
export async function importPdf(file: File): Promise<Asset[]> {
  const { pages, total } = await renderPdfPages(await file.arrayBuffer());
  const base = file.name.replace(/\.pdf$/i, '');
  const assets: Asset[] = [];
  for (const [i, p] of pages.entries()) {
    const a: Asset = {
      id: uid('a_'),
      name: pages.length > 1 ? `${base} · p${i + 1}` : base,
      type: 'image/png',
      blob: p.blob,
      width: p.width,
      height: p.height,
      size: p.blob.size,
      favorite: false,
      createdAt: Date.now() + i,
    };
    await putAsset(a);
    assets.push(a);
  }
  if (total > pages.length) console.warn(`PDF has ${total} pages; imported the first ${pages.length}.`);
  return assets;
}
