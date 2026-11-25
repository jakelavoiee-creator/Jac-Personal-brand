/**
 * Aura's original graphic library.
 *
 * Every asset is generated here from geometry (no third-party artwork), as plain
 * SVG that imports into fabric as fully editable vector groups. Colours are
 * parameterised: `c` = ink, `a` = accent, so any graphic can be recoloured.
 */
export interface Graphic {
  id: string;
  name: string;
  category: GraphicCategory;
  tags: string;
  svg: (c: string, a: string) => string;
}

export type GraphicCategory =
  | 'Badges & Emblems'
  | 'Stars & Sparkles'
  | 'Flames'
  | 'Wings'
  | 'Skulls'
  | 'Flowers & Botanicals'
  | 'Ornaments & Dividers'
  | 'Frames & Borders'
  | 'Symbols'
  | 'Geometric & Abstract'
  | 'Retro & Vintage'
  | 'Patterns';

/* ---------------- geometry helpers ---------------- */

const f = (n: number) => +n.toFixed(2);
const P = (cx: number, cy: number, r: number, deg: number) => [f(cx + r * Math.cos((deg * Math.PI) / 180)), f(cy + r * Math.sin((deg * Math.PI) / 180))];
const poly = (pts: number[][]) => 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z';
const svg = (body: string, w = 200, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

function starPts(cx: number, cy: number, n: number, ro: number, ri: number, rot = -90) {
  return Array.from({ length: n * 2 }, (_, i) => P(cx, cy, i % 2 ? ri : ro, rot + (i * 180) / n));
}

/** Smooth closed curve through points (Catmull-Rom → cubic Bézier). */
function smoothClosed(pts: number[][]) {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d + ' Z';
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Leaf: pointed ellipse from (x,y) along angle, length L, width W. */
function leaf(x: number, y: number, ang: number, L: number, W: number) {
  const [tx, ty] = P(x, y, L, ang);
  const [m1x, m1y] = P(x, y, L * 0.5, ang);
  const [l1x, l1y] = P(m1x, m1y, W, ang - 90);
  const [l2x, l2y] = P(m1x, m1y, W, ang + 90);
  return `M${f(x)} ${f(y)} Q${l1x} ${l1y} ${tx} ${ty} Q${l2x} ${l2y} ${f(x)} ${f(y)} Z`;
}

/** Petal: rounded teardrop from centre outward. */
function petal(cx: number, cy: number, ang: number, r0: number, L: number, W: number) {
  const [bx, by] = P(cx, cy, r0, ang);
  const [tx, ty] = P(cx, cy, r0 + L, ang);
  const [c1x, c1y] = P(bx, by, L * 0.9, ang - (W * 57) / L);
  const [c2x, c2y] = P(bx, by, L * 0.9, ang + (W * 57) / L);
  return `M${bx} ${by} C${c1x} ${c1y} ${P(tx, ty, W * 0.9, ang - 90).join(' ')} ${tx} ${ty} C${P(tx, ty, W * 0.9, ang + 90).join(' ')} ${c2x} ${c2y} ${bx} ${by} Z`;
}

function flame(cx: number, base: number, h: number, w: number, lean = 0) {
  const tipX = cx + lean;
  return `M${f(cx - w)} ${base} C${f(cx - w * 1.3)} ${f(base - h * 0.45)} ${f(tipX - w * 0.2)} ${f(base - h * 0.6)} ${f(tipX)} ${f(base - h)} C${f(tipX + w * 0.15)} ${f(base - h * 0.55)} ${f(cx + w * 1.35)} ${f(base - h * 0.5)} ${f(cx + w)} ${base} C${f(cx + w * 0.6)} ${f(base + w * 0.55)} ${f(cx - w * 0.6)} ${f(base + w * 0.55)} ${f(cx - w)} ${base} Z`;
}

function ringDots(cx: number, cy: number, r: number, n: number, dr: number, c: string) {
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = P(cx, cy, r, (i * 360) / n);
    return `<circle cx="${x}" cy="${y}" r="${dr}" fill="${c}"/>`;
  }).join('');
}

function laurel(cx: number, cy: number, R: number, span: number, leaves: number, size: number, c: string, side: 1 | -1) {
  let out = '';
  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1);
    const deg = 90 + side * (25 + t * span);
    const [x, y] = P(cx, cy, R, deg);
    const tangent = deg + side * 90;
    const s = size * (1 - t * 0.45);
    out += `<path d="${leaf(x, y, tangent - side * 30, s, s * 0.32)}" fill="${c}"/>`;
    out += `<path d="${leaf(x, y, tangent + side * 32, s * 0.9, s * 0.28)}" fill="${c}"/>`;
  }
  const a0 = P(cx, cy, R, 90 + side * 25);
  const a1 = P(cx, cy, R, 90 + side * (25 + span));
  out += `<path d="M${a0.join(' ')} A${R} ${R} 0 0 ${side === 1 ? 1 : 0} ${a1.join(' ')}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  return out;
}

/* ---------------- library ---------------- */

const G: Graphic[] = [];
const add = (category: GraphicCategory, name: string, tags: string, fn: (c: string, a: string) => string) =>
  G.push({ id: `${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, category, tags, svg: fn });

