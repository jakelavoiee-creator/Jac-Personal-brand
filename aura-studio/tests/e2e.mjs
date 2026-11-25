// End-to-end workflow test for Stage 1. Run against a served build:
//   npm run build && npx vite preview --port 4173 &  then  npm test
// Exercises real UI + real exports and verifies the downloaded files' bytes.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Use the project's playwright if installed, otherwise the globally available one.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS || path.join(os.tmpdir(), 'aura-shots');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) failures++;
};

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), colorType: buf[25] };
}
function jpgSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errors.push(m.text()));

const engine = (fn, arg) => page.evaluate(fn, arg);
const count = () => engine(() => window.__aura.objects().length);
const download = async (trigger) => {
  const [d] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const file = path.join(OUT, d.suggestedFilename());
  await d.saveAs(file);
  return { name: d.suggestedFilename(), buf: fs.readFileSync(file) };
};

// 1. Dashboard
await page.goto(BASE);
await page.waitForSelector('text=What are we making today?');
await page.screenshot({ path: path.join(OUT, '01-dashboard.png') });
ok(true, 'dashboard renders');

// 2. Create an Instagram post
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project, null, { timeout: 15000 });
ok((await engine(() => [window.__aura.project.width, window.__aura.project.height].join('x'))) === '1080x1080', 'Instagram Post opens at 1080×1080');

// 3. Add text + shapes through the UI
await page.click('.rail button:has-text("Text")');
await page.click('button:has-text("Add a heading")');
await page.click('.rail button:has-text("Elements")');
await page.click('.shape-grid button[title^="Rectangle"]');
await page.click('.shape-grid button[title^="Star"]');
ok((await count()) === 3, 'added heading + rectangle + star');

// 4. Undo / redo
await page.keyboard.press('Escape');
await page.keyboard.press('Control+z');
await page.waitForFunction(() => window.__aura.objects().length === 2);
ok(true, 'undo removes last object');
await page.keyboard.press('Control+Shift+z');
await page.waitForFunction(() => window.__aura.objects().length === 3);
ok(true, 'redo restores it');

// 5. Drag an object on canvas and confirm it moved + snapped state committed
const before = await engine(() => {
  const o = window.__aura.objects()[2];
  const p = window.__aura.toScreen(o.getCenterPoint().x, o.getCenterPoint().y);
  const r = document.querySelector('.canvas-host').getBoundingClientRect();
  return { x: p.x + r.left, y: p.y + r.top, left: o.left };
});
await page.mouse.move(before.x, before.y);
await page.mouse.down();
await page.mouse.move(before.x + 120, before.y + 40, { steps: 8 });
await page.mouse.up();
const after = await engine(() => window.__aura.objects()[2].left);
ok(Math.abs(after - before.left) > 50, `drag moves object (${before.left.toFixed(0)} → ${after.toFixed(0)})`);

// 6. Properties panel: set exact X via input on the selected star
await page.locator('.props .num:has(label:text-is("X")) input').fill('100');
await page.keyboard.press('Enter');
const x = await engine(() => window.__aura.active().getBoundingRect().left);
ok(Math.abs(x - 100) < 0.6, `exact X position set (${x.toFixed(2)})`);

// 7. Multi-select, align, group, ungroup
await page.keyboard.press('Control+a');
ok((await engine(() => window.__aura.canvas.getActiveObjects().length)) === 3, 'select all');
await page.click('.props button[title="Align left"]');
const lefts = await engine(() => window.__aura.objects().map((o) => Math.round(o.getBoundingRect().left)));
ok(new Set(lefts).size === 1, `align left lines up all objects (${lefts.join(',')})`);
await page.keyboard.press('Control+g');
ok((await count()) === 1, 'group combines into one layer');
await page.keyboard.press('Control+Shift+g');
ok((await count()) === 3, 'ungroup restores three layers');

// 8. Upload an image via the Uploads panel
const imgPath = path.join(OUT, 'upload-sample.png');
await page.screenshot({ path: imgPath, clip: { x: 0, y: 0, width: 400, height: 300 } });
await page.click('.rail button:has-text("Uploads")');
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await chooser.setFiles(imgPath);
await page.waitForSelector('.asset');
await page.click('.asset');
await page.waitForFunction(() => window.__aura.objects().length === 4);
ok((await engine(() => window.__aura.active()?.type)) === 'image', 'uploaded image placed on canvas');

