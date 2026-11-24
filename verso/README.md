# Verso Studio

A professional, browser-based creative studio — Canva's simplicity, Kittl's typographic
freedom, Photoshop/Illustrator precision, and (from Stage 4) real AI tools — in one workspace.

**North star:** quiet, precise, editorial. The canvas is the hero; the chrome recedes.
Free-first: everything in Stage 1 runs locally in the browser with no account.

## Run it

```bash
cd verso
npm install
npm run dev          # http://localhost:5173
```

Production build + end-to-end tests (Chromium via Playwright):

```bash
npm run build
npx vite preview --port 4173 &
npm test                      # core workflow: create → edit → export → reload
node tests/e2e-tools.mjs      # tools: text editing, crop, guides, SVG, layers, pages, trash
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
| Fonts | Google Fonts (OFL / Apache) | Loaded on demand; glyph metrics flushed when a font arrives so text measures correctly. |

The editor and Fabric.js are code-split: the dashboard loads ~65 KB gzipped and the editor
chunk only loads when a design is opened.

```
src/
  App.tsx, main.tsx          routing (hash) + lazy editor
  styles.css                 design tokens + all component styles
  store/app.ts               routes, toasts
  lib/                       db, assets, fonts, formats, render (export), zip, portable files
  dashboard/                 home, projects, folders, assets, trash, settings, roadmap pages
  editor/
    engine.ts                canvas engine: history, autosave, snapping, guides, pages, ops
    shapes.ts                shape library (also renders panel thumbnails)
    Editor.tsx               layout, top bar, rulers, pages bar, context menu, shortcuts
    Properties.tsx           context-aware right panel
    panels/LeftPanel.tsx     tool rail + panels (elements, text, fonts, uploads, bg, layers)
    dialogs/                 export, resize, crop, preview, share, shortcuts
tests/                       Playwright end-to-end suites
```

### Document model

A project has a fixed artboard size and N pages. Each page stores `background` (colour or
`null` = transparent) and `objects` (Fabric serialization + `id`, `name`, `locked`,
`assetId`, `shapeKind`). Undo history is per page, de-duplicated, capped at 120 steps.
Exports re-render each page off-screen at the target scale (no screenshotting of the editor).

See **[CHECKLIST.md](CHECKLIST.md)** for what's done, what's next, and what depends on
external services.
