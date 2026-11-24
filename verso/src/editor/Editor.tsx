import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BringToFront,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Cloud,
  CloudOff,
  Copy,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  Group as GroupIcon,
  Loader2,
  Lock,
  Maximize,
  Minus,
  Play,
  Plus,
  Redo2,
  Scaling,
  Scissors,
  SendToBack,
  Share2,
  Trash2,
  Undo2,
  Ungroup,
  AlignCenterHorizontal,
  AlignCenterVertical,
  Crop,
} from 'lucide-react';
import { ActiveSelection, FabricImage, Group } from 'fabric';
import { getProject } from '../lib/db';
import { importFile, assetURL } from '../lib/assets';
import { getAsset } from '../lib/db';
import { navigate, toast } from '../store/app';
import { MOD, PopMenu, type MenuItem } from '../ui/controls';
import { Engine, useEditor } from './engine';
import LeftPanel from './panels/LeftPanel';
import Properties from './Properties';
import ExportDialog from './dialogs/ExportDialog';
import ResizeDialog from './dialogs/ResizeDialog';
import CropDialog from './dialogs/CropDialog';
import PreviewOverlay from './dialogs/PreviewOverlay';
import ShareDialog from './dialogs/ShareDialog';
import ShortcutsDialog from './dialogs/ShortcutsDialog';

const EngineCtx = createContext<Engine | null>(null);
export const useEngine = () => useContext(EngineCtx)!;