/* Badges & emblems */
[
  { n: 'Classic seal', dots: 24, rings: 2 },
  { n: 'Dotted badge', dots: 36, rings: 1 },
  { n: 'Double ring', dots: 0, rings: 3 },
].forEach(({ n, dots, rings }) =>
  add('Badges & Emblems', n, 'badge seal round logo stamp', (c, a) =>
    svg(
      `<circle cx="100" cy="100" r="92" fill="none" stroke="${c}" stroke-width="5"/>` +
        (rings > 1 ? `<circle cx="100" cy="100" r="82" fill="none" stroke="${c}" stroke-width="1.5"/>` : '') +
        (rings > 2 ? `<circle cx="100" cy="100" r="54" fill="none" stroke="${c}" stroke-width="1.5"/>` : '') +
        (dots ? ringDots(100, 100, 70, dots, 2.2, c) : '') +
        `<circle cx="100" cy="100" r="${rings > 2 ? 48 : 56}" fill="${a}"/>` +
        `<path d="${poly(starPts(100, 100, 5, 22, 9))}" fill="${c}"/>`,
    ),
  ),
);
[16, 24, 32, 48].forEach((pts, i) =>
  add('Badges & Emblems', `Rosette seal ${i + 1}`, 'seal rosette burst sticker sale badge', (c, a) =>
    svg(`<path d="${poly(starPts(100, 100, pts, 96, 96 - 300 / pts))}" fill="${c}"/><circle cx="100" cy="100" r="${70 - i * 2}" fill="none" stroke="${a}" stroke-width="2.5"/>`),
  ),
);
const shields = [
  'M100 12 L176 38 C176 110 150 158 100 188 C50 158 24 110 24 38 Z',
  'M30 20 H170 V90 C170 140 140 170 100 188 C60 170 30 140 30 90 Z',
  'M100 10 C130 26 160 30 180 26 C182 110 150 160 100 190 C50 160 18 110 20 26 C40 30 70 26 100 10 Z',
];
shields.forEach((d, i) =>
  add('Badges & Emblems', `Shield ${i + 1}`, 'shield crest emblem heraldry varsity', (c, a) =>
    svg(`<path d="${d}" fill="${c}"/><path d="${d}" fill="none" stroke="${a}" stroke-width="3" transform="translate(100 100) scale(0.86) translate(-100 -100)"/>`),
  ),
);
add('Badges & Emblems', 'Laurel wreath', 'laurel wreath award victory crest luxury', (c) => svg(laurel(100, 92, 78, 150, 9, 30, c, 1) + laurel(100, 92, 78, 150, 9, 30, c, -1)));
add('Badges & Emblems', 'Laurel crest', 'laurel crest star award', (c, a) => svg(laurel(100, 96, 74, 130, 8, 28, c, 1) + laurel(100, 96, 74, 130, 8, 28, c, -1) + `<path d="${poly(starPts(100, 96, 5, 30, 12))}" fill="${a}"/>`));
add('Badges & Emblems', 'Half laurel', 'laurel branch left', (c) => svg(laurel(100, 92, 78, 150, 9, 30, c, 1)));
const ribbon = (curve: number) => (c: string, a: string) =>
  svg(
    `<path d="M16 ${70 + curve} L44 ${66 + curve} L44 ${110 + curve} L16 ${114 + curve} L28 ${92 + curve} Z" fill="${a}"/>` +
      `<path d="M184 ${70 + curve} L156 ${66 + curve} L156 ${110 + curve} L184 ${114 + curve} L172 ${92 + curve} Z" fill="${a}"/>` +
      `<path d="M36 60 Q100 ${60 - curve * 2} 164 60 L164 106 Q100 ${106 - curve * 2} 36 106 Z" fill="${c}"/>`,
    200,
    150,
  );
add('Badges & Emblems', 'Ribbon banner', 'ribbon banner label title', ribbon(0));
add('Badges & Emblems', 'Arched ribbon', 'ribbon banner arched curved', ribbon(12));
add('Badges & Emblems', 'Varsity patch', 'patch varsity oval college streetwear', (c, a) =>
  svg(`<ellipse cx="100" cy="100" rx="92" ry="70" fill="${c}"/><ellipse cx="100" cy="100" rx="82" ry="60" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="6 5"/>`, 200, 200),
);

