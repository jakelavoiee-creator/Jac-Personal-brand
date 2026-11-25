// Stage 3 workflow tests: DB upgrade, asset folders, SVG/PDF export, PDF import,
// smart resize copies, brand kits, templates, photo frames, stock photos, Discover.
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
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const ev = (fn, a) => page.evaluate(fn, a);
const allAssets = () =>
  ev(() => new Promise((res) => { const q = indexedDB.open('aura-studio'); q.onsuccess = () => { const t = q.result.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => (res(t.result.map((a) => ({ id: a.id, name: a.name, type: a.type, folderId: a.folderId ?? null, credit: a.credit ?? null, w: a.width }))), q.result.close()); }; }));
const download = async (trigger) => {
  const [d] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const file = path.join(OUT, `s3-${Date.now()}-${d.suggestedFilename()}`);
  await d.saveAs(file);
  return file;
};
const exportAs = async (fmt, setup) => {
  await page.click('button:has-text("Export")');
  await page.click(`.modal .seg button:text-is("${fmt}")`);
  if (setup) await setup();
  return download(() => page.click('.modal button:has-text("Download")'));
};
const openPanel = async (label) => {
  if (!(await page.locator(`.panel-head h4:text-is("${label}")`).count())) await page.click(`.rail button:has-text("${label === 'Illustrations' ? 'Illustr.' : label}")`);
};

