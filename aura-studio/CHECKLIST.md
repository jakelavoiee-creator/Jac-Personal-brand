# Aura Studio — Development Checklist

Legend: ✅ done & tested · 🟡 partial · ⏳ planned · 🔌 needs external dependency

_Last updated: Stage 2 complete (app renamed Verso → Aura Studio; existing data migrates automatically)._

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

## Stage 3 — Ecosystem
- ⏳ Editable template library + save-as-template
- ⏳ Brand kits (logos, palettes HEX/RGB, type systems)
- ⏳ Element-aware smart resize
- ⏳ SVG & print-ready PDF export (effects rasterised or converted), PDF import (pdf.js)
- ⏳ Stock photos (openly licensed source)
- 🔌 Optional Supabase cloud sync & share links (free tier; account optional)

## Stage 4 — Image editing & AI
- ⏳ Full adjustments (exposure, temperature, tint, highlights/shadows, whites/blacks, clarity, vignette, grain), filter presets with intensity, masks
- ⏳ Background removal — local ONNX Runtime Web model (RMBG/BiRefNet class), lazy-loaded, with erase/restore brushes & feathering — **free, on-device**
- 🔌 Text-to-image, generative fill, expand, object replace, magic edit — requires provider API key (paid inference) or self-hosted GPU
- 🔌 AI design assistant — requires LLM provider key

## Stage 5 — Apparel & mockups
- ⏳ Garment templates (front/back/sleeves/labels), placement guides, realistic mockups, packaging, lifestyle scenes
- 🔌 AI-generated lifestyle scenes (paid inference)

## Known limitations / bugs
- Effects render through an offscreen layer capped at 4096 px per object side; a single effected object wider than that on a very large document exports slightly softer.
- Page add / delete / reorder and document resize are not undoable (object edits are). Resize clears undo history.
- Italic is synthesised by the browser for fonts without italic files.
- Very large documents (e.g. 4500×5400 apparel) are capped at ~160 MP per export to stay inside browser canvas limits — the dialog blocks larger sizes with a message.
- Copy/paste between designs works within a browser tab session (internal clipboard); pasting images from the OS clipboard works everywhere.
- Fonts need network access to Google Fonts on first use; offline, text falls back to a system font until fonts load.