/* Stars & sparkles */
[4, 5, 6, 8].forEach((n) => add('Stars & Sparkles', `${n}-point star`, 'star shape', (c) => svg(`<path d="${poly(starPts(100, 100, n, 90, n === 4 ? 28 : n === 5 ? 36 : 50))}" fill="${c}"/>`)));
add('Stars & Sparkles', 'Sparkle', 'sparkle twinkle shine glint', (c) => svg(`<path d="M100 6 C106 70 130 94 194 100 C130 106 106 130 100 194 C94 130 70 106 6 100 C70 94 94 70 100 6 Z" fill="${c}"/>`));
add('Stars & Sparkles', 'Sparkle cluster', 'sparkles twinkle magic shine', (c) => {
  const sp = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} C${x + r * 0.07} ${y - r * 0.3} ${x + r * 0.3} ${y - r * 0.07} ${x + r} ${y} C${x + r * 0.3} ${y + r * 0.07} ${x + r * 0.07} ${y + r * 0.3} ${x} ${y + r} C${x - r * 0.07} ${y + r * 0.3} ${x - r * 0.3} ${y + r * 0.07} ${x - r} ${y} C${x - r * 0.3} ${y - r * 0.07} ${x - r * 0.07} ${y - r * 0.3} ${x} ${y - r} Z" fill="${c}"/>`;
  return svg(sp(84, 110, 72) + sp(158, 46, 32) + sp(160, 160, 20));
});
add('Stars & Sparkles', 'Starburst lines', 'burst rays lines explosion pop', (c) =>
  svg(Array.from({ length: 24 }, (_, i) => `<path d="M${P(100, 100, 34, i * 15).join(' ')} L${P(100, 100, i % 2 ? 72 : 94, i * 15).join(' ')}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('')),
);
add('Stars & Sparkles', 'Shooting star', 'shooting star comet', (c) => svg(`<path d="${poly(starPts(138, 62, 5, 40, 16, -80))}" fill="${c}"/><path d="M110 82 L20 170 M120 96 L48 176 M100 72 L14 140" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`));
add('Stars & Sparkles', 'Star field', 'stars night scatter', (c) => {
  const r = rng(11);
  return svg(Array.from({ length: 14 }, () => `<path d="${poly(starPts(f(15 + r() * 170), f(15 + r() * 170), 5, f(5 + r() * 12), f(2 + r() * 4)))}" fill="${c}"/>`).join(''));
});

/* Flames */
add('Flames', 'Flame', 'fire flame hot', (c, a) => svg(`<path d="${flame(100, 170, 160, 52)}" fill="${c}"/><path d="${flame(100, 170, 90, 26)}" fill="${a}"/>`));
add('Flames', 'Fire trio', 'fire flames hot streetwear', (c) => svg(`<path d="${flame(62, 176, 110, 30, -10)}" fill="${c}"/><path d="${flame(138, 176, 110, 30, 10)}" fill="${c}"/><path d="${flame(100, 180, 168, 40, 4)}" fill="${c}"/>`));
add('Flames', 'Hot-rod flames', 'hot rod flames tribal racing', (c) => {
  let d = '';
  [0, 1, 2, 3].forEach((i) => {
    const y = 60 + i * 30;
    d += `<path d="M10 ${y + 14} C60 ${y + 20} 110 ${y + 10} ${150 + i * 10} ${y - 18} C${140 + i * 8} ${y + 4} 120 ${y + 22} 10 ${y + 30} Z" fill="${c}"/>`;
  });
  return svg(d);
});
add('Flames', 'Torch flame', 'torch flame candle', (c, a) => svg(`<path d="${flame(100, 130, 120, 34, 6)}" fill="${c}"/><path d="M80 134 H120 L112 192 H88 Z" fill="${a}"/>`));

/* Wings — tiered silhouette (primaries → secondaries → coverts). Each tier is one
   solid shape: the arm along the top, a scalloped feather edge along the bottom. */
function wingSVG(c: string, a: string, side: 1 | -1, ox: number, oy: number, scale = 1, tiers = 3) {
  const X = (x: number) => f(ox - side * x * scale);
  const Y = (y: number) => f(oy + y * scale);
  const arm = (t: number) => [2 * (1 - t) * t * 34 + t * t * 120, 2 * (1 - t) * t * -70 + t * t * -92];
  const defs = [
    { n: 9, len: (t: number) => 46 + t * 70, spread: -58 },
    { n: 7, len: (t: number) => 32 + t * 40, spread: -52 },
    { n: 6, len: (t: number) => 16 + t * 18, spread: -44 },
  ].slice(0, tiers);
  let out = '';
  defs.forEach((tier, ti) => {
    const tip = (t: number) => {
      const [x, y] = arm(t);
      const r = ((90 + tier.spread * t) * Math.PI) / 180;
      const L = tier.len(t);
      return { x: x + Math.cos(r) * L, y: y + Math.sin(r) * L, r };
    };
    let d = `M${X(0)} ${Y(0)}`;
    for (let k = 1; k <= 24; k++) {
      const [x, y] = arm(k / 24);
      d += ` L${X(x)} ${Y(y)}`;
    }
    // scallops back from the wing tip to the shoulder, one per feather
    const pts = Array.from({ length: tier.n + 1 }, (_, i) => tip(1 - i / tier.n));
    d += ` L${X(pts[0].x)} ${Y(pts[0].y)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mr = (p0.r + p1.r) / 2;
      const bulge = Math.hypot(p1.x - p0.x, p1.y - p0.y) * 0.75;
      const cx = (p0.x + p1.x) / 2 + Math.cos(mr) * bulge;
      const cy = (p0.y + p1.y) / 2 + Math.sin(mr) * bulge;
      d += ` Q${X(cx)} ${Y(cy)} ${X(p1.x)} ${Y(p1.y)}`;
    }
    d += ' Z';
    out += `<path d="${d}" fill="${c}"${ti ? ` stroke="${a}" stroke-width="${f(2.2 * scale)}" stroke-linejoin="round"` : ''}/>`;
  });
  return out;
}
add('Wings', 'Wing (left)', 'wing feather angel', (c, a) => svg(wingSVG(c, a, 1, 236, 150, 1), 260, 260));
add('Wings', 'Wing (right)', 'wing feather angel', (c, a) => svg(wingSVG(c, a, -1, 24, 150, 1), 260, 260));
add('Wings', 'Winged pair', 'wings pair angel freedom streetwear logo', (c, a) => svg(wingSVG(c, a, 1, 196, 150, 1) + wingSVG(c, a, -1, 204, 150, 1), 400, 260));
add('Wings', 'Simple wings', 'wings minimal', (c, a) => svg(wingSVG(c, a, 1, 196, 150, 1, 2) + wingSVG(c, a, -1, 204, 150, 1, 2), 400, 260));

