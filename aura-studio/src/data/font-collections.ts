/**
 * Curated font collections, built from the reference boards the studio owner
 * supplied (luxury, old money, elegant minimal, bold branding, clothing brand,
 * minimalist, and the classic faces behind famous logos).
 *
 * Every family here is free & openly licensed (Google Fonts). Where a board
 * named a commercial typeface, the closest free alternative is used and the
 * original is recorded in `similarTo` — users who own a licence can upload the
 * real font in Fonts → Upload.
 */
export interface CollectionFont {
  family: string;
  weight?: number;
  italic?: boolean;
  caps?: boolean;
  /** letter spacing in fabric units (1/1000 em) */
  tracking?: number;
  /** commercial face this stands in for */
  similarTo?: string;
  note?: string;
}

export interface FontCollection {
  id: string;
  name: string;
  mood: string;
  sample: string;
  fonts: CollectionFont[];
}

export const COLLECTIONS: FontCollection[] = [
  {
    id: 'luxury',
    name: 'Luxury',
    mood: 'High-contrast serifs, refined scripts, airy caps',
    sample: 'Maison Aura',
    fonts: [
      { family: 'Cinzel', caps: true, tracking: 120 },
      { family: 'Prata' },
      { family: 'Italiana' },
      { family: 'Bodoni Moda', weight: 500, similarTo: 'Theano Didot' },
      { family: 'Boska', weight: 500, note: 'Fontshare' },
      { family: 'Zodiak', weight: 400, note: 'Fontshare' },
      { family: 'Playfair Display', weight: 500 },
      { family: 'Yeseva One' },
      { family: 'Antic Didone', caps: true, tracking: 200 },
      { family: 'Abhaya Libre', weight: 500 },
      { family: 'Balthazar' },
      { family: 'Gruppo', tracking: 80 },
      { family: 'Cormorant Garamond', weight: 400, similarTo: 'Butler' },
      { family: 'Josefin Sans', weight: 300, caps: true, tracking: 250, similarTo: 'Caviar Dreams' },
      { family: 'Rozha One', similarTo: 'Goku' },
      { family: 'DM Serif Display', similarTo: 'Soria' },
      { family: 'Six Caps', similarTo: 'Voga / Coco' },
      { family: 'Raleway', weight: 300, similarTo: 'Lovato' },
      { family: 'Gilda Display', similarTo: 'Sanford' },
      { family: 'Noto Serif Display', weight: 500 },
      { family: 'Pinyon Script' },
      { family: 'Parisienne' },
      { family: 'Arizonia' },
      { family: 'Great Vibes', similarTo: 'Cylburn' },
    ],
  },
  {
    id: 'old-money',
    name: 'Old Money',
    mood: 'Heritage serifs and formal copperplate scripts',
    sample: 'The Estate',
    fonts: [
      { family: 'Pinyon Script' },
      { family: 'Gloock', similarTo: 'The Seasons' },
      { family: 'Cormorant Garamond', weight: 300, caps: true, tracking: 60, similarTo: 'Calgary' },
      { family: 'Noto Serif Display', weight: 400 },
      { family: 'Monsieur La Doulaise', similarTo: 'Citadel Script' },
      { family: 'Bodoni Moda', weight: 600, caps: true, similarTo: 'Perandory' },
      { family: 'Libre Baskerville' },
      { family: 'EB Garamond', weight: 500 },
      { family: 'Cinzel', weight: 500, caps: true, tracking: 80 },
      { family: 'Tenor Sans', caps: true, tracking: 220 },
      { family: 'Playfair Display SC' },
      { family: 'Allura' },
    ],
  },
  {
    id: 'elegant-minimal',
    name: 'Elegant Minimal',
    mood: 'Quiet, light-weight letterforms with generous space',
    sample: 'Calma',
    fonts: [
      { family: 'Forum' },
      { family: 'Italiana', similarTo: 'Muse' },
      { family: 'Raleway', weight: 300 },
      { family: 'Ysabeau Infant', weight: 400 },
      { family: 'Quicksand', weight: 300, similarTo: 'Sulfur Point' },
      { family: 'Marcellus', similarTo: 'Classico' },
      { family: 'Poiret One', similarTo: 'Black Mango' },
      { family: 'Gloock', similarTo: 'Sundays' },
      { family: 'Thasadith' },
      { family: 'Josefin Sans', weight: 300, caps: true, tracking: 180, similarTo: 'Brown Austin Sans' },
      { family: 'Bellefair' },
      { family: 'Aboreto', caps: true, tracking: 120 },
    ],
  },
  {
    id: 'bold-branding',
    name: 'Bold Branding',
    mood: 'Heavy, condensed and slab faces built for impact',
    sample: 'DETERMINED',
    fonts: [
      { family: 'Archivo Black', caps: true, similarTo: 'Agrandir Tight Black' },
      { family: 'Montserrat', weight: 900, caps: true, similarTo: 'Aileron Heavy' },
      { family: 'Livvic', weight: 700, caps: true },
      { family: 'Oswald', weight: 700, caps: true, similarTo: 'Mozer Bold' },
      { family: 'Squada One', caps: true },
      { family: 'Lexend', weight: 700, caps: true, similarTo: 'Panton Bold' },
      { family: 'Alfa Slab One', caps: true, similarTo: 'Chunk Five' },
      { family: 'Bebas Neue', similarTo: 'Norwester' },
      { family: 'Anton', caps: true, similarTo: 'Impact' },
      { family: 'League Gothic', caps: true, similarTo: 'Dharma Gothic' },
      { family: 'Big Shoulders', weight: 900, caps: true, similarTo: 'Manuka' },
      { family: 'Teko', weight: 600, caps: true, similarTo: 'Abolition' },
      { family: 'Kanit', weight: 800, italic: true, caps: true, similarTo: 'Sheepman' },
      { family: 'Bungee Inline', caps: true, similarTo: 'Gill Sans Nova Inline' },
      { family: 'Sancreek', caps: true, similarTo: 'Boucherie' },
      { family: 'Graduate', caps: true, similarTo: 'Octin' },
      { family: 'Passion One', caps: true },
      { family: 'Black Ops One', caps: true },
      { family: 'Rubik Dirt', caps: true },
      { family: 'Bevan', caps: true },
      { family: 'Six Caps', caps: true },
    ],
  },
  {
    id: 'clothing-brand',
    name: 'Clothing Brand',
    mood: 'Streetwear to luxury fashion — logos, tags and prints',
    sample: 'BRAND',
    fonts: [
      { family: 'Anton', caps: true, similarTo: 'Druk' },
      { family: 'Russo One', italic: true, caps: true, similarTo: 'Disruptor' },
      { family: 'UnifrakturMaguntia', note: 'Blackletter' },
      { family: 'Michroma', caps: true, similarTo: 'Eurostile' },
      { family: 'Metal Mania', caps: true, similarTo: 'Metal Lord' },
      { family: 'Unbounded', weight: 700, caps: true, similarTo: 'Neue Machina' },
      { family: 'Space Grotesk', weight: 500, caps: true },
      { family: 'Kanit', weight: 800, italic: true, caps: true },
      { family: 'Bebas Neue' },
      { family: 'Syne', weight: 700, caps: true },
      { family: 'Orbitron', weight: 700, caps: true },
      { family: 'Clash Display', weight: 700, caps: true, note: 'Fontshare' },
      { family: 'Cabinet Grotesk', weight: 800, caps: true, note: 'Fontshare' },
      { family: 'Panchang', weight: 700, caps: true, similarTo: 'Monument Extended', note: 'Fontshare' },
      { family: 'Tanker', caps: true, similarTo: 'Druk', note: 'Fontshare' },
      { family: 'Bodoni Moda', weight: 500 },
      { family: 'Playfair Display', italic: true },
      { family: 'Fraunces', weight: 700, similarTo: 'Recoleta' },
      { family: 'EB Garamond' },
      { family: 'Krona One', caps: true, similarTo: 'Monument Extended' },
      { family: 'Inter', weight: 700, similarTo: 'Helvetica Neue' },
      { family: 'Pirata One' },
      { family: 'Grenze Gotisch', weight: 600 },
    ],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    mood: 'Clean geometric and humanist sans for modern identities',
    sample: 'Studio',
    fonts: [
      { family: 'Montserrat', weight: 300, similarTo: 'Metropolis' },
      { family: 'Josefin Sans', weight: 100, caps: true, tracking: 200, similarTo: 'Uni Sans Thin' },
      { family: 'Quicksand', weight: 400, similarTo: 'Coco Gothic' },
      { family: 'Varela Round' },
      { family: 'Mulish', weight: 300, similarTo: 'Muli' },
      { family: 'Comfortaa', similarTo: 'Gidolinya' },
      { family: 'Josefin Slab', weight: 300, similarTo: 'Virtuous Slab' },
      { family: 'Nunito Sans', caps: true, tracking: 150, similarTo: 'Museo Sans' },
      { family: 'Play' },
      { family: 'Varela' },
      { family: 'Mako' },
      { family: 'Voces' },
      { family: 'Poiret One', similarTo: 'Avoda' },
      { family: 'Lexend Exa', caps: true, similarTo: 'Lena' },
      { family: 'Raleway', weight: 200, similarTo: 'Mint Sans' },
      { family: 'Cormorant', weight: 300, caps: true, similarTo: 'Ortica Light' },
      { family: 'Montserrat', weight: 400, similarTo: 'Nexa' },
      { family: 'Antonio', weight: 300, caps: true, tracking: 80, similarTo: 'Ostrich Sans' },
      { family: 'Outfit', weight: 800, similarTo: 'Olline' },
      { family: 'Lexend', weight: 600, similarTo: 'Colasta' },
      { family: 'Jost', weight: 300, caps: true, similarTo: 'Luxury (geometric)' },
      { family: 'Sora', weight: 500, similarTo: 'Mograph' },
      { family: 'Inter', weight: 700, similarTo: 'Noirden' },
    ],
  },
  {
    id: 'classic-faces',
    name: 'Iconic Brand Looks',
    mood: 'Free equivalents of the classic typefaces behind famous logos',
    sample: 'Signature',
    fonts: [
      { family: 'Jost', weight: 700, italic: true, similarTo: 'Futura Bold Oblique' },
      { family: 'Montserrat', weight: 700, similarTo: 'Gotham' },
      { family: 'Inter', weight: 700, similarTo: 'Helvetica' },
      { family: 'Arimo', similarTo: 'Arial (metric-compatible)' },
      { family: 'Nunito Sans', weight: 700, caps: true, similarTo: 'Avenir' },
      { family: 'Barlow Condensed', weight: 600, caps: true, similarTo: 'DIN' },
      { family: 'Source Sans 3', weight: 700, similarTo: 'Myriad' },
      { family: 'Bodoni Moda', weight: 500, caps: true, similarTo: 'Bodoni' },
      { family: 'Marcellus', caps: true, similarTo: 'Optima' },
      { family: 'Playfair Display', similarTo: 'Didot' },
      { family: 'Cinzel', caps: true, tracking: 400, similarTo: 'Charlemagne' },
      { family: 'Libre Baskerville', caps: true, similarTo: 'Baskerville' },
      { family: 'Tinos', caps: true, tracking: 100, similarTo: 'Times New Roman (metric-compatible)' },
      { family: 'Cinzel', weight: 700, caps: true, similarTo: 'Copperplate' },
      { family: 'EB Garamond', caps: true, tracking: 300, similarTo: 'Granjon' },
      { family: 'Federo', caps: true, similarTo: 'University Roman' },
      { family: 'Archivo Black', caps: true, similarTo: 'Utah / Helvetica Black' },
      { family: 'Lato', caps: true, tracking: 300, similarTo: 'Gill Sans' },
      { family: 'Gelasio', similarTo: 'Georgia (metric-compatible)' },
      { family: 'Courier Prime', caps: true, similarTo: 'Courier' },
      { family: 'Fira Sans', weight: 700, similarTo: 'Trebuchet MS' },
      { family: 'PT Sans', similarTo: 'Verdana / Tahoma' },
    ],
  },
];

COLLECTIONS.splice(1, 0, {
  id: 'premium-free',
  name: 'Premium Free (Fontshare)',
  mood: 'Foundry-quality serifs and grotesks, free for commercial use',
  sample: 'Maison Aura',
  fonts: [
    { family: 'Boska', weight: 500 },
    { family: 'Gambetta', weight: 500 },
    { family: 'Zodiak', weight: 400 },
    { family: 'Sentient', weight: 400 },
    { family: 'Erode', weight: 500 },
    { family: 'Melodrama', weight: 500 },
    { family: 'Stardom' },
    { family: 'Gambarino' },
    { family: 'Bespoke Serif', weight: 500 },
    { family: 'Recia', weight: 500 },
    { family: 'Author', weight: 500 },
    { family: 'Rosaline' },
    { family: 'Clash Display', weight: 600 },
    { family: 'Cabinet Grotesk', weight: 700 },
    { family: 'Satoshi', weight: 500 },
    { family: 'General Sans', weight: 500 },
    { family: 'Switzer', weight: 500 },
    { family: 'Chillax', weight: 500 },
    { family: 'Supreme', weight: 500 },
    { family: 'Panchang', weight: 700 },
  ],
});

export const STARTER_SAMPLE = 'Aura Studio';
