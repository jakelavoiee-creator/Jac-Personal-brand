// Builds the Google Fonts catalogue shipped with Aura Studio.
// Input: google-fonts-v2.json from the MIT-licensed `google-font-metadata` npm package.
//   npm pack google-font-metadata && tar xzf google-font-metadata-*.tgz
//   node scripts/build-font-catalog.mjs package/data/google-fonts-v2.json
// Output: src/data/font-catalog.json (families, styles, weights)
//         public/fonts/ttf-index.json (TrueType URLs, used for "convert text to outlines")
import fs from 'node:fs';

const src = process.argv[2];
if (!src) throw new Error('usage: node scripts/build-font-catalog.mjs <google-fonts-v2.json>');
const data = JSON.parse(fs.readFileSync(src, 'utf8'));

const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);
// Curated style tags. Google only ships five broad categories, so the creative
// categories designers actually browse by are assigned here.
const TAGS = {
  Luxury: list('Cinzel|Cinzel Decorative|Cormorant|Cormorant Garamond|Cormorant SC|Cormorant Unicase|Cormorant Upright|Cormorant Infant|Bodoni Moda|Libre Bodoni|Playfair Display|Playfair Display SC|Italiana|Marcellus|Marcellus SC|Forum|Tenor Sans|Bellefair|Gilda Display|Prata|Lustria|Della Respira|Federo|Antic Didone|Yeseva One|Abhaya Libre|Castoro|Gloock|Instrument Serif|Noto Serif Display|DM Serif Display|Limelight|Arapey|Rosarivo|Philosopher|Poiret One|Julius Sans One|Josefin Sans|Aboreto|Bodoni Moda SC|Playfair|Cormorant Garamond'),
  Fashion: list('Bodoni Moda|Libre Bodoni|Antic Didone|Playfair Display|DM Serif Display|Abril Fatface|Gloock|Italiana|Poiret One|Six Caps|Instrument Serif|Syne|Unica One|Prata|Yeseva One|Rozha One|Della Respira|Gilda Display|Cormorant Garamond|Bebas Neue|Big Shoulders|Didact Gothic|Julius Sans One|Tenor Sans|Montserrat|Questrial|Jost|Bodoni Moda SC|Aboreto|Kumbh Sans'),
  Editorial: list('Fraunces|Newsreader|Playfair Display|DM Serif Display|DM Serif Text|Libre Caslon Text|Libre Caslon Display|Source Serif 4|Lora|Merriweather|EB Garamond|Crimson Pro|Crimson Text|Spectral|Literata|Instrument Serif|Young Serif|Gloock|Bitter|Domine|Noto Serif|PT Serif|Libre Baskerville|Cardo|Old Standard TT|Abril Fatface|Bodoni Moda|Cormorant|Rufina|Sorts Mill Goudy|Petrona|Brygada 1918|Besley|Alegreya|Vollkorn|Gelasio|Source Serif Pro|Roboto Serif|Bricolage Grotesque|Newsreader'),
  Modern: list('Space Grotesk|Syne|Unbounded|Manrope|Sora|Outfit|Plus Jakarta Sans|Urbanist|Lexend|Epilogue|Archivo|Familjen Grotesk|Hanken Grotesk|Schibsted Grotesk|Bricolage Grotesque|Onest|Figtree|Red Hat Display|DM Sans|Inter Tight|Instrument Sans|Geologica|Gabarito|Darker Grotesque|Golos Text|Wix Madefor Display|Anybody|Big Shoulders|Space Mono|Rethink Sans|Funnel Display|Funnel Sans|Host Grotesk|Afacad|Albert Sans|Be Vietnam Pro|Chivo|Commissioner|Encode Sans|General Sans|Mona Sans|Hubot Sans|Reddit Sans|Inclusive Sans'),
  Minimalist: list('Inter|DM Sans|Manrope|Jost|Poppins|Work Sans|Karla|Mulish|Nunito Sans|Questrial|Raleway|Montserrat|Josefin Sans|Quicksand|Comfortaa|Didact Gothic|Lato|Open Sans|Roboto|IBM Plex Sans|Albert Sans|Figtree|Outfit|Urbanist|Hind|Heebo|Assistant|Red Hat Text|Public Sans|Lexend Deca|Kumbh Sans|Sen|Tenor Sans|Gruppo|Raleway|Source Sans 3|Noto Sans|Rubik|Barlow|Archivo|Sora|Onest|Instrument Sans'),
  Western: list('Rye|Smokum|Sancreek|Ewert|Diplomata|Diplomata SC|Ultra|Holtwood One SC|Vast Shadow|Wellfleet|Graduate|Alfa Slab One|Bevan|Arvo|Chango|Emblema One|Fjord One|Sansita|Shojumaru|Stint Ultra Expanded|Stint Ultra Condensed|Texturina|Abril Fatface|Cherry Swash|Berkshire Swash|Germania One|Ranchers|Slackey|Bigshot One|Carter One|Spicy Rice'),
  Vintage: list('IM Fell English|IM Fell English SC|IM Fell DW Pica|IM Fell Double Pica|IM Fell French Canon|IM Fell Great Primer|Old Standard TT|Sorts Mill Goudy|Special Elite|Cutive|Cutive Mono|Courier Prime|Libre Caslon Text|Linden Hill|Fanwood Text|Goudy Bookletter 1911|Rozha One|Limelight|Poiret One|Federo|Josefin Slab|Cinzel Decorative|Uncial Antiqua|Almendra|Almendra SC|MedievalSharp|Berkshire Swash|Rye|Vast Shadow|Abril Fatface|Playfair Display SC|Oleo Script|Lobster|Cherry Cream Soda|Bevan|Arbutus Slab|Ultra|Holtwood One SC|Alfa Slab One|Kelly Slab|Rokkitt|Zilla Slab|Elsie|Elsie Swash Caps|Bodoni Moda|Playball|Yesteryear|Corben|Coustard|Fondamento'),
  Retro: list('Monoton|Shrikhand|Bungee|Bungee Shade|Bungee Inline|Bungee Outline|Bungee Hairline|Righteous|Lobster|Lobster Two|Fascinate|Fascinate Inline|Pacifico|Chicle|Sniglet|Bowlby One|Bowlby One SC|Titan One|Luckiest Guy|Lilita One|Coiny|Rammetto One|Racing Sans One|Faster One|Audiowide|Monofett|Kavoon|Spicy Rice|Paytone One|Cherry Cream Soda|Rubik Mono One|Yellowtail|Mr Dafoe|Damion|Leckerli One|Fredoka|Fredoka One|Bagel Fat One|Chango|Gochi Hand|Sigmar One|Sigmar|Shrikhand|Pattaya|Nova Flat|Kablammo|Climate Crisis|Rampart One|Tilt Warp|Bungee Spice|Gasoek One|Grandstander|Modak|Erica One|Galindo|Oleo Script|Oleo Script Swash Caps|Yesteryear|Neonderthaw|Lobster'),
  Psychedelic: list('Monoton|Fascinate|Fascinate Inline|Faster One|Frijole|Ribeye|Ribeye Marrow|Butterfly Kids|Rubik Glitch|Rubik Beastly|Rubik Wet Paint|Rubik Puddles|Rubik Microbe|Rubik Moonrocks|Rubik Vinyl|Rubik Distressed|Rubik Iso|Rubik Maze|Rubik Burned|Rubik Marker Hatch|Rubik Bubbles|Rubik Gemstones|Rubik Storm|Rubik Doodle Shadow|Nabla|Bungee Spice|Honk|Climate Crisis|Shrikhand|Plaster|Kablammo|Rampart One|Tilt Prism|Tilt Neon|Tilt Warp|Hanalei|Hanalei Fill|Akronim|Bahianita|Kranky|Gajraj One|Sedgwick Ave Display|Kalnia Glaze|Moirai One|Bungee Tint|Jacquard 12 Charted|Workbench|Danfo|Sixtyfour|Shojumaru|Bagel Fat One|Gasoek One|Kirang Haerang'),
  Futuristic: list('Orbitron|Audiowide|Exo|Exo 2|Michroma|Unbounded|Syncopate|Aldrich|Oxanium|Rajdhani|Saira|Bai Jamjuree|Chakra Petch|Electrolize|Tomorrow|Turret Road|Zen Dots|Major Mono Display|Gruppo|Quantico|Share Tech|Share Tech Mono|Iceland|Wallpoet|Nova Square|Sarpanch|Teko|Space Grotesk|Space Mono|Krona One|Monda|Russo One|Jura|Goldman|Kdam Thmor Pro|Big Shoulders Stencil|Tektur|Bruno Ace|Bruno Ace SC|Zen Tokyo Zoo|Syne Mono|Sixtyfour|Workbench|Doto|Micro 5|Silkscreen|Press Start 2P|VT323|Genos|Stick No Bills|Agdasima|Orbit|Ubuntu Sans Mono|Afacad'),
  Graffiti: list('Permanent Marker|Rubik Spray Paint|Sedgwick Ave|Sedgwick Ave Display|Rock Salt|Knewave|Bangers|Wallpoet|Gochi Hand|Covered By Your Grace|Nanum Brush Script|Finger Paint|Rubik Wet Paint|Barrio|Freckle Face|Mansalva|Caveat Brush|Marck Script|Permanent Marker|Kalam|Rubik Dirt|Rubik Burned|Rubik Distressed|Londrina Sketch|Londrina Solid|Bungee Spice|Shadows Into Light|Gloria Hallelujah|Reenie Beanie|Nothing You Could Do|Jim Nightshade|Faster One|Kaushan Script|Lacquer|Butcherman|Creepster|Metal Mania|Nosifer|Eater|Frijole|Flavors|Chewy|Boogaloo|Tilt Warp'),
  Gothic: list('UnifrakturMaguntia|UnifrakturCook|Grenze Gotisch|Pirata One|New Rocker|Jacquard 12|Jacquard 24|Jacquarda Bastarda 9|Texturina|Fruktur|Metal Mania|Nosifer|Creepster|Eater|Butcherman|Griffy|Metamorphous|Almendra Display|MedievalSharp|Germania One|Uncial Antiqua|Cinzel Decorative|Macondo|Macondo Swash Caps|New Rocker|IM Fell English SC|Grenze|Jacquard 24 Charted'),
  Blackletter: list('UnifrakturMaguntia|UnifrakturCook|Grenze Gotisch|Pirata One|New Rocker|Jacquard 12|Jacquard 24|Jacquarda Bastarda 9|Jacquarda Bastarda 9 Charted|Texturina|Fruktur|Germania One|Metal Mania|Jacquard 12 Charted|Jacquard 24 Charted'),
  Bold: list('Archivo Black|Anton|Alfa Slab One|Bowlby One|Bowlby One SC|Titan One|Passion One|Dela Gothic One|Rubik Mono One|Black Ops One|Russo One|Lilita One|Luckiest Guy|Bungee|Ultra|Abril Fatface|Bevan|Chango|Bebas Neue|Big Shoulders|Paytone One|Sigmar One|Racing Sans One|Holtwood One SC|Rammetto One|Bagel Fat One|Gasoek One|Climate Crisis|Dela Gothic One|Mochiy Pop One|Shrikhand|Kanit|Fjalla One|Oswald|League Spartan|Archivo|Inter|Montserrat|Poppins|Work Sans|Unbounded|Syne|Outfit|Lexend Zetta|Lexend Peta|Lexend Mega|Krona One|Bricolage Grotesque|Darker Grotesque|Familjen Grotesk|Anybody|Six Caps|Antonio|Teko|Barlow Condensed|Saira Extra Condensed|Big Shoulders Text|Black Han Sans|Do Hyeon|Changa One|Coda|Erica One'),
};
const SCRIPT = /script|vibes|brush|signature|swash|formal|calligraph|allura|parisienne|pacifico|dancing|sacramento|satisfy|tangerine|yellowtail|lobster|cookie|kaushan|italianno|pinyon|alex brush|herr von|monsieur|mrs |mr |miss |lovers|qwigley|ruthie|seaweed|bilbo|clicker|cursive|playball|damion|yesteryear|arizonia|bad script|euphoria|ballet|corinthia|ephesis|ingrid|imperial|island moments|lavishly|luxurious|meow|moon dance|ole|passions|petemoss|send flowers|splash|square peg|the nautigal|twinkle star|updock|whisper|windsong|style script|birthstone|ms madi|my soul|love light|grape nuts|great vibes|kristi|rouge|norican|niconne|marck|engagement|fleur de leah|bonbon|charm|caramel|carattere|comforter|estonia|explora|fuggles|gwendolyn|hurricane|inspiration|kolker|licorice|mea culpa|mrs saint|oooh baby|puppies|qwitcher|smooch|vujahday|waterfall|babylonica|beau rivage|bilbo|cherish|dr sugiyama|hachi|mr bedfort/i;

