/**
 * Tapstitch Open Platform API client — the garment library for Aura's apparel
 * studio. Uses the user's own Tapstitch token (Settings) through Aura's
 * same-origin relay (/tapstitch → openapi.tapstitch.com), because the API does
 * not accept browser CORS requests. Product photos and mockup layers load
 * straight from Tapstitch's CDN at runtime; nothing is redistributed.
 */

export interface TsColor {
  id: string;
  name: string;
  value: string;
}
export interface TsProduct {
  id: string;
  style_code: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'discontinued';
  price?: { amount: string; currency: string };
  main_image?: { url: string };
  media?: { type: 'image' | 'video'; url: string }[];
  colors: TsColor[];
  sizes: string[];
  techniques: { code: string }[];
  fabric?: Record<string, unknown>;
}
export interface TsBox {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}
export interface TsPlacement {
  id: string;
  title: string;
  design_area: TsBox;
  price?: { amount: string; currency: string };
  mask_url?: string;
  mask_line_url?: string;
}
export interface TsLayer {
  type: string; // color | image | line | user
  z_index: number;
  url?: string;
  visible_color_ids?: string[];
}
export interface TsPrintArea {
  piece: string;
  title: string;
  placements: TsPlacement[];
  mockup_layers: TsLayer[];
}
export interface TsCatalog {
  technique: string;
  fulfillment_center: string;
  reference_size?: string;
  canvas: { width: number; height: number; unit: string };
  colors: TsColor[];
  print_areas: TsPrintArea[];
}

export type FulfillmentCenter = 'international' | 'usa';

function read(k: string) {
  try {
    return localStorage.getItem(`aura.key.${k}`) || '';
  } catch {
    return '';
  }
}
export const tapstitchToken = () => read('tapstitch');
export const hasTapstitch = () => !!tapstitchToken();
export const fulfillmentCenter = (): FulfillmentCenter => (read('tapstitchCenter') === 'usa' ? 'usa' : 'international');

export class TapstitchError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function api<T>(path: string): Promise<T> {
  const token = tapstitchToken();
  if (!token) throw new TapstitchError('Connect your Tapstitch account in Settings to load the garment library.', 401);
  let res: Response;
  try {
    res = await fetch(`/tapstitch${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new TapstitchError('Could not reach Tapstitch — check your connection.');
  }
  if (res.ok) return res.json();
  let detail = '';
  try {
    const j = await res.json();
    detail = j.detail || j.title || '';
  } catch {
    /* not JSON */
  }
  if (res.status === 401 || res.status === 403) throw new TapstitchError('Tapstitch rejected the token. Paste the token secret from tapstitch.com/developers/tokens in Settings.', res.status);
  if (res.status === 404 && !detail) throw new TapstitchError('The Tapstitch relay is not available on this host — see README (Hosting).', 404);
  if (res.status === 429) throw new TapstitchError('Tapstitch is rate-limiting requests — try again in a moment.', 429);
  throw new TapstitchError(detail || `Tapstitch request failed (${res.status}).`, res.status);
}

/* ---------------- browser cache (12 h) ---------------- */

const CACHE = 'aura-tapstitch';
const TTL = 12 * 3600 * 1000;
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const req = new Request(`https://cache.aura.local/${key}`);
  try {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit && Date.now() - Number(hit.headers.get('x-saved') || 0) < TTL) return hit.json();
    const v = await load();
    await c.put(req, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json', 'x-saved': String(Date.now()) } }));
    return v;
  } catch (e) {
    if (e instanceof TapstitchError) throw e;
    return load();
  }
}

/** Every active product, loaded page by page (progress reported as products arrive). */
export async function catalog(onPage?: (sofar: TsProduct[], total: number) => void): Promise<TsProduct[]> {
  const center = fulfillmentCenter();
  return cached(`catalog-${center}`, async () => {
    const all: TsProduct[] = [];
    for (let page = 1; page < 100; page++) {
      const r = await api<{ products: TsProduct[]; paging?: { total: number } }>(`/v1/catalog/products?status=active&limit=50&page=${page}&fulfillment_center=${center}`);
      all.push(...r.products);
      onPage?.(all, r.paging?.total ?? all.length);
      if (r.products.length < 50 || (r.paging && all.length >= r.paging.total)) break;
    }
    return all;
  });
}

export async function product(id: string): Promise<TsProduct> {
  const center = fulfillmentCenter();
  return cached(`product-${center}-${id}`, async () => (await api<{ product: TsProduct }>(`/v1/catalog/products/${encodeURIComponent(id)}?fulfillment_center=${center}`)).product);
}

/** Print areas, placements, colours and mockup layers for a product + technique. */
export async function designAreas(id: string, technique: string): Promise<TsCatalog> {
  const center = fulfillmentCenter();
  return cached(`areas-${center}-${id}-${technique}`, async () => {
    const r = await api<TsCatalog[] | TsCatalog>(`/v1/designs/products/${encodeURIComponent(id)}/design-areas?technique=${encodeURIComponent(technique)}&fulfillment_center=${center}`);
    const cat = Array.isArray(r) ? r[0] : r;
    if (!cat?.print_areas?.length) throw new TapstitchError('This product has no printable areas for that technique.');
    return cat;
  });
}

/* ---------------- browsing helpers ---------------- */

export const CATEGORIES: { id: string; label: string; test: RegExp }[] = [
  { id: 'tees', label: 'T-shirts', test: /t-?shirt|\btee\b/i },
  { id: 'hoodies', label: 'Hoodies', test: /hoodie/i },
  { id: 'sweatshirts', label: 'Sweatshirts', test: /sweatshirt|crew ?neck|pullover/i },
  { id: 'longsleeve', label: 'Long sleeve', test: /long sleeve/i },
  { id: 'tanks', label: 'Tanks', test: /tank|vest|sleeveless/i },
  { id: 'polos', label: 'Polos & shirts', test: /polo|button|shirt\b/i },
  { id: 'jackets', label: 'Jackets', test: /jacket|coat|windbreaker/i },
  { id: 'pants', label: 'Pants', test: /pants|jogger|sweatpant|trouser|legging/i },
  { id: 'shorts', label: 'Shorts', test: /shorts/i },
  { id: 'active', label: 'Activewear', test: /yoga|sports bra|performance|compression|athletic/i },
  { id: 'womens', label: 'Women', test: /women/i },
  { id: 'kids', label: 'Kids & baby', test: /kid|baby|toddler|youth/i },
  { id: 'accessories', label: 'Caps & bags', test: /cap|hat|beanie|bag|tote/i },
];
export const inCategory = (p: TsProduct, cat: string) => CATEGORIES.find((c) => c.id === cat)?.test.test(p.title) ?? true;

/** Preferred technique for previews: DTG for most garments, otherwise whatever is offered. */
export const defaultTechnique = (p: TsProduct) => (p.techniques.find((t) => t.code === 'DTG') ?? p.techniques[0])?.code ?? 'DTG';
