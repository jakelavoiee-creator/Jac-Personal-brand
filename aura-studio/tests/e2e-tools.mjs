// Second workflow pass: text editing, clipboard, context menu, crop, guides,
// SVG vectors, layer reordering, page operations, preview, trash/restore.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS || path.join(os.tmpdir(), 'aura-shots');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
const ok = (c, m) => (console.log(`${c ? '✔' : '✘'} ${m}`), c || failures++);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const ev = (fn, a) => page.evaluate(fn, a);
const count = () => ev(() => window.__aura.objects().length);
const screenOf = (i) =>
  ev((i) => {
    const o = window.__aura.objects()[i];
    const c = o.getCenterPoint();
    const p = window.__aura.toScreen(c.x, c.y);
    const r = document.querySelector('.canvas-host').getBoundingClientRect();
    return { x: p.x + r.left, y: p.y + r.top };
  }, i);

await page.goto(BASE + '/#/home');
await page.click('.tab:has-text("Branding & Apparel")');
await page.click('button.format:has-text("T-Shirt Front Print")');
await page.waitForFunction(() => window.__aura?.project);
const proj = await ev(() => ({ w: window.__aura.project.width, pages: window.__aura.project.pages.length, bg: window.__aura.page.background }));
ok(proj.w === 4500 && proj.pages === 2 && proj.bg === null, 'T-shirt format: 4500px, front+back pages, transparent');

// Text editing by double-click + typing
await page.keyboard.press('t');
await page.waitForFunction(() => window.__aura.objects().length === 1);
let p = await screenOf(0);
await page.mouse.dblclick(p.x, p.y);
await page.keyboard.press('Control+a');
await page.keyboard.type('STREET CULTURE');
await page.mouse.click(5, 300); // click off — exits editing
await page.waitForTimeout(200);
ok((await ev(() => window.__aura.objects()[0].text)) === 'STREET CULTURE', 'double-click edits text in place');
await page.keyboard.press('Control+z');
await page.waitForTimeout(200);
ok((await ev(() => window.__aura.objects()[0].text)) === 'Your text', 'text edit is undoable');
await page.keyboard.press('Control+Shift+z');
await page.waitForTimeout(200);

// Font change via properties
await ev(() => window.__aura.select([window.__aura.objects()[0]]));
await page.click('.props .font-field'); // opens the font library panel
await page.fill('.panel .search input', 'Bebas Neue');
await page.click('.font-row:has-text("Bebas Neue")');
await page.waitForFunction(() => window.__aura.objects()[0].fontFamily === 'Bebas Neue');
ok(true, 'font family changes from the font library');
ok(await ev(() => !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)), 'picking a font returns keyboard focus to the canvas');

// Copy / paste / duplicate / delete
await page.keyboard.press('Control+c');
await page.keyboard.press('Control+v');
await page.waitForFunction(() => window.__aura.objects().length === 2);
ok(true, 'copy + paste creates a copy');
await page.keyboard.press('Control+d');
await page.waitForFunction(() => window.__aura.objects().length === 3);
ok(true, 'duplicate');
await page.keyboard.press('Delete');
await page.waitForFunction(() => window.__aura.objects().length === 2);
ok(true, 'delete key removes selection');

// Context menu
p = await screenOf(1);
await page.mouse.click(p.x, p.y, { button: 'right' });
await page.waitForSelector('.menu');
await page.screenshot({ path: path.join(OUT, '04-context-menu.png') });
await page.click('.menu button:has-text("Lock")');
ok(await ev(() => !!window.__aura.objects()[1].locked), 'context menu → lock');
await page.keyboard.press('Delete');
ok((await count()) === 2, 'locked object cannot be deleted');
await page.keyboard.press('Control+l');
ok(await ev(() => !window.__aura.objects()[1].locked), 'Ctrl+L unlocks');

// Hide / show
await page.keyboard.press('Control+Shift+h');
ok(await ev(() => !window.__aura.objects()[1].visible), 'hide');

// Shapes + layer reorder via drag in Layers panel
await page.keyboard.press('r');
await page.click('.rail button:has-text("Layers")');
const names = () => page.$$eval('.layer .layer-name', (els) => els.map((e) => e.textContent.trim()));
const before = await names();
const rows = page.locator('.layer');
await rows.nth(0).dragTo(rows.nth(2), { targetPosition: { x: 40, y: 30 } });
await page.waitForTimeout(200);
const afterNames = await names();
ok(before[0] !== afterNames[0] && afterNames.includes(before[0]), `layer drag reorders (${before.join(' / ')} → ${afterNames.join(' / ')})`);

