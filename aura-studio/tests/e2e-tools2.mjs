// Creative tools + bug-fix regression: FX Lab (looks, surprise, stack, levels/
// curves, persistence, export), turn into image, merge visible, brush studio
// (brushes, symmetry, eraser, undo, hidden internal assets), garment
// duplicate / resize guards, Escape on studio dialogs.
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

/** pixel of the current page rendered at 1× (document coordinates) */
const pagePixel = (x, y) =>
  ev(
    async ([x, y]) => {
      const e = window.__aura;
      const c = await e.pageCanvas(e.pageIndex, 1);
      return [...c.getContext('2d').getImageData(x, y, 1, 1).data];
    },
    [x, y],
  );

await page.goto(BASE);
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project, null, { timeout: 15000 });

/* 1. FX Lab on an image */
const photo = await ev(async () => {
  const c = new OffscreenCanvas(600, 600);
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 600, 600);
  gr.addColorStop(0, '#2d6cdf');
  gr.addColorStop(1, '#ffcf3a');
  g.fillStyle = gr;
  g.fillRect(0, 0, 600, 600);
  g.fillStyle = '#e8424f';
  g.beginPath();
  g.arc(300, 300, 160, 0, 7);
  g.fill();
  const b = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
});
const photoFile = path.join(OUT, 't2-photo.png');
fs.writeFileSync(photoFile, Buffer.from(photo, 'base64'));
await page.click('.rail button:has-text("Uploads")');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc.setFiles(photoFile);
await page.waitForTimeout(800);
await ev(async () => {
  const q = await new Promise((res) => { const r = indexedDB.open('aura-studio'); r.onsuccess = () => { const t = r.result.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => (res(t.result), r.result.close()); }; });
  await window.__aura.addAsset(q[0], { x: 540, y: 540 });
});
await page.waitForSelector('[data-testid="fx-look"] img', { timeout: 20000 });
ok((await page.locator('[data-testid="fx-look"]').count()) === 14, 'FX Lab shows 14 looks with live previews');
const before = await pagePixel(540, 540);
await page.locator('[data-testid="fx-look"]', { hasText: 'Game Boy' }).click();
await page.waitForTimeout(800);
const after = await pagePixel(540, 540);
ok(JSON.stringify(before) !== JSON.stringify(after), `a look changes the rendered pixels (${before.slice(0, 3)} → ${after.slice(0, 3)})`);
const gb = await ev(() => window.__aura.fxStackOf(window.__aura.active()).map((f) => f.effect).join(','));
ok(gb === 'dither', 'Game Boy look = dither stack');
await page.click('[data-testid="fx-surprise"]');
await page.waitForTimeout(600);
const rnd = await ev(() => window.__aura.fxStackOf(window.__aura.active()).length);
ok(rnd >= 2 && (await page.locator('[data-testid="fx-item"]').count()) === rnd, `Surprise me builds an editable stack (${rnd} effects)`);
await page.click('[data-testid="fx-clear"]');
await page.selectOption('[data-testid="fx-add"]', 'curves');
await page.waitForSelector('[data-testid="curve-editor"]');
const pt = await page.locator('[data-testid="curve-pt-2"]').boundingBox();
await page.mouse.move(pt.x + pt.width / 2, pt.y + pt.height / 2);
await page.mouse.down();
await page.mouse.move(pt.x + pt.width / 2, pt.y - 40, { steps: 4 });
await page.mouse.up();
await page.waitForTimeout(400);
const curve = await ev(() => window.__aura.fxStackOf(window.__aura.active())[0].curve);
ok(curve[2] > 0.6, `dragging the curve brightens midtones (mid → ${curve[2]})`);
await page.selectOption('[data-testid="fx-add"]', 'kaleido');
await page.waitForTimeout(500);
ok((await ev(() => window.__aura.fxStackOf(window.__aura.active()).map((f) => f.effect).join(','))) === 'curves,kaleido', 'effects stack in order');
// adjustments must not wipe FX
await ev(() => { const e = window.__aura, i = e.active(); const st = e.photoState(i); e.setPhoto(i, { ...st, adjust: { ...st.adjust, exposure: 0.3 } }); });
ok((await ev(() => window.__aura.fxStackOf(window.__aura.active()).length)) === 2, 'photo adjustments keep the FX stack');
await page.waitForTimeout(1200);
await page.reload();
await page.waitForFunction(() => window.__aura?.objects().length, null, { timeout: 20000 });
await page.waitForTimeout(800);
const reloaded = await ev(() => window.__aura.objects()[0].filters.map((f) => f.type + (f.effect ? ':' + f.effect : '')).join(','));
ok(reloaded === 'AuraAdjust,AuraFX:curves,AuraFX:kaleido', `FX survive reload (${reloaded})`);

