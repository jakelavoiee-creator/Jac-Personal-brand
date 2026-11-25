// Stage 5 workflow tests: Tapstitch apparel library (live API through Aura's
// relay), garment projects, mockups, print files, try-on, place-on-a-photo
// perspective mockups and AI lifestyle scenes (OpenAI mocked).
//
// The Tapstitch part needs a Tapstitch token: set TAPSTITCH_TOKEN, or run where
// a network proxy injects it for openapi.tapstitch.com (then any placeholder
// works). Without access those checks are skipped with a message.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS || path.join(os.tmpdir(), 'aura-shots');
const TOKEN = process.env.TAPSTITCH_TOKEN || 'proxy-injected';
fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
const ok = (c, m) => (console.log(`${c ? '✔' : '✘'} ${m}`), c || failures++);
const skip = (m) => console.log(`– skipped: ${m}`);

/** PNG width/height from the IHDR chunk */
const pngSize = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
const jpgSize = (buf) => {
  for (let i = 2; i < buf.length; ) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const ev = (fn, a) => page.evaluate(fn, a);
const shot = (n) => page.screenshot({ path: path.join(OUT, `s5-${n}.png`) });
const download = async (trigger, name) => {
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 180000 }), trigger()]);
  const f = path.join(OUT, `s5-${name}-${d.suggestedFilename()}`);
  await d.saveAs(f);
  return f;
};

// OpenAI is mocked (AI lifestyle scene)
const sentOpenAI = [];
await page.route('https://api.openai.com/**', async (route) => {
  const text = (route.request().postDataBuffer() ?? Buffer.alloc(0)).toString('latin1');
  sentOpenAI.push({ url: route.request().url(), text: text.slice(0, 3000), images: (text.match(/name="image(\[\])?"/g) || []).length });
  const png = await page.evaluate(async () => {
    const c = new OffscreenCanvas(1536, 1024);
    const g = c.getContext('2d');
    g.fillStyle = '#c9b48f';
    g.fillRect(0, 0, 1536, 1024);
    const b = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
    let s = '';
    for (const x of b) s += String.fromCharCode(x);
    return btoa(s);
  });
  await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ data: [{ b64_json: png }], output_format: 'png' }) });
});

/* 1. Apparel page without a token explains how to connect */
await page.goto(BASE);
ok((await page.locator('.nav-item:has-text("Apparel")').count()) === 1, 'Apparel is in the dashboard navigation');
await page.click('.nav-item:has-text("Apparel")');
await page.waitForSelector('.connect-card');
ok(/tapstitch\.com\/developers\/tokens/.test(await page.textContent('.connect-card')), 'without a token, Apparel explains how to connect Tapstitch');
await page.goto(BASE + '/#/settings');
ok((await page.locator('label:has-text("Tapstitch API token")').count()) === 1 && (await page.locator('select:has(option:text-is("USA"))').count()) === 1, 'Settings has the Tapstitch token and fulfilment centre');
ok((await page.locator('.rail button:has-text("Mockups") .dot').count()) === 0, 'Mockups is no longer marked “in development”');

/* relay guards */
const relayBad = await ev(async () => (await fetch('/tapstitch/admin')).status);
ok(relayBad === 404, 'relay refuses anything outside /v1/');

/* 2. Live Tapstitch catalogue */
await ev((t) => localStorage.setItem('aura.key.tapstitch', t), TOKEN);
const probe = await ev(async (t) => (await fetch('/tapstitch/v1/catalog/products?limit=1&status=active', { headers: { Authorization: `Bearer ${t}` } })).status, TOKEN);
const live = probe === 200;
if (!live) skip(`Tapstitch API not reachable with this token (HTTP ${probe}) — set TAPSTITCH_TOKEN to run the apparel checks`);

