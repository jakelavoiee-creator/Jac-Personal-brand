// Builds the Fontshare (Indian Type Foundry) catalogue: fonts free for personal and
// commercial use under the ITF Free Font License or SIL OFL, served by their CDN.
//   curl "https://api.fontshare.com/v2/fonts?limit=100&page=1" > fontshare.json   (repeat while has_more)
//   node scripts/build-fontshare.mjs fontshare-all.json
import fs from 'node:fs';
const all = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const google = new Set(JSON.parse(fs.readFileSync('src/data/font-catalog.json', 'utf8')).map((r) => r[0]));

// Creative styles for Fontshare's exclusives (curated by eye)
const STYLE = {
  Luxury: 'Boska|Gambetta|Zodiak|Sentient|Erode|Melodrama|Stardom|Gambarino|Bespoke Serif|Recia|Rosaline|Author|Telma|Quilon|Britney',
  Fashion: 'Clash Display|Melodrama|Stardom|Boska|Zodiak|Britney|Gambarino|Tanker|Bonny',
  Editorial: 'Gambetta|Sentient|Erode|Zodiak|Boska|Author|Recia|Bespoke Serif|Literata|Rosaline',
  Modern: 'Clash Display|Clash Grotesk|Cabinet Grotesk|Satoshi|General Sans|Switzer|Chillax|Supreme|Synonym|Bespoke Sans|Plein|Aktura|Array|Excon',
  Minimalist: 'Satoshi|General Sans|Switzer|Supreme|Synonym|Plein|Bespoke Sans|Ranade|Pally',
  Bold: 'Clash Display|Cabinet Grotesk|Tanker|Panchang|Chubbo|Bonny|Boxing|Expose|Striper|Kola',
  Condensed: 'Tanker|Boxing|Expose|Striper',
  Futuristic: 'Panchang|Technor|Array|Aktura|Segment|RX100|Nippo|Excon',
  Retro: 'Bonny|Chubbo|Comico|Gambarino|Kola|Alpino|Paquito|Roundo|Styro',
  Display: 'Kihim|Bevellier|New Title|Hoover|Neco',
  Script: 'Pencerio|Zina',
  Handwritten: 'Sharpie|Comico',
  Western: 'Trench Slab|Bespoke Slab',
  Graffiti: 'Sharpie|Striper',
  Gothic: 'Bevellier',
};
const out = [];
for (const f of all) {
  if (google.has(f.name)) continue; // already in the Google catalogue
  if (!['itf_ffl', 'sil_ofl'].includes(f.license_type)) continue;
  const tags = new Set();
  for (const c of f.category.split(',').map((s) => s.trim()).filter(Boolean)) {
    tags.add({ Sans: 'Sans serif', Serif: 'Serif', Display: 'Display', Script: 'Script', Handwritten: 'Handwritten', Slab: 'Serif', Blackletter: 'Blackletter' }[c] ?? c);
  }
  for (const [tag, names] of Object.entries(STYLE)) if (names.split('|').includes(f.name)) tags.add(tag);
  const normal = f.styles.filter((s) => !s.is_italic && !s.is_variable).map((s) => s.weight.number);
  const weights = [...new Set(normal)].sort((a, b) => a - b);
  if (!weights.length) continue;
  out.push([f.name, f.slug, [...tags].join('|'), weights.join(','), f.license_type]);
}
out.sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync('src/data/fontshare.json', JSON.stringify(out));
console.log(out.length, 'Fontshare families added:', out.map((r) => r[0]).join(', '));
