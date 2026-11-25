// Stage 4 workflow tests: photo studio, on-device AI (background removal,
// magic eraser, enhance), provider AI (generate, generative fill, expand) and
// the design assistant. Local models run for real (downloaded from Hugging
// Face); OpenAI and Anthropic are mocked at the network layer, and the tests
// check exactly what Aura sends to them.
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

// test photo (public sample from the transformers.js docs dataset), cached locally
const PHOTO = path.join(OUT, 's4-portrait.jpg');
if (!fs.existsSync(PHOTO)) {
  // curl honours proxy settings (Node's fetch does not)
  const { execFileSync } = await import('node:child_process');
  execFileSync('curl', ['-sfL', '-o', PHOTO, 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman_small.jpg']);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const ev = (fn, a) => page.evaluate(fn, a);
const shot = (n) => page.screenshot({ path: path.join(OUT, `s4-${n}.png`) });
const image = () =>
  ev(() => {
    const o = window.__aura.objects().find((x) => x.type === 'image');
    const c = o.getCenterPoint();
    return { asset: o.assetId, orig: o.originalAssetId ?? null, nat: o.getOriginalSize(), w: Math.round(o.getScaledWidth()), h: Math.round(o.getScaledHeight()), cx: Math.round(c.x), cy: Math.round(c.y) };
  });
const selectImage = () => ev(() => window.__aura.select([window.__aura.objects().find((x) => x.type === 'image')]));
const assetPixel = (id, x, y) =>
  ev(
    async ([id, x, y]) => {
      const q = await new Promise((res) => { const r = indexedDB.open('aura-studio'); r.onsuccess = () => { const t = r.result.transaction('assets').objectStore('assets').get(id); t.onsuccess = () => (res(t.result), r.result.close()); }; });
      const bm = await createImageBitmap(q.blob);
      const c = new OffscreenCanvas(bm.width, bm.height);
      const g = c.getContext('2d');
      g.drawImage(bm, 0, 0);
      return [...g.getImageData(Math.round(x * bm.width), Math.round(y * bm.height), 1, 1).data];
    },
    [id, x, y],
  );

/* ---------- mocked providers ---------- */
const sent = { openai: [], anthropic: [] };
let mockColor = [40, 200, 90];
await page.route('https://api.openai.com/**', async (route) => {
  const req = route.request();
  const body = req.postDataBuffer() ?? Buffer.alloc(0);
  const isEdit = req.url().endsWith('/images/edits');
  const text = body.toString('latin1');
  const size = isEdit ? /name="size"\r\n\r\n([^\r]+)/.exec(text)?.[1] : JSON.parse(body.toString()).size;
  const n = isEdit ? +(/name="n"\r\n\r\n(\d+)/.exec(text)?.[1] ?? 1) : JSON.parse(body.toString()).n;
  sent.openai.push({ url: req.url(), auth: req.headers()['authorization'], size, n, text: isEdit ? text.slice(0, 4000) : body.toString(), hasMask: /name="mask"/.test(text), images: (text.match(/name="image(\[\])?"/g) || []).length });
  const [w, h] = (size || '1024x1024').split('x').map(Number);
  const png = await page.evaluate(
    async ([w, h, c]) => {
      const cv = new OffscreenCanvas(w, h);
      const g = cv.getContext('2d');
      g.fillStyle = `rgb(${c.join(',')})`;
      g.fillRect(0, 0, w, h);
      const b = await cv.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await b.arrayBuffer());
      let s = '';
      for (const x of bytes) s += String.fromCharCode(x);
      return btoa(s);
    },
    [w, h, mockColor],
  );
  await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ created: 1, data: Array.from({ length: n || 1 }, () => ({ b64_json: png })), output_format: 'png', usage: { total_tokens: 1 } }) });
});
let assistantReply = null;
await page.route('https://api.anthropic.com/**', async (route) => {
  const req = route.request();
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  const body = JSON.parse(req.postData() || '{}');
  sent.anthropic.push({ headers: req.headers(), body });
  const text = body.output_config?.format ? JSON.stringify(assistantReply) : 'A sunlit ceramic cup on pale travertine, soft morning window light, minimal composition, warm neutral palette.';
  await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }) });
});