/* 1. Existing Stage 2 database (schema v1) upgrades in place without losing data */
await page.goto(BASE + '/favicon.svg');
await ev(
  () =>
    new Promise((res, rej) => {
      const r = indexedDB.open('aura-studio', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('projects', { keyPath: 'id' }).createIndex('updatedAt', 'updatedAt');
        d.createObjectStore('assets', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        d.createObjectStore('folders', { keyPath: 'id' });
      };
      r.onsuccess = () => {
        const tx = r.result.transaction('projects', 'readwrite');
        tx.objectStore('projects').put({ id: 'p_v1', title: 'Stage Two Design', width: 1080, height: 1080, pages: [{ id: 'pg', background: '#fff', objects: [] }], favorite: false, folderId: null, trashedAt: null, createdAt: 1, updatedAt: Date.now() });
        tx.oncomplete = () => (r.result.close(), res(1));
        tx.onerror = rej;
      };
    }),
);
await page.goto(BASE);
await page.waitForSelector('.card:has-text("Stage Two Design")', { timeout: 10000 }).catch(() => {});
ok((await page.locator('.card:has-text("Stage Two Design")').count()) === 1, 'existing designs survive the v2 database upgrade');
ok(await ev(() => new Promise((res) => { const q = indexedDB.open('aura-studio'); q.onsuccess = () => { const s = [...q.result.objectStoreNames]; q.result.close(); res(s.includes('templates') && s.includes('brands')); }; })), 'templates and brand kit stores exist');

/* 2. Templates */
await page.click('.nav-item:has-text("Templates")');
await page.waitForSelector('.tpl-card img');
ok((await page.locator('.tpl-card').count()) === 34, '34 built-in templates in the gallery');
ok((await page.locator('.tabs .tab').count()) >= 13, 'template categories (12 + All)');
await page.click('.tab:text-is("Product Ads")');
await page.click('.tpl-card:has-text("Product Launch")');
await page.waitForFunction(() => window.__aura?.project?.title === 'Product Launch', null, { timeout: 30000 });
await page.waitForTimeout(400);
const layers = await ev(() => window.__aura.objects().map((o) => o.type));
ok(layers.length === 5 && layers.filter((t) => t === 'textbox').length === 3, `template opens as separate editable layers (${layers.join(', ')})`);
await ev(() => { const e = window.__aura; e.select([e.objects().find((o) => o.placeholder)]); });
const photo = path.join(OUT, 's3-photo.png');
await page.screenshot({ path: photo, clip: { x: 500, y: 150, width: 640, height: 420 } });
await openPanel('Uploads');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc.setFiles(photo);
await page.waitForSelector('.asset');
await page.click('.asset');
await page.waitForFunction(() => window.__aura.active()?.type === 'image');
const filled = await ev(() => { const a = window.__aura.active(); return [Math.round(a.getScaledWidth()), Math.round(a.getScaledHeight())]; });
ok(filled[0] === filled[1] && filled[0] > 700, `photo frame fills with a cover crop (${filled.join('×')})`);
await openPanel('Templates');
await page.click('.tpl-panel-item[title^="Swiss Grid Poster"]');
await page.waitForFunction(() => window.__aura.project.pages.length === 2, null, { timeout: 30000 });
ok((await ev(() => window.__aura.objects().length)) === 5, 'templates panel adds a smart-resized page');
page.once('dialog', (d) => d.accept('S3 Saved Template'));
await page.click('button:has-text("Share")');
await page.click('.modal button:has-text("Save as reusable template")');
await page.waitForTimeout(400);

/* 3. Vector export */
await ev(async () => {
  const e = window.__aura;
  await e.gotoPage(0);
  await e.addText({ text: 'ARCHED', fontFamily: 'Inter', fontWeight: 800, size: 60 }, { x: 540, y: 120 });
  await e.setWarp({ kind: 'arc', amount: 30 });
  e.setFx({ outline: { width: 3, color: '#111111' } });
  e.deselect();
});
await page.waitForTimeout(300);
const svgFile = await exportAs('SVG', async () => page.click('.modal .seg button:text-is("Current page")'));
const svg = fs.readFileSync(svgFile, 'utf8');
ok(svg.startsWith('<?xml') || svg.includes('<svg'), 'SVG export produces an SVG document');
ok(!/<text/.test(svg) && (svg.match(/<path/g) || []).length >= 3, 'outlined SVG converts text to vector paths');
ok(!svg.includes('blob:') && svg.includes('data:image'), 'SVG is self-contained (images embedded)');
const liveFile = await exportAs('SVG', async () => { await page.click('.modal .seg button:text-is("Current page")'); await page.click('.modal button:has-text("Live text")'); });
const live = fs.readFileSync(liveFile, 'utf8');
ok(/<text/.test(live) && live.includes('@import'), 'live-text SVG keeps editable text and links its fonts');
const pdfFile = await exportAs('PDF', async () => {
  await page.click('.modal .seg button:text-is("All 2")');
  await page.click('.modal .row:has-text("Bleed") .toggle');
  await page.click('.modal .row:has-text("Crop marks") .toggle');
});
const pdf = fs.readFileSync(pdfFile);
const pdfText = pdf.toString('latin1');
const pages = (pdfText.match(/\/Type\s*\/Page[^s]/g) || []).length;
const box = /MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/.exec(pdfText);
ok(pdf.slice(0, 5).toString() === '%PDF-' && pages === 2, `vector PDF with ${pages} pages`);
ok(box && Math.abs(+box[1] - (810 + 17.007 + 36)) < 1, `PDF page = trim + 3 mm bleed + crop-mark margin (${box?.[1]}pt wide)`);
const rasterFile = await exportAs('PDF', async () => page.click('.modal button:has-text("High-res image")'));
ok(fs.readFileSync(rasterFile).slice(0, 5).toString() === '%PDF-', 'high-res image PDF exports');

/* 4. PDF import renders pages into images */
const before = (await allAssets()).length;
await openPanel('Uploads');
const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc2.setFiles(pdfFile);
await page.waitForFunction((n) => document.querySelectorAll('.asset').length >= n + 2, before, { timeout: 60000 }).catch(() => {});
const afterAssets = await allAssets();
ok(afterAssets.length === before + 2 && afterAssets.filter((a) => a.name.includes('· p')).length === 2, 'PDF import creates one image per page');

/* 5. Smart resize into copies */
await page.click('button:has-text("Resize")');
for (const n of ['Instagram Story', 'YouTube Thumbnail']) await page.click(`.modal button.tab:has-text("${n}")`);
await page.click('.modal button:has-text("Create 2 copies")');
await page.waitForSelector('.modal-head h3:text-is("Resized copies ready")', { timeout: 30000 });
ok((await page.locator('.modal button img').count()) === 2, 'smart resize creates two copies with thumbnails');
ok((await ev(() => [window.__aura.project.width, window.__aura.project.height].join('x'))) === '1080x1350', 'original design is unchanged');
await page.click('.modal button:has-text("Done")');

/* 6. Brand kit */
await page.click('button[title="Back to dashboard"]');
await page.click('.nav-item:has-text("Brand Kits")');
await page.click('button:has-text("New brand")');
await page.fill('.brand-name-input', 'Test Brand');
await page.locator('.brand-color').nth(0).locator('.color-field .input').fill('#123456');
await page.keyboard.press('Tab');
await page.locator('.brand-color').nth(0).locator('.row input').nth(0).fill('200');
ok((await page.locator('.brand-color').nth(0).locator('.color-field .input').inputValue()).toLowerCase() === '#c83456', 'RGB channels edit the HEX value');
await page.locator('.brand-font').nth(0).locator('input.input').fill('Bodoni Moda');
await page.waitForTimeout(300);
await page.click('button:has-text("All brands")');
await page.waitForSelector('.brand-card:has-text("Test Brand")', { timeout: 5000 }).catch(() => {});
ok((await page.locator('.brand-card:has-text("Test Brand")').count()) === 1, 'brand kit saved');
await page.click('.nav-item:has-text("Home")');
await page.click('button.format:has-text("Instagram Post")');
await page.waitForSelector('.props-title');
await ev(async () => {
  await window.__aura.addText({ text: 'Headline', fontFamily: 'Inter', size: 110, fill: '#ff0000' });
  window.__aura.deselect();
});
await openPanel('Brand');
await page.selectOption('.panel select.select', { label: 'Test Brand' });
await page.click('button:has-text("Apply brand fonts to all text")');
await page.waitForFunction(() => window.__aura.objects()[0].fontFamily === 'Bodoni Moda', null, { timeout: 15000 });
await page.click('button:has-text("Apply brand colours")');
ok((await ev(() => window.__aura.objects()[0].fill)) === '#c83456', 'brand fonts and colours apply to the design');

/* 7. Stock photos (API responses served by the test; live APIs are key-gated/rate-limited here) */
const png = fs.readFileSync(photo);
await ctx.route('https://commons.wikimedia.org/**', (r) =>
  r.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ query: { pages: {
      1: { pageid: 1, index: 1, title: 'File:A.jpg', imageinfo: [{ mime: 'image/jpeg', url: 'https://upload.wikimedia.org/a.jpg', thumburl: 'https://upload.wikimedia.org/a-t.jpg', width: 800, height: 600, descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', extmetadata: { LicenseShortName: { value: 'CC BY 4.0' }, Artist: { value: '<b>Ana Ruiz</b>' }, ObjectName: { value: 'Morning light' } } }] },
      2: { pageid: 2, index: 2, title: 'File:B.jpg', imageinfo: [{ mime: 'image/jpeg', url: 'https://upload.wikimedia.org/b.jpg', thumburl: 'https://upload.wikimedia.org/b-t.jpg', width: 8, height: 8, descriptionurl: 'x', extmetadata: { LicenseShortName: { value: 'CC BY-NC-SA 4.0' } } }] },
    } } }),
  }),
);
await ctx.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: png }));
await openPanel('Photos');
await page.click('.panel .seg button:text-is("Wikimedia")');
await page.fill('.panel .search input', 'light');
await page.keyboard.press('Enter');
await page.waitForSelector('.photo img');
ok((await page.locator('.photo').count()) === 1, 'non-commercial licences are filtered out');
await page.click('.photo');
await page.waitForSelector('.credit-box span');
ok((await page.textContent('.credit-box span')).includes('Ana Ruiz · CC BY 4.0'), 'stock photo keeps its attribution');

