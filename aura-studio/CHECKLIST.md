# Aura Studio — Development Checklist

Legend: ✅ done & tested · 🟡 partial · ⏳ planned · 🔌 needs external dependency

_Last updated: Stage 3 complete._

## Stage 1 — Core design platform ✅

### App & dashboard
- ✅ Dark design system (tokens per brief: #111 / #191919 / #202020 / #303030, single accent)
- ✅ Navigation: Home, Projects, Templates*, Discover*, AI Studio*, Brand Kits*, Assets, Favorites, Trash, Settings (*honest "in development" roadmap pages)
- ✅ 30 design formats across Social / Print & Editorial / Branding & Apparel / Custom, each opening a real document at the right size (carousel = 3 pages, business card / apparel = front + back, apparel & logo = transparent)
- ✅ Custom size dialog: px / in / mm / cm with DPI, transparent option, size validation
- ✅ Search designs, recent designs, favorites
- ✅ Projects: sort, folders (create / filter / delete), rename, duplicate, favorite, move to folder, trash → restore / delete forever / empty trash
- ✅ Assets: upload (button or drop anywhere), search, filter (favorites, SVG), rename, delete, favorite
- ✅ Import / export portable project files (`.aura.json`, images embedded)
- ✅ Settings: capability & cost matrix (local vs paid), API key storage (local only), storage usage
- ✅ Responsive dashboard (phone / tablet / desktop)

### Editor
- ✅ Top bar: back, editable title, autosave status, undo/redo, zoom menu, fit, resize, preview, share, export
- ✅ Canvas: artboard with off-board dimming, zoom (Ctrl/⌘+wheel, buttons, menu), pan (wheel, Space-drag, middle mouse), fit-to-screen (auto-refits on layout change until you zoom)
- ✅ Rulers (adaptive ticks), draggable guides (drag from ruler; drag back to delete), grid with adjustable size
- ✅ Smart snapping to page edges/centre, other objects' edges/centres and guides, with pink guide lines
- ✅ Text (Textbox): add presets + 8 type styles, in-place editing, corner-scale changes font size (no glyph stretching)
- ✅ 14 shapes (rect, rounded, circle, triangle, diamond, pentagon, hexagon, star, burst, heart, arch, ring, line, arrow) — click or drag onto canvas
- ✅ Images: upload, drag-drop from desktop, paste from clipboard, drag from Uploads panel
- ✅ SVG import as editable vector groups (ungroup to edit individual paths)
- ✅ Move / resize / rotate (Shift = 15° steps) / flip H & V / duplicate / delete / copy / cut / paste
- ✅ Multi-select (marquee, Shift-click, Ctrl+A), group / ungroup, lock / unlock, hide / show
- ✅ Align (to page or to selection), distribute H/V, arrange forward/backward/front/back
- ✅ Exact X / Y / W / H / rotation with proportional lock and drag-to-scrub labels
- ✅ Properties panel switches by selection: page, text, shape, image, multi-selection, group
- ✅ Text controls: family, weight, size, bold/italic/underline/strike, align, letter spacing, line height, case (UPPER/Title/lower), colour, highlight, outline (stroke behind fill)
- ✅ Shape controls: fill, stroke, width, solid/dash/dot, corner radius
- ✅ Appearance: opacity, 16 blend modes, drop shadow (colour, blur, offset)
- ✅ Image: non-destructive crop dialog (aspect presets, re-croppable, reset), brightness / contrast / saturation / blur filters
- ✅ Layers panel: thumbnails, names, drag-to-reorder, rename (double-click), visibility, lock, multi-select
- ✅ Right-click context menu
- ✅ Pages: thumbnails, add, duplicate, delete, reorder (drag or arrows), per-page background
- ✅ Undo / redo per page (120 steps, de-duplicated)
- ✅ Autosave to IndexedDB (debounced), flush on tab hide and editor close
- ✅ Resize design (presets + custom; scale-to-fit or keep size & re-centre; never stretches)
- ✅ Export: PNG, JPG, WEBP, transparent PNG/WEBP, 0.5×–4×, quality, current / all / chosen pages (multi-page → ZIP), oversize guard
- ✅ Preview (full-screen, arrow-key paging)
- ✅ Share: copy page as PNG to clipboard, download editable project file
- ✅ Keyboard shortcuts (press `?` in the editor)

### Verified by automated tests (tests/*.mjs)
48 checks: format sizes, add/undo/redo, drag, exact positioning, align, group/ungroup, upload,
layers, PNG/JPG/transparent/ZIP export byte checks, reload persistence (pages, objects, images),
resize proportions, text editing + undo, fonts, clipboard, context menu, lock/hide, layer drag,
SVG vectors, ruler guides, page ops, crop, filters, preview, export guard, trash/restore,
zero runtime errors.

## Stage 2 — Kittl-inspired design engine ✅

### Typography & font library
- ✅ 1,973 free-for-commercial-use families: 1,908 Google Fonts + 65 Fontshare exclusives (Clash Display, Satoshi, Boska, Gambetta, Zodiak, Cabinet Grotesk…), loaded on demand from the foundries' CDNs
- ✅ 22 creative categories (Serif, Sans serif, Modern, Minimalist, Editorial, Luxury, Fashion, Display, Vintage, Retro, Western, Gothic, Blackletter, Script, Handwritten, Graffiti, Psychedelic, Futuristic, Condensed, Bold, Decorative, Monospace)
- ✅ Search, category filter, favourites, recently used, live previews (per-glyph subsets, lazy-loaded as you scroll)
- ✅ Custom font upload (TTF/OTF/WOFF/WOFF2), stored privately in the browser
- ✅ 8 curated collections built from the owner's reference boards (Luxury, Premium Free, Old Money, Elegant Minimal, Bold Branding, Clothing Brand, Minimalist, Iconic Brand Looks — 157 picks; commercial faces shown as labelled free alternatives)
- ✅ Typography comparison studio: any phrase, 10/20/30/50 fonts, source (collection, category, popular, favourites, shuffle), weight, spacing, case, size, light/dark cards, pick → apply or insert
- ✅ Text transforms: arch (bend ±), circle (spacing), wave (height, number of waves), text on any drawn path — text stays live/editable
- ✅ Effects (combinable, editable, applied to text *and* any shape/graphic/image): 3D extrusion with shading, long shadow, offset copy, outline-only echo, layered copies, glow/neon, outline, double outline, hollow, gradient fill (stops + angle), metallic gold/chrome presets, drop shadow
- ✅ 16 one-click effect presets
- ✅ Convert text to outlines — glyph-accurate from the real font file (Google, Fontshare or uploaded TTF/OTF), including warped text

### Vector
- ✅ Pen tool (click points, drag for Bézier handles, click start to close, Enter/Esc)
- ✅ Pencil (freehand) with stroke colour/width
- ✅ Point editing: anchors and Bézier handles on paths and polygons (double-click), closed paths stay welded
- ✅ Convert basic shapes to editable paths
- ✅ Boolean ops: unite, subtract (minus front), intersect, exclude — shapes, paths, graphics and text
- ✅ SVG import as editable vector groups; recolour any group/graphic (Properties → Colours)

### Graphics, illustrations, textures
- ✅ 103 original vector graphics (generated in code — no third-party artwork): badges & emblems, laurels, ribbons, shields, seals, stars & sparkles, flames, wings, skulls, botanicals, ornaments & dividers, frames & borders, symbols, geometric & abstract, retro & vintage, patterns
- ✅ Ink/accent colours on insert, drag-and-drop to canvas, search
- ✅ 14 procedural print textures: distressed, screen print, worn ink, grunge, cracked, weathered, vintage grain, film grain/noise, halftone (true AM dots), newspaper, rough edges, faded ink, vintage aging, paper — with intensity, scale, rotation, colour/tint, randomise
- ✅ Paper texture background layer
- ✅ Transparent export keeps textures/effects for apparel printing

### Verified by tests/e2e-stage2.mjs (28 checks) — plus Stage 1 suites (49) still green

## Stage 2 — partial / follow-ups
- 🟡 Warped/envelope distortion, perspective text, vertical and stacked text, text inside shapes, repeated text patterns — not yet built
- 🟡 Inner shadow effect — not yet built
- 🟡 Illustrations are geometric/ornamental; hand-drawn engraving-style packs still to be authored
- 🟡 Fontshare italics not wired (uprights only); WOFF2 uploads can't be converted to outlines (TTF/OTF can)
- 🟡 Free fonts from marketplaces (e.g. Creative Fabrica) can't be bundled — download with your account and use Upload font

## Stage 3 — Canva-inspired ecosystem ✅

### Templates
- ✅ 34 original, fully editable templates in 12 categories (streetwear graphics, apparel branding, vintage typography, luxury branding, editorial posters, album covers, music artwork, social media, product ads, minimalist branding, retro compositions, business materials) — live text, warped text, effects, vector graphics, photo frames
- ✅ Template gallery (category tabs, search), "Start from a template" on Home, Templates panel in the editor (adds pages, smart-resized to the current design), open-as-new-design
- ✅ Photo frames: select a frame and click any image to fill it (cover-crop, re-croppable)
- ✅ Save any design as a reusable template (Share menu or design card menu) → "My templates"

### Brand kits
- ✅ Multiple brands: logos, palette with roles (primary/secondary/accent/neutral), HEX + RGB editing, heading/subheading/body type system (weights, tracking, caps), brand assets, guidelines
- ✅ Editor Brand panel: brand swatches (fill selection or page), add heading/subheading/body in brand fonts, insert logos and assets
- ✅ Apply brand to a design: fonts by text hierarchy, colours mapped by prominence onto the palette

### Resize, export, import
- ✅ Element-aware smart resize (backgrounds re-cover, bands stretch, edge pieces stay pinned, content re-fits as a group); create resized copies in many formats at once — original untouched
- ✅ SVG export: outlined text (exact) or live text with linked web fonts; images embedded; effects/shadows/blend modes embedded as high-res images
- ✅ PDF export: vector or high-res image, 150/300/600 DPI, multi-page, 3 mm bleed, crop marks, correct physical page size
- ✅ PDF import (pdf.js 6, scripting disabled): one image asset per page
- ✅ Multi-page documents and social resizing presets (from Stage 1) carried forward

### Assets & discovery
- ✅ Asset folders, move to folder, duplicate, recently uploaded, favourites, vectors, stock-photo filter
- ✅ Free stock photos: Wikimedia Commons (no key) and Openverse (free API key), commercial-use licences only, attribution stored and copyable
- ✅ Discover: themed template kits and 8 curated font pairings that start a design
- ✅ DB schema v2 (templates, brand kits) — upgrades existing data in place

### Verified by tests/e2e-stage3.mjs (28 checks); Stage 1–2 suites (77) still green

## Stage 3 — partial / awaiting external setup
- 🔌 Cloud sync & share links — needs your own Supabase project (URL + anon key); not connected yet. Designs stay local; use project files to move between devices.
- 🔌 Openverse search needs a free Openverse API key (Settings). Wikimedia Commons works without a key.
- 🟡 Stock search was verified against recorded API responses; live calls from the build container were rate-limited/key-gated.
- 🟡 PDF export is RGB (no CMYK conversion in the browser).

## Stage 4 — Image editing & AI ✅

### Photo studio (free, local)
- ✅ Adjustments: exposure, temperature, tint, highlights, shadows, whites, blacks, contrast, saturation, vibrance, clarity, vignette, grain, sharpness, blur — one custom WebGL filter with an identical CPU fallback
- ✅ 10 filter presets with live previews and intensity; hold-to-compare Before; reset; everything non-destructive and saved with the design
- ✅ Image masks: oval, rounded, arch, star, heart, hexagon, diamond

### On-device AI (free — models download once, then run offline; nothing is uploaded)
- ✅ Background remover — three commercially licensed models: ORMBG (Apache-2.0, default), BiRefNet-lite 512 (MIT, finest hair), MODNet (Apache-2.0, portraits). WebGPU (fp16) when available, otherwise multi-threaded WebAssembly; automatic CPU fallback if a GPU can't run a model
- ✅ Refine: erase/restore brushes with size + hardness, shift edge, smooth, feather, colour decontamination (removes background colour halos), mask overlay / white / black / transparent previews, zoom (fit, 1:1, ⌘-wheel), pan (Space / hand), 20-step undo/redo, before/after
- ✅ Background options as separate editable layers: transparent, colour, blurred original, any photo
- ✅ Non-destructive: cutouts are new PNG assets; the layer remembers its original → "Refine cutout" restarts from the original pixels + current mask, "Restore original" puts it back
- ✅ Magic eraser — LaMa inpainting (Apache-2.0, 208 MB once) with per-region 512² context windows and grain matching; "Quick fill" (instant, no download) for blemishes; erase on release, multi-step undo, keeps transparency
- ✅ Enhance 2× — Swin2SR super-resolution (Apache-2.0): Fast (8 MB) / Best detail (54 MB); tiled with feathered seams, ETA + cancel; same size on the page, twice the pixels
- ✅ Cross-origin isolation (COOP + COEP credentialless) enables multi-threaded WebAssembly — measured 2.5× faster

### Provider AI (paid — the user's own keys, billed by the provider)
- ✅ Text-to-image (OpenAI): 11 style presets, aspect, quality, 1–4 images, "avoid" list, transparent background, up to 4 reference images (image-to-image / variations), prompt enhancement via Claude; results saved to Uploads with prompt + model
- ✅ Generative fill / object replace / remove: brush selection, or one-click AI selection of background or subject (on-device segmentation) for background scenes; only the selected pixels are pasted back, feathered, at full resolution
- ✅ Expand (outpaint) to 1:1 / 4:5 / 9:16 / 16:9 / 3:2 or free margin; original pixels kept untouched in place
- ✅ AI Studio page: generator, AI image history ("Design with it"), free vs paid tool map, key status
- ✅ Design assistant (Claude, claude-opus-5-5): sees the page as layers + a rendered snapshot + the active brand kit; replies with direction and concrete edits (text, fonts, colours, sizes, positions, background, new text) that apply as one undoable step; per-edit opt-out; refusal fallbacks on
- ✅ Clear errors for invalid keys, quota/rate limits and policy declines; every paid surface says what is sent where

### Verified by tests/e2e-stage4.mjs (42 checks) — real on-device models + mocked provider APIs; Stage 1–3 suites (105) still green — 147 checks in total

## Stage 4 — partial / awaiting external setup
- 🟡 OpenAI and Anthropic calls are verified against mocked API responses (request shape, mask semantics, keys, error handling). This build environment cannot reach those APIs, so no live generation was run here — add your keys in Settings to use them.
- 🟡 OpenAI image model defaults to `gpt-image-1` (editable in Settings) — set a newer model id there if your account has one.
- 🟡 WebGPU path for the on-device models was exercised on a software GPU only; real GPUs use fp16 weights when they support `shader-f16`, otherwise the verified CPU path.
- 🟡 BiRefNet's 1024² exports exceed the browser's WebAssembly memory, so High detail uses the 512² BiRefNet-lite export.
- 🟡 Production hosting must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` (provided in `public/_headers` for Netlify / Cloudflare Pages). Without them everything still works, but the on-device models run single-threaded (slower).
- 🟡 API keys are stored in this browser's localStorage and sent directly from the browser to the provider — use keys with spending limits.

## Stage 5 — Apparel & mockup studio ✅

### Apparel library — Tapstitch (official Open Platform API, your Tapstitch token)
- ✅ Apparel page: the live Tapstitch catalogue (1,403 active garments: tees, hoodies, zip-ups, sweatshirts, tanks, pants, shorts, jackets, polos, activewear, kids, caps & bags) with search, 13 categories, DTG/DTF filter, International / USA fulfilment
- ✅ Product sheet: Tapstitch photos, colours, sizes, blank price, techniques, every print area and placement with its print price, live garment preview with placement outlines, link to the product on Tapstitch
- ✅ Garment projects: one transparent 7000 px page per print area (front, back, sleeves…); the real Tapstitch garment in your chosen colour sits behind the artwork (never exported); dashed, labelled print placements; anything outside them is dimmed because it won't print
- ✅ Mockups panel: live mockup of every piece from Tapstitch's own mockup layers + your artwork clipped to the rotated placement boxes / masks; colour switcher; fabric realism (garment folds and lighting shade the print)
- ✅ Exports: mockup PNG (2000 px) per piece, or a ZIP with all mockups + one transparent print file per printed placement (10× Tapstitch design-area size, e.g. 2600×3270 for a tee front; empty placements skipped) + README
- ✅ Try on: preview any non-garment design on any Tapstitch garment / colour / placement with size and height, download the mockup, or turn it into a garment design
- ✅ Same-origin relay for the API (it does not allow browser CORS): Vite dev/preview middleware, `functions/tapstitch/[[path]].js` (Cloudflare Pages) and `public/_redirects` (Netlify)

### Other mockups (Aura's own tools)
- ✅ Place on a photo: packaging, boxes, posters, labels, bags, screens — your own photo, 4-corner perspective (true homography), printed (multiply) or opaque blending, photo-lighting transfer, full-resolution download / save / add to design
- ✅ AI lifestyle scene from the finished mockup (paid, your OpenAI key)

### Verified by tests/e2e-stage5.mjs (26 checks) — live Tapstitch API through the relay, OpenAI mocked; Stage 1–4 suites (147) still green — 173 checks in total

## Stage 5 — notes / awaiting setup
- 🔌 Needs a Tapstitch account token (Settings → Tapstitch API token). Free to create at tapstitch.com/developers/tokens.
- 🔌 Production hosting must provide the `/tapstitch` relay (Cloudflare Pages Function and Netlify rule included). Static hosting without it cannot reach the API.
- 🟡 Tapstitch's terms prohibit scraping or copying their site, so nothing is downloaded or bundled: product data, photos and mockup layers load live from their official API and CDN, and stay Tapstitch's property.
- 🟡 Sending designs to Tapstitch to order (their API's create-design endpoint) needs the artwork at a public HTTPS URL, i.e. image hosting — not wired yet. Download the print files and upload them on tapstitch.com.
- 🟡 Tapstitch's mockup layers are flat studio shots, so fabric realism is subtle on most garments.

## Creative tools pass — Photoshop-style tools for "crazy artwork easily" ✅

### FX Lab (any image layer; stackable, non-destructive, saved with the design)
- ✅ 26 effects, each a WebGL shader with an identical CPU fallback (large images / no WebGL):
  Colour — Levels, Curves (5-point editor, RGB/R/G/B), Duotone, Acid colours, Thermal, Posterize, Threshold, Solarize, Invert ·
  Stylize — Halftone, Pixelate, Dither, Neon edges, Emboss, VHS/scanlines, Glitch, Chromatic aberration, Grain ·
  Distort — Twirl, Bulge/pinch, Wave, Ripple, Kaleidoscope, Mirror ·
  Blur — Motion, Zoom
- ✅ 14 one-click looks with live previews (Acid trip, VHS tape, Riso print, Comic halftone, Neon noir, Vaporwave, Mandala, Retro pixel, Game Boy, Thermal cam, Liquid, Rubber stamp, Speed, Warp zoom) and "Surprise me"
- ✅ Per-effect strength, settings, colours, reorder, remove, reroll; photo adjustments and FX coexist
- ✅ Turn into image: any text/shape/group becomes an image layer for FX (original kept, hidden)
- ✅ Merge visible to new layer (Photoshop "stamp visible") — FX the whole artwork

### Brush studio
- ✅ Paint layers (move, blend, mask or FX them like any layer); 12 brushes: round, airbrush, spray can, chalk, marker, neon, calligraphy, stars, confetti, bubbles, smudge, eraser
- ✅ Rainbow colour flow, size / opacity / hardness / spacing / jitter, pen-tablet pressure
- ✅ Symmetry: mirror, flip, quad, mandala (2–16 segments) with live guides and mirrored cursors
- ✅ Per-stroke undo; strokes saved as hidden internal assets (never inline data URLs, never cluttering Uploads)

### Bug sweep
- ✅ ESLint (correctness + React hooks rules) added — codebase clean; strict TypeScript clean; full UI smoke sweep (every page, panel, dialog, object type) with no console errors
- ✅ Fixed: duplicating a garment project or page lost its Tapstitch garment link
- ✅ Fixed: resizing a garment project would break print-area geometry (now explained and blocked)
- ✅ Fixed: FX Lab CPU duotone rendered black; kaleidoscope sampled background instead of the subject
- ✅ Fixed: studio dialogs ignored Escape; photo action buttons overflowed the panel; stale "Stage 2" hint

### Verified by tests/e2e-tools2.mjs (22 checks, pixel-level) plus all earlier suites

### Not added (yet)
- 🟡 Pixel selections (marquee / lasso / magic wand) — use shape masks, AI subject/background selection, brushes and the magic eraser instead
- 🟡 Liquify brush (use Twirl / Bulge / Wave / Ripple in FX Lab), clone stamp (use Magic eraser), smart objects, adjustment layers that affect layers below

## Known limitations / bugs
- Effects render through an offscreen layer capped at 4096 px per object side; a single effected object wider than that on a very large document exports slightly softer.
- Page add / delete / reorder and document resize are not undoable (object edits are). Resize clears undo history.
- Italic is synthesised by the browser for fonts without italic files.
- Very large documents (e.g. 4500×5400 apparel) are capped at ~160 MP per export to stay inside browser canvas limits — the dialog blocks larger sizes with a message.
- Copy/paste between designs works within a browser tab session (internal clipboard); pasting images from the OS clipboard works everywhere.
- Fonts need network access to Google Fonts on first use; offline, text falls back to a system font until fonts load.
