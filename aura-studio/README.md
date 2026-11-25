# Aura Studio

A professional, browser-based creative studio — Canva's simplicity, Kittl's typographic
freedom, Photoshop/Illustrator precision, and real AI tools — in one workspace.

**North star:** quiet, precise, editorial. The canvas is the hero; the chrome recedes.
Free-first: the editor and the on-device AI tools run locally in the browser with no account.
Paid AI (generation, generative fill, the design assistant) only runs with keys you add.

## Use it on your laptop

1. Install **Node.js** (LTS) from nodejs.org — once.
2. Download this project (GitHub → branch → Code → Download ZIP) and unzip it.
3. Double-click **Start Aura (Mac).command** or **Start Aura (Windows).bat** in the project folder.
   The first start installs Aura (a few minutes); after that it opens in seconds at http://localhost:5173.
4. Keep that window open while you work; close it to stop Aura. Your designs stay saved in your browser on this laptop.

## Run it

```bash
cd aura
npm install
npm run dev          # http://localhost:5173
```

Production build + end-to-end tests (Chromium via Playwright); `npm run lint` checks for bugs:

```bash
npm run build
npx vite preview --port 4173 &
npm test                      # all five suites
#   tests/e2e.mjs         core workflow: create → edit → export → reload
#   tests/e2e-tools.mjs   tools: text editing, crop, guides, SVG, layers, pages, trash
#   tests/e2e-tools2.mjs  FX Lab, levels/curves, turn into image, merge visible, brushes + symmetry
#   tests/e2e-stage2.mjs  effects, textures, transforms, fonts, vectors, graphics, migration
#   tests/e2e-stage3.mjs  templates, brand kits, smart resize, SVG/PDF export, PDF import, photos
#   tests/e2e-stage4.mjs  photo studio, on-device AI (real models), provider AI + assistant (mocked APIs)
#   tests/e2e-stage5.mjs  Tapstitch apparel (live API; needs TAPSTITCH_TOKEN), mockups, print files, perspective
```

The tests drive the real UI and verify exported files at the byte level (PNG/JPEG headers,
dimensions, alpha channel, ZIP structure).

## Architecture

| Layer | Choice | Why |
|---|---|---|
| App shell | **Vite + React 18 + TypeScript** | Pure client-side app — no SSR needed, so Vite beats Next.js on dev speed and simplicity. A Next.js/FastAPI backend can be added beside it later for cloud sync and GPU jobs. |
| Canvas engine | **Fabric.js 7** (subclassed `StudioCanvas`) | Mature object model, text editing, serialization, filters. The artboard, grid, guides and off-board dimming are drawn in render hooks so they never enter the document. |
| State | **Zustand** | Small UI store; the engine (`src/editor/engine.ts`) owns document state and pushes UI deltas. |
| Storage | **IndexedDB** (`idb`) | Projects, pages and uploaded binaries persist locally. Images are stored once as blobs and referenced by `assetId`, so history snapshots and project records stay small. |
| Styling | Hand-written CSS tokens (`src/styles.css`) | One file, exact control of the dark design language, no runtime cost. |
| Icons | lucide-react (ISC) | |
| Fonts | 1,908 Google Fonts (OFL/Apache) + 65 Fontshare families (ITF Free Font License / OFL) | Catalogues are generated at build time (`scripts/`); files load on demand from the foundries' CDNs (no redistribution). Previews use per-glyph subsets under private aliases. |
| Effects | Custom compositor (`src/lib/fx.ts`) | Hooks fabric's `drawObject`: any object renders through an offscreen pipeline (extrusion, glow, outlines, gradients, 14 procedural print textures), cached per state and zoom bucket — fully editable, and exports at target resolution. |
| Vectors | paper.js (MIT) · opentype.js (MIT) | Boolean ops and glyph-accurate text→outlines. Both lazy-loaded on first use. |
| Graphics | `src/data/graphics.ts` | 103 original vectors generated from geometry — no third-party artwork. |
| Templates | `src/templates/` | 34 original templates written as compact layout descriptions and built into live, editable layers on demand. Gallery previews are pre-rendered by `npm run templates:thumbs` through the same builder. |
| Vector export | jsPDF 4 + svg2pdf.js (MIT) | SVG and print-ready PDF (vector or high-res, 3 mm bleed, crop marks). Effects, shadows and blend modes are embedded as images at print DPI; text is outlined from the real font files. |
| PDF import | pdf.js 6 (Apache-2.0) | Renders each page to an image asset; scripting disabled. |
| Stock photos | Wikimedia Commons · Openverse | Commercial-use licences only, attribution stored with each photo. Openverse needs a free API key (Settings). |
| Photo filters | Custom fabric filter `AuraAdjust` (`src/lib/photoFilter.ts`) | One WebGL pass for all adjustments + presets, identical CPU fallback, serialised with the design. |
| On-device AI | transformers.js 4 + ONNX Runtime Web (Apache-2.0/MIT) | Background removal (ORMBG Apache-2.0 · BiRefNet-lite 512 MIT · MODNet Apache-2.0), inpainting (LaMa Apache-2.0), super-resolution (Swin2SR Apache-2.0). Weights download from Hugging Face on first use and are cached by the browser; the ONNX Runtime wasm is served by Aura itself (`public/ort`, copied at build). WebGPU fp16 where supported, otherwise multi-threaded WebAssembly (needs the COOP/COEP headers in `public/_headers`). |
| Apparel library | Tapstitch Open Platform API | Live catalogue, print areas and mockup layers with the user's own Tapstitch token, through a same-origin relay (`/tapstitch` → openapi.tapstitch.com; the API has no browser CORS). Garment projects use Tapstitch's 700 px design canvas at 10×; print files are cut per placement. |
| FX Lab | `src/lib/fxlab.ts` | 26 effects as one custom fabric filter class (`AuraFX`): per-effect GLSL program + identical CPU mirror; stackable passes, serialized with the design. |
| Brush studio | `src/editor/brush.ts` | Raster paint layers drawn into a live canvas; symmetry around the page centre; strokes persisted as hidden internal assets for per-stroke undo. |
| Perspective mockups | `src/lib/perspective.ts` | 4-point homography with bilinear inverse mapping and photo-lighting transfer. |
| Provider AI | OpenAI Images API · Anthropic SDK (Claude) | Called from the browser with the user's own keys (stored locally). Generative edits paste back only the masked pixels at full resolution. The assistant returns structured edits (zod schema) that the engine applies as one undoable step. |

