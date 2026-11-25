import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  CaseSensitive,
  Sparkles,
  Flower2,
  Camera,
  Upload,
  PaintBucket,
  Grip,
  Wand2,
  Shirt,
  Layers as LayersIcon,
  X,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Square,
  Group as GroupIcon,
  PenTool,
  Palette,
  Pencil,
} from 'lucide-react';
import { ActiveSelection, FabricImage, Group, IText, type FabricObject } from 'fabric';
import { useEngine } from '../Editor';
import FontsPanel from './FontsPanel';
import GraphicsPanel from './GraphicsPanel';
import BrandPanel from './BrandPanel';
import TemplatesPanel from './TemplatesPanel';
import PhotosPanel from './PhotosPanel';
import AIPanel from './AIPanel';
import { isDark, useEditor } from '../engine';
import { SHAPES, shapePath } from '../shapes';
import { ensureFont } from '../../lib/fonts';
import { ACCEPTED_UPLOADS, assetURL, forgetAssetURL, importFile } from '../../lib/assets';
import { deleteAsset, listAssets } from '../../lib/db';
import { pickFiles } from '../../lib/download';
import type { Asset } from '../../lib/types';
import { toast } from '../../store/app';
import { ColorField, RangeField, Toggle } from '../../ui/controls';
import { TEXTURES, textureSwatch, type TextureKind } from '../../lib/fx';
import { refSize, TextureControls } from '../EffectsSection';
import { Rect } from 'fabric';

type PanelId =
  | 'templates'
  | 'elements'
  | 'text'
  | 'fonts'
  | 'graphics'
  | 'illustrations'
  | 'photos'
  | 'uploads'
  | 'backgrounds'
  | 'textures'
  | 'ai'
  | 'mockups'
  | 'layers'
  | 'brand';

const RAIL: { id: PanelId; label: string; icon: any; soon?: string }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'fonts', label: 'Fonts', icon: CaseSensitive },
  { id: 'graphics', label: 'Graphics', icon: Sparkles },
  { id: 'illustrations', label: 'Illustr.', icon: Flower2 },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'backgrounds', label: 'Backgr.', icon: PaintBucket },
  { id: 'textures', label: 'Textures', icon: Grip },
  { id: 'ai', label: 'AI Tools', icon: Wand2 },
  { id: 'mockups', label: 'Mockups', icon: Shirt, soon: 'Stage 5' },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const SOON: Record<string, { title: string; body: string; items: string[] }> = {
  mockups: { title: 'Mockup studio', body: 'Stage 5: garment templates (front/back), packaging and lifestyle mockups.', items: ['T-shirts, hoodies, caps', 'Packaging & posters', 'Your own product photos'] },
};

