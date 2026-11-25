import { putAsset } from '../db';
import { uid } from '../ids';
import type { Asset } from '../types';

/** Store an AI result as a regular asset that remembers how it was made. */
export async function saveAIAsset(blob: Blob, opts: { name: string; prompt: string; model: string; provider: string }): Promise<Asset> {
  const { width, height } = await new Promise<{ width: number; height: number }>((res) => {
    const u = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = () => (res({ width: im.naturalWidth, height: im.naturalHeight }), URL.revokeObjectURL(u));
    im.onerror = () => (res({ width: 1024, height: 1024 }), URL.revokeObjectURL(u));
    im.src = u;
  });
  const asset: Asset = {
    id: uid('a_'),
    name: opts.name.slice(0, 80),
    type: blob.type || 'image/png',
    blob,
    width,
    height,
    size: blob.size,
    favorite: false,
    createdAt: Date.now(),
    credit: { title: opts.prompt.slice(0, 300), author: `AI · ${opts.model}`, license: 'AI-generated — usage per provider terms', source: opts.provider, sourceUrl: 'https://openai.com/policies/' },
  };
  await putAsset(asset);
  return asset;
}

export const isAIAsset = (a: Asset) => !!a.credit?.author?.startsWith('AI · ');
