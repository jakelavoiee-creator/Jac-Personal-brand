import {
  ActiveSelection,
  Canvas,
  FabricImage,
  FabricObject,
  Group,
  IText,
  Path,
  PencilBrush,
  Point,
  Polygon,
  Polyline,
  Rect,
  Ellipse,
  controlsUtils,
  Shadow,
  Textbox,
  filters,
  loadSVGFromString,
  util,
  type TPointerEventInfo,
} from 'fabric';
import { create } from 'zustand';
import { putProject } from '../lib/db';
import { uid, clamp } from '../lib/ids';
import { assetURL, assetURLById } from '../lib/assets';
import { getAsset } from '../lib/db';
import { ensureFont } from '../lib/fonts';
import { CUSTOM_PROPS, applyLock, enliven, renderThumb } from '../lib/render';
import { newPage } from '../lib/projects';
import type { Asset, BrandFont, BrandKit, PageData, Project } from '../lib/types';
import { makeShape, type ShapeKind } from './shapes';
import type { FX } from '../lib/fx';
import { AuraAdjust, NEUTRAL, type Adjust } from '../lib/photoFilter';

export interface PhotoState {
  adjust: Adjust;
  preset: string | null;
  amount: number;
  sharpness: number;
  blur: number;
}
import { warpPath, type Warp } from '../lib/warp';
import type { BoolOp } from '../lib/vector';
import type { AssistantAction } from '../lib/ai/assistant';
import { renderPiece } from '../lib/garment';
import { AuraFX, type FxOpts } from '../lib/fxlab';
import { BRUSH_DEFAULT, BrushSession, type BrushStyle } from './brush';

interface PenPt {
  x: number;
  y: number;
  hin?: { x: number; y: number };
  hout?: { x: number; y: number };
}

/* ------------------------------------------------------------------ */
/* UI-facing state                                                     */
/* ------------------------------------------------------------------ */

export type SaveState = 'saved' | 'saving' | 'dirty' | 'error';

export interface EditorState {
  project: Project | null;
  pageIndex: number;
  zoom: number;
  selVersion: number;
  objVersion: number;
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveState;
  showGrid: boolean;
  showRulers: boolean;
  snapping: boolean;
  gridSize: number;
  thumbs: Record<string, string>;
  menu: { x: number; y: number } | null;
  cropping: FabricImage | null;
  /** full-screen AI image tool (background remover, magic eraser, enhance) */
  imageTool: { kind: ImageToolKind; img: FabricImage } | null;
  /** place-on-a-photo perspective mockup studio */
  perspective: boolean;
  /** open left-rail panel */
  panel: string | null;
  /** typography comparison studio */
  compare: { families?: string[]; title?: string } | null;
  /** active drawing tool */
  tool: 'select' | 'pen' | 'pencil' | 'brush';
  brushStyle: BrushStyle;
  penStyle: { stroke: string; width: number; fill: string };
  /** object currently in point-editing mode */
  nodeEditing: boolean;
  busy: string | null;
}

export type ImageToolKind = 'cutout' | 'erase' | 'enhance' | 'genfill' | 'expand';

export const useEditor = create<EditorState>(() => ({
  project: null,
  pageIndex: 0,
  zoom: 1,
  selVersion: 0,
  objVersion: 0,
  canUndo: false,
  canRedo: false,
  saveState: 'saved',
  showGrid: false,
  showRulers: true,
  snapping: true,
  gridSize: 50,
  thumbs: {},
  menu: null,
  cropping: null,
  imageTool: null,
  perspective: false,
  panel: typeof innerWidth !== 'undefined' && innerWidth < 900 ? null : 'elements',
  compare: null,
  tool: 'select',
  brushStyle: { ...BRUSH_DEFAULT },
  penStyle: { stroke: '#111111', width: 6, fill: '#c9c9c9' },
  nodeEditing: false,
  busy: null,
}));

const set = useEditor.setState;
const get = useEditor.getState;

/* ------------------------------------------------------------------ */
/* Canvas subclass: draws the artboard, grid, guides and off-board dim */
/* ------------------------------------------------------------------ */

class StudioCanvas extends Canvas {
  studio?: Engine;
  _renderBackground(ctx: CanvasRenderingContext2D) {
    super._renderBackground(ctx);
    this.studio?.drawArtboard(ctx);
  }
  _renderOverlay(ctx: CanvasRenderingContext2D) {
    super._renderOverlay(ctx);
    this.studio?.drawOverlay(ctx);
  }
}

interface Snapshot {
  objects: any[];
  background: string | null;
}
interface History {
  stack: Snapshot[];
  /** serialized form of each snapshot, for de-duplication */
  keys?: string[];
  index: number;
}

interface SnapLine {
  axis: 'x' | 'y';
  pos: number;
  from: number;
  to: number;
}

const HISTORY_LIMIT = 120;
const ACCENT = '#6E8BFF';
const GUIDE = '#FF4FA3';

let checker: CanvasPattern | null = null;
function checkerPattern(ctx: CanvasRenderingContext2D) {
  if (checker) return checker;
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#e4e4e4';
  g.fillRect(0, 0, 8, 8);
  g.fillRect(8, 8, 8, 8);
  checker = ctx.createPattern(c, 'repeat');
  return checker!;
}

export type AlignKind = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

/* ------------------------------------------------------------------ */

export class Engine {
  canvas: StudioCanvas;
  project!: Project;
  pageIndex = 0;
  private host: HTMLElement;
  private history = new Map<string, History>();
  private restoring = false;
  private clipboard: any[] = [];
  /** active brush painting session (brush tool) */
  brush: BrushSession | null = null;
  private painting = false;
  /** rendered Tapstitch garment behind the artwork (garment projects) */
  private backdrop: { key: string; canvas: HTMLCanvasElement | null } | null = null;
  private pasteCount = 0;
  private saveTimer: number | undefined;
  private thumbTimers = new Map<string, number>();
  private propTimer: number | undefined;
  private ro: ResizeObserver;
  private viewportListeners = new Set<() => void>();
  private snapLines: SnapLine[] = [];
  private spaceDown = false;
  private panning: { x: number; y: number } | null = null;
  private rafBump = 0;
  /** Until the user zooms or pans, keep the artboard fitted as the layout changes. */
  private autoFit = true;
  private pen: { pts: PenPt[]; drag: boolean; cursor: { x: number; y: number } | null } | null = null;
  private nodeTarget: FabricObject | null = null;
  /** shared start/end anchor of a closed path in point-editing mode */
  private weld: { x: number; y: number } | null = null;
  /** Live guide being dragged (from a ruler or an existing guide). */
  dragGuide: { axis: 'v' | 'h'; pos: number; index: number | null } | null = null;
  disposed = false;

  constructor(el: HTMLCanvasElement, host: HTMLElement) {
    this.host = host;
    this.canvas = new StudioCanvas(el, {
      width: host.clientWidth,
      height: host.clientHeight,
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
      fireRightClick: true,
      stopContextMenu: true,
      selectionColor: 'rgba(110,139,255,0.08)',
      selectionBorderColor: ACCENT,
      selectionLineWidth: 1,
      targetFindTolerance: 4,
    });
    this.canvas.studio = this;
    FabricObject.ownDefaults.borderColor = ACCENT;
    FabricObject.ownDefaults.cornerColor = '#ffffff';
    FabricObject.ownDefaults.cornerStrokeColor = ACCENT;
    FabricObject.ownDefaults.cornerStyle = 'circle';
    FabricObject.ownDefaults.cornerSize = 9;
    FabricObject.ownDefaults.transparentCorners = false;
    FabricObject.ownDefaults.borderScaleFactor = 1.5;
    FabricObject.ownDefaults.padding = 0;

    this.ro = new ResizeObserver(() => this.resizeHost());
    this.ro.observe(host);
    this.bindEvents();
    window.addEventListener('pointerdown', this.onOutsidePointer, true);
  }

  /** Clicking any UI outside the canvas finishes in-place text editing. */
  private onOutsidePointer = (e: PointerEvent) => {
    const a = this.canvas.getActiveObject() as any;
    if (!a?.isEditing) return;
    if (this.host.contains(e.target as Node)) return;
    a.exitEditing();
    this.canvas.requestRenderAll();
  };

  dispose() {
    this.disposed = true;
    this.ro.disconnect();
    window.removeEventListener('pointerdown', this.onOutsidePointer, true);
    window.clearTimeout(this.propTimer);
    window.clearTimeout(this.saveTimer);
    this.thumbTimers.forEach((t) => window.clearTimeout(t));
    this.canvas.dispose();
  }

  /* ---------------- loading ---------------- */

  async load(project: Project) {
    this.project = project;
    project.guides ??= { v: [], h: [] };
    const thumbs: Record<string, string> = {};
    project.pages.forEach((p) => p.thumb && (thumbs[p.id] = p.thumb));
    set({ project, pageIndex: 0, thumbs, saveState: 'saved' });
    await this.showPage(0, false);
    this.fit();
    // Backfill missing thumbnails (new or imported projects)
    project.pages.forEach((p, i) => !p.thumb && this.queueThumb(i, 50 * i));
  }

  get page(): PageData {
    return this.project.pages[this.pageIndex];
  }

  serialize(): any[] {
    return ((this.canvas.toObject(CUSTOM_PROPS) as any).objects || []) as any[];
  }

  private syncPage() {
    this.page.objects = this.serialize();
  }

  private async showPage(i: number, sync = true) {
    if (sync && this.project.pages[this.pageIndex]) this.syncPage();
    this.pageIndex = clamp(i, 0, this.project.pages.length - 1);
    const page = this.page;
    this.restoring = true;
    this.canvas.discardActiveObject();
    this.canvas.remove(...this.canvas.getObjects());
    const objs = await enliven(page.objects);
    if (this.disposed) return;
    objs.forEach((o) => this.canvas.add(o));
    this.restoring = false;
    if (!this.history.has(page.id)) {
      const first = this.snap();
      this.history.set(page.id, { stack: [first], keys: [JSON.stringify(first)], index: 0 });
    }
    this.canvas.requestRenderAll();
    set({ pageIndex: this.pageIndex });
    this.bump(true);
  }

  /* ---------------- history & persistence ---------------- */

  private snap(): Snapshot {
    return { objects: this.serialize(), background: this.page.background };
  }

  private hist() {
    let h = this.history.get(this.page.id);
    if (!h) {
      const first = this.snap();
      h = { stack: [first], keys: [JSON.stringify(first)], index: 0 };
      this.history.set(this.page.id, h);
    }
    return h;
  }

  /** Record the current page state as one undoable step and autosave. */
  commit() {
    if (this.restoring || this.disposed) return;
    window.clearTimeout(this.propTimer);
    const h = this.hist();
    const next = this.snap();
    const key = JSON.stringify(next);
    // Several fabric events can describe one user action (e.g. editing:exited
    // + object:modified). Identical states never become separate undo steps.
    if (key === h.keys?.[h.index]) {
      this.syncPage();
      this.bump(true);
      return;
    }
    h.stack = h.stack.slice(0, h.index + 1);
    h.keys = (h.keys ?? []).slice(0, h.index + 1);
    h.stack.push(next);
    h.keys.push(key);
    if (h.keys.length > HISTORY_LIMIT) h.keys.shift();
    if (h.stack.length > HISTORY_LIMIT) h.stack.shift();
    h.index = h.stack.length - 1;
    this.syncPage();
    this.scheduleSave();
    this.queueThumb(this.pageIndex);
    this.bump(true);
  }

  /** For continuous controls (sliders, colour drags): commit once input settles. */
  commitSoon(ms = 350) {
    window.clearTimeout(this.propTimer);
    this.propTimer = window.setTimeout(() => this.commit(), ms);
  }

  private async restore(s: Snapshot) {
    this.nodeTarget = null;
    set({ nodeEditing: false });
    this.restoring = true;
    this.canvas.discardActiveObject();
    this.canvas.remove(...this.canvas.getObjects());
    const objs = await enliven(s.objects);
    objs.forEach((o) => this.canvas.add(o));
    this.page.background = s.background;
    this.restoring = false;
    this.syncPage();
    this.canvas.requestRenderAll();
    this.scheduleSave();
    this.queueThumb(this.pageIndex);
    this.bump(true);
  }

  async undo() {
    window.clearTimeout(this.propTimer);
    const h = this.hist();
    if (h.index <= 0) return;
    h.index--;
    await this.restore(h.stack[h.index]);
  }

  async redo() {
    const h = this.hist();
    if (h.index >= h.stack.length - 1) return;
    h.index++;
    await this.restore(h.stack[h.index]);
  }