/* 1. Cross-origin isolation (multi-threaded on-device AI) + AI Studio page */
await page.goto(BASE);
ok(await ev(() => self.crossOriginIsolated), 'page is cross-origin isolated (multi-threaded WebAssembly for AI models)');
await page.click('.nav-item:has-text("AI Studio")');
await page.waitForSelector('.ai-studio');
ok((await page.locator('.nav-item:has-text("AI Studio") .tag').count()) === 0, 'AI Studio is a real page (no “in development” tag)');
ok((await page.locator('.ai-map-row').count()) === 7 && (await page.locator('.ai-map-row .tag.local').count()) === 3, 'AI Studio maps 3 free on-device tools and 4 paid tools');
ok(await page.locator('[data-testid="ai-generate"]').isDisabled(), 'generation is disabled without an OpenAI key');
ok((await page.locator('.ai-key-note').count()) >= 1, 'missing-key note explains the paid requirement');
await shot('ai-studio-nokey');
await page.click('.nav-item:has-text("Settings")');
ok((await page.locator('input[placeholder="https://…"]').count()) === 0 && !(await page.content()).includes('Replicate'), 'Settings lists only keys that are actually used');
ok(/Available/.test(await page.locator('tr', { hasText: 'Background removal' }).innerText()), 'capability table marks background removal available');

/* set keys */
await ev(() => {
  localStorage.setItem('aura.key.openai', 'sk-test-openai');
  localStorage.setItem('aura.key.anthropic', 'sk-ant-test');
});

/* 2. Editor with a photo */
await page.goto(BASE);
await page.click('button.format:has-text("Instagram Post")');
await page.waitForFunction(() => window.__aura?.project, null, { timeout: 15000 });
await page.click('.rail button:has-text("Uploads")');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('button:has-text("Upload files")')]);
await fc.setFiles(PHOTO);
await page.waitForTimeout(1200);
await ev(async () => {
  const q = await new Promise((res) => { const r = indexedDB.open('aura-studio'); r.onsuccess = () => { const t = r.result.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => (res(t.result), r.result.close()); }; });
  await window.__aura.addAsset(q[0]);
});
await page.waitForTimeout(400);
const start = await image();
ok(start.nat.width === 360, `photo placed (${start.nat.width}×${start.nat.height})`);

/* 3. Background removal — real on-device model */
await selectImage();
await page.click('[data-testid="remove-bg"]');
await page.waitForSelector('.modal.studio');
await page.click('[data-testid="detect"]');
await page.waitForSelector('[data-testid="cutout-busy"]', { state: 'detached', timeout: 300000 });
ok((await page.locator('.modal.studio .err').count()) === 0, 'subject detected on device (ORMBG)');
// refine: erase a stroke, then undo it
const cv = await page.locator('[data-testid="mask-canvas"]').boundingBox();
await page.mouse.move(cv.x + cv.width * 0.3, cv.y + cv.height * 0.5);
await page.mouse.down();
await page.mouse.move(cv.x + cv.width * 0.7, cv.y + cv.height * 0.5, { steps: 8 });
await page.mouse.up();
ok(!(await page.locator('.modal-foot .icon-btn[title^="Undo"]').isDisabled()), 'refine brush stroke recorded in undo history');
await page.keyboard.press('Control+z');
await page.click('.prop-row:has-text("Feather") input[type=range]');
await shot('cutout');
await page.click('[data-testid="apply-cutout"]');
await page.waitForSelector('.modal.studio', { state: 'detached', timeout: 60000 });
const cut = await image();
ok(cut.asset !== start.asset && cut.orig === start.asset, 'cutout is a new asset; the original is kept for restore/refine');
ok(cut.w === start.w && cut.cx === start.cx, 'cutout keeps size and position on the page');
const corner = await assetPixel(cut.asset, 0.03, 0.03);
const face = await assetPixel(cut.asset, 0.5, 0.45);
ok(corner[3] < 30 && face[3] > 220, `background is transparent, subject opaque (corner α=${corner[3]}, face α=${face[3]})`);

