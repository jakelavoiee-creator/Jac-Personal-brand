# Verso Studio — Development Checklist

Legend: ✅ done & tested · 🟡 partial · ⏳ planned · 🔌 needs external dependency

_Last updated: Stage 1 complete._

## Stage 1 — Core design platform ✅

### App & dashboard
- ✅ Dark design system (tokens per brief: #111 / #191919 / #202020 / #303030, single accent)
- ✅ Navigation: Home, Projects, Templates*, Discover*, AI Studio*, Brand Kits*, Assets, Favorites, Trash, Settings (*honest "in development" roadmap pages)
- ✅ 30 design formats across Social / Print & Editorial / Branding & Apparel / Custom, each opening a real document at the right size (carousel = 3 pages, business card / apparel = front + back, apparel & logo = transparent)
- ✅ Custom size dialog: px / in / mm / cm with DPI, transparent option, size validation
- ✅ Search designs, recent designs, favorites
- ✅ Projects: sort, folders (create / filter / delete), rename, duplicate, favorite, move to folder, trash → restore / delete forever / empty trash
- ✅ Assets: upload (button or drop anywhere), search, filter (favorites, SVG), rename, delete, favorite
- ✅ Import / export portable project files (`.verso.json`, images embedded)
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

## In progress / next up — Stage 2 (Kittl-inspired design engine)
- ⏳ Full font library (Google Fonts / Fontsource index, ~1,500 families) with categories, search, favorites, recents, custom font upload
- ⏳ Typography comparison studio (10–50 fonts side by side, weights, spacing, case, insert to canvas)
- ⏳ Text transforms: curved, circular, arched, wavy, text on path, vertical, warped, perspective, stacked
- ⏳ Text effects: 3D extrusion, long shadow, double outline, hollow, gradient fill, glow, offset/layered, retro, distressed, halftone
- ⏳ Vector tools: pen, node editing, boolean ops (union/subtract/intersect), convert text to outlines, gradient fills
- ⏳ Original graphic & illustration library (badges, ornaments, frames, flames, wings…)
- ⏳ Texture & print-effects engine (grain, halftone, screen-print, distressed, paper)

## Stage 3 — Ecosystem
- ⏳ Editable template library + save-as-template
- ⏳ Brand kits (logos, palettes HEX/RGB, type systems)
- ⏳ Element-aware smart resize
- ⏳ SVG & print-ready PDF export, PDF import (pdf.js)
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
- Page add / delete / reorder and document resize are not undoable (object edits are). Resize clears undo history.
- Italic is synthesised by the browser for fonts without italic files.
- Very large documents (e.g. 4500×5400 apparel) are capped at ~160 MP per export to stay inside browser canvas limits — the dialog blocks larger sizes with a message.
- Copy/paste between designs works within a browser tab session (internal clipboard); pasting images from the OS clipboard works everywhere.
- Fonts need network access to Google Fonts on first use; offline, text falls back to a system font until fonts load.
