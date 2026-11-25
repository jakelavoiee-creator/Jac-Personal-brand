/**
 * Aura's original template library. Every template is a layered composition of
 * live text, vector graphics, shapes and photo frames — never a flattened image.
 * Coordinates are design units (element centres); `k` scales to the document.
 */
import type { Template } from './build';

export const TEMPLATE_CATEGORIES = [
  'Streetwear Graphics',
  'Apparel Branding',
  'Vintage Typography',
  'Luxury Branding',
  'Editorial Posters',
  'Album Covers',
  'Music Artwork',
  'Social Media',
  'Product Ads',
  'Minimalist Branding',
  'Retro Compositions',
  'Business Materials',
] as const;

const CREAM = '#f4f1ea';
const INK = '#16130f';
const GOLD = '#c9a227';
const RED = '#b23a2e';

const distress = (scale: number, intensity = 0.32) => ({ texture: { kind: 'distressed' as const, intensity, scale, seed: 9, angle: 45 } });
const screen = (scale: number) => ({ texture: { kind: 'screenprint' as const, intensity: 0.3, scale, seed: 4, angle: 45 } });

export const TEMPLATES: Template[] = [
  /* ---------------- Streetwear graphics (4500 × 5400, transparent) ---------------- */
  {
    id: 'sw-winged-crest',
    preview: '#1d1a17',
    name: 'Winged Crest',
    category: 'Streetwear Graphics',
    w: 900,
    h: 1080,
    k: 5,
    bg: null,
    tags: 'wings laurel crest vintage tee back print',
    pages: [
      [
        { t: 'text', text: 'AURA STUDIO', font: 'Bodoni Moda', weight: 700, size: 92, x: 450, y: 250, color: '#d9c08a', tracking: 120, warp: { kind: 'arc', amount: 32 }, fx: { offset: { x: 6, y: 6, color: RED, outlineOnly: false, width: 0 }, ...screen(10) } },
        { t: 'graphic', id: 'badges-emblems-laurel-wreath', x: 450, y: 590, w: 560, ink: '#d9c08a' },
        { t: 'graphic', id: 'wings-winged-pair', x: 450, y: 520, w: 760, ink: '#d9c08a', accent: INK },
        { t: 'text', text: 'MAISON', font: 'Clash Display', weight: 700, size: 170, x: 450, y: 830, color: '#efe6d2', tracking: 30, fx: { extrude: { depth: 16, angle: 60, color: RED, shade: true }, ...distress(18) } },
        { t: 'text', text: 'EST. 2026 — HANDMADE GOODS', font: 'Inter', weight: 600, size: 24, x: 450, y: 960, color: '#d9c08a', tracking: 420 },
      ],
    ],
  },
  {
    id: 'sw-no-limits',
    preview: '#151515',
    name: 'No Limits Flames',
    category: 'Streetwear Graphics',
    w: 900,
    h: 1080,
    k: 5,
    bg: null,
    tags: 'flames fire bold streetwear hot rod',
    pages: [
      [
        { t: 'graphic', id: 'flames-fire-trio', x: 450, y: 360, w: 520, ink: '#ff5a1f', fx: { glow: { color: '#ff8a1f', blur: 30, strength: 2 } } },
        { t: 'text', text: 'NO LIMITS', font: 'Tanker', size: 230, x: 450, y: 640, color: '#fff3dc', fx: { extrude: { depth: 22, angle: 50, color: '#c2181a', shade: true }, outline: { width: 7, color: '#111111' } } },
        { t: 'text', text: 'SPEED  •  STYLE  •  FREEDOM', font: 'Space Grotesk', weight: 700, size: 34, x: 450, y: 800, color: '#ff5a1f', tracking: 260 },
        { t: 'graphic', id: 'retro-vintage-speed-lines', x: 450, y: 900, w: 300, ink: '#ff5a1f', opacity: 0.9 },
      ],
    ],
  },
  {
    id: 'sw-sinners-club',
    preview: '#141414',
    name: 'Gothic Club',
    category: 'Streetwear Graphics',
    w: 900,
    h: 1080,
    k: 5,
    bg: null,
    tags: 'gothic blackletter skull dark club',
    pages: [
      [
        { t: 'text', text: 'Midnight Club', font: 'UnifrakturMaguntia', size: 150, x: 450, y: 230, color: '#f2efe8', warp: { kind: 'arc', amount: 26 }, fx: distress(14, 0.25) },
        { t: 'graphic', id: 'skulls-skull', x: 450, y: 560, w: 380, ink: '#f2efe8', accent: '#111111', fx: distress(16, 0.28) },
        { t: 'graphic', id: 'stars-sparkles-sparkle', x: 200, y: 470, w: 70, ink: '#f2efe8' },
        { t: 'graphic', id: 'stars-sparkles-sparkle', x: 700, y: 650, w: 54, ink: '#f2efe8' },
        { t: 'text', text: 'ESTD  MMXXVI', font: 'Cinzel', weight: 700, size: 46, x: 450, y: 850, color: '#f2efe8', tracking: 500 },
        { t: 'text', text: 'members only — after dark', font: 'Cormorant Garamond', weight: 500, italic: true, size: 40, x: 450, y: 920, color: '#c8c2b6' },
      ],
    ],
  },
  {
    id: 'sw-varsity',
    preview: '#22324a',
    name: 'Varsity Athletics',
    category: 'Streetwear Graphics',
    w: 900,
    h: 1080,
    k: 5,
    bg: null,
    tags: 'varsity college athletics number',
    pages: [
      [
        { t: 'text', text: 'ATHLETICS', font: 'Graduate', size: 120, x: 450, y: 300, color: '#f7f1e3', warp: { kind: 'arc', amount: 22 }, fx: { outline: { width: 10, color: '#7a1f2b' }, outline2: { width: 8, color: '#f7f1e3' } } },
        { t: 'text', text: '26', font: 'Graduate', size: 420, x: 450, y: 640, color: '#7a1f2b', fx: { outline: { width: 12, color: '#f7f1e3' }, outline2: { width: 10, color: '#7a1f2b' }, ...distress(20, 0.2) } },
        { t: 'text', text: 'DEPT. OF GOOD TIMES', font: 'Oswald', weight: 600, size: 44, x: 450, y: 900, color: '#f7f1e3', tracking: 300 },
      ],
    ],
  },

  /* ---------------- Apparel branding ---------------- */
  {
    id: 'ab-neck-label',
    preview: '#1c1c1c',
    name: 'Printed Neck Label',
    category: 'Apparel Branding',
    w: 600,
    h: 600,
    dpi: 300,
    bg: null,
    tags: 'neck label tag inside print size',
    pages: [
      [
        { t: 'text', text: 'AURA', font: 'Clash Display', weight: 600, size: 120, x: 300, y: 200, color: '#ffffff', tracking: 80 },
        { t: 'line', x1: 200, y1: 270, x2: 400, y2: 270, stroke: '#ffffff', sw: 3 },
        { t: 'text', text: 'M', font: 'Satoshi', weight: 700, size: 90, x: 300, y: 350, color: '#ffffff' },
        { t: 'text', text: '100% ORGANIC COTTON\nMACHINE WASH COLD', font: 'Satoshi', weight: 500, size: 24, x: 300, y: 470, color: '#ffffff', tracking: 120, lineHeight: 1.4 },
      ],
    ],
  },
  {
    id: 'ab-hangtag',
    name: 'Hangtag',
    category: 'Apparel Branding',
    w: 600,
    h: 1050,
    dpi: 300,
    bg: CREAM,
    tags: 'hang tag swing tag label price',
    pages: [
      [
        { t: 'circle', x: 300, y: 90, r: 26, fill: '#ffffff', stroke: INK, sw: 3, name: 'Hole' },
        { t: 'graphic', id: 'badges-emblems-laurel-crest', x: 300, y: 330, w: 260, ink: INK, accent: GOLD },
        { t: 'text', text: 'MAISON AURA', font: 'Cinzel', weight: 600, size: 52, x: 300, y: 540, color: INK, tracking: 200 },
        { t: 'text', text: 'atelier collection', font: 'Cormorant Garamond', italic: true, size: 40, x: 300, y: 600, color: '#5c544a' },
        { t: 'line', x1: 160, y1: 680, x2: 440, y2: 680, stroke: GOLD, sw: 2 },
        { t: 'text', text: 'STYLE 0426  ·  SIZE M', font: 'Inter', weight: 500, size: 22, x: 300, y: 760, color: INK, tracking: 180 },
        { t: 'text', text: '$128', font: 'Bodoni Moda', weight: 600, size: 72, x: 300, y: 880, color: INK },
      ],
    ],
  },
  {
    id: 'ab-chest-mark',
    preview: '#e9e4da',
    name: 'Left-Chest Monogram',
    category: 'Apparel Branding',
    w: 600,
    h: 600,
    k: 2,
    bg: null,
    tags: 'chest logo monogram small embroidery',
    pages: [
      [
        { t: 'circle', x: 300, y: 300, r: 210, fill: '', stroke: INK, sw: 8 },
        { t: 'circle', x: 300, y: 300, r: 190, fill: '', stroke: INK, sw: 2 },
        { t: 'text', text: 'AM', font: 'Bodoni Moda', weight: 700, size: 150, x: 300, y: 292, color: INK },
        { t: 'text', text: 'ATELIER · MAISON · ', font: 'Inter', weight: 700, size: 30, x: 300, y: 300, color: INK, tracking: 200, warp: { kind: 'circle', amount: 118 } },
      ],
    ],
  },

  /* ---------------- Vintage typography ---------------- */
  {
    id: 'vt-garage',
    name: 'Since 1974 Garage',
    category: 'Vintage Typography',
    w: 1080,
    h: 1350,
    bg: '#efe3c8',
    tags: 'garage motor vintage western badge',
    pages: [
      [
        { t: 'graphic', id: 'retro-vintage-retro-sunburst', x: 540, y: 600, w: 1300, ink: '#e6d2a8' },
        { t: 'graphic', id: 'retro-vintage-est-badge', x: 540, y: 560, w: 640, ink: '#2b3a2f', accent: '#efe3c8' },
        { t: 'text', text: 'ROUTE 9', font: 'Rye', size: 120, x: 540, y: 520, color: '#efe3c8', fx: distress(14, 0.22) },
        { t: 'text', text: 'MOTOR CO.', font: 'Oswald', weight: 600, size: 58, x: 540, y: 628, color: '#efe3c8', tracking: 300 },
        { t: 'text', text: 'SINCE 1974', font: 'Rye', size: 84, x: 540, y: 1000, color: '#b23a2e', fx: { offset: { x: 5, y: 5, color: '#2b3a2f', outlineOnly: false, width: 0 }, ...distress(12, 0.25) } },
        { t: 'text', text: 'REPAIRS  ·  CUSTOMS  ·  RESTORATION', font: 'Oswald', weight: 500, size: 30, x: 540, y: 1100, color: '#2b3a2f', tracking: 260 },
      ],
    ],
  },
  {
    id: 'vt-coffee-label',
    name: 'Old Town Coffee',
    category: 'Vintage Typography',
    w: 1080,
    h: 1080,
    bg: '#2a1f18',
    tags: 'coffee label oval vintage cafe',
    pages: [
      [
        { t: 'graphic', id: 'retro-vintage-vintage-oval-label', x: 540, y: 540, w: 900, ink: '#e8d9bd' },
        { t: 'text', text: 'Old Town', font: 'Pacifico', size: 110, x: 540, y: 470, color: '#e8d9bd', fx: { offset: { x: 4, y: 4, color: '#b5542c', outlineOnly: false, width: 0 } } },
        { t: 'text', text: 'COFFEE ROASTERS', font: 'Cinzel', weight: 700, size: 46, x: 540, y: 600, color: '#e8d9bd', tracking: 250 },
        { t: 'graphic', id: 'ornaments-dividers-diamond-divider', x: 540, y: 670, w: 360, ink: '#b5542c' },
        { t: 'text', text: 'SMALL BATCH · EST. 1962', font: 'Inter', weight: 600, size: 24, x: 540, y: 880, color: '#b8a585', tracking: 300 },
      ],
    ],
  },
  {
    id: 'vt-forever-wild',
    name: 'Forever Wild Rose',
    category: 'Vintage Typography',
    w: 1080,
    h: 1350,
    bg: '#f3ece0',
    tags: 'rose script tattoo romantic',
    pages: [
      [
        { t: 'graphic', id: 'flowers-botanicals-daisy-3', x: 540, y: 460, w: 460, ink: '#8e2335', accent: '#d9a441' },
        { t: 'graphic', id: 'badges-emblems-arched-ribbon', x: 540, y: 820, w: 900, ink: '#1f1a17', accent: '#8e2335' },
        { t: 'text', text: 'Forever Wild', font: 'Pinyon Script', size: 112, x: 540, y: 812, color: '#f3ece0' },
        { t: 'text', text: 'HEART OF GOLD · SOUL OF FIRE', font: 'Cinzel', weight: 600, size: 32, x: 540, y: 1080, color: '#1f1a17', tracking: 260 },
      ],
    ],
  },

  /* ---------------- Luxury branding ---------------- */
  {
    id: 'lx-monogram',
    name: 'Maison Monogram',
    category: 'Luxury Branding',
    w: 1080,
    h: 1080,
    bg: '#0f0e0c',
    tags: 'luxury monogram gold logo crest',
    pages: [
      [
        { t: 'graphic', id: 'badges-emblems-laurel-wreath', x: 540, y: 470, w: 520, ink: GOLD, fx: { gradient: { stops: ['#7a5a12', '#f9e7a1', '#b88a2e', '#fff4c9', '#8a6d1f'], angle: 90 } } },
        { t: 'text', text: 'MA', font: 'Bodoni Moda', weight: 600, size: 210, x: 540, y: 460, color: GOLD, fx: { gradient: { stops: ['#7a5a12', '#f9e7a1', '#b88a2e', '#fff4c9', '#8a6d1f'], angle: 90 } } },
        { t: 'text', text: 'MAISON AURA', font: 'Cinzel', weight: 500, size: 60, x: 540, y: 800, color: '#e9dcc0', tracking: 450 },
        { t: 'text', text: 'PARIS · MILANO · NEW YORK', font: 'Inter', weight: 500, size: 20, x: 540, y: 870, color: '#9a8e78', tracking: 500 },
      ],
    ],
  },
  {
    id: 'lx-perfume',
    name: 'Parfum Campaign',
    category: 'Luxury Branding',
    w: 1080,
    h: 1350,
    bg: '#1a1410',
    tags: 'perfume luxury campaign arch gold product',
    pages: [
      [
        { t: 'graphic', id: 'frames-borders-arch-frame', x: 540, y: 640, w: 700, ink: '#c9a96e' },
        { t: 'photo', x: 540, y: 690, w: 560, h: 700, tone: '#3a2e25' },
        { t: 'text', text: 'Lumière', font: 'Italiana', size: 150, x: 540, y: 170, color: '#efe3cc', tracking: 40 },
        { t: 'text', text: 'EAU DE PARFUM', font: 'Cinzel', weight: 500, size: 30, x: 540, y: 1170, color: '#c9a96e', tracking: 600 },
        { t: 'text', text: 'The new fragrance', font: 'Cormorant Garamond', italic: true, size: 40, x: 540, y: 1240, color: '#efe3cc' },
      ],
    ],
  },
  {
    id: 'lx-card',
    name: 'Gold Foil Business Card',
    category: 'Luxury Branding',
    w: 1050,
    h: 600,
    dpi: 300,
    bg: '#121212',
    tags: 'business card luxury gold foil black',
    pages: [
      [
        { t: 'text', text: 'Aurélie Laurent', font: 'Bodoni Moda', weight: 500, size: 74, x: 525, y: 250, color: GOLD, fx: { gradient: { stops: ['#8a6d1f', '#f9e7a1', '#b88a2e', '#fff4c9'], angle: 0 } } },
        { t: 'text', text: 'CREATIVE DIRECTOR', font: 'Inter', weight: 500, size: 22, x: 525, y: 330, color: '#bdb3a0', tracking: 500 },
        { t: 'graphic', id: 'ornaments-dividers-art-deco-rule', x: 525, y: 410, w: 320, ink: GOLD },
      ],
      [
        { t: 'text', text: 'MA', font: 'Bodoni Moda', weight: 600, size: 150, x: 525, y: 260, color: GOLD, fx: { gradient: { stops: ['#8a6d1f', '#f9e7a1', '#b88a2e', '#fff4c9'], angle: 90 } } },
        { t: 'text', text: 'hello@maisonaura.com  ·  +1 555 0142', font: 'Inter', weight: 500, size: 22, x: 525, y: 430, color: '#bdb3a0', tracking: 120 },
      ],
    ],
  },

  /* ---------------- Editorial posters (18 × 24 in @150 dpi) ---------------- */
  {
    id: 'ed-swiss',
    name: 'Swiss Grid Poster',
    category: 'Editorial Posters',
    w: 900,
    h: 1200,
    k: 3,
    dpi: 150,
    bg: '#efece6',
    tags: 'swiss international grid modernist helvetica red circle',
    pages: [
      [
        { t: 'circle', x: 600, y: 420, r: 260, fill: '#e2321b' },
        { t: 'text', text: 'Form\nfollows\nfunction', font: 'Inter', weight: 800, size: 118, x: 330, y: 800, color: '#111111', align: 'left', lineHeight: 0.92, tracking: -30, width: 560 },
        { t: 'line', x1: 60, y1: 1040, x2: 840, y2: 1040, stroke: '#111111', sw: 3 },
        { t: 'text', text: 'LECTURE SERIES\n03 — 14 MAY', font: 'Inter', weight: 700, size: 24, x: 170, y: 1100, color: '#111111', align: 'left', lineHeight: 1.3, width: 240 },
        { t: 'text', text: 'Museum of Design\nGallery 4, Free entry', font: 'Inter', weight: 400, size: 24, x: 720, y: 1100, color: '#111111', align: 'right', lineHeight: 1.3, width: 260 },
      ],
    ],
  },
  {
    id: 'ed-modernism',
    name: 'Exhibition: Modernism',
    category: 'Editorial Posters',
    w: 900,
    h: 1200,
    k: 3,
    dpi: 150,
    bg: '#111111',
    tags: 'exhibition gallery serif bold editorial',
    pages: [
      [
        { t: 'photo', x: 450, y: 470, w: 780, h: 760, tone: '#2b2b2b' },
        { t: 'text', text: 'MODERN', font: 'Bodoni Moda', weight: 800, size: 160, x: 450, y: 920, color: '#f4f1ea', tracking: -10 },
        { t: 'text', text: 'An exhibition of form, colour and light', font: 'Cormorant Garamond', italic: true, size: 40, x: 450, y: 1030, color: '#cfc8bb' },
        { t: 'text', text: '12.06 — 30.09', font: 'Inter', weight: 600, size: 26, x: 160, y: 1130, color: '#f4f1ea', tracking: 200 },
        { t: 'text', text: 'NORTH GALLERY', font: 'Inter', weight: 600, size: 26, x: 740, y: 1130, color: '#f4f1ea', tracking: 200 },
      ],
    ],
  },
  {
    id: 'ed-magazine',
    name: 'Magazine Cover',
    category: 'Editorial Posters',
    w: 850,
    h: 1100,
    k: 3,
    dpi: 300,
    bg: '#e9e4da',
    tags: 'magazine cover masthead editorial fashion',
    pages: [
      [
        { t: 'photo', x: 425, y: 600, w: 850, h: 1000, tone: '#c9bfae' },
        { t: 'text', text: 'AURA', font: 'Playfair Display', weight: 900, size: 260, x: 425, y: 150, color: '#111111', tracking: -20 },
        { t: 'text', text: 'THE SLOW\nLUXURY\nISSUE', font: 'Bebas Neue', size: 96, x: 170, y: 520, color: '#ffffff', align: 'left', lineHeight: 0.9, width: 280 },
        { t: 'text', text: '48 pages of quiet\nconfidence', font: 'Playfair Display', italic: true, size: 36, x: 640, y: 860, color: '#ffffff', align: 'right', width: 300 },
        { t: 'text', text: 'NO. 07 — AUTUMN', font: 'Inter', weight: 700, size: 20, x: 425, y: 1060, color: '#111111', tracking: 400 },
      ],
    ],
  },

  /* ---------------- Album covers (3000 × 3000) ---------------- */
  {
    id: 'al-midnight-drive',
    name: 'Midnight Drive',
    category: 'Album Covers',
    w: 1000,
    h: 1000,
    k: 3,
    bg: '#120b2e',
    tags: 'synthwave retro sunset neon 80s',
    pages: [
      [
        { t: 'graphic', id: 'retro-vintage-retro-sunset', x: 500, y: 560, w: 700, ink: '#ff4f9a', accent: '#120b2e' },
        { t: 'text', text: 'MIDNIGHT', font: 'Monoton', size: 130, x: 500, y: 180, color: '#ffd6f0', fx: { glow: { color: '#ff4f9a', blur: 22, strength: 2 } } },
        { t: 'text', text: 'DRIVE', font: 'Unbounded', weight: 800, size: 110, x: 500, y: 300, color: '#3ff2ff', tracking: 200, fx: { glow: { color: '#3ff2ff', blur: 18, strength: 2 } } },
        { t: 'text', text: 'NOVA LANE', font: 'Space Grotesk', weight: 700, size: 34, x: 500, y: 930, color: '#ffd6f0', tracking: 600 },
      ],
    ],
  },
  {
    id: 'al-velvet-hours',
    name: 'Velvet Hours',
    category: 'Album Covers',
    w: 1000,
    h: 1000,
    k: 3,
    bg: '#5b1a22',
    tags: 'minimal serif soul rnb grain',
    pages: [
      [
        { t: 'rect', x: 500, y: 500, w: 1000, h: 1000, fill: '#5b1a22', fx: { texture: { kind: 'film', intensity: 0.5, scale: 6, seed: 2, angle: 0 } }, name: 'Grain' },
        { t: 'text', text: 'velvet\nhours', font: 'Fraunces', weight: 300, italic: true, size: 200, x: 500, y: 470, color: '#f3d9c6', lineHeight: 0.88, tracking: -20 },
        { t: 'text', text: 'JUNE ROSE', font: 'Inter', weight: 600, size: 28, x: 500, y: 880, color: '#f3d9c6', tracking: 700 },
      ],
    ],
  },
  {
    id: 'al-loud',
    name: 'LOUD',
    category: 'Album Covers',
    w: 1000,
    h: 1000,
    k: 3,
    bg: '#f2ee00',
    tags: 'punk loud halftone bold tape',
    pages: [
      [
        { t: 'text', text: 'LOUD', font: 'Anton', size: 520, x: 500, y: 470, color: '#111111', tracking: -20, fx: { texture: { kind: 'halftone', intensity: 0.7, scale: 7, seed: 1, angle: 30 } } },
        { t: 'rect', x: 300, y: 820, w: 520, h: 90, fill: '#111111', angle: -4 },
        { t: 'text', text: 'THE STATIC KIDS', font: 'Space Grotesk', weight: 700, size: 46, x: 300, y: 820, color: '#f2ee00', angle: -4 },
      ],
    ],
  },

  /* ---------------- Music artwork ---------------- */
  {
    id: 'mu-gig-poster',
    name: 'Rooftop Gig Poster',
    category: 'Music Artwork',
    w: 1080,
    h: 1350,
    bg: '#0d0d0d',
    tags: 'gig concert live lineup poster',
    pages: [
      [
        { t: 'text', text: 'LIVE AT THE', font: 'Inter', weight: 700, size: 40, x: 540, y: 140, color: '#ff4f2e', tracking: 500 },
        { t: 'text', text: 'ROOFTOP', font: 'Big Shoulders', weight: 900, size: 260, x: 540, y: 300, color: '#f4f1ea', tracking: 10 },
        { t: 'graphic', id: 'geometric-abstract-halftone-circle', x: 540, y: 640, w: 420, ink: '#ff4f2e' },
        { t: 'text', text: 'FRI 14 JUN  —  NOVA LANE\nSAT 15 JUN  —  THE STATIC KIDS\nSUN 16 JUN  —  JUNE ROSE', font: 'Space Grotesk', weight: 600, size: 38, x: 540, y: 1000, color: '#f4f1ea', lineHeight: 1.6 },
        { t: 'text', text: 'DOORS 8PM · TICKETS AT AURA.FM', font: 'Inter', weight: 600, size: 24, x: 540, y: 1230, color: '#8c8c8c', tracking: 300 },
      ],
    ],
  },
  {
    id: 'mu-new-single',
    name: 'New Single Out Now',
    category: 'Music Artwork',
    w: 1080,
    h: 1080,
    bg: '#e8e2f5',
    tags: 'single release announcement music social',
    pages: [
      [
        { t: 'photo', x: 540, y: 470, w: 640, h: 640, tone: '#b9a9dc', rx: 8 },
        { t: 'text', text: 'NEW SINGLE', font: 'Syne', weight: 800, size: 64, x: 540, y: 880, color: '#2b1d52', tracking: 100 },
        { t: 'text', text: 'out now everywhere', font: 'Fraunces', italic: true, weight: 400, size: 44, x: 540, y: 960, color: '#2b1d52' },
      ],
    ],
  },

  /* ---------------- Social media ---------------- */
  {
    id: 'so-quote',
    name: 'Minimal Quote',
    category: 'Social Media',
    w: 1080,
    h: 1350,
    bg: '#f1ede4',
    tags: 'quote instagram minimal serif',
    pages: [
      [
        { t: 'text', text: '“', font: 'Fraunces', weight: 700, size: 300, x: 540, y: 300, color: '#c46a3c' },
        { t: 'text', text: 'Simplicity is the\nultimate sophistication.', font: 'Fraunces', weight: 400, size: 76, x: 540, y: 640, color: '#1d1a16', lineHeight: 1.15, width: 900 },
        { t: 'line', x1: 480, y1: 860, x2: 600, y2: 860, stroke: '#c46a3c', sw: 3 },
        { t: 'text', text: 'LEONARDO DA VINCI', font: 'Inter', weight: 600, size: 26, x: 540, y: 930, color: '#1d1a16', tracking: 400 },
      ],
    ],
  },
  {
    id: 'so-drop',
    name: 'New Drop Announcement',
    category: 'Social Media',
    w: 1080,
    h: 1350,
    bg: '#111111',
    tags: 'drop launch streetwear announcement',
    pages: [
      [
        { t: 'photo', x: 540, y: 560, w: 1080, h: 1120, tone: '#2a2a2a' },
        { t: 'text', text: 'NEW DROP', font: 'Anton', size: 200, x: 540, y: 1000, color: '#f4f1ea', fx: { offset: { x: 8, y: 8, color: '#ff3b2f', outlineOnly: false, width: 0 } } },
        { t: 'text', text: 'FRIDAY 6PM  ·  LIMITED RUN', font: 'Space Grotesk', weight: 700, size: 34, x: 540, y: 1190, color: '#f4f1ea', tracking: 260 },
        { t: 'rect', x: 540, y: 1265, w: 420, h: 6, fill: '#ff3b2f' },
      ],
    ],
  },
  {
    id: 'so-story-sale',
    name: 'Story Sale',
    category: 'Social Media',
    w: 1080,
    h: 1920,
    bg: '#ffd84d',
    tags: 'sale story discount promo',
    pages: [
      [
        { t: 'graphic', id: 'retro-vintage-pop-sticker', x: 540, y: 820, w: 900, ink: '#111111', accent: '#ff5a36' },
        { t: 'text', text: '40%', font: 'Archivo Black', size: 260, x: 540, y: 780, color: '#ffd84d' },
        { t: 'text', text: 'OFF', font: 'Archivo Black', size: 120, x: 540, y: 960, color: '#ffd84d', tracking: 200 },
        { t: 'text', text: 'WEEKEND SALE', font: 'Archivo Black', size: 96, x: 540, y: 330, color: '#111111' },
        { t: 'rect', x: 540, y: 1560, w: 640, h: 140, fill: '#111111', rx: 70 },
        { t: 'text', text: 'SHOP NOW', font: 'Inter', weight: 800, size: 52, x: 540, y: 1560, color: '#ffd84d', tracking: 200 },
      ],
    ],
  },
  {
    id: 'so-yt-thumb',
    name: 'Bold YouTube Thumbnail',
    category: 'Social Media',
    w: 1280,
    h: 720,
    bg: '#0f172a',
    tags: 'youtube thumbnail bold arrow',
    pages: [
      [
        { t: 'photo', x: 980, y: 360, w: 600, h: 720, tone: '#334155' },
        { t: 'text', text: 'I TRIED IT\nFOR 30 DAYS', font: 'Archivo Black', size: 108, x: 380, y: 330, color: '#ffffff', align: 'left', lineHeight: 0.95, width: 680, fx: { outline: { width: 8, color: '#111111' } } },
        { t: 'rect', x: 250, y: 560, w: 400, h: 90, fill: '#facc15', rx: 10, angle: -3 },
        { t: 'text', text: 'HONEST REVIEW', font: 'Inter', weight: 800, size: 40, x: 250, y: 560, color: '#111111', angle: -3 },
        { t: 'graphic', id: 'symbols-curved-arrow', x: 700, y: 560, w: 170, ink: '#facc15', angle: -10 },
      ],
    ],
  },

  /* ---------------- Product ads ---------------- */
  {
    id: 'pa-launch',
    name: 'Product Launch',
    category: 'Product Ads',
    w: 1080,
    h: 1350,
    bg: '#f6f3ee',
    tags: 'product ad launch price cta',
    pages: [
      [
        { t: 'photo', x: 540, y: 520, w: 820, h: 820, tone: '#e3ddd2', rx: 24 },
        { t: 'text', text: 'Meet the new classic.', font: 'Gambetta', weight: 500, size: 74, x: 540, y: 1030, color: '#1c1a17' },
        { t: 'text', text: 'Handcrafted. Built to last.', font: 'Satoshi', weight: 500, size: 34, x: 540, y: 1100, color: '#6b645a' },
        { t: 'rect', x: 540, y: 1220, w: 360, h: 96, fill: '#1c1a17', rx: 48 },
        { t: 'text', text: 'Shop — $89', font: 'Satoshi', weight: 700, size: 34, x: 540, y: 1220, color: '#f6f3ee' },
      ],
    ],
  },
  {
    id: 'pa-skincare',
    name: 'Skincare Minimal',
    category: 'Product Ads',
    w: 1080,
    h: 1350,
    bg: '#e9d9cf',
    tags: 'skincare beauty soft minimal',
    pages: [
      [
        { t: 'circle', x: 540, y: 600, r: 380, fill: '#f4e9e1' },
        { t: 'photo', x: 540, y: 620, w: 360, h: 560, tone: '#d8c3b5', rx: 180 },
        { t: 'text', text: 'glow, naturally', font: 'Boska', weight: 400, italic: true, size: 88, x: 540, y: 150, color: '#5a3d33' },
        { t: 'text', text: 'VITAMIN C SERUM · 30 ML', font: 'General Sans', weight: 500, size: 28, x: 540, y: 1130, color: '#5a3d33', tracking: 300 },
        { t: 'text', text: 'clean · vegan · cruelty-free', font: 'General Sans', weight: 400, size: 26, x: 540, y: 1190, color: '#8b6b5e' },
      ],
    ],
  },

  /* ---------------- Minimalist branding ---------------- */
  {
    id: 'mb-brand-board',
    name: 'Brand Board',
    category: 'Minimalist Branding',
    w: 1920,
    h: 1080,
    bg: '#f5f3ef',
    tags: 'brand board identity palette type specimen',
    pages: [
      [
        { t: 'text', text: 'studio form.', font: 'Satoshi', weight: 700, size: 120, x: 520, y: 300, color: '#141414', tracking: -30 },
        { t: 'text', text: 'Primary logotype', font: 'Satoshi', weight: 500, size: 24, x: 520, y: 400, color: '#8a8580' },
        { t: 'circle', x: 1180, y: 300, r: 90, fill: '#141414' },
        { t: 'circle', x: 1400, y: 300, r: 90, fill: '#d9cfc1' },
        { t: 'circle', x: 1620, y: 300, r: 90, fill: '#b5654a' },
        { t: 'text', text: '#141414      #D9CFC1      #B5654A', font: 'JetBrains Mono', weight: 500, size: 22, x: 1400, y: 440, color: '#6b6660' },
        { t: 'line', x1: 120, y1: 560, x2: 1800, y2: 560, stroke: '#d9d4cc', sw: 2 },
        { t: 'text', text: 'Aa', font: 'Gambetta', weight: 500, size: 240, x: 330, y: 790, color: '#141414' },
        { t: 'text', text: 'Gambetta — headlines\nSatoshi — interface & body\nJetBrains Mono — details', font: 'Satoshi', weight: 500, size: 32, x: 860, y: 790, color: '#141414', align: 'left', lineHeight: 1.6, width: 560 },
        { t: 'text', text: 'Quiet. Precise. Warm.', font: 'Gambetta', italic: true, weight: 400, size: 46, x: 1540, y: 790, color: '#b5654a' },
      ],
    ],
  },
  {
    id: 'mb-wordmark',
    preview: '#f5f3ef',
    name: 'Minimal Wordmark',
    category: 'Minimalist Branding',
    w: 1000,
    h: 1000,
    bg: null,
    tags: 'logo wordmark minimal transparent',
    pages: [
      [
        { t: 'text', text: 'oak & ore', font: 'Syne', weight: 700, size: 130, x: 500, y: 480, color: '#141414', tracking: -20 },
        { t: 'circle', x: 760, y: 410, r: 16, fill: '#d0603b' },
        { t: 'text', text: 'FURNITURE STUDIO', font: 'Inter', weight: 600, size: 24, x: 500, y: 580, color: '#141414', tracking: 600 },
      ],
    ],
  },

  /* ---------------- Retro compositions ---------------- */
  {
    id: 'rt-good-vibes',
    name: 'Good Vibes 70s',
    category: 'Retro Compositions',
    w: 1080,
    h: 1350,
    bg: '#f4e4c1',
    tags: '70s groovy retro sunset wave',
    pages: [
      [
        { t: 'graphic', id: 'retro-vintage-retro-sunset', x: 540, y: 820, w: 820, ink: '#e8663d', accent: '#f4e4c1' },
        { t: 'text', text: 'good vibes', font: 'Shrikhand', size: 150, x: 540, y: 290, color: '#8c3b1e', warp: { kind: 'wave', amount: 28, cycles: 1 }, fx: { offset: { x: 7, y: 7, color: '#f0a63a', outlineOnly: false, width: 0 } } },
        { t: 'text', text: 'ONLY', font: 'Shrikhand', size: 90, x: 540, y: 520, color: '#e8663d' },
        { t: 'text', text: 'SUMMER  ·  1976', font: 'Rubik', weight: 700, size: 32, x: 540, y: 1230, color: '#8c3b1e', tracking: 400 },
      ],
    ],
  },
  {
    id: 'rt-diner',
    name: 'Open Late Neon',
    category: 'Retro Compositions',
    w: 1080,
    h: 1350,
    bg: '#0b1020',
    tags: 'neon diner retro night sign',
    pages: [
      [
        { t: 'text', text: 'Open', font: 'Pacifico', size: 210, x: 540, y: 470, color: '#ffe3f1', fx: { glow: { color: '#ff3ea5', blur: 34, strength: 3 } } },
        { t: 'text', text: 'LATE', font: 'Monoton', size: 190, x: 540, y: 720, color: '#d9fbff', fx: { glow: { color: '#29d9ff', blur: 30, strength: 3 } } },
        { t: 'graphic', id: 'stars-sparkles-sparkle-cluster', x: 860, y: 260, w: 200, ink: '#fff3a8', fx: { glow: { color: '#ffd84d', blur: 18, strength: 2 } } },
        { t: 'text', text: 'BURGERS · SHAKES · TILL 3AM', font: 'Inter', weight: 700, size: 30, x: 540, y: 1100, color: '#9fb0d0', tracking: 300 },
      ],
    ],
  },

  /* ---------------- Business materials ---------------- */
  {
    id: 'bm-card',
    name: 'Minimal Business Card',
    category: 'Business Materials',
    w: 1050,
    h: 600,
    dpi: 300,
    bg: '#ffffff',
    tags: 'business card minimal clean',
    pages: [
      [
        { t: 'text', text: 'Jordan Hale', font: 'Satoshi', weight: 700, size: 60, x: 300, y: 220, color: '#141414', align: 'left', width: 480 },
        { t: 'text', text: 'Brand Designer', font: 'Satoshi', weight: 500, size: 30, x: 300, y: 280, color: '#7a7570', align: 'left', width: 480 },
        { t: 'text', text: 'jordan@studioform.co\n+1 555 0199\nstudioform.co', font: 'Satoshi', weight: 500, size: 24, x: 300, y: 450, color: '#141414', align: 'left', lineHeight: 1.5, width: 480 },
        { t: 'rect', x: 930, y: 300, w: 240, h: 600, fill: '#d0603b' },
      ],
      [
        { t: 'rect', x: 525, y: 300, w: 1050, h: 600, fill: '#141414' },
        { t: 'text', text: 'studio form.', font: 'Satoshi', weight: 700, size: 90, x: 525, y: 300, color: '#ffffff', tracking: -30 },
      ],
    ],
  },
  {
    id: 'bm-grand-opening',
    name: 'Grand Opening Flyer',
    category: 'Business Materials',
    w: 850,
    h: 1100,
    k: 3,
    dpi: 300,
    bg: '#fbf8f2',
    tags: 'flyer grand opening event business',
    pages: [
      [
        { t: 'graphic', id: 'frames-borders-double-frame', x: 425, y: 550, w: 790, ink: '#1f3b2d' },
        { t: 'text', text: 'You’re invited to our', font: 'Playfair Display', italic: true, size: 40, x: 425, y: 230, color: '#1f3b2d' },
        { t: 'text', text: 'GRAND\nOPENING', font: 'Playfair Display', weight: 800, size: 120, x: 425, y: 410, color: '#1f3b2d', lineHeight: 0.95 },
        { t: 'graphic', id: 'ornaments-dividers-flourish', x: 425, y: 590, w: 300, ink: '#b08a3e' },
        { t: 'text', text: 'SATURDAY, 21 SEPTEMBER\n10AM – 6PM\n\n12 Market Street', font: 'Inter', weight: 600, size: 28, x: 425, y: 770, color: '#1f3b2d', tracking: 150, lineHeight: 1.4 },
        { t: 'text', text: 'Free coffee for the first 100 guests', font: 'Playfair Display', italic: true, size: 30, x: 425, y: 960, color: '#b08a3e' },
      ],
    ],
  },
  {
    id: 'bm-invitation',
    name: 'Elegant Invitation',
    category: 'Business Materials',
    w: 750,
    h: 1050,
    k: 2,
    dpi: 300,
    bg: '#f7f3ec',
    tags: 'invitation wedding event elegant',
    pages: [
      [
        { t: 'graphic', id: 'ornaments-dividers-corner-flourish', x: 120, y: 120, w: 180, ink: '#a8875a' },
        { t: 'graphic', id: 'ornaments-dividers-corner-flourish', x: 630, y: 930, w: 180, ink: '#a8875a', angle: 180 },
        { t: 'text', text: 'together with their families', font: 'Cormorant Garamond', italic: true, size: 34, x: 375, y: 300, color: '#4a4036' },
        { t: 'text', text: 'Amelia\n&\nJames', font: 'Pinyon Script', size: 110, x: 375, y: 500, color: '#2f2a24', lineHeight: 0.95 },
        { t: 'text', text: 'REQUEST THE PLEASURE OF YOUR COMPANY', font: 'Cinzel', weight: 500, size: 18, x: 375, y: 700, color: '#4a4036', tracking: 300 },
        { t: 'text', text: 'Saturday · 14 June 2026\nThe Glasshouse, Lake Como', font: 'Cormorant Garamond', weight: 500, size: 32, x: 375, y: 800, color: '#2f2a24', lineHeight: 1.4 },
      ],
    ],
  },
];