const out = [];
const ttf = {};
for (const f of Object.values(data)) {
  const fam = f.family;
  const cat = f.category; // serif | sans-serif | display | handwriting | monospace
  const tags = new Set();
  tags.add({ serif: 'Serif', 'sans-serif': 'Sans serif', display: 'Display', handwriting: 'Handwritten', monospace: 'Monospace' }[cat]);
  for (const [tag, fams] of Object.entries(TAGS)) if (fams.includes(fam)) tags.add(tag);
  if (/Condensed|Narrow|Compressed|Extra Condensed|Bebas|Oswald|Anton|League Gothic|Fjalla|Pathway Gothic|Antonio|Big Shoulders|Six Caps|Teko|Saira (Extra )?Condensed|Pragati Narrow|Archivo Narrow|Encode Sans (Semi |Extra )?Condensed/.test(fam)) tags.add('Condensed');
  if (cat === 'handwriting' && SCRIPT.test(fam)) {
    tags.add('Script');
    tags.delete('Handwritten');
  }
  if (/Gotisch|Fraktur|Unifraktur|Jacquard|Texturina|Pirata|Bastarda/.test(fam)) {
    tags.add('Blackletter');
    tags.add('Gothic');
  }
  if (/Retro|Vintage|Antique|Antiqua|IM Fell|Old Standard/.test(fam)) tags.add('Vintage');
  if (/ Black$| Heavy$| Ultra$| Fat |Black Ops|Black Han/.test(fam)) tags.add('Bold');
  if (cat === 'display' && ![...tags].some((t) => !['Display'].includes(t))) tags.add('Decorative');
  if (cat === 'monospace') tags.add('Monospace');

  const weights = f.weights.map(Number).sort((a, b) => a - b);
  const italic = f.styles.includes('italic');
  out.push([fam, [...tags].join('|'), weights.join(','), italic ? 1 : 0]);

  // TrueType URLs per weight/style (same file covers all subsets)
  const entry = {};
  for (const [w, styles] of Object.entries(f.variants)) {
    for (const [st, subs] of Object.entries(styles)) {
      const any = Object.values(subs)[0];
      const url = any?.url?.truetype;
      if (url) entry[`${w}${st === 'italic' ? 'i' : ''}`] = url.replace('https://fonts.gstatic.com/s/', '');
    }
  }
  ttf[fam] = entry;
}
out.sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync('src/data/font-catalog.json', JSON.stringify(out));
fs.writeFileSync('public/fonts/ttf-index.json', JSON.stringify(ttf));
const counts = {};
out.forEach((r) => r[1].split('|').forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
console.log(out.length, 'families');
console.log(counts);