/* 4. Restore original, then re-open refine starts from the existing cutout */
await page.click('button:has-text("Restore original")');
await page.waitForTimeout(500);
ok((await image()).asset === start.asset, 'restore original brings back the untouched photo');
await page.keyboard.press('Control+z');
await page.waitForTimeout(500);
ok((await image()).asset === cut.asset, 'undo re-applies the cutout');

/* 5. Magic eraser — quick fill (no download) */
await selectImage();
await page.click('[data-testid="magic-erase"]');
await page.waitForSelector('.modal.studio');
await page.click('[data-mode="quick"]');
const cv2 = await page.locator('[data-testid="mask-canvas"]').boundingBox();
await page.mouse.move(cv2.x + cv2.width * 0.45, cv2.y + cv2.height * 0.62);
await page.mouse.down();
await page.mouse.move(cv2.x + cv2.width * 0.58, cv2.y + cv2.height * 0.62, { steps: 5 });
await page.mouse.up();
await page.waitForFunction(() => document.querySelector('[data-testid="erase-steps"]')?.textContent?.startsWith('1 edit'), null, { timeout: 30000 });
ok(true, 'magic eraser removes on brush release (quick fill)');
await page.click('[data-testid="apply-erase"]');
await page.waitForSelector('.modal.studio', { state: 'detached' });
const erased = await image();
ok(erased.asset !== cut.asset && erased.orig === start.asset, 'erase saves a new asset and keeps the very first original');
const stillTransparent = await assetPixel(erased.asset, 0.03, 0.03);
ok(stillTransparent[3] < 30, 'erasing preserves the cutout transparency');

/* 6. Enhance 2× — real on-device super-resolution on a small crop */
await ev(() => {
  const o = window.__aura.objects().find((x) => x.type === 'image');
  window.__aura.applyCrop(o, { x: 140, y: 150, w: 80, h: 60 });
});
const beforeEnh = await image();
await selectImage();
await page.click('[data-testid="enhance"]');
await page.waitForSelector('.modal.studio');
await page.click('[data-model="fast"]');
await page.click('[data-testid="run-enhance"]');
await page.waitForSelector('[data-testid="enhance-busy"]', { state: 'detached', timeout: 600000 });
ok((await page.locator('.modal.studio .err').count()) === 0, 'enhance ran on device (Swin2SR)');
await shot('enhance');
await page.click('[data-testid="apply-enhance"]');
await page.waitForSelector('.modal.studio', { state: 'detached' });
const enh = await image();
ok(enh.nat.width === beforeEnh.nat.width * 2, `enhanced asset has 2× the pixels (${enh.nat.width}px wide)`);
ok(Math.abs(enh.w - beforeEnh.w) <= 1 && Math.abs(enh.cx - beforeEnh.cx) <= 1, 'enhanced layer keeps its crop, size and position');
await page.click('button:has-text("Restore original")');
await page.waitForTimeout(500);
const restored = await image();
ok(Math.abs(restored.w - beforeEnh.w) <= 1, `restore after enhance keeps the on-page size (${restored.w}px)`);
await ev(() => {
  const o = window.__aura.objects().find((x) => x.type === 'image');
  window.__aura.applyCrop(o, { x: 0, y: 0, w: o.getOriginalSize().width, h: o.getOriginalSize().height });
});