/* 2. Turn into image + merge visible */
await ev(async () => { await window.__aura.addText({ text: 'WILD', fontFamily: 'Inter', fontWeight: 900, size: 200, fill: '#ff2bd6' }, { x: 540, y: 200 }); });
await page.waitForTimeout(600);
await page.click('[data-testid="rasterize"]');
await page.waitForTimeout(1200);
const layers = await ev(() => window.__aura.objects().map((o) => ({ t: o.type, v: o.visible, n: o.name })));
ok(layers.at(-1).t === 'image' && layers.at(-2).t === 'textbox' && layers.at(-2).v === false, 'turn into image keeps the original text hidden underneath');
ok((await page.locator('[data-testid="fx-look"]').count()) === 14, 'the new image layer gets FX Lab');
await ev(() => window.__aura.deselect());
await page.waitForTimeout(300);
await page.click('[data-testid="stamp-visible"]');
await page.waitForTimeout(1500);
const stamp = await ev(() => { const o = window.__aura.objects().at(-1); return { n: o.name, w: Math.round(o.getScaledWidth()) }; });
ok(stamp.n === 'Merged (stamp)' && stamp.w === 1080, 'merge visible creates one full-page image layer');

/* 3. Brush studio */
await page.click('button.icon-btn[aria-label="Back to dashboard"], .topbar .icon-btn').catch(() => {});
await page.goto(BASE);
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project && window.__aura.objects().length === 0, null, { timeout: 15000 });
await page.click('.rail button:has-text("Brush")');
await page.waitForTimeout(300);
ok((await ev(() => window.__aura.canvas.skipTargetFind)) === true && (await page.locator('.brush-grid button').count()) === 12, 'Brush panel picks up the brush (12 brushes)');
const host = await ev(() => { const r = document.querySelector('.canvas-host').getBoundingClientRect(); const a = window.__aura.toScreen(0, 0), z = window.__aura.toScreen(1080, 1080); return { x0: a.x + r.left, y0: a.y + r.top, k: (z.x - a.x) / 1080 }; });
const at = (x, y) => [host.x0 + x * host.k, host.y0 + y * host.k];
const stroke = async (pts) => {
  await page.mouse.move(...at(...pts[0]));
  await page.mouse.down();
  for (const q of pts.slice(1)) await page.mouse.move(...at(...q), { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
};
await page.click('[data-testid="brush-round"]');
await ev(() => window.__aura.setBrushStyle({ size: 40, color: '#ff0000', hardness: 1, symmetry: 'x' }));
await stroke([[200, 300], [300, 300]]);
const left = await pagePixel(250, 300);
const mirrored = await pagePixel(830, 300);
ok(left[0] > 200 && left[3] > 200 && mirrored[0] > 200 && mirrored[3] > 200, 'mirror symmetry paints both halves');
const paintLayer = await ev(() => { const o = window.__aura.objects()[0]; return { paint: o.paintLayer, asset: o.assetId }; });
ok(paintLayer.paint === true && !!paintLayer.asset, 'the first stroke creates a paint layer saved as an asset');
await ev(() => window.__aura.setBrushStyle({ symmetry: 'radial', radial: 6, color: '#00ff00' }));
await stroke([[540, 340], [540, 300]]);
const radial = await pagePixel(540 + Math.round(220 * Math.sin(Math.PI / 3)), 540 - Math.round(220 * Math.cos(Math.PI / 3)));
ok(radial[1] > 200 && radial[3] > 200, 'radial (mandala) symmetry repeats the stroke around the centre');
await page.click('[data-testid="brush-eraser"]');
await ev(() => window.__aura.setBrushStyle({ size: 60, symmetry: 'none', hardness: 1 }));
await stroke([[230, 300], [270, 300]]);
const erased = await pagePixel(250, 300);
ok(erased[3] === 0 || (erased[0] === 255 && erased[1] === 255 && erased[2] === 255), 'eraser removes paint');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await ev(() => window.__aura.undo());
await page.waitForTimeout(800);
const restored = await pagePixel(250, 300);
ok(restored[0] > 200 && restored[1] < 60, 'undo brings the erased stroke back');
const hidden = await ev(async () => {
  const all = await new Promise((res) => { const r = indexedDB.open('aura-studio'); r.onsuccess = () => { const t = r.result.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => (res(t.result), r.result.close()); }; });
  return { internal: all.filter((a) => a.internal).length };
});
await page.click('.rail button:has-text("Uploads")');
await page.waitForTimeout(500);
const titles = await page.locator('.asset-grid .asset').evaluateAll((els) => els.map((e) => e.getAttribute('title') || ''));
ok(hidden.internal >= 3 && !titles.some((t) => t.startsWith('Paint')), `paint snapshots are internal and hidden from Uploads (${hidden.internal} hidden, ${titles.length} real uploads shown)`);
await page.waitForTimeout(1200);
await page.reload();
await page.waitForFunction(() => window.__aura?.objects().length, null, { timeout: 20000 });
await page.waitForTimeout(800);
const persisted = await pagePixel(830, 300);
ok((await ev(() => window.__aura.objects()[0].paintLayer)) === true && persisted[0] > 200, 'paint layer survives reload');

/* 4. Garment project guards (no Tapstitch call needed) */
const g = await ev(async () => {
  const { createProject, duplicateProject } = await import('/src/lib/projects.ts').catch(() => ({}));
  return !!createProject;
});
if (g) {
  // only possible against the dev server, where source modules are importable
  const res = await ev(async () => {
    const { createProject, duplicateProject } = await import('/src/lib/projects.ts');
    const { putProject } = await import('/src/lib/db.ts');
    const p = await createProject({ title: 'G', width: 7000, height: 7000, pages: 2 });
    p.garment = { provider: 'tapstitch', productId: 'x', styleCode: 'x', title: 'x', technique: 'DTG', colorId: '1', realism: 0.7, catalog: { technique: 'DTG', fulfillment_center: 'international', canvas: { width: 700, height: 700, unit: 'px' }, colors: [], print_areas: [] }, pages: { [p.pages[0].id]: 'front', [p.pages[1].id]: 'back' } };
    await putProject(p);
    const d = await duplicateProject(p.id);
    return d.pages.map((pg) => d.garment.pages[pg.id]).join(',');
  });
  ok(res === 'front,back', 'duplicating a garment project keeps every page linked to its garment piece');
}

/* 5. Escape closes studio dialogs */
await page.goto(BASE);
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project);
await page.click('.rail button:has-text("Uploads")');
const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc2.setFiles(photoFile);
await page.waitForTimeout(800);
await ev(async () => {
  const q = await new Promise((res) => { const r = indexedDB.open('aura-studio'); r.onsuccess = () => { const t = r.result.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => (res(t.result.filter((a) => !a.internal)), r.result.close()); }; });
  await window.__aura.addAsset(q[0]);
});
await page.click('[data-testid="magic-erase"]');
await page.waitForSelector('.modal.studio');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
ok((await page.locator('.modal.studio').count()) === 0, 'Escape closes the studio dialogs');

ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
