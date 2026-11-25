// Renders gallery thumbnails for the built-in templates through the real
// template builder, so previews always match what "Use template" creates.
//   npx vite --port 5199 &   then   node scripts/build-template-thumbs.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DEV = process.env.DEV_URL || 'http://localhost:5199';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(DEV);
const ids = await page.evaluate(async () => (await import('/src/templates/library.ts')).TEMPLATES.map((t) => t.id));
fs.mkdirSync('public/templates', { recursive: true });
for (const id of ids) {
  const url = await page.evaluate(async (id) => {
    const { TEMPLATES } = await import('/src/templates/library.ts');
    const { buildTemplatePages, templateSize } = await import('/src/templates/build.ts');
    const { renderThumb } = await import('/src/lib/render.ts');
    const tpl = TEMPLATES.find((t) => t.id === id);
    const pages = await buildTemplatePages(tpl);
    const page0 = { ...pages[0], background: pages[0].background ?? tpl.preview ?? null };
    return renderThumb(templateSize(tpl), page0, 520);
  }, id);
  fs.writeFileSync(`public/templates/${id}.webp`, Buffer.from(url.split(',')[1], 'base64'));
  console.log('✔', id);
}
await browser.close();