/* 7. Generative fill (mocked OpenAI) */
await page.click('.rail button:has-text("AI Tools")');
await page.click('.ai-panel .seg button:has-text("Image")');
await selectImage();
await page.click('[data-testid="tool-genfill"]');
await page.waitForSelector('.modal.studio');
const cv3 = await page.locator('[data-testid="mask-canvas"]').boundingBox();
await page.mouse.move(cv3.x + cv3.width * 0.15, cv3.y + cv3.height * 0.15);
await page.mouse.down();
await page.mouse.move(cv3.x + cv3.width * 0.25, cv3.y + cv3.height * 0.2, { steps: 5 });
await page.mouse.up();
await page.fill('[data-testid="gen-prompt"]', 'a small green leaf');
await page.click('[data-testid="gen-run"]');
await page.waitForFunction(() => document.querySelector('[data-testid="gen-steps"]')?.textContent?.startsWith('1 edit'), null, { timeout: 30000 });
const fillReq = sent.openai.at(-1);
ok(fillReq.url.endsWith('/v1/images/edits') && fillReq.hasMask && fillReq.images === 1, 'generative fill sends image + mask to /v1/images/edits');
ok(fillReq.auth === 'Bearer sk-test-openai' && /a small green leaf/.test(fillReq.text), 'request carries the user key and prompt');
await page.click('[data-testid="gen-apply"]');
await page.waitForSelector('.modal.studio', { state: 'detached' });
const filled = await image();
const inFill = await assetPixel(filled.asset, 0.19, 0.17);
const outFill = await assetPixel(filled.asset, 0.5, 0.45);
ok(inFill[1] > 150 && inFill[0] < 120, `painted area takes the generated pixels (rgb ${inFill.slice(0, 3)})`);
ok(!(outFill[1] > 150 && outFill[0] < 80), 'pixels outside the painted area are untouched');

/* 8. Expand (mocked OpenAI) */
mockColor = [40, 90, 220];
const preExpand = await image();
await selectImage();
await page.click('[data-testid="tool-expand"]');
await page.waitForSelector('.modal.studio');
await page.click('.modal.studio .chip:text-is("1:1")');
await page.click('[data-testid="gen-run"]');
await page.waitForFunction(() => document.querySelector('[data-testid="gen-steps"]')?.textContent?.startsWith('1 edit'), null, { timeout: 30000 });
await shot('expand');
await page.click('[data-testid="gen-apply"]');
await page.waitForSelector('.modal.studio', { state: 'detached' });
const exp = await image();
ok(Math.abs(exp.nat.width / exp.nat.height - 1) < 0.01 && exp.nat.width > preExpand.nat.width, `expanded to a square frame (${exp.nat.width}×${exp.nat.height})`);
ok(Math.abs(exp.cx - preExpand.cx) <= 1 && Math.abs(exp.cy - preExpand.cy) <= 1, 'original content stays in place on the page');
const edgeExp = await assetPixel(exp.asset, 0.02, 0.5);
ok(edgeExp[2] > 180, 'new margins come from the generated image');

/* 9. Text-to-image (mocked) */
await page.click('.ai-panel .seg button:has-text("Generate")');
await page.fill('[data-testid="ai-prompt"]', 'ceramic cup on travertine');
await page.click('.aigen .chip:has-text("Product shot")');
await page.click('[data-testid="ai-generate"]');
await page.waitForSelector('[data-testid="ai-results"] .result', { timeout: 30000 });
const genReq = sent.openai.at(-1);
const genBody = JSON.parse(genReq.text);
ok(genReq.url.endsWith('/v1/images/generations') && genBody.n === 2 && /studio product photograph/i.test(genBody.prompt), 'generation sends prompt + style, 2 images');
ok((await page.locator('[data-testid="ai-results"] .result').count()) === 2, 'results shown and saved');
const before9 = await ev(() => window.__aura.objects().length);
await page.locator('[data-testid="ai-results"] .result').first().click();
await page.waitForTimeout(500);
ok((await ev(() => window.__aura.objects().length)) === before9 + 1, 'a generated image adds to the design');
await page.click('button:has-text("Enhance prompt")');
await page.waitForFunction(() => document.querySelector('[data-testid="ai-prompt"]').value.startsWith('A sunlit'), null, { timeout: 15000 });
ok(sent.anthropic.at(-1).body.model === 'claude-opus-5-5', 'prompt enhancement uses Claude');

