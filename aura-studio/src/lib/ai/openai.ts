/**
 * OpenAI image provider — PAID inference billed to the user's own OpenAI
 * account. The key lives only in this browser and is sent only to
 * api.openai.com. Nothing here runs without a key.
 */
export const OPENAI_MODELS = ['gpt-image-1', 'gpt-image-1-mini'];
export const DEFAULT_OPENAI_MODEL = 'gpt-image-1';

export type Aspect = 'square' | 'portrait' | 'landscape';
export const ASPECT_SIZE: Record<Aspect, string> = { square: '1024x1024', portrait: '1024x1536', landscape: '1536x1024' };
export type Quality = 'low' | 'medium' | 'high';

function read(k: string) {
  try {
    return localStorage.getItem(`aura.key.${k}`) || '';
  } catch {
    return '';
  }
}
export const openaiKey = () => read('openai');
export const openaiModel = () => read('openaiModel') || DEFAULT_OPENAI_MODEL;
export const hasOpenAI = () => !!openaiKey();

export class ProviderError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function fail(res: Response): Promise<never> {
  let msg = '';
  try {
    msg = (await res.json())?.error?.message ?? '';
  } catch {
    /* not JSON */
  }
  if (res.status === 401) throw new ProviderError('OpenAI rejected the API key. Check it in Settings.', 401);
  if (res.status === 429) throw new ProviderError(msg || 'OpenAI rate limit or quota reached — check your OpenAI billing, then try again.', 429);
  if (res.status === 400 && /safety|moderation|policy/i.test(msg)) throw new ProviderError(`OpenAI declined this request: ${msg}`, 400);
  if (res.status === 403 && /verif/i.test(msg)) throw new ProviderError(`${msg} (OpenAI requires organization verification for this model.)`, 403);
  throw new ProviderError(msg || `OpenAI request failed (${res.status}).`, res.status);
}

async function toBlobs(json: any): Promise<Blob[]> {
  const out: Blob[] = [];
  for (const d of json?.data ?? []) {
    if (d.b64_json) {
      const bin = atob(d.b64_json);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const fmt = json.output_format ?? 'png';
      out.push(new Blob([bytes], { type: `image/${fmt === 'jpeg' ? 'jpeg' : fmt}` }));
    } else if (d.url) {
      const r = await fetch(d.url);
      if (r.ok) out.push(await r.blob());
    }
  }
  if (!out.length) throw new ProviderError('OpenAI returned no image.');
  return out;
}

function requireKey() {
  const key = openaiKey();
  if (!key) throw new ProviderError('Add your OpenAI API key in Settings to use AI generation (billed by OpenAI).');
  return key;
}

export interface GenerateOpts {
  prompt: string;
  aspect: Aspect;
  quality: Quality;
  n: number;
  transparent?: boolean;
  signal?: AbortSignal;
}

/** Text → image. */
export async function generateImages(o: GenerateOpts): Promise<Blob[]> {
  const key = requireKey();
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: openaiModel(),
      prompt: o.prompt,
      size: ASPECT_SIZE[o.aspect],
      quality: o.quality,
      n: o.n,
      ...(o.transparent ? { background: 'transparent', output_format: 'png' } : {}),
    }),
    signal: o.signal,
  });
  if (!res.ok) await fail(res);
  return toBlobs(await res.json());
}

export interface EditOpts {
  prompt: string;
  /** first image is edited; extra images act as references */
  images: Blob[];
  /** PNG the size of images[0]; fully transparent pixels are the area to change */
  mask?: Blob;
  size: string;
  quality: Quality;
  n?: number;
  transparent?: boolean;
  signal?: AbortSignal;
}

/** Image(s) + prompt (+ optional mask) → image. Generative fill, replace, references, variations. */
export async function editImages(o: EditOpts): Promise<Blob[]> {
  const key = requireKey();
  const fd = new FormData();
  fd.append('model', openaiModel());
  fd.append('prompt', o.prompt);
  o.images.forEach((b, i) => fd.append(o.images.length > 1 ? 'image[]' : 'image', b, `image${i}.${b.type === 'image/jpeg' ? 'jpg' : 'png'}`));
  if (o.mask) fd.append('mask', o.mask, 'mask.png');
  fd.append('size', o.size);
  fd.append('quality', o.quality);
  fd.append('n', String(o.n ?? 1));
  if (o.transparent) fd.append('background', 'transparent');
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd, signal: o.signal });
  if (!res.ok) await fail(res);
  return toBlobs(await res.json());
}

/** Pick the supported output size closest to an aspect ratio. */
export function sizeFor(w: number, h: number) {
  const r = w / h;
  return r > 1.25 ? ASPECT_SIZE.landscape : r < 0.8 ? ASPECT_SIZE.portrait : ASPECT_SIZE.square;
}

/* ---------------- prompt craft ---------------- */

export const STYLES: { id: string; label: string; suffix: string }[] = [
  { id: 'none', label: 'No style', suffix: '' },
  { id: 'photo', label: 'Photo', suffix: 'Photorealistic photograph, natural light, 50mm lens, shallow depth of field, true-to-life colour.' },
  { id: 'product', label: 'Product shot', suffix: 'Commercial studio product photograph, seamless backdrop, softbox lighting, crisp reflections, centered composition.' },
  { id: 'editorial', label: 'Editorial', suffix: 'High-end editorial fashion photography, considered styling, muted palette, magazine composition.' },
  { id: 'cinematic', label: 'Cinematic', suffix: 'Cinematic film still, anamorphic framing, moody contrast, teal and amber grade, atmospheric haze.' },
  { id: 'illustration', label: 'Illustration', suffix: 'Contemporary editorial illustration, clean shapes, limited palette, subtle grain texture.' },
  { id: 'vector', label: 'Flat vector', suffix: 'Flat vector illustration, geometric shapes, two to four colours, no gradients, crisp edges.' },
  { id: '3d', label: '3D render', suffix: 'Soft 3D render, clay-like materials, studio lighting, gentle shadows, pastel palette.' },
  { id: 'watercolor', label: 'Watercolour', suffix: 'Loose watercolour painting on textured paper, soft bleeding edges, light washes.' },
  { id: 'line', label: 'Line art', suffix: 'Single-weight black line art on white, minimal, elegant, no shading.' },
  { id: 'logo', label: 'Logo mark', suffix: 'Simple flat logo mark, centered, solid colours, high contrast, scalable, plain background.' },
];

/** Compose the final prompt: subject + style + things to avoid (the API has no negative prompt). */
export function composePrompt(prompt: string, style: string, avoid: string) {
  const s = STYLES.find((x) => x.id === style)?.suffix ?? '';
  return [prompt.trim(), s, avoid.trim() ? `Avoid: ${avoid.trim()}.` : ''].filter(Boolean).join(' ');
}
