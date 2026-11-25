/**
 * Background removal — real segmentation models running locally in the browser.
 * All three are licensed for commercial use and verified on CPU (WebAssembly):
 *  • general : ORMBG (ISNet, Apache-2.0) — any subject, 44 MB, default
 *  • quality : BiRefNet-lite 512 (MIT) — finest hair / edge detail
 *  • portrait: MODNet (Apache-2.0) — people only, 7 MB, fastest
 * (The 1024² BiRefNet exports exceed the browser's wasm memory ceiling.)
 */
import { gpuInfo, progressReporter, transformers, type Progress } from './runtime';

export type SegModel = 'general' | 'quality' | 'portrait';
interface ModelDef { id: string; label: string; hint: string; dtype: { gpu: string; cpu: string }; size: { gpu: string; cpu: string } }
const MODELS: Record<SegModel, ModelDef> = {
  general: { id: 'onnx-community/ormbg-ONNX', label: 'Standard', hint: 'Any subject — products, people, pets', dtype: { gpu: 'fp16', cpu: 'uint8' }, size: { gpu: '88 MB', cpu: '44 MB' } },
  quality: { id: 'studioludens/birefnet-lite-512', label: 'High detail', hint: 'Best hair and fine edges — slower', dtype: { gpu: 'fp16', cpu: 'fp32' }, size: { gpu: '99 MB', cpu: '192 MB' } },
  portrait: { id: 'Xenova/modnet', label: 'Fast portrait', hint: 'People only — tiny and quick', dtype: { gpu: 'fp16', cpu: 'uint8' }, size: { gpu: '13 MB', cpu: '7 MB' } },
};
export const SEG_MODELS = MODELS;
export const MODEL_LICENSES: Record<SegModel, string> = { general: 'ORMBG · Apache-2.0', quality: 'BiRefNet-lite · MIT', portrait: 'MODNet · Apache-2.0' };

const cache = new Map<string, Promise<any>>();

export async function segDevice() {
  const g = await gpuInfo();
  return g.webgpu && g.f16 ? 'GPU (WebGPU)' : 'CPU (WebAssembly)';
}
export async function segDownloadSize(kind: SegModel) {
  const g = await gpuInfo();
  return g.webgpu && g.f16 ? MODELS[kind].size.gpu : MODELS[kind].size.cpu;
}

const forceCPU = new Set<SegModel>();

async function getPipeline(kind: SegModel, onProgress?: Progress) {
  const g = await gpuInfo();
  // fp16-capable GPUs only: without shader-f16 the fp32 weights are 2–4× larger than the CPU build
  const gpu = g.webgpu && g.f16 && !forceCPU.has(kind);
  const key = `${kind}|${gpu}|${g.f16}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const t = await transformers();
      const m = MODELS[kind];
      const dtype = gpu ? m.dtype.gpu : m.dtype.cpu;
      return t.pipeline('background-removal', m.id, { device: gpu ? 'webgpu' : 'wasm', dtype, progress_callback: progressReporter(onProgress) } as any);
    })();
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return p;
}

/**
 * Returns an alpha mask (0–255, same size as the image) predicted by the model.
 * The image itself is never modified here — refinement happens on the mask.
 */
export async function predictMask(img: HTMLImageElement | HTMLCanvasElement, kind: SegModel, onProgress?: Progress): Promise<ImageData> {
  const pipe = await getPipeline(kind, onProgress);
  onProgress?.({ stage: 'Finding the subject…' });
  const t = await transformers();
  const w = (img as HTMLImageElement).naturalWidth || img.width;
  const h = (img as HTMLImageElement).naturalHeight || img.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(img, 0, 0);
  const raw = await t.RawImage.fromCanvas(c);
  let res;
  try {
    res = await pipe(raw);
  } catch (e) {
    // some GPUs can't run every layer (shader limits) — fall back to the CPU once
    if (forceCPU.has(kind) || !(await gpuInfo()).f16) throw e;
    forceCPU.add(kind);
    onProgress?.({ stage: 'GPU unsupported for this model — switching to CPU…' });
    res = await (await getPipeline(kind, onProgress))(raw);
  }
  const out = Array.isArray(res) ? res[0] : res;
  // output is RGBA with the predicted alpha; keep just the mask
  const rgba = out.channels === 4 ? out : out.rgba();
  const mask = new ImageData(w, h);
  const src = rgba.width === w && rgba.height === h ? rgba : await rgba.resize(w, h);
  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    const a = src.data[i * 4 + 3];
    mask.data[j] = mask.data[j + 1] = mask.data[j + 2] = 255;
    mask.data[j + 3] = a;
  }
  onProgress?.({ stage: 'Done' });
  return mask;
}