/* 10. Design assistant (mocked Anthropic) */
const headId = await ev(async () => {
  await window.__aura.addText({ text: 'Morning Ritual', fontFamily: 'Inter', fontWeight: 700, size: 96, name: 'Heading' });
  await new Promise((r) => setTimeout(r, 300));
  const t = window.__aura.objects().find((o) => o.type === 'textbox' || o.type === 'i-text');
  return t?.id;
});
ok(!!headId, 'a heading exists for the assistant to edit');
assistantReply = {
  reply: 'Pair a high-contrast serif headline with the clean body text, and warm the background to a soft cream.',
  actions: [
    { type: 'set_style', id: headId, label: 'Headline → Playfair Display', text: null, fill: '#1d1b17', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: null, charSpacing: null, lineHeight: null, textAlign: null, opacity: null, x: null, y: null, width: null, color: null },
    { type: 'set_background', id: null, label: 'Background → cream #f4efe6', text: null, fill: null, fontFamily: null, fontWeight: null, fontSize: null, charSpacing: null, lineHeight: null, textAlign: null, opacity: null, x: null, y: null, width: null, color: '#f4efe6' },
  ],
};
await page.click('.ai-panel .seg button:has-text("Assistant")');
await page.fill('[data-testid="assistant-input"]', 'Suggest a stronger font pairing');
await page.keyboard.press('Enter');
await page.waitForSelector('[data-testid="assistant-actions"]', { timeout: 20000 });
const aReq = sent.anthropic.at(-1);
const userContent = aReq.body.messages.at(-1).content;
ok(aReq.body.model === 'claude-opus-5-5' && aReq.body.output_config?.format?.type === 'json_schema', 'assistant uses Claude with structured output');
ok(aReq.body.fallbacks === 'default' && /server-side-fallback-2026-07-01/.test(aReq.headers['anthropic-beta'] || ''), 'refusal fallbacks enabled');
ok(userContent.some((b) => b.type === 'image') && userContent.some((b) => b.type === 'text' && b.text.includes(headId)), 'assistant sees a rendered snapshot and the layer list');
ok(aReq.headers['x-api-key'] === 'sk-ant-test' && !sent.openai.some((r) => r.auth?.includes('sk-ant')), 'each key goes only to its own provider');
await shot('assistant');
await page.click('[data-testid="apply-actions"]');
await page.waitForTimeout(800);
const applied = await ev((id) => ({ font: window.__aura.objects().find((o) => o.id === id).fontFamily, bg: window.__aura.project.pages[window.__aura.pageIndex ?? 0].background }), headId);
ok(applied.font === 'Playfair Display' && applied.bg === '#f4efe6', 'assistant edits apply to the design');
await page.keyboard.press('Escape');
await page.click('.canvas-wrap, .workspace', { position: { x: 5, y: 5 } }).catch(() => {});
await ev(() => window.__aura.undo());
await page.waitForTimeout(500);
ok((await ev((id) => window.__aura.objects().find((o) => o.id === id).fontFamily, headId)) !== 'Playfair Display', 'assistant edits undo as one step');

/* 11. Provider errors surface clearly */
await page.unroute('https://api.openai.com/**');
await page.route('https://api.openai.com/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: { message: 'Incorrect API key provided' } }) }));
await page.click('.ai-panel .seg button:has-text("Generate")');
await page.fill('[data-testid="ai-prompt"]', 'test');
await page.click('[data-testid="ai-generate"]');
await page.waitForSelector('.aigen .err', { timeout: 15000 });
ok(/rejected the API key/.test(await page.textContent('.aigen .err')), 'invalid OpenAI key shows a clear error');

ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
await browser.close();
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