  scheduleSave(ms = 600) {
    if (this.disposed) return; // a closed editor must never overwrite newer dashboard edits
    set({ saveState: 'dirty' });
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveNow(), ms);
  }

  /** Persist immediately. Also used as the final flush when the editor closes. */
  async saveNow() {
    window.clearTimeout(this.saveTimer);
    if (!this.project || this.canvas.destroyed) return;
    set({ saveState: 'saving' });
    try {
      this.syncPage();
      this.project.updatedAt = Date.now();
      this.project.thumbnail = this.project.pages[0]?.thumb ?? this.project.thumbnail;
      await putProject(this.project);
      set({ saveState: 'saved', project: { ...this.project } });
    } catch (err) {
      console.error(err);
      set({ saveState: 'error' });
    }
  }

  private queueThumb(index: number, delay = 900) {
    const id = this.project.pages[index]?.id;
    if (!id) return;
    window.clearTimeout(this.thumbTimers.get(id));
    this.thumbTimers.set(id, window.setTimeout(async () => {
      this.thumbTimers.delete(id);
      const page = this.project.pages.find((p) => p.id === id);
      if (!page || this.disposed) return;
      try {
        const t = await renderThumb(this.project, page, 320);
        if (this.disposed) return;
        page.thumb = t;
        if (page === this.project.pages[0]) this.project.thumbnail = t;
        set((s) => ({ thumbs: { ...s.thumbs, [page.id]: t } }));
        this.scheduleSave(200);
      } catch (e) {
        console.warn('thumbnail failed', e);
      }
    }, delay));
  }

  bump(objects = false) {
    const h = this.project ? this.history.get(this.page?.id) : undefined;
    set((s) => ({
      selVersion: s.selVersion + 1,
      objVersion: objects ? s.objVersion + 1 : s.objVersion,
      canUndo: !!h && h.index > 0,
      canRedo: !!h && h.index < h.stack.length - 1,
    }));
  }

  private bumpRaf() {
    if (this.rafBump) return;
    this.rafBump = requestAnimationFrame(() => {
      this.rafBump = 0;
      this.bump();
    });
  }

  /* ---------------- viewport ---------------- */

  onViewport(cb: () => void) {
    this.viewportListeners.add(cb);
    return () => this.viewportListeners.delete(cb);
  }

  private emitViewport() {
    set({ zoom: this.canvas.getZoom() });
    this.viewportListeners.forEach((cb) => cb());
  }

  private resizeHost() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    const prevW = this.canvas.width;
    const prevH = this.canvas.height;
    this.canvas.setDimensions({ width: w, height: h });
    const v = this.canvas.viewportTransform;
    v[4] += (w - prevW) / 2;
    v[5] += (h - prevH) / 2;
    this.canvas.setViewportTransform(v);
    if (this.autoFit) this.fit();
    else this.emitViewport();
  }

  fit() {
    this.autoFit = true;
    if (!this.project) return;
    const pad = 64;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const z = clamp(Math.min((w - pad * 2) / this.project.width, (h - pad * 2) / this.project.height), 0.02, 4);
    this.canvas.setViewportTransform([z, 0, 0, z, (w - this.project.width * z) / 2, (h - this.project.height * z) / 2]);
    this.emitViewport();
  }

  setZoom(z: number, at?: Point) {
    this.autoFit = false;
    z = clamp(z, 0.02, 16);
    const p = at ?? new Point(this.canvas.width / 2, this.canvas.height / 2);
    this.canvas.zoomToPoint(p, z);
    this.emitViewport();
  }

  zoomBy(f: number) {
    this.setZoom(this.canvas.getZoom() * f);
  }

  /** Scene → screen (relative to the host element). */
  toScreen(x: number, y: number) {
    const v = this.canvas.viewportTransform;
    return { x: x * v[0] + v[4], y: y * v[3] + v[5] };
  }
  toScene(x: number, y: number) {
    const v = this.canvas.viewportTransform;
    return { x: (x - v[4]) / v[0], y: (y - v[5]) / v[3] };
  }

  /* ---------------- drawing hooks ---------------- */

  drawArtboard(ctx: CanvasRenderingContext2D) {
    if (!this.project) return;
    const v = this.canvas.viewportTransform;
    const { width, height } = this.project;
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 4;
    const bg = this.page?.background;
    ctx.fillStyle = bg ?? '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.shadowColor = 'transparent';
    const garment = this.garmentBackdrop();
    if (garment) {
      ctx.drawImage(garment, 0, 0, width, height);
    } else if (!bg) {
      // checkerboard drawn in screen pixels so it stays crisp at any zoom
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      ctx.scale(1 / v[0], 1 / v[3]);
      ctx.fillStyle = checkerPattern(ctx);
      ctx.fillRect(0, 0, width * v[0], height * v[3]);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------------- garment projects ---------------- */

  /** The current page's garment piece (garment projects only). */
  garmentPiece() {
    const g = this.project?.garment;
    if (!g) return null;
    const piece = g.pages[this.page.id];
    return piece ? g.catalog.print_areas.find((a) => a.piece === piece) ?? null : null;
  }

  private garmentBackdrop() {
    const g = this.project?.garment;
    const area = this.garmentPiece();
    if (!g || !area) return null;
    const key = `${g.productId}|${area.piece}|${g.colorId}`;
    if (this.backdrop?.key !== key) {
      const slot: { key: string; canvas: HTMLCanvasElement | null } = { key, canvas: this.backdrop?.canvas ?? null };
      this.backdrop = slot;
      renderPiece(g.catalog, area.piece, g.colorId, null, { size: 1400, noArt: true })
        .then((c) => {
          if (this.backdrop !== slot) return;
          slot.canvas = c;
          this.canvas.requestRenderAll();
        })
        .catch(() => {
          /* offline: plain artboard */
        });
    }
    return this.backdrop.canvas;
  }

  /** Dashed print areas with labels; the garment outside them is dimmed (it won't be printed). */
  private drawPlacements(ctx: CanvasRenderingContext2D, z: number) {
    const area = this.garmentPiece();
    if (!area) return;
    const k = this.project.width / this.project.garment!.catalog.canvas.width;
    const trace = (b: { left: number; top: number; width: number; height: number; angle: number }) => {
      const cx = (b.left + b.width / 2) * k, cy = (b.top + b.height / 2) * k, a = ((b.angle || 0) * Math.PI) / 180;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
        const x = (sx * b.width * k) / 2, y = (sy * b.height * k) / 2;
        return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
      });
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.project.width, this.project.height);
    area.placements.forEach((p) => trace(p.design_area));
    ctx.fillStyle = 'rgba(17,17,17,0.28)';
    ctx.fill('evenodd');
    ctx.beginPath();
    area.placements.forEach((p) => trace(p.design_area));
    ctx.setLineDash([6 / z, 5 / z]);
    ctx.lineWidth = 1.5 / z;
    ctx.strokeStyle = '#8b6cff';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `600 ${11 / z}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#8b6cff';
    area.placements.forEach((p) => ctx.fillText(p.title, p.design_area.left * k, p.design_area.top * k - 6 / z));
    ctx.restore();
  }

  /** Change garment colour / realism; saved with the project. */
  setGarment(patch: Partial<Pick<NonNullable<Project['garment']>, 'colorId' | 'realism'>>) {
    const g = this.project.garment;
    if (!g) return;
    Object.assign(g, patch);
    set({ project: { ...this.project } });
    this.canvas.requestRenderAll();
    this.scheduleSave();
    this.bump();
  }

  /** Current page rendered as a canvas (for mockups / print files). */
  async pageCanvas(i = this.pageIndex, scale = 1) {
    this.syncPage();
    const { renderPageCanvas } = await import('../lib/render');
    return renderPageCanvas(this.project, this.project.pages[i], scale);
  }

  drawOverlay(ctx: CanvasRenderingContext2D) {
    if (!this.project) return;
    const v = this.canvas.viewportTransform;
    const z = v[0];
    const { width, height } = this.project;
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);

    // Dim everything outside the artboard (objects stay visible but subdued)
    ctx.beginPath();
    ctx.rect(-1e6, -1e6, 2e6, 2e6);
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = 'rgba(17,17,17,0.78)';
    ctx.fill('evenodd');
    this.drawPlacements(ctx, z);
    // hairline page edge so dark or transparent pages stay legible against the workspace
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1 / z;
    ctx.strokeRect(0, 0, width, height);

    const { showGrid, gridSize } = get();
    if (showGrid && gridSize * z >= 4) {
      ctx.beginPath();
      for (let x = gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.strokeStyle = 'rgba(110,139,255,0.35)';
      ctx.lineWidth = 1 / z;
      ctx.stroke();
    }

    // Ruler guides
    const g = this.project.guides!;
    ctx.lineWidth = 1 / z;
    ctx.strokeStyle = 'rgba(0,200,255,0.9)';
    ctx.beginPath();
    g.v.forEach((x, i) => {
      if (this.dragGuide?.axis === 'v' && this.dragGuide.index === i) return;
      ctx.moveTo(x, -1e5);
      ctx.lineTo(x, 1e5);
    });
    g.h.forEach((y, i) => {
      if (this.dragGuide?.axis === 'h' && this.dragGuide.index === i) return;
      ctx.moveTo(-1e5, y);
      ctx.lineTo(1e5, y);
    });
    if (this.dragGuide) {
      const p = this.dragGuide.pos;
      if (this.dragGuide.axis === 'v') {
        ctx.moveTo(p, -1e5);
        ctx.lineTo(p, 1e5);
      } else {
        ctx.moveTo(-1e5, p);
        ctx.lineTo(1e5, p);
      }
    }
    ctx.stroke();

    // Brush cursor (+ its symmetric copies)
    if (this.brush?.cursor) {
      const st = get().brushStyle;
      const r = st.size / 2;
      const cx = this.project.width / 2, cy = this.project.height / 2;
      const p0 = this.brush.cursor;
      const pts: { x: number; y: number }[] = [p0];
      if (st.symmetry === 'x' || st.symmetry === 'quad') pts.push({ x: 2 * cx - p0.x, y: p0.y });
      if (st.symmetry === 'y' || st.symmetry === 'quad') pts.push({ x: p0.x, y: 2 * cy - p0.y });
      if (st.symmetry === 'quad') pts.push({ x: 2 * cx - p0.x, y: 2 * cy - p0.y });
      if (st.symmetry === 'radial') {
        const n = Math.max(2, Math.round(st.radial));
        for (let k = 1; k < n; k++) {
          const a = (k * 2 * Math.PI) / n, dx = p0.x - cx, dy = p0.y - cy;
          pts.push({ x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) });
        }
      }
      ctx.save();
      ctx.lineWidth = 1.2 / z;
      pts.forEach((q, i) => {
        ctx.strokeStyle = i ? 'rgba(139,108,255,.55)' : '#ffffff';
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      if (st.symmetry !== 'none') {
        ctx.setLineDash([6 / z, 6 / z]);
        ctx.strokeStyle = 'rgba(139,108,255,.6)';
        ctx.beginPath();
        if (st.symmetry === 'x' || st.symmetry === 'quad' || st.symmetry === 'radial') (ctx.moveTo(cx, 0), ctx.lineTo(cx, this.project.height));
        if (st.symmetry === 'y' || st.symmetry === 'quad' || st.symmetry === 'radial') (ctx.moveTo(0, cy), ctx.lineTo(this.project.width, cy));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Pen tool preview
    if (this.pen && this.pen.pts.length) {
      const pts = this.pen.pts;
      ctx.lineWidth = 1.5 / z;
      ctx.strokeStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const c1 = a.hout ?? a;
        const c2 = b.hin ?? b;
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y);
      }
      const last = pts[pts.length - 1];
      if (this.pen.cursor && !this.pen.drag) {
        const c1 = last.hout ?? last;
        ctx.bezierCurveTo(c1.x, c1.y, this.pen.cursor.x, this.pen.cursor.y, this.pen.cursor.x, this.pen.cursor.y);
      }
      ctx.stroke();
      for (const p of pts) {
        for (const h of [p.hin, p.hout]) {
          if (!h) continue;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(h.x, h.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(h.x, h.y, 3 / z, 0, Math.PI * 2);
          ctx.fillStyle = ACCENT;
          ctx.fill();
        }
      }
      pts.forEach((p, i) => {
        const r = (i === 0 && pts.length > 2 ? 6 : 4) / z;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2);
      });
    }

    // Smart snapping lines
    if (this.snapLines.length) {
      ctx.strokeStyle = GUIDE;
      ctx.beginPath();
      for (const l of this.snapLines) {
        if (l.axis === 'x') {
          ctx.moveTo(l.pos, l.from);
          ctx.lineTo(l.pos, l.to);
        } else {
          ctx.moveTo(l.from, l.pos);
          ctx.lineTo(l.to, l.pos);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- events ---------------- */

  private bindEvents() {
    const c = this.canvas;
    c.on('selection:created', () => this.bump());
    c.on('selection:updated', () => this.bump());
    c.on('selection:cleared', () => this.bump());
    c.on('object:moving', (e) => {
      this.snapMove(e.target);
      this.bumpRaf();
    });
    c.on('object:scaling', () => this.bumpRaf());
    c.on('object:rotating', (e) => {
      if ((e.e as MouseEvent).shiftKey) e.target.set('angle', Math.round(e.target.angle / 15) * 15);
      this.bumpRaf();
    });
    c.on('object:modified', (e) => {
      this.snapLines = [];
      this.normalizeTextScale(e.target);
      this.commit();
    });
    c.on('text:changed', (e) => {
      const t = e.target as any;
      if (t?.warp && t.warp.kind !== 'path') this.applyWarp(t);
      this.bumpRaf();
    });
    c.on('text:editing:exited', () => this.commit());
    c.on('mouse:up', () => {
      if (this.snapLines.length) {
        this.snapLines = [];
        c.requestRenderAll();
      }
    });

    c.on('mouse:wheel', (opt: TPointerEventInfo<WheelEvent>) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        const z = c.getZoom() * Math.pow(0.995, e.deltaY);
        this.setZoom(z, c.getViewportPoint(e));
      } else {
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
        c.relativePan(new Point(-dx, -dy));
        this.autoFit = false;
        this.emitViewport();
      }
    });

    c.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      set({ menu: null });
      if (this.pen && e.button === 0 && !this.spaceDown) {
        this.penDown(opt.scenePoint);
        return;
      }
      if (this.brush && e.button === 0 && !this.spaceDown) {
        this.painting = true;
        this.brush.down(opt.scenePoint, penPressure(e));
        return;
      }
      if (e.button === 2) {
        const t = opt.target;
        if (t && !c.getActiveObjects().includes(t)) c.setActiveObject(t);
        if (!t) c.discardActiveObject();
        c.requestRenderAll();
        set({ menu: { x: e.clientX, y: e.clientY } });
        return;
      }
      if (this.spaceDown || e.button === 1) {
        this.panning = { x: e.clientX, y: e.clientY };
        c.selection = false;
        c.discardActiveObject();
        c.setCursor('grabbing');
        return;
      }
      if (!opt.target) {
        const hit = this.guideAt(opt.viewportPoint.x, opt.viewportPoint.y);
        if (hit) {
          c.selection = false;
          this.dragGuide = { ...hit, pos: hit.axis === 'v' ? this.project.guides!.v[hit.index!] : this.project.guides!.h[hit.index!] };
        }
      }
    });
    c.on('mouse:move', (opt) => {
      const e = opt.e as MouseEvent;
      if (this.pen && !this.panning) {
        this.penMove(opt.scenePoint);
        if (!this.spaceDown) return;
      }
      if (this.brush && !this.panning) {
        if (this.painting) this.brush.move(opt.scenePoint, penPressure(e));
        else {
          this.brush.cursor = opt.scenePoint;
          c.requestRenderAll();
        }
        if (!this.spaceDown) return;
      }
      if (this.panning) {
        this.autoFit = false;
        c.relativePan(new Point(e.clientX - this.panning.x, e.clientY - this.panning.y));
        this.panning = { x: e.clientX, y: e.clientY };
        this.emitViewport();
        return;
      }
      if (this.dragGuide) {
        const p = this.toScene(opt.viewportPoint.x, opt.viewportPoint.y);
        this.dragGuide.pos = Math.round(this.dragGuide.axis === 'v' ? p.x : p.y);
        c.requestRenderAll();
        this.emitViewport();
        return;
      }
      if (!opt.target && !this.spaceDown) {
        const hit = this.guideAt(opt.viewportPoint.x, opt.viewportPoint.y);
        c.setCursor(hit ? (hit.axis === 'v' ? 'ew-resize' : 'ns-resize') : 'default');
      }
    });
    c.on('mouse:dblclick', (opt) => {
      if (this.pen) return this.finishPen(false);
      const t = opt.target;
      if (t && (t instanceof Path || t instanceof Polygon || t instanceof Polyline) && !(t as any).locked) this.editNodes(t);
    });
    // A closed path's start anchor and its closing segment's end anchor coincide;
    // keep them welded so dragging either one moves both.
    c.on('object:modifyPath' as any, (e: any) => {
      const p = e.target as Path;
      if (p !== this.nodeTarget || !(p instanceof Path)) return;
      const path = p.path as any[];
      const first = path[0];
      const last = path[path.length - 1];
      const w = this.weld;
      if (!w || first?.[0] !== 'M' || !last || last.length < 3) return;
      const lx = last[last.length - 2];
      const ly = last[last.length - 1];
      if (e.commandIndex === 0 || (first[1] !== w.x || first[2] !== w.y)) {
        last[last.length - 2] = first[1];
        last[last.length - 1] = first[2];
      } else if (lx !== w.x || ly !== w.y) {
        first[1] = lx;
        first[2] = ly;
      }
      this.weld = { x: first[1], y: first[2] };
    });
    c.on('selection:cleared', () => this.exitNodeEdit());
    c.on('selection:updated', () => this.exitNodeEdit());
    c.on('path:created', (e: any) => {
      const p = e.path as Path;
      (p as any).id = uid('o_');
      (p as any).name = this.nameFor('Drawing');
      p.set({ strokeUniform: true });
      this.commit();
    });
    c.on('mouse:up', (opt) => {
      if (this.pen) this.pen.drag = false;
      if (this.brush && this.painting) {
        this.painting = false;
        this.brush.up();
        return;
      }
      if (this.panning) {
        this.panning = null;
        c.selection = true;
        c.setCursor(this.spaceDown ? 'grab' : 'default');
      }
      if (this.dragGuide) {
        const e = opt.e as MouseEvent;
        const rect = this.host.getBoundingClientRect();
        const overRuler = this.dragGuide.axis === 'v' ? e.clientY - rect.top < 0 : e.clientX - rect.left < 0;
        this.finishGuideDrag(!overRuler);
        c.selection = true;
      }
    });
  }

  setSpace(down: boolean) {
    this.spaceDown = down;
    this.canvas.defaultCursor = down ? 'grab' : 'default';
    this.canvas.setCursor(down ? 'grab' : 'default');
    this.canvas.skipTargetFind = down;
  }

  /* ---------------- guides ---------------- */

  private guideAt(sx: number, sy: number): { axis: 'v' | 'h'; index: number } | null {
    const g = this.project?.guides;
    if (!g) return null;
    const tol = 4;
    for (let i = 0; i < g.v.length; i++) if (Math.abs(this.toScreen(g.v[i], 0).x - sx) <= tol) return { axis: 'v', index: i };
    for (let i = 0; i < g.h.length; i++) if (Math.abs(this.toScreen(0, g.h[i]).y - sy) <= tol) return { axis: 'h', index: i };
    return null;
  }

  startGuideFromRuler(axis: 'v' | 'h', clientX: number, clientY: number) {
    const rect = this.host.getBoundingClientRect();
    const p = this.toScene(clientX - rect.left, clientY - rect.top);
    this.dragGuide = { axis, index: null, pos: Math.round(axis === 'v' ? p.x : p.y) };
    const move = (e: MouseEvent) => {
      const q = this.toScene(e.clientX - rect.left, e.clientY - rect.top);
      if (this.dragGuide) this.dragGuide.pos = Math.round(axis === 'v' ? q.x : q.y);
      this.canvas.requestRenderAll();
      this.emitViewport();
    };
    const up = (e: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const inside = axis === 'v' ? e.clientY - rect.top > 0 : e.clientX - rect.left > 0;
      this.finishGuideDrag(inside);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  private finishGuideDrag(keep: boolean) {
    const d = this.dragGuide;
    if (!d) return;
    const list = d.axis === 'v' ? this.project.guides!.v : this.project.guides!.h;
    if (d.index !== null) list.splice(d.index, 1);
    if (keep) list.push(d.pos);
    this.dragGuide = null;
    this.canvas.requestRenderAll();
    this.emitViewport();
    this.scheduleSave();
  }

  clearGuides() {
    this.project.guides = { v: [], h: [] };
    this.canvas.requestRenderAll();
    this.emitViewport();
    this.scheduleSave();
  }

  /* ---------------- snapping ---------------- */

  private snapMove(target: FabricObject) {
    this.snapLines = [];
    if (!get().snapping || !this.project) return;
    const z = this.canvas.getZoom();
    const thr = 6 / z;
    const moving = new Set<FabricObject>(target instanceof ActiveSelection ? target.getObjects() : [target]);
    const xs: { v: number; from: number; to: number }[] = [];
    const ys: { v: number; from: number; to: number }[] = [];
    const W = this.project.width;
    const H = this.project.height;
    [0, W / 2, W].forEach((v) => xs.push({ v, from: 0, to: H }));
    [0, H / 2, H].forEach((v) => ys.push({ v, from: 0, to: W }));
    this.project.guides?.v.forEach((v) => xs.push({ v, from: -1e5, to: 1e5 }));
    this.project.guides?.h.forEach((v) => ys.push({ v, from: -1e5, to: 1e5 }));
    for (const o of this.canvas.getObjects()) {
      if (moving.has(o) || !o.visible) continue;
      const b = o.getBoundingRect();
      [b.left, b.left + b.width / 2, b.left + b.width].forEach((v) => xs.push({ v, from: b.top, to: b.top + b.height }));
      [b.top, b.top + b.height / 2, b.top + b.height].forEach((v) => ys.push({ v, from: b.left, to: b.left + b.width }));
    }
    const b = target.getBoundingRect();
    const edgesX = [b.left, b.left + b.width / 2, b.left + b.width];
    const edgesY = [b.top, b.top + b.height / 2, b.top + b.height];
    let bestX: { d: number; c: (typeof xs)[0] } | null = null;
    for (const c of xs) for (const e of edgesX) {
      const d = c.v - e;
      if (Math.abs(d) < thr && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, c };
    }
    let bestY: { d: number; c: (typeof ys)[0] } | null = null;
    for (const c of ys) for (const e of edgesY) {
      const d = c.v - e;
      if (Math.abs(d) < thr && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, c };
    }
    if (bestX) target.set('left', target.left + bestX.d);
    if (bestY) target.set('top', target.top + bestY.d);
    if (bestX || bestY) target.setCoords();
    const nb = target.getBoundingRect();
    if (bestX) {
      const from = Math.min(bestX.c.from, nb.top);
      const to = Math.max(bestX.c.to, nb.top + nb.height);
      this.snapLines.push({ axis: 'x', pos: bestX.c.v, from: Math.max(from, -1e4), to: Math.min(to, 1e4) });
    }
    if (bestY) {
      const from = Math.min(bestY.c.from, nb.left);
      const to = Math.max(bestY.c.to, nb.left + nb.width);
      this.snapLines.push({ axis: 'y', pos: bestY.c.v, from: Math.max(from, -1e4), to: Math.min(to, 1e4) });
    }
  }

  /** Corner-scaling a textbox should change its font size, not stretch glyphs. */
  private normalizeTextScale(t: FabricObject | undefined) {
    if (!(t instanceof Textbox)) return;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    if (Math.abs(sx - 1) < 1e-3 && Math.abs(sy - 1) < 1e-3) return;
    if (Math.abs(sx - sy) > 1e-3) return; // non-uniform (user stretched) — keep
    t.set({ fontSize: Math.round(t.fontSize * sx * 10) / 10, width: t.width * sx, scaleX: 1, scaleY: 1 });
    t.initDimensions();
    t.setCoords();
  }

  /* ---------------- helpers ---------------- */

  active(): FabricObject | undefined {
    return this.canvas.getActiveObject();
  }

  objects() {
    return this.canvas.getObjects();
  }

  private place(o: FabricObject, opts: { fit?: number; at?: { x: number; y: number } } = {}) {
    const { width, height } = this.project;
    const fit = opts.fit ?? 0.6;
    const ow = o.getScaledWidth();
    const oh = o.getScaledHeight();
    const maxW = width * fit;
    const maxH = height * fit;
    if (ow > maxW || oh > maxH) {
      const s = Math.min(maxW / ow, maxH / oh);
      o.scaleX = (o.scaleX ?? 1) * s;
      o.scaleY = (o.scaleY ?? 1) * s;
    }
    const at = opts.at ?? { x: width / 2, y: height / 2 };
    o.setPositionByOrigin(new Point(at.x, at.y), 'center', 'center');
    o.setCoords();
  }

  private nameFor(base: string) {
    const n = this.canvas.getObjects().filter((o) => ((o as any).name || '').startsWith(base)).length;
    return n ? `${base} ${n + 1}` : base;
  }

  addObject(o: FabricObject, opts?: { fit?: number; at?: { x: number; y: number }; name?: string }) {
    (o as any).id ??= uid('o_');
    (o as any).name ??= this.nameFor(opts?.name ?? (o.type === 'textbox' ? 'Text' : o.type));
    this.place(o, opts);
    this.canvas.add(o);
    this.canvas.setActiveObject(o);
    this.canvas.requestRenderAll();
    this.commit();
    return o;
  }

  /* ---------------- add content ---------------- */

  async addText(preset: { text: string; fontFamily: string; fontWeight?: number; size: number; letterSpacing?: number; fill?: string; align?: string; uppercase?: boolean; name?: string }, at?: { x: number; y: number }) {
    await ensureFont(preset.fontFamily, preset.fontWeight ?? 400);
    const W = this.project.width;
    const fontSize = Math.round(preset.size * (Math.min(W, this.project.height) / 1080));
    const t = new Textbox(preset.uppercase ? preset.text.toUpperCase() : preset.text, {
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight ?? 400,
      fontSize,
      fill: preset.fill ?? (this.page.background && isDark(this.page.background) ? '#ffffff' : '#111111'),
      textAlign: (preset.align as any) ?? 'center',
      charSpacing: preset.letterSpacing ?? 0,
      lineHeight: 1.1,
      width: W * 0.9,
      splitByGrapheme: false,
    });
    // size the box to the real rendered line (with tracking) so single lines never wrap
    t.initDimensions();
    const natural = Math.max(...(t as any)._textLines.map((_: any, i: number) => t.getLineWidth(i)));
    t.set({ width: Math.min(W * 0.9, Math.max(natural + fontSize * 0.1, fontSize * 2)) });
    t.initDimensions();
    return this.addObject(t, { at, fit: 0.9, name: preset.name ?? (preset.size >= 80 ? 'Heading' : preset.size >= 40 ? 'Subheading' : 'Text') });
  }

  addShape(kind: ShapeKind, at?: { x: number; y: number }) {
    const size = Math.min(this.project.width, this.project.height) * 0.3;
    const o = makeShape(kind, size);
    return this.addObject(o, { at, name: o.get('name') as string });
  }

  /** Insert SVG markup as editable vectors (single shape, or a group). */
  async addSVG(text: string, name: string, at?: { x: number; y: number }, fit = 0.6) {
    const { objects, options } = await loadSVGFromString(text);
    const valid = objects.filter(Boolean) as FabricObject[];
    if (!valid.length) throw new Error('This SVG contains no drawable shapes.');
    const g = util.groupSVGElements(valid, options);
    return this.addObject(g, { at, name, fit });
  }

  /* ---------------- brand kits ---------------- */

  /** Text role by relative size: top tier → heading, middle → subheading, rest → body. */
  private textRoles() {
    const texts = this.canvas.getObjects().filter((o) => o instanceof IText) as IText[];
    const size = (t: IText) => t.fontSize * Math.max(t.scaleX ?? 1, t.scaleY ?? 1);
    const max = Math.max(0, ...texts.map(size));
    return texts.map((t) => ({ t, role: (size(t) >= max * 0.6 ? 'heading' : size(t) >= max * 0.32 ? 'subheading' : 'body') as 'heading' | 'subheading' | 'body' }));
  }

  private async fontProps(f: BrandFont, t?: IText) {
    const { findFont, closestWeight } = await import('../lib/fontCatalog');
    const w = closestWeight(findFont(f.family)?.weights ?? [f.weight], f.weight);
    await ensureFont(f.family, w);
    const props: Record<string, any> = { fontFamily: f.family, fontWeight: w };
    if (f.tracking !== undefined) props.charSpacing = f.tracking;
    if (t && f.caps) props.text = t.text.toUpperCase();
    return props;
  }

  async applyBrandFonts(brand: BrandKit, scope: 'selection' | 'design' = 'design') {
    const sel = new Set(this.canvas.getActiveObjects());
    const roles = this.textRoles().filter(({ t }) => scope === 'design' || sel.has(t));
    if (!roles.length) return 0;
    for (const { t, role } of roles) {
      const wasSingle = t instanceof Textbox && (t as any)._textLines?.length === 1 && !String(t.text).includes('\n');
      t.set(await this.fontProps(brand.fonts[role], t));
      if ((t as any).warp) this.applyWarp(t);
      else t.initDimensions();
      if (wasSingle) this.refitSingleLine(t as Textbox);
      t.setCoords();
    }
    this.canvas.requestRenderAll();
    this.commit();
    return roles.length;
  }

  async addBrandText(brand: BrandKit, role: 'heading' | 'subheading' | 'body') {
    const f = brand.fonts[role];
    const sample = { heading: brand.name, subheading: 'Subheading', body: 'Body copy in your brand voice.' }[role];
    const primary = brand.colors.find((c) => c.role === 'primary')?.hex;
    await this.addText({ text: f.caps ? sample.toUpperCase() : sample, fontFamily: f.family, fontWeight: f.weight, size: role === 'heading' ? 110 : role === 'subheading' ? 48 : 30, letterSpacing: f.tracking, fill: primary, name: role[0].toUpperCase() + role.slice(1) });
  }

  /** Map the design's colours (by prominence) onto the brand palette (by role order). */
  applyBrandColors(brand: BrandKit) {
    const order = ['primary', 'secondary', 'accent', 'neutral'];
    const palette = [...brand.colors].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)).map((c) => c.hex.toLowerCase());
    if (!palette.length) return 0;
    const counts = new Map<string, number>();
    const objs = this.canvas.getObjects();
    for (const o of objs) {
      const area = Math.max(1, o.getScaledWidth() * o.getScaledHeight());
      for (const c of this.colorsOf(o)) counts.set(c, (counts.get(c) ?? 0) + area);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const neutral = brand.colors.find((c) => c.role === 'neutral')?.hex;
    const map = new Map(ranked.map((c, i) => [c, palette[i % palette.length]]));
    // one lookup per colour value — sequential replacement would cascade (A→B, then B→C)
    const walk = (x: FabricObject) => {
      if (x instanceof Group) return x.getObjects().forEach(walk);
      for (const k of ['fill', 'stroke'] as const) {
        const v = (x as any)[k];
        if (typeof v === 'string' && map.has(v.toLowerCase())) x.set(k, map.get(v.toLowerCase()));
      }
      (x as any).__fxCache = undefined;
      x.dirty = true;
    };
    objs.forEach(walk);
    if (this.page.background && neutral) this.page.background = neutral;
    this.canvas.requestRenderAll();
    this.commit();
    return map.size;
  }

  /** Every distinct solid fill/stroke colour inside an object (recursing into groups). */
  colorsOf(o: FabricObject) {
    const set = new Map<string, number>();
    const walk = (x: FabricObject) => {
      if (x instanceof Group) return x.getObjects().forEach(walk);
      for (const k of ['fill', 'stroke'] as const) {
        const v = (x as any)[k];
        if (typeof v === 'string' && v && v !== 'none' && v !== 'transparent' && !(k === 'stroke' && !x.strokeWidth)) {
          const key = v.toLowerCase();
          set.set(key, (set.get(key) ?? 0) + 1);
        }
      }
    };
    walk(o);
    return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }

  /** Swap one colour for another everywhere inside the object. */
  replaceColor(o: FabricObject, from: string, to: string, live = false) {
    const walk = (x: FabricObject) => {
      if (x instanceof Group) return x.getObjects().forEach(walk);
      for (const k of ['fill', 'stroke'] as const) {
        const v = (x as any)[k];
        if (typeof v === 'string' && v.toLowerCase() === from) x.set(k, to);
      }
      x.dirty = true;
    };
    walk(o);
    o.dirty = true;
    (o as any).__fxCache = undefined;
    this.canvas.requestRenderAll();
    this.bump();
    if (live) this.commitSoon();
    else this.commit();
  }

  async addAsset(asset: Asset, at?: { x: number; y: number }) {
    if (asset.type === 'image/svg+xml') return this.addSVG(await asset.blob.text(), asset.name, at);
    const img = await FabricImage.fromURL(assetURL(asset));
    (img as any).assetId = asset.id;
    const frame = this.active();
    if (!at && frame && (frame as any).placeholder) return this.fillFrame(frame, img, asset.name);
    return this.addObject(img, { at, fit: 0.8, name: asset.name });
  }

  /** Fill a template photo frame: cover-crop the image to the frame and take its place. */
  private fillFrame(frame: FabricObject, img: FabricImage, name: string) {
    const fw = frame.getScaledWidth();
    const fh = frame.getScaledHeight();
    const iw = img.width;
    const ih = img.height;
    const s = Math.max(fw / iw, fh / ih);
    const cw = fw / s;
    const ch = fh / s;
    img.set({ cropX: (iw - cw) / 2, cropY: (ih - ch) / 2, width: cw, height: ch, scaleX: s, scaleY: s, angle: frame.angle ?? 0 });
    if ((frame as any).rx) img.set({ clipPath: new Rect({ width: cw, height: ch, rx: (frame as any).rx / s, ry: (frame as any).ry / s, originX: 'center', originY: 'center' }) } as any);
    (img as any).id = uid('o_');
    (img as any).name = name;
    img.setPositionByOrigin(frame.getCenterPoint(), 'center', 'center');
    img.setCoords();
    const idx = this.canvas.getObjects().indexOf(frame);
    this.canvas.discardActiveObject();
    this.canvas.remove(frame);
    this.canvas.insertAt(Math.max(0, idx), img);
    this.canvas.setActiveObject(img);
    this.canvas.requestRenderAll();
    this.commit();
    return img;
  }

  /* ---------------- selection operations ---------------- */

  selectAll() {
    const objs = this.canvas.getObjects().filter((o) => o.visible && !(o as any).locked);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(objs.length === 1 ? objs[0] : new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
  }

  select(objs: FabricObject[]) {
    this.canvas.discardActiveObject();
    const sel = objs.filter((o) => o.visible);
    if (sel.length === 1) this.canvas.setActiveObject(sel[0]);
    else if (sel.length > 1) this.canvas.setActiveObject(new ActiveSelection(sel, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.bump();
  }

  deselect() {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  remove(objs = this.canvas.getActiveObjects()) {
    const list = objs.filter((o) => !(o as any).locked);
    if (!list.length) return;
    this.canvas.discardActiveObject();
    this.canvas.remove(...list);
    this.canvas.requestRenderAll();
    this.commit();
  }

  private selectionJSON() {
    // Serialize in canvas space (realizes ActiveSelection transforms)
    const active = new Set(this.canvas.getActiveObjects());
    return this.serialize().filter((_, i) => active.has(this.canvas.getObjects()[i]));
  }

  copy() {
    const json = this.selectionJSON();
    if (!json.length) return false;
    this.clipboard = json;
    this.pasteCount = 0;
    return true;
  }

  cut() {
    if (this.copy()) this.remove();
  }

  async paste() {
    if (!this.clipboard.length) return;
    this.pasteCount++;
    await this.insertJSON(this.clipboard, 20 * this.pasteCount);
  }

  async duplicate() {
    const json = this.selectionJSON();
    if (!json.length) return;
    await this.insertJSON(json, 24);
  }

  private async insertJSON(json: any[], offset: number) {
    const objs = await enliven(json);
    this.canvas.discardActiveObject();
    for (const o of objs) {
      (o as any).id = uid('o_');
      o.set({ left: o.left + offset, top: o.top + offset });
      applyLock(o, false);
      o.setCoords();
      this.canvas.add(o);
    }
    this.select(objs);
    this.commit();
  }

  group() {
    const objs = this.canvas.getActiveObjects();
    if (objs.length < 2) return;
    const all = this.canvas.getObjects();
    const top = Math.max(...objs.map((o) => all.indexOf(o)));
    const ordered = [...objs].sort((a, b) => all.indexOf(a) - all.indexOf(b));
    this.canvas.discardActiveObject();
    const insertAt = top - (ordered.length - 1);
    this.canvas.remove(...ordered);
    const g = new Group(ordered);
    (g as any).id = uid('o_');
    (g as any).name = this.nameFor('Group');
    this.canvas.insertAt(Math.max(0, insertAt), g);
    this.canvas.setActiveObject(g);
    this.canvas.requestRenderAll();
    this.commit();
  }

  ungroup() {
    const g = this.active();
    if (!(g instanceof Group) || g instanceof ActiveSelection) return;
    const idx = this.canvas.getObjects().indexOf(g);
    this.canvas.discardActiveObject();
    const items = g.removeAll();
    this.canvas.remove(g);
    items.forEach((o, i) => this.canvas.insertAt(idx + i, o));
    this.select(items);
    this.commit();
  }

  toggleLock(objs = this.canvas.getActiveObjects()) {
    if (!objs.length) return;
    const lock = !objs.every((o) => (o as any).locked);
    objs.forEach((o) => applyLock(o, lock));
    this.canvas.requestRenderAll();
    this.commit();
  }

  toggleVisible(objs = this.canvas.getActiveObjects()) {
    if (!objs.length) return;
    const show = objs.some((o) => !o.visible);
    objs.forEach((o) => o.set('visible', show));
    if (!show) this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.commit();
  }

  rename(o: FabricObject, name: string) {
    (o as any).name = name.trim() || (o as any).name;
    this.commit();
  }

  flip(axis: 'x' | 'y') {
    const o = this.active();
    if (!o) return;
    if (axis === 'x') o.set('flipX', !o.flipX);
    else o.set('flipY', !o.flipY);
    this.canvas.requestRenderAll();
    this.commit();
  }

  /** z-order: kind = forward | backward | front | back */
  arrange(kind: 'forward' | 'backward' | 'front' | 'back') {
    const objs = this.canvas.getActiveObjects();
    if (!objs.length) return;
    const c = this.canvas;
    const all = () => c.getObjects();
    const sorted = [...objs].sort((a, b) => all().indexOf(a) - all().indexOf(b));
    if (kind === 'front') sorted.forEach((o) => c.bringObjectToFront(o));
    else if (kind === 'back') [...sorted].reverse().forEach((o) => c.sendObjectToBack(o));
    else if (kind === 'forward') [...sorted].reverse().forEach((o) => c.bringObjectForward(o));
    else sorted.forEach((o) => c.sendObjectBackwards(o));
    c.requestRenderAll();
    this.commit();
  }

  /** Move a layer to an absolute stacking index (0 = bottom). */
  moveLayer(o: FabricObject, index: number) {
    this.canvas.moveObjectTo(o, clamp(index, 0, this.canvas.getObjects().length - 1));
    this.canvas.requestRenderAll();
    this.commit();
  }

  /** Operate on canvas-space objects even when they're inside an ActiveSelection. */
  private withLooseSelection(fn: (objs: FabricObject[]) => void) {
    const objs = this.canvas.getActiveObjects();
    const wasMulti = objs.length > 1;
    if (wasMulti) this.canvas.discardActiveObject();
    fn(objs);
    objs.forEach((o) => o.setCoords());
    if (wasMulti) this.select(objs);
    this.canvas.requestRenderAll();
    this.commit();
  }

  align(kind: AlignKind) {
    const objs = this.canvas.getActiveObjects();
    if (!objs.length) return;
    this.withLooseSelection((list) => {
      let frame: { left: number; top: number; width: number; height: number };
      if (list.length === 1) frame = { left: 0, top: 0, width: this.project.width, height: this.project.height };
      else {
        const rects = list.map((o) => o.getBoundingRect());
        const l = Math.min(...rects.map((r) => r.left));
        const t = Math.min(...rects.map((r) => r.top));
        const r = Math.max(...rects.map((r) => r.left + r.width));
        const b = Math.max(...rects.map((r) => r.top + r.height));
        frame = { left: l, top: t, width: r - l, height: b - t };
      }
      for (const o of list) {
        if ((o as any).locked) continue;
        const r = o.getBoundingRect();
        let dx = 0;
        let dy = 0;
        if (kind === 'left') dx = frame.left - r.left;
        if (kind === 'hcenter') dx = frame.left + frame.width / 2 - (r.left + r.width / 2);
        if (kind === 'right') dx = frame.left + frame.width - (r.left + r.width);
        if (kind === 'top') dy = frame.top - r.top;
        if (kind === 'vcenter') dy = frame.top + frame.height / 2 - (r.top + r.height / 2);
        if (kind === 'bottom') dy = frame.top + frame.height - (r.top + r.height);
        o.set({ left: o.left + dx, top: o.top + dy });
      }
    });
  }

  alignToPage(kind: AlignKind) {
    const objs = this.canvas.getActiveObjects();
    if (objs.length !== 1) {
      // treat selection as one block
      const sel = this.active();
      if (!sel) return;
      const r = sel.getBoundingRect();
      const W = this.project.width;
      const H = this.project.height;
      const dx = kind === 'left' ? -r.left : kind === 'hcenter' ? W / 2 - (r.left + r.width / 2) : kind === 'right' ? W - (r.left + r.width) : 0;
      const dy = kind === 'top' ? -r.top : kind === 'vcenter' ? H / 2 - (r.top + r.height / 2) : kind === 'bottom' ? H - (r.top + r.height) : 0;
      sel.set({ left: sel.left + dx, top: sel.top + dy });
      sel.setCoords();
      this.canvas.requestRenderAll();
      this.commit();
      return;
    }
    this.align(kind);
  }

  distribute(axis: 'h' | 'v') {
    const objs = this.canvas.getActiveObjects();
    if (objs.length < 3) return;
    this.withLooseSelection((list) => {
      const items = list.map((o) => ({ o, r: o.getBoundingRect() }));
      if (axis === 'h') {
        items.sort((a, b) => a.r.left - b.r.left);
        const start = items[0].r.left;
        const end = items[items.length - 1].r.left + items[items.length - 1].r.width;
        const total = items.reduce((s, i) => s + i.r.width, 0);
        const gap = (end - start - total) / (items.length - 1);
        let x = start;
        for (const it of items) {
          it.o.set('left', it.o.left + (x - it.r.left));
          x += it.r.width + gap;
        }
      } else {
        items.sort((a, b) => a.r.top - b.r.top);
        const start = items[0].r.top;
        const end = items[items.length - 1].r.top + items[items.length - 1].r.height;
        const total = items.reduce((s, i) => s + i.r.height, 0);
        const gap = (end - start - total) / (items.length - 1);
        let y = start;
        for (const it of items) {
          it.o.set('top', it.o.top + (y - it.r.top));
          y += it.r.height + gap;
        }
      }
    });
  }

  nudge(dx: number, dy: number) {
    const o = this.active();
    if (!o || (o as any).locked) return;
    o.set({ left: o.left + dx, top: o.top + dy });
    o.setCoords();
    this.canvas.requestRenderAll();
    this.bump();
    this.commitSoon(400);
  }

  /* ---------------- property editing ---------------- */

  /** Apply props to the active object (or each object in a selection). */
  setProps(props: Record<string, any>, opts: { live?: boolean; target?: FabricObject } = {}) {
    const o = opts.target ?? this.active();
    if (!o) return;
    const targets = o instanceof ActiveSelection ? o.getObjects() : [o];
    const typo = ['fontFamily', 'fontWeight', 'fontSize', 'charSpacing', 'fontStyle', 'text'].some((k) => k in props);
    for (const t of targets) {
      const wasSingle = t instanceof Textbox && (t as any)._textLines?.length === 1 && !String(t.text).includes('\n');
      t.set(props);
      if (t instanceof IText) {
        if ((t as any).warp) this.applyWarp(t);
        else t.initDimensions();
        if (typo && wasSingle) this.refitSingleLine(t as Textbox);
      }
      t.setCoords();
    }
    if (o instanceof ActiveSelection) o.setCoords();
    this.canvas.requestRenderAll();
    this.bump();
    if (opts.live) this.commitSoon();
    else this.commit();
  }

  /** A one-line text that a font/size change made wrap is widened back to one line (centre kept). */
  private refitSingleLine(t: Textbox) {
    if ((t as any)._textLines.length <= 1) return;
    const c = t.getCenterPoint();
    t.set({ width: 1e5 });
    t.initDimensions();
    const natural = t.getLineWidth(0);
    t.set({ width: Math.min(this.project.width * 0.95, natural + t.fontSize * 0.1) });
    t.initDimensions();
    t.setPositionByOrigin(c, 'center', 'center');
  }

  async setFont(family: string, weight?: number) {
    const o = this.active();
    if (!o) return;
    const targets = (o instanceof ActiveSelection ? o.getObjects() : [o]).filter((t) => t instanceof IText) as IText[];
    if (!targets.length) return;
    await Promise.all(targets.map((t) => ensureFont(family, weight ?? (t.fontWeight as number) ?? 400, t.fontStyle)));
    this.setProps(weight ? { fontFamily: family, fontWeight: weight } : { fontFamily: family });
  }

  /** Apply a full font spec (family, weight, style, tracking, caps) to the selected text. */
  async applyFontSpec(spec: { family: string; weight?: number; italic?: boolean; tracking?: number; caps?: boolean }) {
    const o = this.active();
    if (!o) return false;
    const targets = (o instanceof ActiveSelection ? o.getObjects() : [o]).filter((t) => t instanceof IText) as IText[];
    if (!targets.length) return false;
    const weight = spec.weight ?? 400;
    await ensureFont(spec.family, weight, spec.italic ? 'italic' : 'normal');
    const props: Record<string, any> = { fontFamily: spec.family, fontWeight: weight, fontStyle: spec.italic ? 'italic' : 'normal' };
    if (spec.tracking !== undefined) props.charSpacing = spec.tracking;
    if (spec.caps) for (const t of targets) t.set('text', t.text.toUpperCase());
    this.setProps(props);
    return true;
  }

  async setFontWeight(weight: number) {
    const o = this.active();
    if (!(o instanceof IText)) return;
    await ensureFont(o.fontFamily, weight, o.fontStyle);
    this.setProps({ fontWeight: weight });
  }

  /* ---------------- drawing tools ---------------- */

  setTool(tool: 'select' | 'pen' | 'pencil' | 'brush') {
    if (this.pen) this.finishPen(false);
    this.exitNodeEdit();
    const c = this.canvas;
    this.brush = tool === 'brush' ? (this.brush ?? new BrushSession(this, () => get().brushStyle)) : null;
    if (tool === 'brush') c.discardActiveObject();
    c.isDrawingMode = tool === 'pencil';
    if (tool === 'pencil') {
      const { stroke, width } = get().penStyle;
      const b = new PencilBrush(c);
      b.color = stroke;
      b.width = width;
      b.decimate = 2;
      c.freeDrawingBrush = b;
    }
    if (tool === 'pen') {
      c.discardActiveObject();
      this.pen = { pts: [], drag: false, cursor: null };
    }
    c.selection = tool === 'select';
    c.skipTargetFind = tool === 'pen' || tool === 'brush';
    c.defaultCursor = tool === 'pen' ? 'crosshair' : tool === 'brush' ? 'none' : 'default';
    c.setCursor(c.defaultCursor);
    c.requestRenderAll();
    set({ tool });
  }

  setBrushStyle(patch: Partial<BrushStyle>) {
    set({ brushStyle: { ...get().brushStyle, ...patch } });
    this.canvas.requestRenderAll();
  }

  /** Start a fresh paint layer on top (brush tool). */
  newPaintLayer() {
    if (!this.brush) this.setTool('brush');
    this.brush!.newLayer();
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
  }

  setPenStyle(patch: Partial<EditorState['penStyle']>) {
    const next = { ...get().penStyle, ...patch };
    set({ penStyle: next });
    const b = this.canvas.freeDrawingBrush;
    if (b) {
      b.color = next.stroke;
      b.width = next.width;
    }
  }

  private penDown(p: Point) {
    const pen = this.pen!;
    const first = pen.pts[0];
    const z = this.canvas.getZoom();
    if (first && pen.pts.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) < 8 / z) {
      this.finishPen(true);
      return;
    }
    pen.pts.push({ x: p.x, y: p.y });
    pen.drag = true;
    this.canvas.requestRenderAll();
  }

  private penMove(p: Point) {
    const pen = this.pen!;
    pen.cursor = { x: p.x, y: p.y };
    const last = pen.pts[pen.pts.length - 1];
    if (pen.drag && last && Math.hypot(p.x - last.x, p.y - last.y) > 2 / this.canvas.getZoom()) {
      // dragging pulls out symmetric bezier handles
      last.hout = { x: p.x, y: p.y };
      last.hin = { x: 2 * last.x - p.x, y: 2 * last.y - p.y };
    }
    this.canvas.requestRenderAll();
  }

  /** Commit the pen path. Called on closing click, double-click, Enter (open) or Escape. */
  finishPen(close: boolean, cancel = false) {
    const pen = this.pen;
    if (!pen) return;
    const pts = pen.pts;
    this.pen = { pts: [], drag: false, cursor: null };
    if (cancel || pts.length < 2) {
      this.canvas.requestRenderAll();
      if (cancel) this.setToolSelect();
      return;
    }
    const f = (n: number) => +n.toFixed(2);
    let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
    const seg = (a: PenPt, b: PenPt) => {
      const c1 = a.hout ?? a;
      const c2 = b.hin ?? b;
      return a.hout || b.hin ? ` C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(b.x)} ${f(b.y)}` : ` L ${f(b.x)} ${f(b.y)}`;
    };
    for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1], pts[i]);
    if (close) d += seg(pts[pts.length - 1], pts[0]) + ' Z';
    const { stroke, width, fill } = get().penStyle;
    const path = new Path(d, { stroke, strokeWidth: width, fill: close ? fill : '', strokeLineCap: 'round', strokeLineJoin: 'round', strokeUniform: true });
    (path as any).id = uid('o_');
    (path as any).name = this.nameFor(close ? 'Shape' : 'Path');
    this.canvas.add(path);
    this.setToolSelect();
    this.canvas.setActiveObject(path);
    this.canvas.requestRenderAll();
    this.commit();
  }

  private setToolSelect() {
    this.pen = null;
    this.brush = null;
    const c = this.canvas;
    c.isDrawingMode = false;
    c.selection = true;
    c.skipTargetFind = false;
    c.defaultCursor = 'default';
    c.setCursor('default');
    set({ tool: 'select' });
  }

  /* ---------------- point editing ---------------- */

  editNodes(o: FabricObject = this.active()!) {
    if (!o || (o as any).locked) return;
    this.exitNodeEdit();
    const style = { controlFill: '#fff', controlStroke: ACCENT };
    if (o instanceof Path) this.explicitClose(o);
    if (o instanceof Path) o.controls = controlsUtils.createPathControls(o, { controlPointStyle: { controlFill: ACCENT, controlStroke: '#fff' }, pointStyle: style } as any);
    else if (o instanceof Polygon || o instanceof Polyline) o.controls = controlsUtils.createPolyControls(o as any, { cursorStyle: 'pointer' } as any);
    else return;
    o.hasBorders = false;
    (o as any).__fxCache = undefined;
    (o as any).__corner = undefined; // stale hover key from the previous control set
    o.setCoords(); // rebuild cached control positions for the new control set
    this.nodeTarget = o;
    this.weld = null;
    if (o instanceof Path) {
      const path = o.path as any[];
      const first = path[0];
      const last = path[path.length - 1];
      if (first?.[0] === 'M' && last?.length >= 3 && Math.abs(last[last.length - 2] - first[1]) < 1e-6 && Math.abs(last[last.length - 1] - first[2]) < 1e-6) this.weld = { x: first[1], y: first[2] };
    }
    this.canvas.setActiveObject(o);
    this.canvas.requestRenderAll();
    set({ nodeEditing: true });
  }

  /**
   * fabric's point editor reads the command before each anchor; a 'Z' there has
   * no coordinates. Replace every close with an explicit segment back to the
   * subpath start (identical fill, and the shape stays closed visually).
   */
  private explicitClose(p: Path) {
    const out: any[] = [];
    let start: [number, number] = [0, 0];
    let cur: [number, number] = [0, 0];
    for (const cmd of p.path as any[]) {
      const t = cmd[0];
      if (t === 'M') start = [cmd[1], cmd[2]];
      if (t === 'Z' || t === 'z') {
        if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 1e-6) out.push(['L', start[0], start[1]]);
        cur = start;
        continue;
      }
      out.push(cmd);
      if (cmd.length >= 3) cur = [cmd[cmd.length - 2], cmd[cmd.length - 1]];
    }
    if (out.length !== p.path.length) {
      p.path = out as any;
      p.set({ strokeLineJoin: 'round', strokeLineCap: 'round' });
    }
  }

  exitNodeEdit() {
    const o = this.nodeTarget;
    if (!o) return;
    this.nodeTarget = null;
    o.controls = controlsUtils.createObjectDefaultControls() as any;
    (o as any).__corner = undefined;
    o.hasBorders = true;
    o.setCoords();
    this.canvas.requestRenderAll();
    set({ nodeEditing: false });
  }

  /** Turn a basic shape (rect, circle, polygon…) into an editable path. */
  async convertToPath(o: FabricObject = this.active()!) {
    if (!o || o instanceof Path || o instanceof IText || o instanceof FabricImage) return;
    const { booleanPathData } = await import('../lib/vector');
    const d = await booleanPathData([o], 'unite', new Map());
    const p = this.replaceWithPath(o, d);
    this.editNodes(p);
  }

  private replaceWithPath(src: FabricObject, d: string, name?: string) {
    const p = new Path(d, {
      fill: src.fill,
      stroke: src.stroke,
      strokeWidth: src.strokeWidth,
      strokeUniform: true,
      strokeLineJoin: 'round',
      opacity: src.opacity,
      shadow: src.shadow,
      globalCompositeOperation: src.globalCompositeOperation,
      fillRule: 'nonzero',
    } as any);
    (p as any).id = uid('o_');
    (p as any).name = name ?? (src as any).name;
    if ((src as any).fx) (p as any).fx = (src as any).fx;
    const idx = this.canvas.getObjects().indexOf(src);
    this.canvas.discardActiveObject();
    this.canvas.remove(src);
    this.canvas.insertAt(Math.max(0, idx), p);
    this.canvas.setActiveObject(p);
    this.canvas.requestRenderAll();
    this.commit();
    return p;
  }

  /** Convert text into vector outlines using the real font file (glyph-accurate). */
  async outlineText(t: FabricObject = this.active()!) {
    if (!(t instanceof IText)) return;
    set({ busy: 'Converting text to outlines…' });
    try {
      const { textToPathData, toAbsolute } = await import('../lib/vector');
      const d = toAbsolute(await textToPathData(t), t);
      this.replaceWithPath(t, d, `${(t as any).name ?? 'Text'} (outlines)`);
    } finally {
      set({ busy: null });
    }
  }

  /** Union / subtract / intersect / exclude the selected shapes into one path. */
  async booleanOp(op: BoolOp) {
    const sel = this.canvas.getActiveObjects();
    if (sel.length < 2) return;
    if (sel.some((o) => o instanceof FabricImage)) throw new Error('Images can’t be combined — use shapes, paths, graphics or text.');
    set({ busy: 'Combining shapes…' });
    try {
      const all = this.canvas.getObjects();
      const objs = [...sel].sort((a, b) => all.indexOf(a) - all.indexOf(b));
      this.canvas.discardActiveObject();
      const { booleanPathData, textToPathData, toAbsolute } = await import('../lib/vector');
      const outlines = new Map<FabricObject, string>();
      for (const o of objs) if (o instanceof IText) outlines.set(o, toAbsolute(await textToPathData(o), o));
      const d = await booleanPathData(objs, op, outlines);
      const base = objs[0];
      const idx = all.indexOf(base);
      const p = new Path(d, { fill: base instanceof IText ? base.fill : base.fill || '#c9c9c9', stroke: base.stroke, strokeWidth: base.strokeWidth, strokeUniform: true, opacity: base.opacity, fillRule: 'evenodd' } as any);
      (p as any).id = uid('o_');
      (p as any).name = this.nameFor({ unite: 'Union', subtract: 'Subtraction', intersect: 'Intersection', exclude: 'Exclusion' }[op]);
      if ((base as any).fx) (p as any).fx = (base as any).fx;
      this.canvas.remove(...objs);
      this.canvas.insertAt(Math.min(idx, this.canvas.getObjects().length), p);
      this.canvas.setActiveObject(p);
      this.canvas.requestRenderAll();
      this.commit();
    } finally {
      set({ busy: null });
    }
  }

  /* ---------------- text transforms ---------------- */

  /**
   * Swap a text object between the wrapping Textbox and single-line IText
   * classes (warped text must be IText: fabric sizes it from its path).
   */
  private async swapTextClass(t: any, toType: 'IText' | 'Textbox'): Promise<IText> {
    const json: any = (t as any).toObject(CUSTOM_PROPS);
    json.type = toType;
    if (toType === 'Textbox') {
      delete json.path;
      json.width = Math.max(t.calcTextWidth() + 2, t.fontSize);
    }
    const [n] = (await util.enlivenObjects([json])) as IText[];
    applyLock(n, !!(n as any).locked);
    const idx = this.canvas.getObjects().indexOf(t);
    const center = t.getCenterPoint();
    this.canvas.discardActiveObject();
    this.canvas.remove(t);
    this.canvas.insertAt(idx, n);
    n.setPositionByOrigin(center, 'center', 'center');
    n.setCoords();
    return n;
  }

  /** Recompute the warp path from the current text metrics, keeping the object's centre. */
  applyWarp(t: IText) {
    const warp: Warp | null = (t as any).warp;
    const center = t.getCenterPoint();
    if (!warp) {
      t.set('path', undefined as any);
    } else if (warp.kind !== 'path') {
      t.set('path', undefined as any);
      t.initDimensions();
      const w = t.calcTextWidth();
      const p = new Path(warpPath(warp, w, t.fontSize), { visible: false, fill: '', stroke: '' });
      t.set({ path: p, pathAlign: 'center', textAlign: 'center' } as any);
      t.setPathInfo();
    }
    t.initDimensions();
    t.setPositionByOrigin(center, 'center', 'center');
    t.setCoords();
    this.canvas.requestRenderAll();
  }

  async setWarp(warp: Warp | null, live = false) {
    let t = this.active();
    if (!(t instanceof IText)) return;
    const want = !!warp;
    if (want && t instanceof Textbox) t = await this.swapTextClass(t, 'IText');
    else if (!want && !(t instanceof Textbox)) {
      (t as any).warp = null;
      t.set('path', undefined as any);
      t.initDimensions();
      t = await this.swapTextClass(t, 'Textbox');
    }
    (t as any).warp = warp;
    this.applyWarp(t as IText);
    this.canvas.setActiveObject(t);
    this.bump(true);
    if (live) this.commitSoon();
    else this.commit();
  }

  /** Lay the selected text along the selected vector path (path is consumed). */
  async textOnPath() {
    const objs = this.canvas.getActiveObjects();
    let t = objs.find((o) => o instanceof IText) as IText | undefined;
    const p = objs.find((o) => o instanceof Path) as Path | undefined;
    if (!t || !p) return false;
    this.canvas.discardActiveObject();
    if (t instanceof Textbox) t = await this.swapTextClass(t, 'IText');
    t = t as IText;
    const abs = util.transformPath(p.path as any, p.calcTransformMatrix(), p.pathOffset);
    const guide = new Path(abs as any, { visible: false, fill: '', stroke: '' });
    (t as any).warp = { kind: 'path', amount: 0 };
    t.set({ path: guide, pathAlign: 'center', angle: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false } as any);
    t.setPathInfo();
    t.initDimensions();
    const c = p.getCenterPoint();
    t.setPositionByOrigin(c, 'center', 'center');
    t.setCoords();
    this.canvas.remove(p);
    this.canvas.setActiveObject(t);
    this.canvas.requestRenderAll();
    this.commit();
    return true;
  }

  /** Replace the effect stack on the selection (each object keeps its own copy). */
  setFx(fx: FX | null, live = false) {
    const clean = fx && Object.fromEntries(Object.entries(fx).filter(([, v]) => v)) as FX;
    this.setProps({ fx: clean && Object.keys(clean).length ? clean : null }, { live });
  }

  /** Merge one effect key (or remove it with null). */
  patchFx(key: keyof FX, value: any, live = false) {
    const o = this.active();
    if (!o) return;
    const cur: FX = { ...((o as any).fx || {}) };
    if (value === null) delete cur[key];
    else (cur as any)[key] = value;
    this.setFx(cur, live);
  }

  setShadow(cfg: { color: string; blur: number; offsetX: number; offsetY: number } | null, live = false) {
    this.setProps({ shadow: cfg ? new Shadow(cfg) : null }, { live });
  }

  /** Position/size in axis-aligned bounding box terms (what designers expect). */
  geometry(o: FabricObject) {
    const r = o.getBoundingRect();
    return {
      x: r.left,
      y: r.top,
      w: o.getScaledWidth(),
      h: o.getScaledHeight(),
      angle: o.angle ?? 0,
    };
  }

  setGeometry(g: Partial<{ x: number; y: number; w: number; h: number; angle: number }>, lockRatio = false) {
    const o = this.active();
    if (!o || (o as any).locked) return;
    if (g.angle !== undefined) o.rotate(g.angle);
    if (g.w !== undefined && g.w > 0) {
      const s = g.w / o.width;
      if (o instanceof Textbox) o.set({ width: g.w / (o.scaleX ?? 1) });
      else {
        if (lockRatio) o.scaleY = (o.scaleY ?? 1) * (s / (o.scaleX ?? 1));
        o.scaleX = s;
      }
    }
    if (g.h !== undefined && g.h > 0 && !(o instanceof Textbox)) {
      const s = g.h / o.height;
      if (lockRatio) o.scaleX = (o.scaleX ?? 1) * (s / (o.scaleY ?? 1));
      o.scaleY = s;
    }
    if (o instanceof IText) o.initDimensions();
    o.setCoords();
    const r = o.getBoundingRect();
    if (g.x !== undefined) o.set('left', o.left + (g.x - r.left));
    if (g.y !== undefined) o.set('top', o.top + (g.y - r.top));
    o.setCoords();
    this.canvas.requestRenderAll();
    this.bump();
    this.commitSoon(250);
  }

  /* ---------------- image adjustments (non-destructive) ---------------- */

  /** Full photo state of an image (reads legacy Stage 1 filters too). */
  photoState(img: FabricImage): PhotoState {
    const st: PhotoState = { adjust: { ...NEUTRAL }, preset: null, amount: 1, sharpness: 0, blur: 0 };
    for (const f of (img.filters ?? []) as any[]) {
      if (!f) continue;
      if (f.type === 'AuraAdjust') {
        st.adjust = { ...NEUTRAL, ...f.adjust };
        st.preset = f.preset ?? null;
        st.amount = f.amount ?? 1;
      } else if (f.type === 'Convolute' && isSharpenKernel(f.matrix)) st.sharpness = (f.matrix[4] - 1) / 4;
      else if (f.type === 'Blur') st.blur = f.blur;
      // Stage 1 filters map onto the new model
      else if (f.type === 'Brightness') st.adjust.exposure = f.brightness * 2;
      else if (f.type === 'Contrast') st.adjust.contrast = f.contrast;
      else if (f.type === 'Saturation') st.adjust.saturation = f.saturation;
    }
    return st;
  }

  setPhoto(img: FabricImage, st: PhotoState, live = false) {
    img.filters = [...photoFilters(st), ...((img.filters ?? []) as any[]).filter((f) => f?.type === 'AuraFX')];
    img.applyFilters();
    (img as any).__fxCache = undefined;
    this.canvas.requestRenderAll();
    this.bump();
    if (live) this.commitSoon();
    else this.commit();
  }

  /* ---------------- FX Lab ---------------- */

  fxStackOf(img: FabricImage): FxOpts[] {
    return ((img.filters ?? []) as any[]).filter((f) => f?.type === 'AuraFX').map((f) => ({ effect: f.effect, amount: f.amount, p1: f.p1, p2: f.p2, p3: f.p3 ?? 1, curve: [...(f.curve ?? [0, 0.25, 0.5, 0.75, 1])], c1: f.c1, c2: f.c2, seed: f.seed }));
  }

  /** Replace the FX Lab stack (photo adjustments stay first). */
  setFxStack(img: FabricImage, stack: FxOpts[], live = false) {
    const photo = ((img.filters ?? []) as any[]).filter((f) => f && f.type !== 'AuraFX');
    img.filters = [...photo, ...stack.map((o) => new AuraFX(o))] as any;
    img.applyFilters();
    (img as any).__fxCache = undefined;
    img.dirty = true;
    this.canvas.requestRenderAll();
    this.bump();
    if (live) this.commitSoon();
    else this.commit();
  }

  /**
   * Turn any layer (text, shape, group…) into an image so FX Lab and the
   * brushes can work on it. The original is kept, hidden, right below.
   */
  async rasterize(o = this.active()) {
    if (!o || o instanceof FabricImage) return o as FabricImage | undefined;
    const box = o.getBoundingRect();
    const mult = Math.min(4, Math.max(1, 2400 / Math.max(box.width, box.height)));
    const el = o.toCanvasElement({ multiplier: mult, enableRetinaScaling: false } as any);
    const blob: Blob = await new Promise((r, j) => el.toBlob((b) => (b ? r(b) : j(new Error('Could not render this layer.'))), 'image/png'));
    const { importFile } = await import('../lib/assets');
    const name = `${(o as any).name || 'Layer'} (image)`;
    const asset = await importFile(new File([blob], `${name}.png`, { type: 'image/png' }));
    const img = await FabricImage.fromURL(assetURL(asset));
    (img as any).assetId = asset.id;
    (img as any).id = uid('o_');
    (img as any).name = name;
    img.set({ scaleX: 1 / mult, scaleY: 1 / mult, originX: 'center', originY: 'center' });
    img.setPositionByOrigin(new Point(box.left + box.width / 2, box.top + box.height / 2), 'center', 'center');
    const idx = this.canvas.getObjects().indexOf(o);
    o.set({ visible: false });
    (o as any).name = `${(o as any).name || 'Layer'} (original)`;
    this.canvas.discardActiveObject();
    this.canvas.insertAt(idx + 1, img);
    img.setCoords();
    this.canvas.setActiveObject(img);
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
    return img;
  }

  /** Photoshop's "stamp visible": the whole page merged into one new image layer on top. */
  async stampVisible() {
    this.syncPage();
    const { renderPageCanvas } = await import('../lib/render');
    const scale = Math.min(1, 4096 / Math.max(this.project.width, this.project.height));
    const c = await renderPageCanvas(this.project, { ...this.page, background: this.page.background }, scale);
    const blob: Blob = await new Promise((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error('Could not render the page.'))), 'image/png'));
    const { importFile } = await import('../lib/assets');
    const asset = await importFile(new File([blob], 'Merged.png', { type: 'image/png' }));
    const img = await FabricImage.fromURL(assetURL(asset));
    (img as any).assetId = asset.id;
    (img as any).id = uid('o_');
    (img as any).name = 'Merged (stamp)';
    img.set({ scaleX: 1 / scale, scaleY: 1 / scale, originX: 'center', originY: 'center' });
    img.setPositionByOrigin(new Point(this.project.width / 2, this.project.height / 2), 'center', 'center');
    this.canvas.add(img);
    img.setCoords();
    this.canvas.setActiveObject(img);
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
    return img;
  }

  /** Temporarily show the unedited image (before/after compare). */
  comparePhoto(img: FabricImage, showOriginal: boolean) {
    if (showOriginal) {
      (img as any).__savedFilters = img.filters;
      img.filters = [];
    } else if ((img as any).__savedFilters) {
      img.filters = (img as any).__savedFilters;
      (img as any).__savedFilters = undefined;
    }
    img.applyFilters();
    this.canvas.requestRenderAll();
  }

  /** Clip an image to a shape (non-destructive mask). null removes it. */
  maskImage(img: FabricImage, kind: ShapeKind | 'ellipse' | null) {
    if (!kind) {
      img.set({ clipPath: undefined } as any);
    } else {
      const w = img.width;
      const h = img.height;
      let clip: FabricObject;
      if (kind === 'ellipse') clip = new Ellipse({ rx: w / 2, ry: h / 2 });
      else {
        clip = makeShape(kind as ShapeKind, 100);
        clip.set({ scaleX: w / clip.width, scaleY: h / clip.height });
      }
      clip.set({ originX: 'center', originY: 'center', left: 0, top: 0, fill: '#000' } as any);
      (img as any).maskKind = kind;
      img.set({ clipPath: clip } as any);
    }
    if (!kind) (img as any).maskKind = undefined;
    img.dirty = true;
    this.canvas.requestRenderAll();
    this.commit();
  }

  /** Apply a crop expressed in source-image pixels, keeping the visible region in place. */
  applyCrop(img: FabricImage, crop: { x: number; y: number; w: number; h: number }) {
    const oldCx = (img.cropX ?? 0) + img.width / 2;
    const oldCy = (img.cropY ?? 0) + img.height / 2;
    const newCx = crop.x + crop.w / 2;
    const newCy = crop.y + crop.h / 2;
    const center = img.getCenterPoint();
    const local = new Point((newCx - oldCx) * (img.scaleX ?? 1) * (img.flipX ? -1 : 1), (newCy - oldCy) * (img.scaleY ?? 1) * (img.flipY ? -1 : 1));
    const rotated = util.rotateVector(local, util.degreesToRadians(img.angle ?? 0));
    img.set({ cropX: crop.x, cropY: crop.y, width: crop.w, height: crop.h });
    img.setPositionByOrigin(new Point(center.x + rotated.x, center.y + rotated.y), 'center', 'center');
    img.setCoords();
    this.canvas.requestRenderAll();
    this.commit();
  }

  /* ---------------- page operations ---------------- */

  setBackground(color: string | null, live = false) {
    this.page.background = color;
    this.canvas.requestRenderAll();
    this.bump();
    if (live) this.commitSoon();
    else this.commit();
  }

  async gotoPage(i: number) {
    if (i === this.pageIndex) return;
    await this.showPage(i);
  }

  async addPage(after = this.pageIndex) {
    this.syncPage();
    const p = newPage(this.page.background === null ? null : '#ffffff');
    this.project.pages.splice(after + 1, 0, p);
    set({ project: { ...this.project } });
    await this.showPage(after + 1);
    this.scheduleSave();
    this.queueThumb(this.pageIndex);
  }

  /** Insert ready-made pages (templates) after the current one, smart-resizing if sizes differ. */
  async insertPages(pages: PageData[], w: number, h: number) {
    this.syncPage();
    let ready = pages;
    if (w !== this.project.width || h !== this.project.height) {
      const { smartResizePages } = await import('../lib/smartResize');
      ready = await smartResizePages(pages, w, h, this.project.width, this.project.height);
    }
    ready = ready.map((p) => ({ ...p, id: uid('pg_'), thumb: undefined }));
    const at = this.pageIndex + 1;
    this.project.pages.splice(at, 0, ...ready);
    set({ project: { ...this.project } });
    await this.showPage(at);
    this.scheduleSave();
    ready.forEach((_, i) => this.queueThumb(at + i, 200 + i * 60));
  }

  async duplicatePage(i = this.pageIndex) {
    this.syncPage();
    const src = this.project.pages[i];
    const copy: PageData = { ...structuredClone(src), id: uid('pg_') };
    // a duplicated garment page is another version of the same piece
    const g = this.project.garment;
    if (g?.pages[src.id]) g.pages[copy.id] = g.pages[src.id];
    this.project.pages.splice(i + 1, 0, copy);
    set((s) => ({ project: { ...this.project }, thumbs: src.thumb ? { ...s.thumbs, [copy.id]: src.thumb } : s.thumbs }));
    await this.showPage(i + 1);
    this.scheduleSave();
  }

  async deletePage(i = this.pageIndex) {
    if (this.project.pages.length <= 1) return false;
    this.syncPage();
    const [removed] = this.project.pages.splice(i, 1);
    this.history.delete(removed.id);
    const next = Math.min(i, this.project.pages.length - 1);
    this.pageIndex = -1; // force reload without syncing the removed page
    set({ project: { ...this.project } });
    await this.showPage(next, false);
    this.scheduleSave();
    return true;
  }

  movePage(from: number, to: number) {
    if (from === to) return;
    this.syncPage();
    const current = this.page;
    const [p] = this.project.pages.splice(from, 1);
    this.project.pages.splice(to, 0, p);
    this.pageIndex = this.project.pages.indexOf(current);
    set({ project: { ...this.project }, pageIndex: this.pageIndex });
    this.scheduleSave();
    this.queueThumb(0, 300);
  }

  rename_project(title: string) {
    this.project.title = title.trim() || 'Untitled design';
    set({ project: { ...this.project } });
    this.scheduleSave(100);
  }

  /**
   * Resize every page. 'scale' fits content proportionally and centres it;
   * 'keep' preserves object sizes and keeps the composition centred.
   * (Element-aware smart resize ships with Stage 3.)
   */
  async resizeDocument(width: number, height: number, mode: 'smart' | 'scale' | 'keep') {
    this.syncPage();
    const W = this.project.width;
    const H = this.project.height;
    if (mode === 'smart') {
      const { smartResizePages } = await import('../lib/smartResize');
      this.project.pages = await smartResizePages(this.project.pages, W, H, width, height);
    } else {
      const s = mode === 'scale' ? Math.min(width / W, height / H) : 1;
      const dx = (width - W * s) / 2;
      const dy = (height - H * s) / 2;
      for (const page of this.project.pages) {
        page.objects = page.objects.map((o) => ({
          ...o,
          left: o.left * s + dx,
          top: o.top * s + dy,
          scaleX: (o.scaleX ?? 1) * s,
          scaleY: (o.scaleY ?? 1) * s,
        }));
      }
    }
    this.project.width = Math.round(width);
    this.project.height = Math.round(height);
    this.project.guides = { v: [], h: [] };
    this.history.clear();
    this.pageIndex = -1;
    await this.showPage(0, false);
    this.fit();
    set({ project: { ...this.project } });
    this.scheduleSave();
    this.project.pages.forEach((_, i) => this.queueThumb(i, 100 + i * 50));
  }

  openCrop() {
    const o = this.active();
    if (o instanceof FabricImage) set({ cropping: o });
  }

  /* ---------------- design assistant ---------------- */

  /** Compact, model-friendly description of the current page. */
  describePage() {
    const sel = new Set(this.canvas.getActiveObjects());
    const r = (n: number) => Math.round(n);
    const layers = this.canvas.getObjects().map((o: any) => {
      const c = o.getCenterPoint();
      const isText = o instanceof IText || o instanceof Textbox;
      return {
        id: o.id,
        type: isText ? 'text' : o.placeholder ? 'photo-frame' : o instanceof FabricImage ? 'image' : o.type,
        name: o.name,
        ...(isText ? { text: o.text, fontFamily: o.fontFamily, fontWeight: o.fontWeight, fontSize: r(o.fontSize * (o.scaleY ?? 1)), charSpacing: o.charSpacing, lineHeight: o.lineHeight, textAlign: o.textAlign } : {}),
        ...(typeof o.fill === 'string' && o.fill ? { fill: o.fill } : {}),
        x: r(c.x),
        y: r(c.y),
        w: r(o.getScaledWidth()),
        h: r(o.getScaledHeight()),
        ...(o.angle ? { angle: r(o.angle) } : {}),
        ...(o.opacity !== 1 ? { opacity: o.opacity } : {}),
        ...(o.locked ? { locked: true } : {}),
        ...(sel.has(o) ? { selected: true } : {}),
      };
    });
    return { width: this.project.width, height: this.project.height, background: this.page.background, layers };
  }

  /** Rendered image of the current page for visual critique. */
  async pageImage(max = 1024) {
    this.syncPage();
    return renderThumb(this.project, this.page, max);
  }

  /** Apply assistant edits as one undoable step. Returns how many were applied. */
  async applyAssistantActions(actions: AssistantAction[]) {
    let n = 0;
    const byId = (id: string | null) => (id ? this.canvas.getObjects().find((o: any) => o.id === id) : undefined);
    for (const a of actions) {
      const o: any = byId(a.id);
      if (a.type !== 'set_background' && a.type !== 'add_text' && (!o || o.locked)) continue;
      if (a.type === 'set_background') {
        if (a.color) this.page.background = a.color;
      } else if (a.type === 'delete') {
        this.canvas.remove(o);
      } else if (a.type === 'set_text') {
        if (a.text == null || !('text' in o)) continue;
        o.set({ text: a.text });
        o.initDimensions?.();
      } else if (a.type === 'set_style') {
        const p: any = {};
        if (a.fontFamily) {
          await ensureFont(a.fontFamily, a.fontWeight ?? o.fontWeight ?? 400);
          p.fontFamily = a.fontFamily;
        }
        if (a.fontWeight != null) p.fontWeight = a.fontWeight;
        if (a.fontSize != null) {
          p.fontSize = a.fontSize / (o.scaleY ?? 1);
        }
        if (a.fill) p.fill = a.fill;
        if (a.charSpacing != null) p.charSpacing = a.charSpacing;
        if (a.lineHeight != null) p.lineHeight = a.lineHeight;
        if (a.textAlign) p.textAlign = a.textAlign;
        if (a.opacity != null) p.opacity = clamp(a.opacity, 0, 1);
        const c = o.getCenterPoint();
        o.set(p);
        o.initDimensions?.();
        if (o instanceof Textbox && (p.fontFamily || p.fontSize || p.charSpacing != null)) this.refitSingleLine(o);
        o.setPositionByOrigin(c, 'center', 'center');
        (o as any).__fxCache = undefined;
      } else if (a.type === 'move') {
        if (a.width != null && o instanceof Textbox) {
          o.set({ width: a.width / (o.scaleX ?? 1) });
          o.initDimensions();
        }
        const c = o.getCenterPoint();
        o.setPositionByOrigin(new Point(a.x ?? c.x, a.y ?? c.y), 'center', 'center');
      } else if (a.type === 'add_text') {
        if (!a.text) continue;
        const family = a.fontFamily || 'Inter';
        await ensureFont(family, a.fontWeight ?? 400);
        const t = new Textbox(a.text, { fontFamily: family, fontWeight: a.fontWeight ?? 400, fontSize: a.fontSize ?? 48, fill: a.fill ?? '#111111', textAlign: a.textAlign ?? 'center', width: a.width ?? this.project.width * 0.8, lineHeight: a.lineHeight ?? 1.1, charSpacing: a.charSpacing ?? 0 } as any);
        (t as any).id = uid('o_');
        (t as any).name = 'Text';
        t.setPositionByOrigin(new Point(a.x ?? this.project.width / 2, a.y ?? this.project.height / 2), 'center', 'center');
        this.canvas.add(t);
      }
      o?.setCoords?.();
      if (o) o.dirty = true;
      n++;
    }
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
    return n;
  }

  /* ---------------- AI image tools ---------------- */

  openImageTool(kind: ImageToolKind, img = this.active()) {
    if (img instanceof FabricImage) set({ imageTool: { kind, img } });
  }

  /**
   * Pixels the AI tools should work from. For an image that already had its
   * background removed this is the untouched original plus the current cutout
   * alpha, so refining is always non-destructive.
   */
  async imageSources(img: FabricImage): Promise<{ source: HTMLImageElement; current: HTMLImageElement; originalAssetId?: string; assetId?: string; name: string }> {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => res(el);
        el.onerror = () => rej(new Error('Could not read this image.'));
        el.src = src;
      });
    const assetId = (img as any).assetId as string | undefined;
    const originalAssetId = (img as any).originalAssetId as string | undefined;
    const curURL = (assetId && (await assetURLById(assetId))) || img.getSrc();
    const current = await load(curURL);
    const origURL = originalAssetId ? await assetURLById(originalAssetId) : null;
    const source = origURL ? await load(origURL) : current;
    const name = (assetId && (await getAsset(assetId))?.name) || (img as any).name || 'Image';
    return { source, current, originalAssetId: origURL ? originalAssetId : undefined, assetId, name };
  }

  /**
   * Point an image layer at different pixels of the same picture (a cutout,
   * an edit, an upscale or the original). Crop, filters, mask and on-canvas
   * size are kept, whatever the new resolution.
   */
  async swapImageAsset(img: FabricImage, asset: Asset, originalAssetId?: string | null) {
    const factor = asset.width / img.getOriginalSize().width;
    await this.swapImageScaled(img, asset, factor);
    if (originalAssetId !== undefined) (img as any).originalAssetId = originalAssetId ?? undefined;
    this.commit();
  }

  /** Swap to a higher-resolution version of the same picture, keeping its crop and on-canvas size. */
  async swapImageUpscaled(img: FabricImage, asset: Asset, factor: number) {
    await this.swapImageScaled(img, asset, factor);
    this.commit();
  }

  private async swapImageScaled(img: FabricImage, asset: Asset, factor: number) {
    const same = Math.abs(factor - 1) < 1e-3;
    const keep = same
      ? { cropX: img.cropX, cropY: img.cropY, width: img.width, height: img.height }
      : { cropX: (img.cropX ?? 0) * factor, cropY: (img.cropY ?? 0) * factor, width: img.width * factor, height: img.height * factor, scaleX: (img.scaleX ?? 1) / factor, scaleY: (img.scaleY ?? 1) / factor };
    const center = img.getCenterPoint();
    await img.setSrc(assetURL(asset));
    img.set(keep);
    if (!same && img.clipPath) img.clipPath.set({ scaleX: (img.clipPath.scaleX ?? 1) * factor, scaleY: (img.clipPath.scaleY ?? 1) * factor });
    (img as any).assetId = asset.id;
    if (img.filters?.length) img.applyFilters();
    img.setPositionByOrigin(center, 'center', 'center');
    img.dirty = true;
    img.setCoords();
    this.canvas.requestRenderAll();
    this.bump();
  }

  /**
   * Replace the visible (cropped) region of an image with new pixels at the
   * same density — generative edits and expansions. `off` is where the old
   * visible region sits inside the new pixels; it stays put on the page.
   */
  async swapImageReframed(img: FabricImage, asset: Asset, off: { x: number; y: number }) {
    const oldW = img.width, oldH = img.height;
    const center = img.getCenterPoint();
    await img.setSrc(assetURL(asset));
    img.set({ cropX: 0, cropY: 0, width: asset.width, height: asset.height });
    const dx = (asset.width / 2 - (off.x + oldW / 2)) * (img.scaleX ?? 1) * (img.flipX ? -1 : 1);
    const dy = (asset.height / 2 - (off.y + oldH / 2)) * (img.scaleY ?? 1) * (img.flipY ? -1 : 1);
    const r = util.rotateVector(new Point(dx, dy), util.degreesToRadians(img.angle ?? 0));
    (img as any).assetId = asset.id;
    (img as any).originalAssetId = undefined; // a reframed picture has no same-geometry original
    if (img.filters?.length) img.applyFilters();
    img.setPositionByOrigin(new Point(center.x + r.x, center.y + r.y), 'center', 'center');
    img.dirty = true;
    img.setCoords();
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
  }

  /** Put the original pixels back (undo a background removal / edit). */
  async restoreOriginalImage(img: FabricImage) {
    const id = (img as any).originalAssetId as string | undefined;
    const a = id ? await getAsset(id) : null;
    if (!a) return;
    await this.swapImageAsset(img, a, null);
  }

  /** Insert a new layer directly beneath `img`, matching its on-canvas bounds. */
  async addBehind(img: FabricImage, layer: { kind: 'color'; color: string } | { kind: 'blur'; amount: number } | { kind: 'asset'; asset: Asset }) {
    let o: FabricObject;
    const w = img.getScaledWidth();
    const h = img.getScaledHeight();
    if (layer.kind === 'color') {
      o = new Rect({ width: w, height: h, fill: layer.color, angle: img.angle ?? 0 });
      (o as any).name = 'Background colour';
    } else if (layer.kind === 'blur') {
      const orig = ((img as any).originalAssetId && (await assetURLById((img as any).originalAssetId))) || img.getSrc();
      const copy = await FabricImage.fromURL(orig);
      copy.set({ cropX: img.cropX, cropY: img.cropY, width: img.width, height: img.height, scaleX: img.scaleX, scaleY: img.scaleY, angle: img.angle ?? 0, flipX: img.flipX, flipY: img.flipY });
      if (img.clipPath) copy.set({ clipPath: await img.clipPath.clone() } as any);
      (copy as any).assetId = (img as any).originalAssetId ?? (img as any).assetId;
      copy.filters = photoFilters({ ...this.photoState(img), blur: layer.amount });
      copy.applyFilters();
      (copy as any).name = 'Blurred background';
      o = copy;
    } else {
      const bg = await FabricImage.fromURL(assetURL(layer.asset));
      const s = Math.max(w / bg.width, h / bg.height);
      const cw = w / s;
      const ch = h / s;
      bg.set({ cropX: (bg.width - cw) / 2, cropY: (bg.height - ch) / 2, width: cw, height: ch, scaleX: s, scaleY: s, angle: img.angle ?? 0 });
      (bg as any).assetId = layer.asset.id;
      (bg as any).name = 'Background photo';
      o = bg;
    }
    (o as any).id = uid('o_');
    o.setPositionByOrigin(img.getCenterPoint(), 'center', 'center');
    o.setCoords();
    const idx = this.canvas.getObjects().indexOf(img);
    this.canvas.insertAt(Math.max(0, idx), o);
    this.canvas.requestRenderAll();
    this.commit();
    this.bump();
    return o;
  }
}

/** Pen-tablet pressure (mice report a constant, so ignore them). */
function penPressure(e: any) {
  return e?.pointerType === 'pen' && e.pressure > 0 ? 0.2 + e.pressure * 0.8 : 1;
}

/** Fabric filter list for a photo state: adjust → sharpen → blur. */
function photoFilters(st: PhotoState): any[] {
  const list: any[] = [];
  const neutral = !st.preset && Object.values(st.adjust).every((v) => v === 0);
  if (!neutral) list.push(new AuraAdjust({ adjust: { ...st.adjust }, preset: st.preset, amount: st.amount }));
  if (st.sharpness > 0) {
    const a = st.sharpness;
    list.push(new filters.Convolute({ matrix: [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0] }));
  }
  if (st.blur > 0) list.push(new filters.Blur({ blur: st.blur }));
  return list;
}

/** Our sharpen kernel: zero corners, equal negative edges, centre 1 + 4a (survives save/load). */
function isSharpenKernel(m: number[]) {
  return Array.isArray(m) && m.length === 9 && m[0] === 0 && m[2] === 0 && m[6] === 0 && m[8] === 0 && m[1] < 0 && m[1] === m[3] && m[3] === m[5] && m[5] === m[7] && Math.abs(m[4] - (1 - 4 * m[1])) < 1e-6;
}

export function isDark(color: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}