// SVG upload → editable vector group
const svg = path.join(OUT, 'badge.svg');
fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#e63946"/><path d="M50 15 L61 40 L88 40 L66 56 L74 82 L50 66 L26 82 L34 56 L12 40 L39 40 Z" fill="#fff"/></svg>');
await page.click('.rail button:has-text("Uploads")');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc.setFiles(svg);
await page.waitForSelector('.asset[title^="badge"]');
await page.click('.asset[title^="badge"]');
await page.waitForTimeout(300);
const svgInfo = await ev(() => { const a = window.__aura.active(); return { type: a.type, n: a.getObjects?.().length }; });
ok(svgInfo.type === 'group' && svgInfo.n === 2, `SVG imports as editable vector group (${JSON.stringify(svgInfo)})`);
await page.keyboard.press('Control+Shift+g');
ok((await ev(() => window.__aura.objects().filter((o) => o.type === 'circle' || o.type === 'path').length)) >= 2, 'SVG ungroups into individual vector shapes');

// Guides from the ruler
const ruler = await page.locator('canvas.ruler.v').boundingBox();
await page.mouse.move(ruler.x + 10, ruler.y + 300);
await page.mouse.down();
await page.mouse.move(ruler.x + 300, ruler.y + 300, { steps: 6 });
await page.mouse.up();
ok((await ev(() => window.__aura.project.guides.v.length)) === 1, 'drag from ruler creates a guide');

// Page operations: duplicate, reorder, delete, background on back page
await page.click('.page-thumb >> nth=1');
await page.waitForFunction(() => window.__aura.pageIndex === 1);
await ev(() => window.__aura.setBackground('#111111'));
await page.hover('.page-thumb >> nth=1');
await page.click('.page-thumb >> nth=1 >> button[title="Duplicate page"]');
await page.waitForFunction(() => window.__aura.project.pages.length === 3);
ok(true, 'duplicate page');
await page.hover('.page-thumb >> nth=2');
await page.click('.page-thumb >> nth=2 >> button[title="Delete page"]');
await page.waitForFunction(() => window.__aura.project.pages.length === 2);
ok(true, 'delete page');
await page.click('.page-thumb >> nth=0');
await page.waitForFunction(() => window.__aura.pageIndex === 0);
ok((await count()) >= 3, 'switching pages keeps page content');

// Crop dialog on an image
const png = path.join(OUT, 'crop-src.png');
await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 600, height: 400 } });
const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc2.setFiles(png);
await page.waitForSelector('.asset[title^="crop-src"]');
await page.click('.asset[title^="crop-src"]');
await page.waitForTimeout(300);
const cBefore = await ev(() => window.__aura.active().getCenterPoint());
await page.click('.props button:has-text("Crop")');
await page.waitForSelector('.crop-box');
await page.click('.modal .tab:has-text("1:1")');
await page.screenshot({ path: path.join(OUT, '05-crop.png') });
await page.click('.modal button:has-text("Apply crop")');
const crop = await ev(() => { const a = window.__aura.active(); return { w: a.width, h: a.height, cx: a.getCenterPoint().x }; });
ok(crop.w === crop.h && crop.w === 400, `crop applies 1:1 using source pixels (${crop.w}×${crop.h})`);
ok(Math.abs(crop.cx - cBefore.x) < 1, 'crop keeps the image centred in place');

// Image adjustments are non-destructive filters
await ev(() => {
  const e = window.__aura, img = e.active();
  const st = e.photoState(img);
  e.setPhoto(img, { ...st, adjust: { ...st.adjust, exposure: 0.2, contrast: 0.1, saturation: -1 }, blur: 0.1 });
});
const adj = await ev(() => { const e = window.__aura, img = e.active(), st = e.photoState(img); return { types: img.filters.map((f) => f.type), exposure: st.adjust.exposure, saturation: st.adjust.saturation, blur: st.blur }; });
ok(adj.types.join(',') === 'AuraAdjust,Blur' && adj.exposure === 0.2 && adj.saturation === -1 && adj.blur === 0.1, `image adjustments apply as non-destructive filters (${adj.types.join(', ')})`);

// Preview overlay
await page.click('button:has-text("Preview")');
await page.waitForSelector('.preview main img', { timeout: 15000 });
await page.screenshot({ path: path.join(OUT, '06-preview.png') });
await page.keyboard.press('Escape');

// Export dialog screenshot (4500px → 2× disabled warning)
await page.click('button:has-text("Export")');
await page.click('.modal .seg button:text-is("4×")');
ok(await page.locator('.modal button:has-text("Download")').isDisabled(), 'oversized export is blocked with a warning (18000px)');
await page.screenshot({ path: path.join(OUT, '07-export.png') });
await page.keyboard.press('Escape');

// Trash & restore from dashboard
await page.waitForTimeout(800);
await page.click('button[title="Back to dashboard"]');
await page.click('.nav-item:has-text("Projects")');
await page.click('.card >> nth=0 >> button[aria-label="Design options"]');
await page.click('.menu button:has-text("Move to trash")');
await page.click('.nav-item:has-text("Trash")');
await page.waitForSelector('.card');
await page.click('.card button[title="Restore"]');
await page.click('.nav-item:has-text("Projects")');
await page.waitForSelector('.card', { timeout: 5000 }).catch(() => {});
ok((await page.locator('.card').count()) >= 1, 'trash → restore');
await page.screenshot({ path: path.join(OUT, '08-projects.png') });

ok(errors.length === 0, `no runtime errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