/* Skulls (original stylised geometry) */
const skull = (c: string, a: string) =>
  `<path d="M100 18 C146 18 176 50 176 94 C176 120 164 136 150 144 L150 166 C150 174 144 180 136 180 L64 180 C56 180 50 174 50 166 L50 144 C36 136 24 120 24 94 C24 50 54 18 100 18 Z" fill="${c}"/>` +
  `<path d="M58 96 C58 78 74 72 86 78 C96 84 94 108 80 114 C66 120 58 110 58 96 Z" fill="${a}"/>` +
  `<path d="M142 96 C142 78 126 72 114 78 C104 84 106 108 120 114 C134 120 142 110 142 96 Z" fill="${a}"/>` +
  `<path d="M100 118 L110 140 H90 Z" fill="${a}"/>` +
  [70, 85, 100, 115, 130].map((x) => `<rect x="${x - 5}" y="152" width="9" height="22" rx="2" fill="${a}"/>`).join('');
add('Skulls', 'Skull', 'skull death rock punk halloween streetwear', (c, a) => svg(skull(c, a)));
add('Skulls', 'Skull & crossbones', 'skull crossbones pirate danger', (c, a) => {
  const bone = (deg: number) => `<g transform="rotate(${deg} 100 110)"><rect x="18" y="102" width="164" height="16" rx="8" fill="${c}"/><circle cx="18" cy="100" r="11" fill="${c}"/><circle cx="18" cy="120" r="11" fill="${c}"/><circle cx="182" cy="100" r="11" fill="${c}"/><circle cx="182" cy="120" r="11" fill="${c}"/></g>`;
  return svg(bone(35) + bone(-35) + `<g transform="translate(100 92) scale(0.62) translate(-100 -100)">${skull(c, a)}</g>`, 200, 210);
});
add('Skulls', 'Skull outline', 'skull outline line minimal', (c) =>
  svg(`<g fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round">${skull('none', 'none').replace(/fill="none"/g, '')}</g>`),
);

/* Flowers & botanicals */
[5, 6, 8, 12].forEach((n, i) =>
  add('Flowers & Botanicals', `Daisy ${i + 1}`, 'flower daisy floral bloom', (c, a) =>
    svg(Array.from({ length: n }, (_, k) => `<path d="${petal(100, 100, (k * 360) / n, 18, 70, 120 / n + 6)}" fill="${c}"/>`).join('') + `<circle cx="100" cy="100" r="22" fill="${a}"/>`),
  ),
);
add('Flowers & Botanicals', 'Rose', 'rose flower love romantic', (c, a) => {
  let out = '';
  [5, 5, 4].forEach((n, layer) => {
    for (let k = 0; k < n; k++) out += `<path d="${petal(100, 100, (k * 360) / n + layer * 28, 4 + layer * 2, 82 - layer * 24, 36 - layer * 8)}" fill="${layer === 1 ? a : c}" stroke="${layer === 1 ? c : a}" stroke-width="2"/>`;
  });
  return svg(out + `<circle cx="100" cy="100" r="10" fill="${c}"/>`);
});
add('Flowers & Botanicals', 'Tulip', 'tulip flower spring', (c, a) =>
  svg(`<path d="M100 120 C60 120 52 70 60 40 L80 62 L100 30 L120 62 L140 40 C148 70 140 120 100 120 Z" fill="${c}"/><path d="M98 118 H102 V194 H98 Z" fill="${a}"/><path d="${leaf(100, 180, -130, 70, 18)}" fill="${a}"/><path d="${leaf(100, 165, -55, 60, 16)}" fill="${a}"/>`),
);
add('Flowers & Botanicals', 'Leaf sprig', 'leaf branch sprig olive botanical', (c) => {
  let out = `<path d="M30 180 Q100 110 170 20" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const t = 0.12 + i * 0.12;
    const x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 100 + t * t * 170;
    const y = (1 - t) * (1 - t) * 180 + 2 * (1 - t) * t * 110 + t * t * 20;
    out += `<path d="${leaf(x, y, i % 2 ? -10 : -100, 38 - i * 2, 11)}" fill="${c}"/>`;
  }
  return svg(out);
});
add('Flowers & Botanicals', 'Monstera leaf', 'leaf tropical monstera plant', (c) => {
  // one compound path: leaf outline + slits and centre vein as true holes
  let d = 'M100 20 C170 30 190 100 160 150 C140 180 110 186 100 186 C90 186 60 180 40 150 C10 100 30 30 100 20 Z';
  for (let i = 0; i < 5; i++) {
    const y = 60 + i * 24;
    d += ` M103 ${y} L${150 - i * 4} ${y - 16} L${148 - i * 4} ${y - 2} Z M97 ${y} L${50 + i * 4} ${y - 16} L${52 + i * 4} ${y - 2} Z`;
  }
  d += ' M98.5 30 H101.5 V180 H98.5 Z';
  return svg(`<path d="${d}" fill="${c}" fill-rule="evenodd"/>`);
});
add('Flowers & Botanicals', 'Lotus', 'lotus flower zen yoga', (c, a) =>
  svg(
    [-60, -30, 0, 30, 60].map((d, i) => `<path d="${petal(100, 150, -90 + d, 0, i === 2 ? 110 : 90 - Math.abs(d) * 0.3, 26)}" fill="${i % 2 ? a : c}"/>`).join('') + `<path d="M30 152 Q100 172 170 152" fill="none" stroke="${c}" stroke-width="4"/>`,
  ),
);
add('Flowers & Botanicals', 'Olive branch', 'olive branch peace leaves', (c, a) => {
  let out = `<path d="M20 160 C80 140 130 90 180 40" fill="none" stroke="${c}" stroke-width="3"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 25;
    const y = 152 - i * 20;
    out += `<path d="${leaf(x, y, -60, 34, 9)}" fill="${c}"/><path d="${leaf(x + 6, y - 4, 20, 30, 8)}" fill="${c}"/>`;
    if (i % 2) out += `<ellipse cx="${x + 12}" cy="${y + 10}" rx="7" ry="9" fill="${a}"/>`;
  }
  return svg(out);
});
add('Flowers & Botanicals', 'Wildflower', 'wildflower stem minimal line', (c) =>
  svg(`<path d="M100 196 C96 150 104 120 100 80" fill="none" stroke="${c}" stroke-width="3"/>${Array.from({ length: 7 }, (_, k) => `<path d="${petal(100, 62, (k * 360) / 7, 6, 32, 11)}" fill="none" stroke="${c}" stroke-width="3"/>`).join('')}<path d="${leaf(100, 150, -150, 44, 12)}" fill="none" stroke="${c}" stroke-width="3"/>`),
);

