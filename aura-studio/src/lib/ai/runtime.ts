/**
 * Shared on-device AI runtime (transformers.js + ONNX Runtime Web).
 * Models download once from Hugging Face on first use, are cached by the
 * browser, and run locally — WebGPU when available, otherwise WebAssembly.
 */
let envP: Promise<any> | null = null;

export async function transformers() {
  envP ??= import('@huggingface/transformers').then((t) => {
    t.env.allowLocalModels = false;
    t.env.useBrowserCache = true;
    (t.env.backends.onnx as any).wasm.wasmPaths = '/ort/';
    return t;
  });
  return envP;
}

export interface GPUInfo {
  webgpu: boolean;
  /** half-precision shaders — halves model downloads and memory */
  f16: boolean;
}
let gpu: Promise<GPUInfo> | null = null;
export function gpuInfo() {
  gpu ??= (async () => {
    try {
      const a = await (navigator as any).gpu?.requestAdapter();
      return { webgpu: !!a, f16: !!a?.features?.has('shader-f16') };
    } catch {
      return { webgpu: false, f16: false };
    }
  })();
  return gpu;
}
export const hasWebGPU = async () => (await gpuInfo()).webgpu;

export type Progress = (p: { stage: string; pct?: number }) => void;

/** Aggregate transformers.js per-file download events into one percentage. */
export function progressReporter(onProgress?: Progress, label = 'Downloading model') {
  const files = new Map<string, { loaded: number; total: number }>();
  return (e: any) => {
    if (!onProgress) return;
    if (e.status === 'progress' && e.file) {
      files.set(e.file, { loaded: e.loaded ?? 0, total: e.total ?? 0 });
      const loaded = [...files.values()].reduce((s, f) => s + f.loaded, 0);
      const total = [...files.values()].reduce((s, f) => s + f.total, 0);
      onProgress({ stage: `${label} ${total ? `(${(total / 1e6).toFixed(0)} MB, one time)` : ''}`, pct: total ? (loaded / total) * 100 : undefined });
    } else if (e.status === 'ready') onProgress({ stage: 'Model ready' });
  };
}

/** True when a model's weights are already in the browser cache (no download needed). */
export async function isModelCached(modelId: string) {
  try {
    if (!('caches' in self)) return false;
    const c = await caches.open('transformers-cache');
    const keys = await c.keys();
    return keys.some((r) => r.url.includes(`/${modelId}/`) && /\.onnx/.test(r.url));
  } catch {
    return false;
  }
}