let garmentId = null;
if (live) {
  await page.goto(BASE + '/#/apparel');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('[data-testid="apparel-progress"]') && document.querySelector('[data-testid="apparel-count"]'), null, { timeout: 240000 });
  const total = parseInt(await page.textContent('[data-testid="apparel-count"]'));
  ok(total > 1000, `live Tapstitch catalogue loads (${total} active garments)`);
  await page.click('.chip:text-is("Hoodies")');
  const hoodies = parseInt(await page.textContent('[data-testid="apparel-count"]'));
  ok(hoodies > 20 && hoodies < total, `category filter (${hoodies} hoodies)`);
  await page.click('.chip:text-is("All")');
  await page.fill('[data-testid="apparel-search"]', 'Essential Cotton T-Shirt');
  await page.waitForTimeout(300);
  ok((await page.locator('[data-testid="garment-card"]').count()) >= 1, 'search finds a product');
  await shot('catalogue');

  /* 3. Product sheet with real print areas */
  await page.locator('[data-testid="garment-card"]').first().click();
  await page.waitForSelector('[data-testid="garment-preview"] canvas', { timeout: 60000 });
  ok((await page.locator('.product-sheet .placements div').count()) >= 1, 'product sheet lists real print placements');
  ok((await page.locator('.product-sheet .swatches .sw').count()) >= 2, 'product sheet shows Tapstitch colours');
  const previewInk = await ev(() => { const c = document.querySelector('[data-testid="garment-preview"] canvas'); const d = c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data; return d[3]; });
  ok(previewInk === 255, 'garment preview renders from Tapstitch mockup layers');

  /* 4. Garment project */
  await page.click('[data-testid="design-garment"]');
  await page.waitForFunction(() => window.__aura?.project?.garment, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const gp = await ev(() => { const p = window.__aura.project; return { id: p.id, pages: p.pages.length, areas: p.garment.catalog.print_areas.length, w: p.width, piece: window.__aura.garmentPiece()?.piece, bg: p.pages[0].background }; });
  garmentId = gp.id;
  ok(gp.pages === gp.areas && gp.w === 7000 && gp.piece === 'front' && gp.bg === null, `garment project: one transparent 7000 px page per print area (${gp.pages})`);
  const front = await ev(() => window.__aura.garmentPiece().placements[0].design_area);
  await ev(async (b) => {
    const k = 10;
    await window.__aura.addText({ text: 'AURA', fontFamily: 'Inter', fontWeight: 800, size: 420, fill: '#e8d6a8' }, { x: (b.left + b.width / 2) * k, y: (b.top + b.height / 2) * k });
  }, front);
  await page.waitForTimeout(800);
  await page.click('.rail button:has-text("Mockups")');
  await page.waitForSelector('[data-testid="mockup-main"] img', { timeout: 60000 });
  ok((await page.locator('.mk-pieces button').count()) === gp.pages, 'mockups panel shows every garment piece');
  await page.locator('[data-testid="garment-color"]').nth(1).click();
  await page.waitForTimeout(600);
  const colorId = await ev(() => window.__aura.project.garment.colorId);
  ok(colorId === (await ev(() => window.__aura.project.garment.catalog.colors[1].id)), 'colour change applies to the garment');
  await shot('garment-editor');

  /* 5. Mockups + print files */
  const zip = await download(() => page.click('[data-testid="download-all"]'), 'garment');
  const list = execFileSync('unzip', ['-Z1', zip]).toString().trim().split('\n');
  const prints = list.filter((f) => f.startsWith('print-files/'));
  const mockups = list.filter((f) => f.startsWith('mockups/'));
  ok(mockups.length === gp.pages && prints.length === 1, `ZIP has ${mockups.length} mockups and ${prints.length} print file (empty placements skipped)`);
  const pf = pngSize(execFileSync('unzip', ['-p', zip, prints[0]]));
  ok(pf.w === Math.round(front.width * 10) && pf.h === Math.round(front.height * 10), `print file is the placement at 10× (${pf.w}×${pf.h})`);
  const mk = pngSize(execFileSync('unzip', ['-p', zip, mockups[0]]));
  ok(mk.w === 2000 && mk.h === 2000, 'mockups export at 2000 px');

  /* 6. Persistence */
  await page.waitForTimeout(1200);
  await page.reload();
  await page.waitForFunction(() => window.__aura?.project?.garment, null, { timeout: 30000 });
  ok((await ev(() => window.__aura.project.garment.colorId)) === colorId && (await ev(() => window.__aura.objects().length)) === 1, 'garment project, colour and artwork survive reload');

  /* 7. Try a normal design on a garment */
  await page.goto(BASE);
  await page.click('button.format:has-text("Instagram Post")');
  await page.waitForFunction(() => window.__aura?.project && !window.__aura.project.garment, null, { timeout: 15000 });
  await ev(async () => { const e = window.__aura; e.setBackground('#14213d'); await e.addText({ text: 'NIGHT SHIFT', fontFamily: 'Inter', fontWeight: 800, size: 120, fill: '#f4d35e' }); });
  await page.click('.rail button:has-text("Mockups")');
  await page.fill('[data-testid="tryon-search"]', 'hoodie');
  await page.waitForSelector('[data-testid="tryon-product"]', { timeout: 120000 });
  await page.locator('[data-testid="tryon-product"]').first().click();
  await page.waitForSelector('[data-testid="tryon-preview"] img', { timeout: 60000 });
  ok(true, 'try-on previews the design on a Tapstitch garment');
  await page.click('[data-testid="tryon-to-garment"]');
  await page.waitForFunction(() => window.__aura?.project?.garment && window.__aura.objects().length >= 0, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const conv = await ev(() => window.__aura.project.pages.map((p) => p.objects.length));
  ok(conv.some((n) => n === 1), 'try-on becomes a garment design with the artwork in the chosen print area');
}

/* 8. Place on a photo (perspective mockup) */
await page.goto(BASE);
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project, null, { timeout: 15000 });
await ev(async () => { const e = window.__aura; e.setBackground('#14213d'); await e.addText({ text: 'MORNING', fontFamily: 'Inter', fontWeight: 800, size: 160, fill: '#f4d35e' }); });
const scene = path.join(OUT, 's5-scene.jpg');
const sceneB64 = await ev(async () => {
  const c = new OffscreenCanvas(1600, 1100);
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 1600, 0);
  gr.addColorStop(0, '#968c84');
  gr.addColorStop(1, '#d2cac0');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1600, 1100);
  g.fillStyle = '#ece8e0';
  g.beginPath();
  [[520, 230], [1180, 300], [1150, 880], [480, 820]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.fill();
  const b = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 })).arrayBuffer());
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
});
fs.writeFileSync(scene, Buffer.from(sceneB64, 'base64'));
await page.click('.rail button:has-text("Mockups")');
await page.click('[data-testid="open-perspective"]');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="persp-upload"]')]);
await fc.setFiles(scene);
await page.waitForSelector('[data-testid="persp-h0"]', { timeout: 30000 });
await page.waitForTimeout(500);
const target = [[520, 230], [1180, 300], [1150, 880], [480, 820]];
const box = await page.locator('[data-testid="persp-canvas"]').boundingBox();
const k = box.width / 1600;
for (let i = 0; i < 4; i++) {
  const h = await page.locator(`[data-testid="persp-h${i}"]`).boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + target[i][0] * k, box.y + target[i][1] * k, { steps: 5 });
  await page.mouse.up();
}
await page.waitForTimeout(600);
await shot('perspective');
const persp = await download(() => page.click('[data-testid="persp-download"]'), 'persp');
const pbuf = fs.readFileSync(persp);
const psz = jpgSize(pbuf);
ok(psz && psz.w === 1600 && psz.h === 1100, `perspective mockup exports at the photo's full size (${psz?.w}×${psz?.h})`);
// pixel checks on the export: inside the quad is the artwork (navy), outside is the photo
const px = await ev(async (b64) => {
  const bm = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob());
  const c = new OffscreenCanvas(bm.width, bm.height);
  const g = c.getContext('2d');
  g.drawImage(bm, 0, 0);
  const at = (x, y) => [...g.getImageData(x, y, 1, 1).data.slice(0, 3)];
  return { inside: at(820, 700), outside: at(200, 900), corner: at(530, 245) };
}, pbuf.toString('base64'));
ok(px.inside[2] > px.inside[0] + 15 && px.inside[0] < 90, `artwork is warped into the surface (rgb ${px.inside})`);
ok(px.outside[0] > 120, 'the rest of the photo is untouched');

/* 9. AI lifestyle scene (mocked OpenAI) */
await ev(() => localStorage.setItem('aura.key.openai', 'sk-test'));
await page.click('.modal.studio .icon-btn[aria-label="Close"]');
await page.click('[data-testid="open-perspective"]');
await page.locator('[data-testid="persp-photo"]').first().click();
await page.waitForSelector('[data-testid="persp-h0"]');
await page.fill('[data-testid="scene-prompt"]', 'on a marble café table');
await page.click('[data-testid="scene-run"]');
await page.waitForSelector('[data-testid="scene-result"]', { timeout: 30000 });
const sreq = sentOpenAI.at(-1);
ok(sreq.url.endsWith('/v1/images/edits') && sreq.images === 1 && /marble café table/.test(sreq.text), 'AI scene sends the composed mockup + prompt to OpenAI');
await page.locator('[data-testid="scene-result"]').first().click();
await page.waitForTimeout(800);
ok((await ev(() => window.__aura.objects().filter((o) => o.type === 'image').length)) >= 1, 'AI scene can be added to the design');

ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