export default function LeftPanel() {
  const open = useEditor((s) => s.panel) as PanelId | null;
  const setOpen = (p: PanelId | null) => useEditor.setState({ panel: p });
  return (
    <>
      <nav className="rail" aria-label="Tools">
        {RAIL.map((r) => (
          <button key={r.id} className={open === r.id ? 'on' : ''} onClick={() => setOpen(open === r.id ? null : r.id)} title={r.soon ? `${r.label} — in development (${r.soon})` : r.label}>
            <r.icon size={19} strokeWidth={1.7} />
            {r.label}
            {r.soon && <span className="dot" />}
          </button>
        ))}
      </nav>
      <aside className={`panel ${open ? '' : 'closed'}`}>
        {open && (
          <>
            <div className="panel-head">
              <h4>
                {RAIL.find((r) => r.id === open)?.label.replace('Illustr.', 'Illustrations').replace('Backgr.', 'Backgrounds')}
              </h4>
              <button className="icon-btn sm" onClick={() => setOpen(null)} aria-label="Close panel">
                <X size={15} />
              </button>
            </div>
            <div className="panel-body">
              {open === 'elements' && <ElementsPanel />}
              {open === 'text' && <TextPanel />}
              {open === 'fonts' && <FontsPanel />}
              {open === 'uploads' && <UploadsPanel />}
              {open === 'backgrounds' && <BackgroundsPanel />}
              {open === 'layers' && <LayersPanel />}
              {open === 'textures' && <TexturesPanel />}
              {open === 'brand' && <BrandPanel />}
              {open === 'templates' && <TemplatesPanel />}
              {open === 'photos' && <PhotosPanel />}
              {open === 'ai' && <AIPanel />}
              {open === 'graphics' && <GraphicsPanel />}
              {open === 'illustrations' && <GraphicsPanel illustrations />}
              {SOON[open] && <SoonPanel id={open} stage={RAIL.find((r) => r.id === open)!.soon!} />}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function SoonPanel({ id, stage }: { id: string; stage: string }) {
  const s = SOON[id];
  return (
    <div className="soon-panel">
      <span className="tag soon" style={{ marginBottom: 10 }}>
        In development · {stage}
      </span>
      <b>{s.title}</b>
      {s.body}
      <ul>
        {s.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Elements ---------------- */

function ElementsPanel() {
  const engine = useEngine();
  return (
    <>
      <h5>Shapes</h5>
      <div className="shape-grid">
        {SHAPES.map((s) => (
          <button
            key={s.kind}
            title={`${s.label} — click or drag onto the canvas`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/x-aura-shape', s.kind)}
            onClick={() => engine.addShape(s.kind)}
          >
            <svg width="34" height="34" viewBox="-2 -2 40 40">
              <path
                d={shapePath(s.kind, 36)}
                fill={s.kind === 'line' || s.kind === 'arrow' ? 'none' : 'currentColor'}
                fillRule="evenodd"
                stroke={s.kind === 'line' || s.kind === 'arrow' ? 'currentColor' : 'none'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        Shortcuts: <span className="kbd">R</span> rectangle · <span className="kbd">O</span> circle · <span className="kbd">L</span> line · <span className="kbd">T</span> text
      </p>
      <DrawTools />
    </>
  );
}

function DrawTools() {
  const engine = useEngine();
  const tool = useEditor((s) => s.tool);
  const st = useEditor((s) => s.penStyle);
  return (
    <>
      <h5>Draw</h5>
      <div className="row" style={{ gap: 6 }}>
        <button className={`btn sm ${tool === 'pen' ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => engine.setTool(tool === 'pen' ? 'select' : 'pen')} title="Pen tool (P)">
          <PenTool size={14} /> Pen
        </button>
        <button className={`btn sm ${tool === 'pencil' ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => engine.setTool(tool === 'pencil' ? 'select' : 'pencil')} title="Pencil / freehand (B)">
          <Pencil size={14} /> Pencil
        </button>
      </div>
      <div className="prop-row" style={{ marginTop: 10 }}>
        <span>Stroke</span>
        <ColorField value={st.stroke} onChange={(v) => engine.setPenStyle({ stroke: v })} />
      </div>
      <div className="prop-row">
        <span>Width</span>
        <RangeField value={st.width} min={1} max={80} onChange={(v) => engine.setPenStyle({ width: v })} />
      </div>
      <div className="prop-row">
        <span>Fill (closed)</span>
        <ColorField value={st.fill || null} allowNone onNone={() => engine.setPenStyle({ fill: '' })} onChange={(v) => engine.setPenStyle({ fill: v })} />
      </div>
    </>
  );
}

/* ---------------- Text ---------------- */

const TEXT_PRESETS = [
  { label: 'Add a heading', text: 'Heading', fontFamily: 'Inter', fontWeight: 800, size: 110, css: { fontSize: 22, fontWeight: 800 } },
  { label: 'Add a subheading', text: 'Subheading', fontFamily: 'Inter', fontWeight: 600, size: 56, css: { fontSize: 16, fontWeight: 600 } },
  { label: 'Add body text', text: 'Body text — click to edit and start typing.', fontFamily: 'Inter', fontWeight: 400, size: 30, css: { fontSize: 13 } },
];

const COMBOS = [
  { text: 'MIDNIGHT EDITION', fontFamily: 'Bebas Neue', fontWeight: 400, size: 150, letterSpacing: 60, tag: 'Condensed display' },
  { text: 'Maison Lumière', fontFamily: 'Playfair Display', fontWeight: 700, size: 110, tag: 'Editorial serif' },
  { text: 'ÉLÉGANCE', fontFamily: 'Cinzel', fontWeight: 500, size: 100, letterSpacing: 300, tag: 'Luxury caps' },
  { text: 'Est. 1994', fontFamily: 'Rye', fontWeight: 400, size: 96, tag: 'Western' },
  { text: 'Streetwise', fontFamily: 'Permanent Marker', fontWeight: 400, size: 110, tag: 'Graffiti' },
  { text: 'Sunset Club', fontFamily: 'Pacifico', fontWeight: 400, size: 100, tag: 'Retro script' },
  { text: 'FUTURE/FORM', fontFamily: 'Unbounded', fontWeight: 800, size: 96, tag: 'Futuristic' },
  { text: 'Blackletter', fontFamily: 'UnifrakturMaguntia', fontWeight: 400, size: 110, tag: 'Gothic' },
];

function TextPanel() {
  const engine = useEngine();
  useEffect(() => {
    COMBOS.forEach((c) => ensureFont(c.fontFamily, c.fontWeight));
  }, []);
  return (
    <>
      <div className="text-presets">
        {TEXT_PRESETS.map((p) => (
          <button key={p.label} style={p.css} onClick={() => engine.addText(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <h5>Type styles</h5>
      <div className="text-presets">
        {COMBOS.map((c) => (
          <button key={c.text} onClick={() => engine.addText(c)} title={`${c.fontFamily} · ${c.tag}`}>
            <span style={{ fontFamily: `"${c.fontFamily}"`, fontWeight: c.fontWeight, fontSize: 21, letterSpacing: (c.letterSpacing ?? 0) / 1000 + 'em', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</span>
            <small className="faint" style={{ fontSize: 10.5 }}>
              {c.fontFamily} · {c.tag}
            </small>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        Curved, warped and path text plus 3D/outline effects arrive with the Stage 2 typography engine.
      </p>
    </>
  );
}

/* ---------------- Uploads ---------------- */

function UploadsPanel() {
  const engine = useEngine();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [q, setQ] = useState('');
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = () => listAssets().then((l) => setAssets(l.filter((a) => a.type.startsWith('image/'))));
  useEffect(() => {
    refresh();
  }, []);

  const upload = async (files: File[]) => {
    setBusy(true);
    for (const f of files) {
      try {
        await importFile(f);
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
    setBusy(false);
    refresh();
  };

  const list = assets.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <button className="btn primary block" onClick={async () => upload(await pickFiles(ACCEPTED_UPLOADS))} disabled={busy}>
        <Upload size={14} /> {busy ? 'Uploading…' : 'Upload files'}
      </button>
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        onDragOver={(e) => (e.preventDefault(), e.stopPropagation(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          upload(Array.from(e.dataTransfer.files));
        }}
      >
        Drop PNG, JPG, WEBP, GIF, SVG or PDF
      </div>
      {assets.length > 4 && (
        <div className="search" style={{ margin: '8px 0' }}>
          <Search size={14} />
          <input placeholder="Search uploads" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 30 }} />
        </div>
      )}
      <h5>
        Your uploads <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>· {assets.length}</span>
      </h5>
      {!list.length && <p className="faint" style={{ fontSize: 12 }}>Nothing uploaded yet. Uploads are shared across all your designs.</p>}
      <div className="asset-grid">
        {list.map((a) => (
          <div
            key={a.id}
            className="asset"
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/x-aura-asset', a.id)}
            onClick={() => engine.addAsset(a).catch((err) => toast(err.message, 'error'))}
            title={`${a.name} · ${a.width}×${a.height}`}
          >
            <img src={assetURL(a)} alt={a.name} />
            <span className="asset-name">{a.name}</span>
            <button
              className="icon-btn sm x"
              title="Delete upload"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete “${a.name}” from your uploads? Designs already using it will lose the image.`)) return;
                await deleteAsset(a.id);
                forgetAssetURL(a.id);
                refresh();
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- Backgrounds ---------------- */

const PALETTE = [
  '#ffffff', '#f4f1ea', '#e9e4d8', '#d9d9d9', '#9a9a9a', '#3a3a3a', '#111111',
  '#000000', '#1b2a41', '#2f4858', '#33658a', '#86bbd8', '#c9e4ca', '#55828b',
  '#3b6064', '#87bba2', '#f6ae2d', '#f26419', '#e63946', '#a8201a', '#6d2e46',
  '#f1d6e4', '#ffcad4', '#b5838d', '#6b705c', '#a5a58d', '#cb997e', '#ddbea9',
];

function BackgroundsPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const bg = engine.page.background;
  return (
    <>
      <h5>Page colour</h5>
      <ColorField value={bg} onChange={(v, live) => engine.setBackground(v, live)} />
      <div className="row" style={{ justifyContent: 'space-between', margin: '12px 0' }}>
        <span className="muted">Transparent background</span>
        <Toggle on={bg === null} onChange={(v) => engine.setBackground(v ? null : '#ffffff')} />
      </div>
      <div className="swatches">
        {PALETTE.map((c) => (
          <button key={c} className={bg === c ? 'on' : ''} style={{ background: c }} title={c} onClick={() => engine.setBackground(c)} />
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        Gradient, image and texture backgrounds arrive in Stage 2–3. Transparent pages export as transparent PNG/WEBP for apparel printing.
      </p>
      {bg && isDark(bg) && <p className="faint" style={{ fontSize: 11.5 }}>New text on this page defaults to white.</p>}
    </>
  );
}

/* ---------------- Layers ---------------- */

function layerIcon(o: FabricObject) {
  if (o instanceof IText) return <Type size={14} />;
  if (o instanceof FabricImage) return <ImageIcon size={14} />;
  if (o instanceof Group) return <GroupIcon size={14} />;
  return <Square size={14} />;
}

function LayersPanel() {
  const engine = useEngine();
  const objVersion = useEditor((s) => s.objVersion);
  useEditor((s) => s.selVersion);
  const [editing, setEditing] = useState<FabricObject | null>(null);
  const [drag, setDrag] = useState<{ from: number; over: number | null; pos: 'above' | 'below' } | null>(null);
  const lastClicked = useRef<number | null>(null);
  const objs = engine.objects();
  const reversed = [...objs].reverse(); // top of stack first
  const selected = new Set(engine.canvas.getActiveObjects());

  const thumbs = useMemo(() => {
    const map = new Map<FabricObject, string>();
    for (const o of objs) {
      if (o instanceof IText) continue;
      try {
        const w = o.getScaledWidth();
        const h = o.getScaledHeight();
        const m = 56 / Math.max(w, h, 1);
        // render without the active-selection transform & ignoring visibility
        const vis = o.visible;
        o.visible = true;
        map.set(o, o.toDataURL({ multiplier: m, format: 'png' }));
        o.visible = vis;
      } catch {
        /* skip */
      }
    }
    return map;
  }, [objVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClick = (o: FabricObject, i: number, e: React.MouseEvent) => {
    if (!o.visible) return;
    if (e.shiftKey && lastClicked.current !== null) {
      const [a, b] = [lastClicked.current, i].sort((x, y) => x - y);
      engine.select(reversed.slice(a, b + 1).filter((x) => x.visible));
    } else if (e.metaKey || e.ctrlKey) {
      const cur = engine.canvas.getActiveObjects();
      engine.select(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    } else engine.select([o]);
    lastClicked.current = i;
  };

  if (!objs.length) return <p className="faint" style={{ fontSize: 12 }}>No layers on this page yet.</p>;

  return (
    <>
      <p className="faint" style={{ fontSize: 11.5, margin: '0 0 8px' }}>
        Top of the list is front-most. Drag to reorder, double-click to rename, Shift/{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}-click to multi-select.
      </p>
      <div className="layers">
        {reversed.map((o, i) => {
          const name = (o as any).name || o.type;
          const locked = !!(o as any).locked;
          const dropCls = drag && drag.over === i && drag.from !== i ? `drop-${drag.pos}` : '';
          return (
            <div
              key={(o as any).id ?? i}
              className={`layer ${selected.has(o) ? 'on' : ''} ${o.visible ? '' : 'hidden'} ${dropCls}`}
              draggable={editing !== o}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                setDrag({ from: i, over: null, pos: 'above' });
              }}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setDrag({ ...drag, over: i, pos: e.clientY < r.top + r.height / 2 ? 'above' : 'below' });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!drag || drag.over === null) return setDrag(null);
                const src = reversed[drag.from];
                // convert list position (top-first) into canvas stack index (bottom-first)
                let target = drag.pos === 'above' ? i : i + 1;
                if (drag.from < target) target--;
                engine.moveLayer(src, objs.length - 1 - target);
                setDrag(null);
              }}
              onDragEnd={() => setDrag(null)}
              onClick={(e) => onClick(o, i, e)}
              onDoubleClick={() => setEditing(o)}
            >
              <div className="layer-thumb">{thumbs.get(o) ? <img src={thumbs.get(o)} alt="" /> : layerIcon(o)}</div>
              <div className="layer-name">
                {editing === o ? (
                  <input
                    className="input"
                    autoFocus
                    defaultValue={name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      engine.rename(o, e.target.value);
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    {name}
                    {o instanceof Group && !(o instanceof ActiveSelection) && <span className="faint"> · {o.getObjects().length}</span>}
                  </>
                )}
              </div>
              <button className={`icon-btn sm ${locked ? 'keep' : ''}`} title={locked ? 'Unlock' : 'Lock'} onClick={(e) => (e.stopPropagation(), engine.toggleLock([o]))}>
                {locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              <button className={`icon-btn sm ${o.visible ? '' : 'keep'}`} title={o.visible ? 'Hide' : 'Show'} onClick={(e) => (e.stopPropagation(), engine.toggleVisible([o]))}>
                {o.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Textures ---------------- */

function defaultScale(kind: TextureKind, s: number) {
  if (kind === 'paper' || kind === 'film' || kind === 'grain') return Math.max(3, Math.min(14, s * 0.02));
  if (kind === 'halftone') return Math.max(3, Math.min(40, s * 0.06));
  if (kind === 'newspaper') return Math.max(3, Math.min(20, s * 0.04));
  return Math.max(3, Math.min(60, s * 0.1));
}

function TexturesPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const o = engine.active();
  const cur = (o as any)?.fx?.texture?.kind;
  const apply = (kind: TextureKind) => {
    if (!o) return;
    const s = refSize(o);
    engine.patchFx('texture', { kind, intensity: kind === 'paper' ? 0.7 : 0.5, scale: defaultScale(kind, s), seed: Math.floor(Math.random() * 9999), angle: 45 });
  };
  const addPaper = () => {
    const p = engine.project;
    const r = new Rect({ width: p.width, height: p.height, fill: '#efe6d2' });
    (r as any).fx = { texture: { kind: 'paper', intensity: 0.8, scale: Math.max(3, Math.min(p.width, p.height) / 180), seed: 5, angle: 0 } };
    engine.addObject(r, { fit: 1, name: 'Paper texture' });
    engine.arrange('back');
  };
  return (
    <>
      <p className="faint" style={{ fontSize: 12, margin: '0 0 10px' }}>
        {o ? 'Click a print effect to apply it to the selection. Everything stays editable — text remains text.' : 'Select text, a shape, a graphic or an image, then pick a print effect.'}
      </p>
      {o && cur && (
        <div className="soon-panel" style={{ marginBottom: 12, padding: 10 }}>
          <TextureControls o={o} />
        </div>
      )}
      <div className="texture-grid">
        {TEXTURES.map((t) => (
          <button key={t.kind} className={cur === t.kind ? 'on' : ''} disabled={!o} style={!o ? { opacity: 0.55 } : undefined} onClick={() => apply(t.kind)} title={t.hint}>
            <img src={textureSwatch(t.kind)} alt="" />
            <b>{t.label}</b>
            <small>{t.hint}</small>
          </button>
        ))}
      </div>
      <h5>Backgrounds</h5>
      <button className="btn block" onClick={addPaper}>
        Add paper texture layer
      </button>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 10 }}>
        Textures are procedurally generated (original, no licensing) and render at export resolution. Combine with blend modes in Appearance for overlays.
      </p>
    </>
  );
}
