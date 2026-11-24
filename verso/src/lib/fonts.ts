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
let fontLoadedHook: (family: string) => void = () => {};
/** The canvas layer registers this to flush its glyph-width cache. */
export function setFontLoadedHook(fn: (family: string) => void) {
  fontLoadedHook = fn;
}

function familyParam(f: FontDef) {
  const fam = f.family.replace(/ /g, '+');
  if (f.weights.length === 1 && f.weights[0] === 400) return `family=${fam}`;
  return `family=${fam}:wght@${f.weights.join(';')}`;
}

/** Inject stylesheet for all curated fonts (cheap: CSS only, files load on demand). */
export function injectFontCSS() {
  if (document.getElementById('verso-fonts')) return;
  const link = document.createElement('link');
  link.id = 'verso-fonts';
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS.map(familyParam).join('&')}&display=swap`;
  document.head.appendChild(link);
}

/** Ensure the font files for a family/weight are downloaded before canvas measurement. */
export async function ensureFont(family: string, weight: number | string = 400, style = 'normal') {
  const key = `${family}|${weight}|${style}`;
  if (requested.has(key) && document.fonts.check(`${style} ${weight} 16px "${family}"`)) return;
  requested.add(key);
  try {
    await document.fonts.load(`${style} ${weight} 32px "${family}"`, 'AaBb');
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
  return FONTS.find((f) => f.family === family)?.weights ?? [400, 700];
}