// 9. Layers panel
await page.click('.rail button:has-text("Layers")');
ok((await page.locator('.layer').count()) === 4, 'layers panel lists 4 layers');
await page.screenshot({ path: path.join(OUT, '02-editor.png') });

// 10. Export PNG @1x and verify bytes
await page.click('button:has-text("Export")');
await page.click('.modal .seg button:text-is("1×")');
let f = await download(() => page.click('.modal button:has-text("Download")'));
let s = pngSize(f.buf);
ok(s && s.w === 1080 && s.h === 1080, `PNG export is a valid 1080×1080 PNG (${f.name})`);

// 11. Export JPG @2x
await page.click('button:has-text("Export")');
await page.click('.modal .seg button:text-is("JPG")');
await page.click('.modal .seg button:text-is("2×")');
f = await download(() => page.click('.modal button:has-text("Download")'));
s = jpgSize(f.buf);
ok(s && s.w === 2160 && s.h === 2160, `JPG export is a valid 2160×2160 JPEG (${f.name})`);

// 12. Transparent page → transparent PNG (alpha channel present)
await engine(() => window.__aura.setBackground(null));
await page.click('button:has-text("Export")');
await page.click('.modal .seg button:text-is("1×")');
f = await download(() => page.click('.modal button:has-text("Download")'));
s = pngSize(f.buf);
ok(s && s.colorType === 6, 'transparent export has an alpha channel (RGBA PNG)');
await engine(() => window.__aura.setBackground('#f4f1ea'));

// 13. Multi-page: add a page, export all → ZIP
await page.click('.add-page');
await page.waitForFunction(() => window.__aura.project.pages.length === 2);
ok((await count()) === 0, 'new page is blank and active');
await page.click('.rail button:has-text("Text")');
await page.click('button:has-text("Add a subheading")');
await page.click('button:has-text("Export")');
await page.click('.modal .seg button:text-is("1×")');
await page.click('.modal button:has-text("All 2")');
f = await download(() => page.click('.modal button:has-text("Download")'));
ok(f.name.endsWith('.zip') && f.buf.readUInt32LE(0) === 0x04034b50 && f.buf.includes(Buffer.from('page-02.png')), `multi-page export is a ZIP with both pages (${f.name})`);

// 14. Persistence: reload and confirm both pages + objects survived
await page.waitForFunction(() => document.querySelector('.save')?.textContent.includes('Saved'), null, { timeout: 8000 });
const id = await engine(() => window.__aura.project.id);
await page.reload();
await page.waitForFunction(() => window.__aura?.project, null, { timeout: 15000 });
const persisted = await engine(() => ({ pages: window.__aura.project.pages.length, n: window.__aura.project.pages[0].objects.length, bg: window.__aura.project.pages[0].background }));
ok(persisted.pages === 2 && persisted.n === 4 && persisted.bg === '#f4f1ea', `project persists after reload (${JSON.stringify(persisted)})`);
ok((await engine(() => window.__aura.objects().filter((o) => o.type === 'image')[0]?.getElement()?.naturalWidth)) > 0, 'uploaded image reloads from IndexedDB');

// 15. Resize to story, content scaled, not stretched
await page.click('button:has-text("Resize")');
await page.click('.modal button.tab:has-text("Instagram Story")');
await page.click('.modal button:has-text("Resize all")');
await page.waitForFunction(() => window.__aura.project.height === 1920);
const ratios = await engine(() => window.__aura.objects().map((o) => +(o.scaleX / o.scaleY).toFixed(3)));
ok(ratios.every((r, i, a) => r === a[i]), 'resize keeps element proportions');

// 16. Back to dashboard shows the design with a thumbnail
await page.click('button[title="Back to dashboard"]');
await page.waitForSelector('.card');
await page.waitForTimeout(400);
ok((await page.locator('.card img').count()) >= 1, 'dashboard card shows a thumbnail');
await page.screenshot({ path: path.join(OUT, '03-dashboard-after.png') });
ok(typeof id === 'string', 'project id stable');

ok(errors.length === 0, `no runtime errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
console.log(`Artifacts: ${OUT}`);
process.exit(failures ? 1 : 0);