export default function Editor({ projectId }: { projectId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [dialog, setDialog] = useState<null | 'export' | 'resize' | 'preview' | 'share' | 'shortcuts'>(null);
  const showRulers = useEditor((s) => s.showRulers);

  useEffect(() => {
    let eng: Engine | null = null;
    let cancelled = false;
    const host = hostRef.current!;
    const el = document.createElement('canvas');
    host.appendChild(el);
    (async () => {
      const p = await getProject(projectId);
      if (cancelled) return;
      if (!p) {
        toast('That design no longer exists.', 'error');
        navigate({ name: 'home' });
        return;
      }
      eng = new Engine(el, host);
      await eng.load(p);
      if (cancelled) return;
      setEngine(eng);
      (window as any).__verso = eng; // handy for debugging & automated tests
    })().catch((err) => {
      console.error(err);
      toast('Could not open this design: ' + (err?.message ?? err), 'error');
    });
    const flush = () => document.visibilityState === 'hidden' && eng?.saveNow();
    document.addEventListener('visibilitychange', flush);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', flush);
      if (eng) {
        eng.saveNow();
        eng.dispose();
      }
      host.innerHTML = '';
      useEditor.setState({ project: null, menu: null, cropping: null });
    };
  }, [projectId]);

  return (
    <EngineCtx.Provider value={engine}>
      <div className="editor">
        <TopBar onDialog={setDialog} />
        <div className="ed-body">
          {engine ? <LeftPanel /> : <div className="rail" />}
          {!engine && <div />}
          <div className="stage">
            <div />
            <div className={`stage-mid ${showRulers ? '' : 'no-rulers'}`}>
              <Rulers />
              <CanvasHost hostRef={hostRef} />
            </div>
            {engine && <PagesBar />}
          </div>
          {engine ? <Properties onDialog={setDialog} /> : <div className="props" />}
        </div>
      </div>
      {engine && <Shortcuts onDialog={setDialog} />}
      {engine && <ContextMenu />}
      {engine && dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {engine && dialog === 'resize' && <ResizeDialog onClose={() => setDialog(null)} />}
      {engine && dialog === 'preview' && <PreviewOverlay onClose={() => setDialog(null)} />}
      {engine && dialog === 'share' && <ShareDialog onClose={() => setDialog(null)} />}
      {engine && dialog === 'shortcuts' && <ShortcutsDialog onClose={() => setDialog(null)} />}
      {engine && <CropDialog />}
    </EngineCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */

function CanvasHost({ hostRef }: { hostRef: React.RefObject<HTMLDivElement> }) {
  const engine = useContext(EngineCtx);
  const empty = useEditor((s) => (s.objVersion, engine ? engine.objects().length === 0 : false));

  const sceneAt = (e: React.DragEvent) => {
    const r = hostRef.current!.getBoundingClientRect();
    return engine!.toScene(e.clientX - r.left, e.clientY - r.top);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!engine) return;
    const at = sceneAt(e);
    const assetId = e.dataTransfer.getData('application/x-verso-asset');
    const shape = e.dataTransfer.getData('application/x-verso-shape');
    if (shape) {
      engine.addShape(shape as any, at);
      return;
    }
    if (assetId) {
      const a = await getAsset(assetId);
      if (a) await engine.addAsset(a, at).catch((err) => toast(err.message, 'error'));
      return;
    }
    for (const f of Array.from(e.dataTransfer.files)) {
      try {
        const a = await importFile(f);
        assetURL(a);
        await engine.addAsset(a, at);
      } catch (err: any) {
        toast(err.message, 'error');
      }
    }
  };

  return (
    <div className="canvas-host" style={{ gridRow: 2, gridColumn: 2 }} ref={hostRef} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onContextMenu={(e) => e.preventDefault()}>
      {engine && empty && <div className="stage-hint">Add text or elements from the left, or drop images here</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopBar({ onDialog }: { onDialog: (d: any) => void }) {
  const engine = useContext(EngineCtx);
  const project = useEditor((s) => s.project);
  const zoom = useEditor((s) => s.zoom);
  const canUndo = useEditor((s) => s.canUndo);
  const canRedo = useEditor((s) => s.canRedo);
  const saveState = useEditor((s) => s.saveState);
  const [title, setTitle] = useState('');
  const [zoomMenu, setZoomMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setTitle(project?.title ?? ''), [project?.title]);

  const zoomItems: MenuItem[] = [
    { label: 'Fit to screen', kbd: `${MOD}0`, onClick: () => engine?.fit() },
    { label: 'Actual size (100%)', kbd: `${MOD}1`, onClick: () => engine?.setZoom(1) },
    { sep: true },
    ...[0.25, 0.5, 2, 4].map((z) => ({ label: `${z * 100}%`, onClick: () => engine?.setZoom(z) })),
  ];

  return (
    <header className="topbar">
      <button className="icon-btn" title="Back to dashboard" onClick={() => navigate({ name: 'home' })}>
        <ArrowLeft size={17} />
      </button>
      <input
        className="title"
        value={title}
        aria-label="Design title"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => engine?.rename_project(title)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
      <span className="save" title="Designs autosave to this browser (IndexedDB)">
        {saveState === 'saving' || saveState === 'dirty' ? (
          <>
            <Loader2 size={13} className="spin" /> Saving…
          </>
        ) : saveState === 'error' ? (
          <span style={{ color: 'var(--danger)', display: 'flex', gap: 5, alignItems: 'center' }}>
            <CloudOff size={13} /> Not saved
          </span>
        ) : (
          <>
            <Cloud size={13} /> Saved
          </>
        )}
      </span>
      <div className="sep" />
      <button className="icon-btn" title={`Undo (${MOD}Z)`} disabled={!canUndo} onClick={() => engine?.undo()}>
        <Undo2 size={16} />
      </button>
      <button className="icon-btn" title={`Redo (${MOD}⇧Z)`} disabled={!canRedo} onClick={() => engine?.redo()}>
        <Redo2 size={16} />
      </button>
      <div className="spacer" />
      <div className="zoom-ctl">
        <button className="icon-btn sm" title="Zoom out" onClick={() => engine?.zoomBy(1 / 1.2)}>
          <Minus size={15} />
        </button>
        <button
          className="pct"
          title="Zoom options"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoomMenu({ x: r.left - 40, y: r.bottom + 4 });
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className="icon-btn sm" title="Zoom in" onClick={() => engine?.zoomBy(1.2)}>
          <Plus size={15} />
        </button>
        <button className="icon-btn sm" title={`Fit to screen (${MOD}0)`} onClick={() => engine?.fit()}>
          <Maximize size={14} />
        </button>
      </div>
      <div className="sep" />
      {project && (
        <span className="faint hide-sm" style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', marginRight: 4 }}>
          {project.width} × {project.height}
        </span>
      )}
      <button className="btn ghost hide-sm" onClick={() => onDialog('resize')}>
        <Scaling size={14} /> Resize
      </button>
      <button className="btn ghost hide-sm" onClick={() => onDialog('preview')}>
        <Play size={14} /> Preview
      </button>
      <button className="btn" onClick={() => onDialog('share')}>
        <Share2 size={14} /> Share
      </button>
      <button className="btn primary" onClick={() => onDialog('export')}>
        <Download size={14} /> Export
      </button>
      {zoomMenu && <PopMenu x={zoomMenu.x} y={zoomMenu.y} items={zoomItems} onClose={() => setZoomMenu(null)} />}
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Rulers() {
  const engine = useContext(EngineCtx);
  const show = useEditor((s) => s.showRulers);
  const hRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!engine || !show) return;
    const draw = () => {
      const dpr = devicePixelRatio || 1;
      const v = engine.canvas.viewportTransform;
      const z = v[0];
      const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
      const step = steps.find((s) => s * z >= 60) ?? 10000;
      const minor = step / (String(step).startsWith('25') ? 5 : step % 5 === 0 ? 5 : 2);
      for (const [el, axis] of [
        [hRef.current, 'x'],
        [vRef.current, 'y'],
      ] as const) {
        if (!el) continue;
        const w = el.clientWidth;
        const h = el.clientHeight;
        el.width = w * dpr;
        el.height = h * dpr;
        const ctx = el.getContext('2d')!;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#191919';
        ctx.fillRect(0, 0, w, h);
        const len = axis === 'x' ? w : h;
        const off = axis === 'x' ? v[4] : v[5];
        // highlight artboard extent
        const p = engine.project;
        if (p) {
          const a = off;
          const b = off + (axis === 'x' ? p.width : p.height) * z;
          ctx.fillStyle = '#222';
          if (axis === 'x') ctx.fillRect(a, 0, b - a, h);
          else ctx.fillRect(0, a, w, b - a);
        }
        // the canvas host starts 20px after the ruler origin on the other axis only
        const start = Math.floor(-off / z / minor) * minor;
        const end = (len - off) / z;
        ctx.strokeStyle = '#4a4a4a';
        ctx.fillStyle = '#7a7a7a';
        ctx.font = '9.5px Inter, sans-serif';
        ctx.beginPath();
        for (let s = start; s <= end; s += minor) {
          const pos = Math.round(off + s * z) + 0.5;
          const major = Math.abs(s / step - Math.round(s / step)) < 1e-6;
          const t = major ? 20 : 5;
          if (axis === 'x') {
            ctx.moveTo(pos, 20);
            ctx.lineTo(pos, 20 - t);
            if (major) ctx.fillText(String(Math.round(s)), pos + 3, 9);
          } else {
            ctx.moveTo(20, pos);
            ctx.lineTo(20 - t, pos);
            if (major) {
              ctx.save();
              ctx.translate(9, pos + 3);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText(String(Math.round(s)), 0, 0);
              ctx.restore();
            }
          }
        }
        ctx.stroke();
        // guides markers
        if (p?.guides) {
          ctx.fillStyle = 'rgba(0,200,255,0.9)';
          const list = axis === 'x' ? p.guides.v : p.guides.h;
          for (const g of list) {
            const pos = off + g * z;
            if (axis === 'x') ctx.fillRect(pos - 0.5, 0, 1, 20);
            else ctx.fillRect(0, pos - 0.5, 20, 1);
          }
        }
      }
    };
    draw();
    const off = engine.onViewport(draw);
    const ro = new ResizeObserver(draw);
    hRef.current && ro.observe(hRef.current);
    return () => {
      off();
      ro.disconnect();
    };
  }, [engine, show]);

  if (!show) return null;
  return (
    <>
      <div className="ruler-corner" title="Drag from a ruler to add a guide · drag a guide back onto the ruler to remove it" />
      <canvas ref={hRef} className="ruler h" onMouseDown={(e) => engine?.startGuideFromRuler('h', e.clientX, e.clientY)} />
      <canvas ref={vRef} className="ruler v" style={{ gridRow: 2 }} onMouseDown={(e) => engine?.startGuideFromRuler('v', e.clientX, e.clientY)} />
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Fit a page thumbnail inside a 132×64 box, preserving aspect ratio. */
function thumbBox(w: number, h: number) {
  const s = Math.min(132 / w, 64 / h);
  return { width: Math.round(w * s) + 10, height: Math.round(h * s) + 10 };
}

function PagesBar() {
  const engine = useEngine();
  const project = useEditor((s) => s.project);
  const pageIndex = useEditor((s) => s.pageIndex);
  const thumbs = useEditor((s) => s.thumbs);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  if (!project) return null;
  return (
    <div className="pages" aria-label="Pages">
      {project.pages.map((p, i) => (
        <div
          key={p.id}
          className={`page-thumb ${i === pageIndex ? 'on' : ''} ${dropAt === i && dragFrom !== null && dragFrom !== i ? 'drop' : ''}`}
          style={thumbBox(project.width, project.height)}
          draggable
          onDragStart={(e) => {
            setDragFrom(i);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (dragFrom === null) return;
            e.preventDefault();
            setDropAt(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragFrom !== null) engine.movePage(dragFrom, i);
            setDragFrom(null);
            setDropAt(null);
          }}
          onDragEnd={() => {
            setDragFrom(null);
            setDropAt(null);
          }}
          onClick={() => engine.gotoPage(i)}
          title={`Page ${i + 1}`}
        >
          {thumbs[p.id] ? <img src={thumbs[p.id]} alt={`Page ${i + 1}`} /> : <div className="ph" style={p.background ? { background: p.background } : undefined} />}
          <span className="n">{i + 1}</span>
          <div className="tools">
            <button className="icon-btn" title="Duplicate page" onClick={(e) => (e.stopPropagation(), engine.duplicatePage(i))}>
              <CopyPlus size={11} />
            </button>
            {i > 0 && (
              <button className="icon-btn" title="Move left" onClick={(e) => (e.stopPropagation(), engine.movePage(i, i - 1))}>
                <ChevronUp size={11} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            )}
            {i < project.pages.length - 1 && (
              <button className="icon-btn" title="Move right" onClick={(e) => (e.stopPropagation(), engine.movePage(i, i + 1))}>
                <ChevronDown size={11} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            )}
            {project.pages.length > 1 && (
              <button
                className="icon-btn"
                title="Delete page"
                onClick={(e) => {
                  e.stopPropagation();
                  if (project.pages[i].objects.length && !confirm(`Delete page ${i + 1}?`)) return;
                  engine.deletePage(i);
                }}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      ))}
      <button className="add-page" title="Add page" onClick={() => engine.addPage(project.pages.length - 1)}>
        <Plus size={18} />
      </button>
      <span className="faint" style={{ marginLeft: 'auto', fontSize: 11.5, whiteSpace: 'nowrap' }}>
        Page {pageIndex + 1} of {project.pages.length}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ContextMenu() {
  const engine = useEngine();
  const menu = useEditor((s) => s.menu);
  useEditor((s) => s.selVersion);
  if (!menu) return null;
  const sel = engine.canvas.getActiveObjects();
  const active = engine.active();
  const has = sel.length > 0;
  const locked = has && sel.every((o) => (o as any).locked);
  const hidden = has && sel.some((o) => !o.visible);
  const isGroup = active instanceof Group && !(active instanceof ActiveSelection);
  const items: MenuItem[] = has
    ? [
        { label: 'Copy', icon: <Copy size={14} />, kbd: `${MOD}C`, onClick: () => engine.copy() },
        { label: 'Cut', icon: <Scissors size={14} />, kbd: `${MOD}X`, onClick: () => engine.cut(), disabled: locked },
        { label: 'Paste', icon: <Clipboard size={14} />, kbd: `${MOD}V`, onClick: () => engine.paste() },
        { label: 'Duplicate', icon: <CopyPlus size={14} />, kbd: `${MOD}D`, onClick: () => engine.duplicate() },
        { sep: true },
        { label: 'Bring forward', icon: <ChevronUp size={14} />, kbd: `${MOD}]`, onClick: () => engine.arrange('forward') },
        { label: 'Bring to front', icon: <BringToFront size={14} />, kbd: `${MOD}⇧]`, onClick: () => engine.arrange('front') },
        { label: 'Send backward', icon: <ChevronDown size={14} />, kbd: `${MOD}[`, onClick: () => engine.arrange('backward') },
        { label: 'Send to back', icon: <SendToBack size={14} />, kbd: `${MOD}⇧[`, onClick: () => engine.arrange('back') },
        { sep: true },
        ...(sel.length > 1 ? [{ label: 'Group', icon: <GroupIcon size={14} />, kbd: `${MOD}G`, onClick: () => engine.group() }] : []),
        ...(isGroup ? [{ label: 'Ungroup', icon: <Ungroup size={14} />, kbd: `${MOD}⇧G`, onClick: () => engine.ungroup() }] : []),
        { label: 'Center horizontally on page', icon: <AlignCenterVertical size={14} />, onClick: () => engine.alignToPage('hcenter') },
        { label: 'Center vertically on page', icon: <AlignCenterHorizontal size={14} />, onClick: () => engine.alignToPage('vcenter') },
        ...(active instanceof FabricImage ? [{ label: 'Crop image', icon: <Crop size={14} />, onClick: () => engine.openCrop() }] : []),
        { sep: true },
        { label: locked ? 'Unlock' : 'Lock', icon: <Lock size={14} />, kbd: `${MOD}L`, onClick: () => engine.toggleLock() },
        { label: hidden ? 'Show' : 'Hide', icon: hidden ? <Eye size={14} /> : <EyeOff size={14} />, kbd: `${MOD}⇧H`, onClick: () => engine.toggleVisible() },
        { label: 'Delete', icon: <Trash2 size={14} />, kbd: 'Del', danger: true, onClick: () => engine.remove(), disabled: locked },
      ]
    : [
        { label: 'Paste', icon: <Clipboard size={14} />, kbd: `${MOD}V`, onClick: () => engine.paste() },
        { label: 'Select all', kbd: `${MOD}A`, onClick: () => engine.selectAll() },
        { sep: true },
        { label: 'Add page after', icon: <Plus size={14} />, onClick: () => engine.addPage() },
        { label: 'Fit to screen', icon: <Maximize size={14} />, kbd: `${MOD}0`, onClick: () => engine.fit() },
      ];
  return <PopMenu x={menu.x} y={menu.y} items={items} onClose={() => useEditor.setState({ menu: null })} />;
}

/* ------------------------------------------------------------------ */

function isTyping(e: Event) {
  const t = e.target as HTMLElement;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

function Shortcuts({ onDialog }: { onDialog: (d: any) => void }) {
  const engine = useEngine();
  useEffect(() => {
    const editingText = () => !!(engine.active() as any)?.isEditing;
    const down = (e: KeyboardEvent) => {
      if (isTyping(e) || editingText()) return;
      if (document.querySelector('.modal-back, .preview')) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (e.code === 'Space' && !e.repeat) {
        engine.setSpace(true);
        e.preventDefault();
        return;
      }
      if (mod && k === 'z') return e.preventDefault(), e.shiftKey ? engine.redo() : engine.undo();
      if (mod && k === 'y') return e.preventDefault(), engine.redo();
      if (mod && k === 'c') return engine.copy() && e.preventDefault();
      if (mod && k === 'x') return e.preventDefault(), engine.cut();
      if (mod && k === 'd') return e.preventDefault(), engine.duplicate();
      if (mod && k === 'a') return e.preventDefault(), engine.selectAll();
      if (mod && k === 'g') return e.preventDefault(), e.shiftKey ? engine.ungroup() : engine.group();
      if (mod && k === 'l') return e.preventDefault(), engine.toggleLock();
      if (mod && e.shiftKey && k === 'h') return e.preventDefault(), engine.toggleVisible();
      if (mod && (k === ']' || e.code === 'BracketRight')) return e.preventDefault(), engine.arrange(e.shiftKey ? 'front' : 'forward');
      if (mod && (k === '[' || e.code === 'BracketLeft')) return e.preventDefault(), engine.arrange(e.shiftKey ? 'back' : 'backward');
      if (mod && k === '0') return e.preventDefault(), engine.fit();
      if (mod && k === '1') return e.preventDefault(), engine.setZoom(1);
      if (mod && (k === '=' || k === '+')) return e.preventDefault(), engine.zoomBy(1.2);
      if (mod && k === '-') return e.preventDefault(), engine.zoomBy(1 / 1.2);
      if (mod && k === 's') return e.preventDefault(), engine.saveNow().then(() => toast('Saved to this browser', 'success'));
      if (mod && e.shiftKey && k === 'e') return e.preventDefault(), onDialog('export');
      if (mod) return;
      if (k === 'delete' || k === 'backspace') return e.preventDefault(), engine.remove();
      if (k === 'escape') return engine.deselect();
      if (k.startsWith('arrow')) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        engine.nudge(k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0, k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0);
        return;
      }
      if (k === 't') return engine.addText({ text: 'Your text', fontFamily: 'Inter', fontWeight: 600, size: 72, name: 'Text' });
      if (k === 'r') return engine.addShape('rect');
      if (k === 'o') return engine.addShape('circle');
      if (k === 'l') return engine.addShape('line');
      if (k === '?') return onDialog('shortcuts');
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') engine.setSpace(false);
    };
    const paste = async (e: ClipboardEvent) => {
      if (isTyping(e) || editingText()) return;
      const files = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
      e.preventDefault();
      if (files.length) {
        for (const f of files) {
          try {
            const a = await importFile(new File([f], f.name || 'Pasted image', { type: f.type }));
            await engine.addAsset(a);
          } catch (err: any) {
            toast(err.message, 'error');
          }
        }
      } else engine.paste();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('paste', paste);
    window.addEventListener('blur', () => engine.setSpace(false));
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('paste', paste);
    };
  }, [engine, onDialog]);
  return null;
}