/* Ornaments & dividers */
add('Ornaments & Dividers', 'Diamond divider', 'divider line rule ornament elegant', (c) =>
  svg(`<path d="M10 50 H80 M120 50 H190" stroke="${c}" stroke-width="2"/><path d="M100 36 L114 50 L100 64 L86 50 Z" fill="${c}"/><circle cx="76" cy="50" r="3" fill="${c}"/><circle cx="124" cy="50" r="3" fill="${c}"/>`, 200, 100),
);
add('Ornaments & Dividers', 'Dot divider', 'divider dots line', (c) => svg(Array.from({ length: 13 }, (_, i) => `<circle cx="${10 + i * 15}" cy="50" r="${i === 6 ? 6 : i % 2 ? 2 : 3.5}" fill="${c}"/>`).join(''), 200, 100));
add('Ornaments & Dividers', 'Double rule', 'divider rule line double', (c) => svg(`<path d="M10 44 H190 M10 56 H190" stroke="${c}" stroke-width="2.5"/>`, 200, 100));
add('Ornaments & Dividers', 'Flourish', 'flourish swirl ornament scroll calligraphy', (c) => {
  const s = (sx: number) => `<path d="M100 50 C${100 + sx * 30} 20 ${100 + sx * 60} 20 ${100 + sx * 70} 46 C${100 + sx * 76} 62 ${100 + sx * 60} 70 ${100 + sx * 52} 58 C${100 + sx * 46} 50 ${100 + sx * 54} 42 ${100 + sx * 60} 48 M${100 + sx * 70} 46 C${100 + sx * 80} 30 ${100 + sx * 90} 40 ${100 + sx * 92} 50" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  return svg(s(1) + s(-1) + `<path d="M100 38 L106 50 L100 62 L94 50 Z" fill="${c}"/>`, 200, 100);
});
add('Ornaments & Dividers', 'Swash underline', 'swash underline brush stroke', (c) => svg(`<path d="M8 62 C60 40 140 34 192 46 C150 44 80 52 20 72 Z" fill="${c}"/>`, 200, 100));
add('Ornaments & Dividers', 'Fleuron', 'fleuron heart leaf ornament typography', (c) =>
  svg(`<path d="M100 170 C40 130 30 80 60 60 C80 46 96 60 100 80 C104 60 120 46 140 60 C170 80 160 130 100 170 Z" fill="${c}"/><path d="M100 80 C96 50 110 30 130 22" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`),
);
add('Ornaments & Dividers', 'Corner flourish', 'corner ornament flourish frame', (c) =>
  svg(`<path d="M10 190 V60 C10 30 30 10 60 10 H190" fill="none" stroke="${c}" stroke-width="3"/><path d="M24 176 V70 C24 44 44 24 70 24 H176" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M60 60 C60 40 80 40 80 56 C80 66 70 68 66 62" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="190" r="5" fill="${c}"/><circle cx="190" cy="10" r="5" fill="${c}"/>`),
);
add('Ornaments & Dividers', 'Wave divider', 'wave divider line squiggle', (c) => {
  let d = 'M5 50';
  for (let i = 0; i < 8; i++) d += ` q 12 ${i % 2 ? 18 : -18} 24 0`;
  return svg(`<path d="${d}" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`, 200, 100);
});
add('Ornaments & Dividers', 'Bracket pair', 'bracket ornament title frame', (c) =>
  svg(`<path d="M50 14 C30 14 30 30 30 44 C30 50 22 50 16 50 C22 50 30 50 30 56 C30 70 30 86 50 86 M150 14 C170 14 170 30 170 44 C170 50 178 50 184 50 C178 50 170 50 170 56 C170 70 170 86 150 86" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`, 200, 100),
);
add('Ornaments & Dividers', 'Art deco rule', 'art deco divider gatsby luxury', (c) =>
  svg(`<path d="M10 50 H70 M130 50 H190" stroke="${c}" stroke-width="2"/><path d="${poly([[100, 22], [130, 50], [100, 78], [70, 50]])}" fill="none" stroke="${c}" stroke-width="2"/><path d="${poly([[100, 34], [116, 50], [100, 66], [84, 50]])}" fill="${c}"/><path d="M70 40 H50 M70 60 H50 M130 40 H150 M130 60 H150" stroke="${c}" stroke-width="2"/>`, 200, 100),
);

/* Frames & borders */
add('Frames & Borders', 'Double frame', 'frame border double rectangle', (c) => svg(`<rect x="8" y="8" width="184" height="184" fill="none" stroke="${c}" stroke-width="4"/><rect x="18" y="18" width="164" height="164" fill="none" stroke="${c}" stroke-width="1.5"/>`));
add('Frames & Borders', 'Rounded frame', 'frame rounded border', (c) => svg(`<rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke="${c}" stroke-width="5"/>`));
add('Frames & Borders', 'Art deco frame', 'art deco frame gatsby luxury border', (c) =>
  svg(`<path d="M30 8 H170 L192 30 V170 L170 192 H30 L8 170 V30 Z" fill="none" stroke="${c}" stroke-width="4"/><path d="M38 18 H162 L182 38 V162 L162 182 H38 L18 162 V38 Z" fill="none" stroke="${c}" stroke-width="1.5"/>`),
);
add('Frames & Borders', 'Ticket frame', 'ticket coupon frame notch', (c) =>
  svg(`<path d="M8 8 H192 V80 A20 20 0 0 0 192 120 V192 H8 V120 A20 20 0 0 0 8 80 Z" fill="none" stroke="${c}" stroke-width="4"/><path d="M40 100 H160" stroke="${c}" stroke-width="2" stroke-dasharray="6 6"/>`),
);
add('Frames & Borders', 'Arch frame', 'arch frame window boho', (c) => svg(`<path d="M20 196 V100 A80 80 0 0 1 180 100 V196 Z" fill="none" stroke="${c}" stroke-width="5"/><path d="M34 196 V102 A66 66 0 0 1 166 102 V196" fill="none" stroke="${c}" stroke-width="1.5"/>`));
add('Frames & Borders', 'Circle frame', 'circle frame round border dotted', (c) => svg(`<circle cx="100" cy="100" r="90" fill="none" stroke="${c}" stroke-width="4"/>${ringDots(100, 100, 80, 48, 1.8, c)}`));
add('Frames & Borders', 'Stamp border', 'stamp postage border scallop perforated', (c) => {
  // perforated edge: semicircle notches along each side, inner window as a hole
  const n = 12;
  const step = 200 / n;
  let d = 'M0 0';
  for (let i = 0; i < n; i++) d += ` L${f(i * step + step / 2 - 5)} 0 A5 5 0 0 0 ${f(i * step + step / 2 + 5)} 0`;
  d += ' L200 0';
  for (let i = 0; i < n; i++) d += ` L200 ${f(i * step + step / 2 - 5)} A5 5 0 0 0 200 ${f(i * step + step / 2 + 5)}`;
  d += ' L200 200';
  for (let i = n - 1; i >= 0; i--) d += ` L${f(i * step + step / 2 + 5)} 200 A5 5 0 0 0 ${f(i * step + step / 2 - 5)} 200`;
  d += ' L0 200';
  for (let i = n - 1; i >= 0; i--) d += ` L0 ${f(i * step + step / 2 + 5)} A5 5 0 0 0 0 ${f(i * step + step / 2 - 5)}`;
  d += ' Z M20 20 V180 H180 V20 Z';
  return svg(`<path d="${d}" fill="${c}" fill-rule="evenodd"/>`);
});
add('Frames & Borders', 'Corner brackets', 'corners brackets crop frame minimal', (c) =>
  svg(`<path d="M8 50 V8 H50 M150 8 H192 V50 M192 150 V192 H150 M50 192 H8 V150" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="square"/>`),
);

/* Symbols */
add('Symbols', 'Heart', 'heart love', (c) => svg(`<path d="M100 178 C30 130 12 92 22 62 C32 30 76 24 100 58 C124 24 168 30 178 62 C188 92 170 130 100 178 Z" fill="${c}"/>`));
add('Symbols', 'Lightning bolt', 'lightning bolt energy power', (c) => svg(`<path d="M118 6 L40 112 H94 L78 194 L162 82 H106 Z" fill="${c}"/>`));
add('Symbols', 'Crown', 'crown king queen royal luxury', (c, a) =>
  svg(`<path d="M20 150 L30 60 L70 104 L100 40 L130 104 L170 60 L180 150 Z" fill="${c}"/><rect x="20" y="158" width="160" height="18" rx="3" fill="${c}"/><circle cx="30" cy="56" r="9" fill="${a}"/><circle cx="100" cy="36" r="9" fill="${a}"/><circle cx="170" cy="56" r="9" fill="${a}"/>`),
);
add('Symbols', 'Gem', 'diamond gem jewel luxury', (c, a) =>
  svg(`<path d="M50 30 H150 L190 78 L100 182 L10 78 Z" fill="${c}"/><path d="M10 78 H190 M50 30 L76 78 L100 182 L124 78 L150 30 M76 78 L100 30 L124 78" fill="none" stroke="${a}" stroke-width="3" stroke-linejoin="round"/>`),
);
add('Symbols', 'Sun', 'sun sunshine summer rays', (c) => svg(`<circle cx="100" cy="100" r="42" fill="${c}"/>${Array.from({ length: 12 }, (_, i) => `<path d="${leaf(...(P(100, 100, 54, i * 30) as [number, number]), i * 30, 38, 8)}" fill="${c}"/>`).join('')}`));
add('Symbols', 'Crescent moon', 'moon crescent night celestial', (c) => svg(`<path d="M128 20 A84 84 0 1 0 180 150 A70 70 0 1 1 128 20 Z" fill="${c}"/>`));
add('Symbols', 'Eye', 'eye vision mystic all seeing', (c, a) => svg(`<path d="M8 100 C50 40 150 40 192 100 C150 160 50 160 8 100 Z" fill="${c}"/><circle cx="100" cy="100" r="34" fill="${a}"/><circle cx="100" cy="100" r="16" fill="${c}"/>`));
add('Symbols', 'Arrow', 'arrow direction pointer', (c) => svg(`<path d="M10 86 H130 V50 L190 100 L130 150 V114 H10 Z" fill="${c}"/>`));
add('Symbols', 'Curved arrow', 'arrow curved hand drawn', (c) => svg(`<path d="M24 150 C40 60 120 40 168 76" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M140 58 L174 80 L146 108" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`));
add('Symbols', 'Asterisk', 'asterisk star burst', (c) => svg(Array.from({ length: 6 }, (_, i) => `<rect x="90" y="10" width="20" height="90" rx="10" fill="${c}" transform="rotate(${i * 60} 100 100)"/>`).join('')));
add('Symbols', 'Spiral', 'spiral hypnotic swirl', (c) => {
  let d = 'M100 100';
  for (let t = 0; t < 26; t += 0.25) d += ` L${f(100 + Math.cos(t) * t * 3.4)} ${f(100 + Math.sin(t) * t * 3.4)}`;
  return svg(`<path d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`);
});
add('Symbols', 'Infinity', 'infinity forever loop', (c) => svg(`<path d="M100 100 C70 60 20 60 20 100 C20 140 70 140 100 100 C130 60 180 60 180 100 C180 140 130 140 100 100 Z" fill="none" stroke="${c}" stroke-width="12"/>`, 200, 200));

/* Geometric & abstract */
for (let i = 0; i < 4; i++) {
  add('Geometric & Abstract', `Organic blob ${i + 1}`, 'blob organic shape abstract fluid', (c) => {
    const r = rng(100 + i * 7);
    const n = 7 + i;
    return svg(`<path d="${smoothClosed(Array.from({ length: n }, (_, k) => P(100, 100, 60 + r() * 34, (k * 360) / n)))}" fill="${c}"/>`);
  });
}
add('Geometric & Abstract', 'Concentric circles', 'circles rings concentric target', (c) => svg(Array.from({ length: 6 }, (_, i) => `<circle cx="100" cy="100" r="${90 - i * 15}" fill="none" stroke="${c}" stroke-width="5"/>`).join('')));
add('Geometric & Abstract', 'Halftone circle', 'halftone dots circle gradient', (c) => {
  let out = '';
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 13; x++) {
      const cx = 10 + x * 15;
      const cy = 10 + y * 15;
      const d = Math.hypot(cx - 100, cy - 100);
      if (d < 92) out += `<circle cx="${cx}" cy="${cy}" r="${f(6.5 * (1 - d / 100))}" fill="${c}"/>`;
    }
  return svg(out);
});
add('Geometric & Abstract', 'Dot grid', 'dots grid pattern', (c) => svg(Array.from({ length: 49 }, (_, i) => `<circle cx="${22 + (i % 7) * 26}" cy="${22 + Math.floor(i / 7) * 26}" r="4" fill="${c}"/>`).join('')));
add('Geometric & Abstract', 'Zigzag', 'zigzag chevron line memphis', (c) => {
  let d = 'M10 80';
  for (let i = 0; i < 9; i++) d += ` L${30 + i * 20} ${i % 2 ? 80 : 120}`;
  return svg(`<path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`, 200, 200);
});
add('Geometric & Abstract', 'Squiggle', 'squiggle memphis line playful', (c) => svg(`<path d="M20 120 C40 60 60 60 70 100 C80 140 100 140 110 100 C120 60 140 60 150 100 C160 140 175 130 185 100" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`));
add('Geometric & Abstract', 'Triangle trio', 'triangles geometric abstract', (c, a) => svg(`<path d="M20 170 L80 60 L140 170 Z" fill="${c}"/><path d="M80 170 L130 80 L180 170 Z" fill="${a}" opacity="0.85"/><path d="M60 40 L80 10 L100 40 Z" fill="${c}"/>`));
add('Geometric & Abstract', 'Bauhaus composition', 'bauhaus shapes geometric modern', (c, a) =>
  svg(`<rect x="10" y="10" width="90" height="90" fill="${c}"/><circle cx="145" cy="55" r="45" fill="${a}"/><path d="M100 190 A90 90 0 0 1 190 100 V190 Z" fill="${c}"/><path d="M10 110 H100 V190 Z" fill="${a}"/>`),
);
add('Geometric & Abstract', 'Grid of squares', 'grid squares checker modern', (c) => svg(Array.from({ length: 16 }, (_, i) => ((i + Math.floor(i / 4)) % 2 ? '' : `<rect x="${10 + (i % 4) * 45}" y="${10 + Math.floor(i / 4) * 45}" width="45" height="45" fill="${c}"/>`)).join('')));
add('Geometric & Abstract', 'Radial lines', 'radial lines burst minimal', (c) => svg(Array.from({ length: 36 }, (_, i) => `<path d="M${P(100, 100, 20, i * 10).join(' ')} L${P(100, 100, 92, i * 10).join(' ')}" stroke="${c}" stroke-width="2"/>`).join('')));