/* 8. Assets: folders + duplicate */
await page.click('button[title="Back to dashboard"]');
await page.click('.nav-item:has-text("Assets")');
await page.waitForSelector('.card');
page.once('dialog', () => {});
await page.click('button:has-text("New folder")');
await page.fill('.modal input', 'Moodboard');
await page.click('.modal button:has-text("Save")');
await page.locator('.card').first().locator('button[title="Move to folder"]').click();
await page.click('.modal .nav-item:has-text("Moodboard")');
await page.click('.tab:has-text("Moodboard")');
ok((await page.locator('.card').count()) === 1, 'assets move into folders');
await page.locator('.card').first().locator('button[title="Duplicate"]').click();
await page.waitForTimeout(300);
await page.click('.tab:has-text("All uploads")');
ok((await allAssets()).some((a) => a.name.endsWith(' copy')), 'assets duplicate');
await page.click('.tab:has-text("Stock photos")');
ok((await page.locator('.card').count()) >= 1, 'stock photo filter');

/* 9. Templates: saved user template + Discover */
await page.click('.nav-item:has-text("Templates")');
await page.waitForSelector('.tpl-card:has-text("S3 Saved Template")', { timeout: 5000 }).catch(() => {});
ok((await page.locator('.tpl-card:has-text("S3 Saved Template")').count()) === 1, 'saved design appears in My templates');
await page.click('.nav-item:has-text("Discover")');
await page.click('.pairing:has-text("Fashion house")');
await page.waitForFunction(() => window.__aura?.objects().length === 2, null, { timeout: 20000 });
ok((await ev(() => window.__aura.objects().map((o) => o.fontFamily).join('+'))) === 'Bodoni Moda+Satoshi', 'Discover font pairing starts a design');

ok(errors.length === 0, `no runtime errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