The editor and Fabric.js are code-split: the dashboard loads ~66 KB gzipped, the editor chunk
loads when a design is opened, and paper.js / opentype.js only load when a vector tool needs them.

### Licensing of bundled resources

- **Fonts** — only free-for-commercial-use families are listed (Google Fonts, Fontshare). Where a
  reference board named a commercial typeface (Helvetica, Didot, Clash Display alternatives, …) the
  curated collections show the closest free match labelled “similar to X”. Fonts you own a licence
  for can be uploaded (TTF/OTF/WOFF/WOFF2) and stay private to your browser.
- **Graphics, textures & templates** — created in Aura's own code; free to use commercially.
- **Stock photos** — CC0 / public domain / CC BY / CC BY-SA only. BY and BY-SA require crediting the
  author: the credit travels with each photo (Properties → Photo credit → Copy credit).

```
src/
  App.tsx, main.tsx          routing (hash) + lazy editor
  styles.css                 design tokens + all component styles
  store/app.ts               routes, toasts
  lib/                       db, assets, fonts + fontCatalog, fx (effects), warp, vector, render, zip
  data/                      font catalogues (generated), font collections, graphics library
  dashboard/                 home, projects, folders, assets, trash, settings, roadmap pages
  editor/
    engine.ts                canvas engine: history, autosave, snapping, guides, pages, ops
    shapes.ts                shape library (also renders panel thumbnails)
    Editor.tsx               layout, top bar, rulers, pages bar, context menu, shortcuts
    Properties.tsx           context-aware right panel
    EffectsSection.tsx       effect presets, effect layers, texture controls
    panels/                  tool rail, Fonts, Graphics/Illustrations, Textures, Uploads, Layers…
    dialogs/                 export, resize, crop, preview, share, shortcuts, font comparison studio
scripts/                     font catalogue generators (Google Fonts metadata, Fontshare API)
tests/                       Playwright end-to-end suites
```

### Document model

A project has a fixed artboard size and N pages. Each page stores `background` (colour or
`null` = transparent) and `objects` (Fabric serialization + `id`, `name`, `locked`,
`assetId`, `shapeKind`, the `fx` effect stack and `warp` text transform). Projects saved under the
app's earlier name (Verso) migrate automatically on first launch. Undo history is per page, de-duplicated, capped at 120 steps.
Exports re-render each page off-screen at the target scale (no screenshotting of the editor).

See **[CHECKLIST.md](CHECKLIST.md)** for what's done, what's next, and what depends on
external services.

## Hosting

Aura is a static app plus one tiny relay:

- **Headers** — `public/_headers` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` (multi-threaded on-device AI).
- **Tapstitch relay** — `/tapstitch/v1/*` must forward to `https://openapi.tapstitch.com/v1/*` with the `Authorization` header. Included: `functions/tapstitch/[[path]].js` (Cloudflare Pages) and `public/_redirects` (Netlify). `npm run dev` / `vite preview` provide it automatically.