/* Retro & vintage */
add('Retro & Vintage', 'Retro sunburst', 'sunburst rays retro vintage 70s', (c) =>
  svg(Array.from({ length: 16 }, (_, i) => `<path d="M100 100 L${P(100, 100, 140, i * 22.5).join(' ')} L${P(100, 100, 140, i * 22.5 + 11.25).join(' ')} Z" fill="${c}"/>`).join(''), 200, 200),
);
add('Retro & Vintage', 'Retro sunset', 'sunset stripes retro 70s 80s', (c, a) => {
  let out = `<circle cx="100" cy="110" r="80" fill="${c}"/>`;
  for (let i = 0; i < 6; i++) out += `<rect x="10" y="${118 + i * 12}" width="180" height="${2 + i * 1.4}" fill="${a}"/>`;
  return svg(out);
});
add('Retro & Vintage', 'Vintage oval label', 'label oval vintage badge frame', (c) =>
  svg(`<ellipse cx="100" cy="100" rx="94" ry="64" fill="none" stroke="${c}" stroke-width="5"/><ellipse cx="100" cy="100" rx="84" ry="54" fill="none" stroke="${c}" stroke-width="1.5"/>${Array.from({ length: 2 }, (_, i) => `<path d="${poly(starPts(i ? 168 : 32, 100, 5, 7, 3))}" fill="${c}"/>`).join('')}`, 200, 200),
);
add('Retro & Vintage', 'Compass rose', 'compass rose nautical vintage travel', (c, a) =>
  svg(
    `<circle cx="100" cy="100" r="90" fill="none" stroke="${c}" stroke-width="2"/>` +
      [0, 90, 180, 270].map((d) => `<path d="M100 100 L${P(100, 100, 90, d - 90).join(' ')} L${P(100, 100, 18, d - 45).join(' ')} Z" fill="${c}"/><path d="M100 100 L${P(100, 100, 90, d - 90).join(' ')} L${P(100, 100, 18, d - 135).join(' ')} Z" fill="${a}"/>`).join('') +
      [45, 135, 225, 315].map((d) => `<path d="M100 100 L${P(100, 100, 56, d - 90).join(' ')} L${P(100, 100, 12, d - 45).join(' ')} Z" fill="${c}"/>`).join(''),
  ),
);
add('Retro & Vintage', 'Est. badge', 'established est badge vintage heritage', (c, a) =>
  svg(`<path d="${poly(starPts(100, 100, 30, 96, 88))}" fill="${c}"/><circle cx="100" cy="100" r="74" fill="none" stroke="${a}" stroke-width="2"/><path d="M40 100 H160" stroke="${a}" stroke-width="2"/>${laurel(100, 100, 56, 70, 5, 16, a, 1)}${laurel(100, 100, 56, 70, 5, 16, a, -1)}`),
);
add('Retro & Vintage', 'Speed lines', 'speed lines motion retro', (c) => svg(Array.from({ length: 7 }, (_, i) => `<rect x="${10 + (i % 3) * 18}" y="${20 + i * 24}" width="${180 - (i % 3) * 36}" height="10" rx="5" fill="${c}"/>`).join('')));
add('Retro & Vintage', 'Checkerboard flag', 'checker racing flag retro skate', (c) => svg(Array.from({ length: 64 }, (_, i) => ((i + Math.floor(i / 8)) % 2 ? '' : `<rect x="${(i % 8) * 25}" y="${Math.floor(i / 8) * 25}" width="25" height="25" fill="${c}"/>`)).join('')));
add('Retro & Vintage', 'Pop sticker', 'sticker burst retro pop', (c, a) => svg(`<path d="${poly(starPts(100, 100, 12, 96, 70, -75))}" fill="${a}"/><path d="${poly(starPts(100, 100, 12, 82, 60, -75))}" fill="${c}"/>`));

