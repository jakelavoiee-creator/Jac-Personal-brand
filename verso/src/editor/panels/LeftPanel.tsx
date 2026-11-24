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
} from 'lucide-react';
import { ActiveSelection, FabricImage, Group, Textbox, type FabricObject } from 'fabric';
import { useEngine } from '../Editor';
import { isDark, useEditor } from '../engine';
import { SHAPES, shapePath } from '../shapes';
import { FONTS, ensureFont } from '../../lib/fonts';
import { ACCEPTED_UPLOADS, assetURL, forgetAssetURL, importFile } from '../../lib/assets';
import { deleteAsset, listAssets } from '../../lib/db';
import { pickFiles } from '../../lib/download';
import type { Asset } from '../../lib/types';
import { toast } from '../../store/app';
import { ColorField, Toggle } from '../../ui/controls';

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
  | 'layers';

const RAIL: { id: PanelId; label: string; icon: any; soon?: string }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, soon: 'Stage 3' },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'fonts', label: 'Fonts', icon: CaseSensitive },
  { id: 'graphics', label: 'Graphics', icon: Sparkles, soon: 'Stage 2' },
  { id: 'illustrations', label: 'Illustr.', icon: Flower2, soon: 'Stage 2' },
  { id: 'photos', label: 'Photos', icon: Camera, soon: 'Stage 3' },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'backgrounds', label: 'Backgr.', icon: PaintBucket },
  { id: 'textures', label: 'Textures', icon: Grip, soon: 'Stage 2' },
  { id: 'ai', label: 'AI Tools', icon: Wand2, soon: 'Stage 4' },
  { id: 'mockups', label: 'Mockups', icon: Shirt, soon: 'Stage 5' },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const SOON: Record<string, { title: string; body: string; items: string[] }> = {
  templates: { title: 'Editable templates', body: 'Layered, fully editable compositions arrive in Stage 3, along with “save as template”.', items: ['Streetwear & apparel', 'Vintage typography', 'Editorial posters & album covers', 'Social carousels & ads'] },
  graphics: { title: 'Graphic library', body: 'An original, recolourable vector library ships in Stage 2. Until then, import your own SVGs from Uploads — they stay fully editable vectors.', items: ['Badges & emblems', 'Ornaments & dividers', 'Flames, wings, stars, skulls', 'Frames & borders'] },
  illustrations: { title: 'Illustrations', body: 'Original vintage and modern illustration sets ship in Stage 2.', items: ['Vintage engraving style', 'Botanical', 'Abstract & geometric'] },
  photos: { title: 'Stock photos', body: 'A free stock photo search (openly licensed sources) arrives in Stage 3. Upload your own photos today.', items: ['Search by keyword', 'License info per photo'] },
  textures: { title: 'Textures & print effects', body: 'Distressed, halftone, grain and screen-print effects ship with the Stage 2 effects engine.', items: ['Distressed print', 'Halftone', 'Paper & grain', 'Worn ink'] },
  ai: { title: 'AI tools', body: 'Stage 4. Background removal will run locally in the browser (free); generation & generative fill will use provider keys from Settings. Nothing here is simulated.', items: ['Background remover (local ONNX)', 'Magic eraser', 'Generative fill & expand', 'Text-to-image'] },
  mockups: { title: 'Mockup studio', body: 'Stage 5: garment templates (front/back), packaging and lifestyle mockups.', items: ['T-shirts, hoodies, caps', 'Packaging & posters', 'Your own product photos'] },
};

export default function LeftPanel() {
  const [open, setOpen] = useState<PanelId | null>(() => (innerWidth < 900 ? null : 'elements'));
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
            onDragStart={(e) => e.dataTransfer.setData('application/x-verso-shape', s.kind)}
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
      <h5>Graphics</h5>
      <p className="faint" style={{ fontSize: 12, margin: 0 }}>
        The original graphic library (badges, ornaments, frames) arrives in Stage 2. Import SVG files from Uploads to use your own editable vectors now.
      </p>
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

/* ---------------- Fonts ---------------- */

function FontsPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const active = engine.active();
  const current = active instanceof Textbox ? active.fontFamily : null;
  const cats = ['All', ...Array.from(new Set(FONTS.map((f) => f.category)))];
  const list = FONTS.filter((f) => (cat === 'All' || f.category === cat) && f.family.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="search" style={{ marginBottom: 8 }}>
        <Search size={14} />
        <input placeholder="Search fonts" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 32 }} />
      </div>
      <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ marginBottom: 10 }}>
        {cats.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      {!current && <p className="faint" style={{ fontSize: 12, margin: '0 0 8px' }}>Select a text layer to apply a font — or click a font to add new text in it.</p>}
      <div className="font-list">
        {list.map((f) => (
          <button
            key={f.family}
            className={current === f.family ? 'on' : ''}
            style={{ fontFamily: `"${f.family}"` }}
            onClick={() => (current ? engine.setFont(f.family) : engine.addText({ text: f.family, fontFamily: f.family, size: 90, fontWeight: f.weights.includes(700) ? 700 : 400 }))}
          >
            {f.family}
            <small>{f.category}</small>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        {FONTS.length} curated Google Fonts (open licences). The full searchable library with favourites, recents, custom uploads and the 50-font comparison studio ships in Stage 2.
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
  const refresh = () => listAssets().then(setAssets);
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
        Drop PNG, JPG, WEBP, GIF or SVG
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
            onDragStart={(e) => e.dataTransfer.setData('application/x-verso-asset', a.id)}
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
  if (o instanceof Textbox) return <Type size={14} />;
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
      if (o instanceof Textbox) continue;
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
