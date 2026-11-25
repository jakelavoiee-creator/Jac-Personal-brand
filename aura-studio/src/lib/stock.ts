/**
 * Free stock photo search across openly licensed sources — no API keys.
 *
 *  • Openverse (WordPress Foundation) — CC-licensed images from many collections,
 *    filtered to licences that allow commercial use.
 *  • Wikimedia Commons — public domain, CC0, CC BY and CC BY-SA media.
 *
 * Downloaded photos become regular assets that carry their attribution
 * (author, licence, source page), shown in Properties and the Assets page.
 */
import { putAsset } from './db';
import { uid } from './ids';
import type { Asset } from './types';

export type StockProvider = 'openverse' | 'wikimedia';

export interface StockPhoto {
  id: string;
  provider: StockProvider;
  title: string;
  thumb: string;
  /** best downloadable URL(s), tried in order */
  downloads: string[];
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
}

/** Fetch with a short exponential backoff on rate limiting (HTTP 429/503). */
async function politeFetch(url: string, init?: RequestInit, tries = 3): Promise<Response> {
  let res = await fetch(url, init);
  for (let i = 1; i < tries && (res.status === 429 || res.status === 503); i++) {
    await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    res = await fetch(url, init);
  }
  return res;
}

function readKey(k: string) {
  try {
    return localStorage.getItem(`aura.key.${k}`) || '';
  } catch {
    return '';
  }
}

let ovToken: { token: string; expires: number } | null = null;
/** Openverse now issues anonymous requests a 401; registered apps exchange client credentials for a token. */
async function openverseAuth(): Promise<Record<string, string>> {
  const id = readKey('openverseId');
  const secret = readKey('openverseSecret');
  if (!id || !secret) return {};
  if (!ovToken || ovToken.expires < Date.now()) {
    const res = await fetch('https://api.openverse.org/v1/auth_tokens/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
    });
    if (!res.ok) throw new Error(`Openverse rejected the API credentials (${res.status}). Check them in Settings.`);
    const j = await res.json();
    ovToken = { token: j.access_token, expires: Date.now() + (j.expires_in - 60) * 1000 };
  }
  return { Authorization: `Bearer ${ovToken.token}` };
}

const strip = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
/** Licences that allow commercial use (no NC / ND). */
const COMMERCIAL = (l: string) => /^(cc0|pd|public domain|cc by(-sa)?|cc-by(-sa)?|attribution)/i.test(l.trim()) && !/nc|nd/i.test(l);

async function openverse(q: string, page: number): Promise<StockPhoto[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=30&page=${page}&mature=false`;
  const res = await politeFetch(url, { headers: await openverseAuth() });
  if (res.status === 401) throw new Error('Openverse now requires a free API key — register at api.openverse.org, then add the client ID and secret in Settings. Wikimedia works without a key.');
  if (res.status === 429) throw new Error('Openverse is rate-limiting requests right now — try again in a minute.');
  if (!res.ok) throw new Error(`Openverse is unavailable (${res.status}).`);
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    id: `ov_${r.id}`,
    provider: 'openverse' as const,
    title: r.title || 'Untitled',
    thumb: r.thumbnail || r.url,
    // originals often live on hosts that block cross-site downloads; the
    // Openverse thumbnail proxy is the reliable fallback
    downloads: [r.url, r.thumbnail].filter(Boolean),
    width: r.width ?? 0,
    height: r.height ?? 0,
    author: r.creator || 'Unknown',
    license: `CC ${String(r.license || '').toUpperCase()} ${r.license_version ?? ''}`.replace('CC CC0', 'CC0').replace('CC PDM', 'Public domain').trim(),
    licenseUrl: r.license_url,
    sourceUrl: r.foreign_landing_url || r.url,
  }));
}

async function wikimedia(q: string, page: number): Promise<StockPhoto[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `filetype:bitmap ${q}`,
    gsrlimit: '30',
    gsroffset: String((page - 1) * 30),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '1600',
  });
  // Wikimedia asks automated clients to identify themselves (generic app id, no personal data)
  const res = await politeFetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'Api-User-Agent': 'AuraStudio/0.3 (browser design app)' } });
  if (res.status === 429) throw new Error('Wikimedia Commons is rate-limiting requests right now — try again in a minute.');
  if (!res.ok) throw new Error(`Wikimedia Commons is unavailable (${res.status}).`);
  const data = await res.json();
  const pages = Object.values<any>(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const out: StockPhoto[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)/.test(ii.mime)) continue;
    const meta = ii.extmetadata ?? {};
    const license = strip(meta.LicenseShortName?.value) || 'Unknown';
    if (!COMMERCIAL(license)) continue;
    out.push({
      id: `wm_${p.pageid}`,
      provider: 'wikimedia',
      title: strip(meta.ObjectName?.value) || p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
      thumb: ii.thumburl || ii.url,
      downloads: [ii.thumburl, ii.url].filter(Boolean),
      width: ii.thumbwidth || ii.width,
      height: ii.thumbheight || ii.height,
      author: strip(meta.Artist?.value) || 'Unknown',
      license,
      licenseUrl: meta.LicenseUrl?.value,
      sourceUrl: ii.descriptionurl,
    });
  }
  return out;
}

export async function searchStock(provider: StockProvider, q: string, page = 1) {
  if (!q.trim()) return [];
  return provider === 'openverse' ? openverse(q, page) : wikimedia(q, page);
}

/** Download a photo into the asset library, keeping its attribution. */
export async function importStock(p: StockPhoto): Promise<Asset> {
  let blob: Blob | null = null;
  let lastErr = '';
  for (const url of p.downloads) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(String(res.status));
      const b = await res.blob();
      if (!b.type.startsWith('image/')) throw new Error('not an image');
      blob = b;
      break;
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
    }
  }
  if (!blob) throw new Error(`This photo's host doesn't allow direct download (${lastErr}). Try another result.`);
  const dims = await new Promise<{ w: number; h: number }>((res) => {
    const u = URL.createObjectURL(blob!);
    const img = new Image();
    img.onload = () => (res({ w: img.naturalWidth, h: img.naturalHeight }), URL.revokeObjectURL(u));
    img.onerror = () => (res({ w: p.width, h: p.height }), URL.revokeObjectURL(u));
    img.src = u;
  });
  const asset: Asset = {
    id: uid('a_'),
    name: p.title.slice(0, 80),
    type: blob.type,
    blob,
    width: dims.w,
    height: dims.h,
    size: blob.size,
    favorite: false,
    createdAt: Date.now(),
    credit: { title: p.title, author: p.author, license: p.license, licenseUrl: p.licenseUrl, source: p.provider === 'openverse' ? 'Openverse' : 'Wikimedia Commons', sourceUrl: p.sourceUrl },
  };
  await putAsset(asset);
  return asset;
}

export function creditLine(c: NonNullable<Asset['credit']>) {
  return `“${c.title ?? 'Photo'}” by ${c.author} — ${c.license} — via ${c.source} (${c.sourceUrl})`;
}
