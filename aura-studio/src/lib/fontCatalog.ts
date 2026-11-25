import raw from '../data/font-catalog.json';
import fontshareRaw from '../data/fontshare.json';
import { putAsset, listAssets } from './db';
import { uid } from './ids';
import { setFontLookup } from './fonts';
import type { Asset } from './types';

export interface CatalogFont {
  family: string;
  tags: string[];
  weights: number[];
  italic: boolean;
  custom?: boolean;
  /** where the font files come from (default Google Fonts) */
  source?: 'google' | 'fontshare';
  slug?: string;
  license?: string;
}

/** Creative categories in the order designers browse them. */
export const STYLE_CATEGORIES = [
  'Serif', 'Sans serif', 'Modern', 'Minimalist', 'Editorial', 'Luxury', 'Fashion', 'Display', 'Vintage', 'Retro', 'Western',
  'Gothic', 'Blackletter', 'Script', 'Handwritten', 'Graffiti', 'Psychedelic', 'Futuristic', 'Condensed', 'Bold', 'Decorative', 'Monospace',
];

/** Shown first when browsing "All" — widely used, high-quality families. */
export const POPULAR = [
  'Inter', 'Montserrat', 'Playfair Display', 'Bebas Neue', 'Poppins', 'Anton', 'DM Serif Display', 'Archivo Black', 'Oswald', 'Space Grotesk',
  'Cormorant Garamond', 'Syne', 'Unbounded', 'Fraunces', 'Bodoni Moda', 'Cinzel', 'Abril Fatface', 'Permanent Marker', 'Pacifico', 'Great Vibes',
  'Rye', 'UnifrakturMaguntia', 'Monoton', 'Shrikhand', 'Righteous', 'Lobster', 'Bungee', 'Orbitron', 'Caveat', 'JetBrains Mono', 'Manrope',
  'DM Sans', 'Outfit', 'Sora', 'Instrument Serif', 'Gloock', 'Young Serif', 'Libre Baskerville', 'EB Garamond', 'Lora', 'Merriweather', 'Raleway',
  'Josefin Sans', 'Jost', 'Work Sans', 'Rubik', 'Kanit', 'Teko', 'Alfa Slab One', 'Ultra', 'Titan One', 'Luckiest Guy', 'Bangers', 'Sedgwick Ave Display',
  'Rubik Glitch', 'Nabla', 'Climate Crisis', 'Audiowide', 'Michroma', 'Major Mono Display', 'Six Caps', 'Italiana', 'Tenor Sans', 'Yeseva One',
];

export const CATALOG: CatalogFont[] = (raw as [string, string, string, number][]).map(([family, tags, weights, italic]) => ({
  family,
  tags: tags.split('|'),
  weights: weights.split(',').map(Number),
  italic: !!italic,
}));

/** Fontshare (Indian Type Foundry) — free for commercial use (ITF FFL / SIL OFL). */
export const FONTSHARE: CatalogFont[] = (fontshareRaw as [string, string, string, string, string][]).map(([family, slug, tags, weights, license]) => ({
  family,
  slug,
  tags: tags.split('|'),
  weights: weights.split(',').map(Number),
  italic: false,
  source: 'fontshare',
  license,
}));
CATALOG.push(...FONTSHARE);
CATALOG.sort((a, b) => a.family.localeCompare(b.family));

const BY_FAMILY = new Map(CATALOG.map((f) => [f.family, f]));

/** CSS URL for a Fontshare family/weights (fonts load from their CDN). */
export function fontshareCSS(slug: string, weights: number[]) {
  return `https://api.fontshare.com/v2/css?f[]=${slug}@${weights.join(',')}&display=swap`;
}

/** Resolve a downloadable font file URL from a stylesheet (woff2 for display, ttf for outlines). */
export async function fontFileURL(family: string, weight: number, kind: 'woff2' | 'truetype') {
  const f = findFont(family);
  if (!f || f.source !== 'fontshare' || !f.slug) return null;
  const css = await (await fetch(fontshareCSS(f.slug, [closestWeight(f.weights, weight)]))).text();
  const m = new RegExp(`url\\('?([^')]+)'?\\) format\\('${kind}'\\)`).exec(css);
  return m ? (m[1].startsWith('//') ? 'https:' + m[1] : m[1]) : null;
}
export const customFonts: CatalogFont[] = [];