/* Patterns */
add('Patterns', 'Stripes', 'stripes lines pattern', (c) => svg(Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${i * 20}" width="200" height="10" fill="${c}"/>`).join('')));
add('Patterns', 'Diagonal stripes', 'diagonal stripes pattern', (c) => svg(Array.from({ length: 20 }, (_, i) => `<path d="M${i * 20 - 200} 200 L${i * 20} 0 L${i * 20 + 10} 0 L${i * 20 - 190} 200 Z" fill="${c}"/>`).join('')));
add('Patterns', 'Chevrons', 'chevron pattern zigzag', (c) => {
  let out = '';
  for (let r = 0; r < 6; r++) {
    let d = `M0 ${20 + r * 34}`;
    for (let i = 0; i < 10; i++) d += ` L${10 + i * 20} ${(i % 2 ? 20 : 4) + r * 34}`;
    out += `<path d="${d}" fill="none" stroke="${c}" stroke-width="6"/>`;
  }
  return svg(out);
});
add('Patterns', 'Polka dots', 'polka dots pattern', (c) => {
  let out = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) out += `<circle cx="${12 + x * 25 + (y % 2 ? 12 : 0)}" cy="${12 + y * 25}" r="6" fill="${c}"/>`;
  return svg(out);
});
add('Patterns', 'Scales', 'scales fish mermaid pattern', (c) => {
  let out = '';
  for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) out += `<path d="M${x * 25 + (y % 2 ? 12.5 : 0)} ${y * 25 + 25} a12.5 12.5 0 0 1 25 0" fill="none" stroke="${c}" stroke-width="2.5"/>`;
  return svg(out);
});

export const GRAPHICS = G;
export const GRAPHIC_CATEGORIES = [...new Set(G.map((g) => g.category))];
