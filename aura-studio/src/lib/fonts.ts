/**
 * Stage 1 curated library (all Google Fonts, SIL OFL / Apache licensed).
 * Stage 2 replaces this with the full searchable library.
 */
export interface FontDef {
  family: string;
  category: string;
  weights: number[];
}

export const FONTS: FontDef[] = [
  { family: 'Inter', category: 'Sans serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Montserrat', category: 'Sans serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Space Grotesk', category: 'Modern', weights: [300, 400, 500, 600, 700] },
  { family: 'Syne', category: 'Modern', weights: [400, 500, 600, 700, 800] },
  { family: 'Unbounded', category: 'Futuristic', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Archivo Black', category: 'Bold', weights: [400] },
  { family: 'Anton', category: 'Condensed', weights: [400] },
  { family: 'Bebas Neue', category: 'Condensed', weights: [400] },
  { family: 'Oswald', category: 'Condensed', weights: [300, 400, 500, 600, 700] },
  { family: 'Playfair Display', category: 'Editorial', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'DM Serif Display', category: 'Editorial', weights: [400] },
  { family: 'Fraunces', category: 'Serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Cormorant Garamond', category: 'Luxury', weights: [300, 400, 500, 600, 700] },
  { family: 'Cinzel', category: 'Luxury', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Bodoni Moda', category: 'Fashion', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Abril Fatface', category: 'Display', weights: [400] },
  { family: 'Rye', category: 'Western', weights: [400] },
  { family: 'UnifrakturMaguntia', category: 'Blackletter', weights: [400] },
  { family: 'Monoton', category: 'Retro', weights: [400] },
  { family: 'Shrikhand', category: 'Retro', weights: [400] },
  { family: 'Pacifico', category: 'Script', weights: [400] },
  { family: 'Great Vibes', category: 'Script', weights: [400] },
  { family: 'Caveat', category: 'Handwritten', weights: [400, 500, 600, 700] },
  { family: 'Permanent Marker', category: 'Graffiti', weights: [400] },
  { family: 'Rubik Mono One', category: 'Display', weights: [400] },
  { family: 'JetBrains Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800] },
];

const requested = new Set<string>();
const cssInjected = new Set<string>();
let fontLoadedHook: (family: string) => void = () => {};
/** The canvas layer registers this to flush its glyph-width cache. */
export function setFontLoadedHook(fn: (family: string) => void) {
  fontLoadedHook = fn;
}

type FontInfo = { weights: number[]; italic: boolean; custom: boolean; css?: string } | null;
let lookup: (family: string) => FontInfo = () => null;
/** The full catalogue (loaded with the editor) registers itself here. */
export function setFontLookup(fn: (family: string) => FontInfo) {
  lookup = fn;
}

/** Add the Google Fonts stylesheet for one family (all its weights), once. */
function injectFamily(family: string) {
  if (cssInjected.has(family) || FONTS.some((f) => f.family === family)) return;
  const info = lookup(family);
  if (info?.custom) return;
  cssInjected.add(family);
  if (info?.css) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = info.css;
    document.head.appendChild(l);
    return;
  }
  const fam = family.replace(/ /g, '+');
  let q = `family=${fam}`;
  if (info && !(info.weights.length === 1 && info.weights[0] === 400 && !info.italic)) {
    const axes = info.italic ? 'ital,wght' : 'wght';
    const vals = info.italic ? [...info.weights.map((w) => `0,${w}`), ...info.weights.map((w) => `1,${w}`)] : info.weights.map(String);
    q = `family=${fam}:${axes}@${vals.join(';')}`;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
  document.head.appendChild(link);
}

/** Ensure the font files for a family/weight are downloaded before canvas measurement. */
export async function ensureFont(family: string, weight: number | string = 400, style = 'normal') {
  const key = `${family}|${weight}|${style}`;
  if (requested.has(key) && document.fonts.check(`${style} ${weight} 16px "${family}"`)) return;
  requested.add(key);
  injectFamily(family);
  try {
    // the stylesheet may still be in flight; wait for its @font-face rules
    for (let i = 0; i < 20; i++) {
      await document.fonts.load(`${style} ${weight} 32px "${family}"`, 'AaBb');
      if (document.fonts.check(`${style} ${weight} 32px "${family}"`) && [...document.fonts].some((f) => f.family.replace(/"/g, '') === family && f.status === 'loaded')) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    fontLoadedHook(family);
  } catch {
    /* offline or blocked — fabric falls back to system font */
  }
}

/** Walk serialized objects and preload every font they reference. */
export async function ensureFontsForObjects(objects: any[]) {
  const jobs: Promise<void>[] = [];
  const walk = (list: any[]) => {
    for (const o of list || []) {
      if (o.fontFamily) jobs.push(ensureFont(o.fontFamily, o.fontWeight ?? 400, o.fontStyle ?? 'normal'));
      if (o.objects) walk(o.objects);
    }
  };
  walk(objects);
  await Promise.all(jobs);
}

export function weightsFor(family: string) {
  return lookup(family)?.weights ?? FONTS.find((f) => f.family === family)?.weights ?? [400, 700];
}

function familyParam(f: FontDef) {
  const fam = f.family.replace(/ /g, '+');
  if (f.weights.length === 1 && f.weights[0] === 400) return `family=${fam}`;
  return `family=${fam}:wght@${f.weights.join(';')}`;
}

/** Inject the stylesheet for the curated starter fonts (CSS only; files load on demand). */
export function injectFontCSS() {
  if (document.getElementById('aura-fonts')) return;
  const link = document.createElement('link');
  link.id = 'aura-fonts';
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS.map(familyParam).join('&')}&display=swap`;
  document.head.appendChild(link);
}