export function findFont(family: string) {
  return BY_FAMILY.get(family) ?? customFonts.find((f) => f.family === family);
}

setFontLookup((family) => {
  const f = findFont(family);
  return f ? { weights: f.weights, italic: f.italic, custom: !!f.custom, css: f.source === 'fontshare' && f.slug ? fontshareCSS(f.slug, f.weights) : undefined } : null;
});

/* ---------------- favourites & recents (per browser) ---------------- */

function readList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}
function writeList(key: string, v: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}
export const favoriteFonts = () => readList('aura.fonts.fav');
export function toggleFavoriteFont(family: string) {
  const l = favoriteFonts();
  writeList('aura.fonts.fav', l.includes(family) ? l.filter((x) => x !== family) : [family, ...l]);
}
export const recentFonts = () => readList('aura.fonts.recent');
export function markFontUsed(family: string) {
  writeList('aura.fonts.recent', [family, ...recentFonts().filter((x) => x !== family)].slice(0, 24));
}

/* ---------------- preview faces ---------------- */

/*
 * Previews use Google's `text=` subsetting (a few KB per font) loaded under a
 * private alias, so a subset face can never shadow the real family on canvas.
 */
const previewCache = new Map<string, Promise<string | null>>();
const PREVIEW_LIMIT = 6;
let active = 0;
const queue: (() => void)[] = [];
const slot = () => new Promise<void>((r) => (active < PREVIEW_LIMIT ? (active++, r()) : queue.push(() => (active++, r()))));
const release = () => {
  active--;
  queue.shift()?.();
};

export function previewFamily(family: string, weight = 400, text = family): Promise<string | null> {
  const f = findFont(family);
  if (f?.custom) return Promise.resolve(family);
  const w = f ? closestWeight(f.weights, weight) : weight;
  const chars = Array.from(new Set(text)).join('');
  const key = `${family}|${w}|${chars}`;
  let p = previewCache.get(key);
  if (!p) {
    p = (async () => {
      await slot();
      try {
        let src: string | null | undefined;
        if (f?.source === 'fontshare') src = await fontFileURL(family, w, 'woff2');
        else {
          const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&text=${encodeURIComponent(chars)}`;
          const css = await (await fetch(url)).text();
          src = /src:\s*url\(([^)]+)\)/.exec(css)?.[1];
        }
        if (!src) return null;
        const alias = `pv-${hashStr(key)}`;
        const face = new FontFace(alias, `url(${src})`, { weight: String(w) });
        await face.load();
        document.fonts.add(face);
        return alias;
      } catch {
        return null;
      } finally {
        release();
      }
    })();
    previewCache.set(key, p);
  }
  return p;
}

export function closestWeight(weights: number[], w: number) {
  return weights.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), weights[0] ?? 400);
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/* ---------------- custom (uploaded) fonts ---------------- */

export const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';
const FONT_MIME: Record<string, string> = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };

function familyFromName(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+(Regular|Book|Roman)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

async function register(a: Asset) {
  const family = a.name;
  if (customFonts.some((f) => f.family === family)) return;
  const face = new FontFace(family, await a.blob.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  customFonts.push({ family, tags: ['Uploaded'], weights: [400], italic: false, custom: true });
}

/** Register every uploaded font with the browser (called when the editor opens). */
export async function registerCustomFonts() {
  const fonts = (await listAssets()).filter((a) => a.type.startsWith('font/'));
  await Promise.all(fonts.map((a) => register(a).catch((e) => console.warn('font failed', a.name, e))));
  return customFonts;
}

export async function importFontFile(file: File): Promise<CatalogFont> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = FONT_MIME[ext];
  if (!type) throw new Error(`${file.name}: use a TTF, OTF, WOFF or WOFF2 font file.`);
  const family = familyFromName(file.name);
  const asset: Asset = { id: uid('a_'), name: family, type, blob: new Blob([file], { type }), width: 0, height: 0, size: file.size, favorite: false, createdAt: Date.now() };
  // validate before persisting
  const face = new FontFace(family, await file.arrayBuffer());
  await face.load().catch(() => {
    throw new Error(`${file.name}: the browser could not read this font.`);
  });
  await putAsset(asset);
  await register(asset);
  return customFonts.find((f) => f.family === family)!;
}

export function allFonts(): CatalogFont[] {
  return [...customFonts, ...CATALOG];
}
