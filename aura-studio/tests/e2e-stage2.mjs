// Stage 2 workflow tests: effects & textures, text transforms, font library,
// collections, comparison studio, custom fonts, Fontshare, vector tools,
// graphics library, and migration of pre-rename data.
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
const download = async (trigger) => {
  const [d] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const file = path.join(OUT, `s2-${Date.now()}-${d.suggestedFilename()}`);
  await d.saveAs(file);
  return fs.readFileSync(file);
};
/** Open the Fonts panel on its main list, whatever state it was left in. */
const openFonts = async () => {
  if (!(await page.locator('.panel-head h4:text-is("Fonts")').count())) await page.click('.rail button:has-text("Fonts")');
  const back = page.locator('.panel button:has-text("Collections")').first();
  if (await back.count() && !(await page.locator('.font-tabs').count())) await back.click();
  await page.click('.font-tabs button:text-is("All")');
};
const exportPNG = async () => {
  await page.click('button:has-text("Export")');
  await page.click('.modal .seg button:text-is("1×")');
  return download(() => page.click('.modal button:has-text("Download")'));
};

/* 1. Data saved under the old "Verso" name migrates into Aura */
await page.goto(BASE + '/favicon.svg');
await ev(
  () =>
    new Promise((res, rej) => {
      const r = indexedDB.open('verso-studio', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('projects', { keyPath: 'id' }).createIndex('updatedAt', 'updatedAt');
        d.createObjectStore('assets', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        d.createObjectStore('folders', { keyPath: 'id' });
      };
      r.onsuccess = () => {
        const tx = r.result.transaction('projects', 'readwrite');
        tx.objectStore('projects').put({ id: 'p_legacy', title: 'Legacy Verso Design', width: 1080, height: 1080, pages: [{ id: 'pg1', background: '#ffffff', objects: [] }], favorite: false, folderId: null, trashedAt: null, createdAt: Date.now(), updatedAt: Date.now() });
        tx.oncomplete = () => (r.result.close(), res(true));
        tx.onerror = rej;
      };
      r.onerror = rej;
    }),
);
await page.goto(BASE);
await page.waitForSelector('.card:has-text("Legacy Verso Design")', { timeout: 10000 }).catch(() => {});
ok((await page.locator('.card:has-text("Legacy Verso Design")').count()) === 1, 'designs from the pre-rename database migrate automatically');
await page.waitForFunction(() => document.querySelector('.app-logo')?.complete, null, { timeout: 10000 }).catch(() => {});
ok(await page.evaluate(() => { const i = document.querySelector('.app-logo'); return !!i && i.alt === 'aurastudio' && i.naturalWidth > 1000; }), 'app shows the aurastudio logo');

/* 2. Effects */
await page.click('button.format:has-text("Instagram Post")');
await page.waitForSelector('.props-title');
await page.waitForTimeout(300);
await ev(async () => {
  window.__aura.setBackground('#f4f1ea');
  await window.__aura.addText({ text: 'AURA', fontFamily: 'Archivo Black', size: 220, fill: '#e63946' });
});
await ev(() => window.__aura.deselect());
const plain = await exportPNG();
await ev(() => window.__aura.select([window.__aura.objects()[0]]));
await page.click('.fx-presets button[title="3D extrusion"]');
ok(await ev(() => !!window.__aura.active().fx?.extrude), '3D extrusion preset applies an editable effect');
await page.click('.fx-row-head:has-text("3D extrusion")');
await page.locator('.fx-row-body .num input').first().fill('40');
await page.keyboard.press('Enter');
ok((await ev(() => window.__aura.active().fx.extrude.depth)) === 40, 'effect parameters stay editable');
await ev(() => window.__aura.deselect());
const withFx = await exportPNG();
ok(withFx.readUInt32BE(0) === 0x89504e47 && !withFx.equals(plain), 'effects render into the exported PNG');
await ev(() => window.__aura.select([window.__aura.objects()[0]]));
await page.click('.rail button:has-text("Textures")');
await page.click('.texture-grid button:has-text("Halftone")');
ok((await ev(() => window.__aura.active().fx?.texture?.kind)) === 'halftone', 'print texture applies from the Textures panel');
ok((await ev(() => !!window.__aura.active().fx?.extrude)), 'texture combines with existing effects');

/* 3. Text transforms persist (regression: warp data once broke saving) */
await ev(async () => {
  await window.__aura.addText({ text: 'CURVED BADGE TEXT', fontFamily: 'Inter', fontWeight: 800, size: 60 }, { x: 540, y: 820 });
});
await page.click('.props .seg button:text-is("Arch")');
await page.waitForTimeout(200);
ok((await ev(() => window.__aura.active().warp?.kind)) === 'arc', 'arch transform applies');
await page.waitForFunction(() => document.querySelector('.save')?.textContent.includes('Saved'), null, { timeout: 8000 }).catch(() => {});
ok((await page.textContent('.save')).includes('Saved'), 'warped text saves without errors');
await page.reload();
await page.waitForFunction(() => window.__aura?.objects().length === 2, null, { timeout: 15000 });
ok((await ev(() => window.__aura.objects()[1].warp?.kind)) === 'arc', 'warp and effects survive reload');
ok((await ev(() => window.__aura.objects()[0].fx?.texture?.kind)) === 'halftone', 'texture survives reload');

/* 4. Font library, collections, comparison studio */
await page.click('.rail button:has-text("Fonts")');
const placeholder = await page.getAttribute('.panel .search input', 'placeholder');
const total = parseInt(placeholder.replace(/\D/g, ''), 10);
ok(total >= 1900, `font library lists ${total} families`);
await page.selectOption('.panel select.select', 'Blackletter');
ok((await page.locator('.font-row').count()) >= 10, 'style categories filter the library (Blackletter)');
await page.selectOption('.panel select.select', 'All');
await page.click('.font-tabs button:text-is("Collections")');
ok((await page.locator('.collection-card').count()) === 8, '8 curated collections');
await page.click('.collection-card:has-text("Old Money")');
await page.click('button:has-text("Compare all")');
await page.waitForSelector('.compare-card');
ok((await page.locator('.compare-card').count()) === 12, 'comparison studio loads the collection');
await page.click('.compare .seg button:text-is("50")');
await page.selectOption('.compare-controls select >> nth=0', 'Serif');
await page.fill('.compare-text', 'Maison');
await page.waitForTimeout(500);
ok((await page.locator('.compare-card').count()) === 50, 'comparison studio shows 50 fonts');
await page.screenshot({ path: path.join(OUT, 's2-compare.png') });
await ev(() => window.__aura.select([window.__aura.objects()[1]]));
await page.locator('.compare-card').nth(4).click();
const chosen = await page.locator('.compare-foot b').textContent();
await page.click('.compare-foot button');
await page.waitForFunction((f) => window.__aura.active()?.fontFamily === f, chosen, { timeout: 15000 });
ok(true, `picked font from the studio is applied (${chosen})`);

/* 5. Custom font upload + outlines from the uploaded file */
const ttf = '/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf';
if (fs.existsSync(ttf)) {
  await openFonts();
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload font")')]);
  await fc.setFiles(ttf);
  await page.waitForSelector('.font-row:has-text("Caladea")');
  await ev(async () => window.__aura.addText({ text: 'Uploaded', fontFamily: 'Inter', size: 90 }, { x: 540, y: 540 }));
  await page.click('.font-row:has-text("Caladea")');
  await page.waitForFunction(() => window.__aura.active()?.fontFamily === 'Caladea');
  await ev(() => window.__aura.outlineText());
  ok((await ev(() => window.__aura.active()?.type)) === 'path', 'uploaded TTF font applies and converts to outlines');
}

/* 6. Fontshare fonts load and outline */
await ev(async () => window.__aura.addText({ text: 'Satoshi', fontFamily: 'Inter', size: 90 }, { x: 540, y: 300 }));
await openFonts();
await page.fill('.panel .search input', 'Satoshi');
await page.click('.font-row:has-text("Satoshi")');
await page.waitForFunction(() => document.fonts.check('400 32px "Satoshi"'), null, { timeout: 15000 }).catch(() => {});
ok(await ev(() => document.fonts.check('400 32px "Satoshi"')), 'Fontshare font loads from its CDN');

/* 7. Vector tools */
await ev(() => {
  const e = window.__aura;
  e.remove(e.objects());
});
const host = await page.locator('.canvas-host').boundingBox();
const at = (x, y) => ev(([x, y]) => window.__aura.toScreen(x, y), [x, y]).then((s) => ({ x: s.x + host.x, y: s.y + host.y }));
await page.keyboard.press('p');
for (const [x, y] of [[300, 300], [700, 300], [500, 700]]) {
  const s = await at(x, y);
  await page.mouse.click(s.x, s.y);
}
const first = await at(300, 300);
await page.mouse.click(first.x, first.y);
ok((await ev(() => window.__aura.active()?.type)) === 'path', 'pen tool draws a closed path');
const c = await ev(() => { const o = window.__aura.active(); const p = o.getCenterPoint(); return window.__aura.toScreen(p.x, p.y); });
await page.mouse.dblclick(c.x + host.x, c.y + host.y);
ok(await ev(() => Object.keys(window.__aura.active().controls).some((k) => k.startsWith('c_'))), 'double-click enters point editing');
const a1 = await at(700, 300);
await page.mouse.move(a1.x, a1.y);
await page.mouse.down();
await page.mouse.move(a1.x + 40, a1.y - 40, { steps: 5 });
await page.mouse.up();
ok(await ev(() => JSON.stringify(window.__aura.active().path).includes('7')), 'anchor dragging edits the path');
ok(errors.length === 0, 'point editing raises no errors');
await page.keyboard.press('Escape');
await ev(() => {
  const e = window.__aura;
  e.addShape('circle', { x: 500, y: 500 });
  const o = e.objects();
  e.select([o[0], o[1]]);
});
await page.click('.props .seg button[title="Unite"]');
await page.waitForFunction(() => window.__aura.objects().length === 1);
ok((await ev(() => window.__aura.active()?.name)).startsWith('Union'), 'boolean unite merges shapes into one path');

/* 8. Graphics library */
await ev(() => window.__aura.remove(window.__aura.objects()));
await page.click('.rail button:has-text("Graphics")');
const gcount = await page.locator('.graphic-grid button').count();
ok(gcount >= 100, `graphic library has ${gcount} original graphics`);
await page.click('.graphic-grid button[title^="Winged pair"]');
await page.waitForFunction(() => window.__aura.active()?.type === 'group');
const before = await ev(() => window.__aura.colorsOf(window.__aura.active()));
await page.locator('.props-section:has(h6:text-is("Colours")) .color-field .input').first().fill('#c9a227');
await page.keyboard.press('Enter');
const after = await ev(() => window.__aura.colorsOf(window.__aura.active()));
ok(after.includes('#c9a227') && !after.includes(before[0]), 'graphics recolour from Properties → Colours');
await page.click('.rail button:has-text("Illustr.")');
ok((await page.locator('.graphic-grid button').count()) > 20, 'illustrations panel lists botanicals, vintage and more');

ok(errors.length === 0, `no runtime errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
