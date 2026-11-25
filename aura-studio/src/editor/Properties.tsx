import { useEffect, useMemo, useState } from 'react';
import { NEUTRAL, PRESETS, presetPreview, type Adjust } from '../lib/photoFilter';
import { getAsset } from '../lib/db';
import { creditLine } from '../lib/stock';
import type { Asset } from '../lib/types';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  EyeOff,
  FlipHorizontal2,
  FlipVertical2,
  Group as GroupIcon,
  Ungroup,
  Link2,
  Link2Off,
  Crop,
  RotateCcw,
  Scaling,
  Columns3,
  Scissors,
  Wand2,
  Sparkles,
  Layers,
} from 'lucide-react';
import FxLabSection from './FxLab';
import { ActiveSelection, FabricImage, Group, Path, Polygon, Polyline, Rect, Shadow, IText, type FabricObject } from 'fabric';
import { toast } from '../store/app';
import { useEngine } from './Editor';
import { useEditor, type AlignKind, type PhotoState } from './engine';
import { WARPS, type Warp } from '../lib/warp';
import { weightsFor } from '../lib/fonts';
import { ColorField, NumberField, RangeField, Toggle } from '../ui/controls';
import EffectsSection, { TextureControls } from './EffectsSection';

const WEIGHT_NAMES: Record<number, string> = { 100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black' };

const BLEND = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

function typeLabel(o: FabricObject) {
  if (o instanceof ActiveSelection) return `${o.getObjects().length} selected`;
  if (o instanceof IText) return 'Text';
  if (o instanceof FabricImage) return 'Image';
  if (o instanceof Group) return 'Group';
  return 'Shape';
}

export default function Properties({ onDialog }: { onDialog: (d: any) => void }) {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const o = engine.active();
  return <aside className="props">{o ? <ObjectProps o={o} /> : <PageProps onDialog={onDialog} />}</aside>;
}

/* ---------------- page ---------------- */

function PageProps({ onDialog }: { onDialog: (d: any) => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const showGrid = useEditor((s) => s.showGrid);
  const gridSize = useEditor((s) => s.gridSize);
  const snapping = useEditor((s) => s.snapping);
  const showRulers = useEditor((s) => s.showRulers);
  const bg = engine.page.background;
  const guides = project.guides ? project.guides.v.length + project.guides.h.length : 0;
  const redraw = () => engine.canvas.requestRenderAll();
  return (
    <>
      <div className="props-title">
        Page {engine.pageIndex + 1}
        <span>
          {project.width} × {project.height} px{project.dpi ? ` · ${project.dpi} DPI` : ''}
        </span>
      </div>
      <div className="props-section">
        <h6>Size</h6>
        {project.dpi && (
          <p className="faint" style={{ margin: '0 0 8px', fontSize: 11.5 }}>
            {(project.width / project.dpi).toFixed(2)} × {(project.height / project.dpi).toFixed(2)} in at {project.dpi} DPI
          </p>
        )}
        <button className="btn block" onClick={() => onDialog('resize')}>
          <Scaling size={14} /> Resize design
        </button>
        <button className="btn block" style={{ marginTop: 6 }} onClick={() => engine.stampVisible()} title="Merge everything visible into one new image layer (Photoshop: Stamp visible) — then use FX Lab on the whole artwork" data-testid="stamp-visible">
          <Layers size={14} /> Merge visible to new layer
        </button>
      </div>
      <div className="props-section">
        <h6>Background</h6>
        <ColorField value={bg} onChange={(v, live) => engine.setBackground(v, live)} />
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <span className="muted">Transparent</span>
          <Toggle on={bg === null} onChange={(v) => engine.setBackground(v ? null : '#ffffff')} />
        </div>
      </div>
      <div className="props-section">
        <h6>View</h6>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="muted">Smart snapping</span>
          <Toggle on={snapping} onChange={(v) => useEditor.setState({ snapping: v })} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="muted">Rulers</span>
          <Toggle on={showRulers} onChange={(v) => useEditor.setState({ showRulers: v })} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="muted">Grid</span>
          <Toggle
            on={showGrid}
            onChange={(v) => {
              useEditor.setState({ showGrid: v });
              redraw();
            }}
          />
        </div>
        {showGrid && (
          <div className="prop-row">
            <span>Grid size</span>
            <NumberField
              value={gridSize}
              min={2}
              max={2000}
              unit="px"
              onChange={(v) => {
                useEditor.setState({ gridSize: v });
                redraw();
              }}
            />
          </div>
        )}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Guides · {guides}</span>
          <button className="btn sm" disabled={!guides} onClick={() => engine.clearGuides()}>
            Clear guides
          </button>
        </div>
        <p className="faint" style={{ fontSize: 11.5, margin: '10px 0 0' }}>
          Drag from a ruler to place a guide. Hold <span className="kbd">Space</span> to pan, <span className="kbd">Ctrl</span>+scroll to zoom. Press <span className="kbd">?</span> for all shortcuts.
        </p>
      </div>
    </>
  );
}

/* ---------------- object ---------------- */

function ObjectProps({ o }: { o: FabricObject }) {
  const engine = useEngine();
  const multi = o instanceof ActiveSelection;
  const objs = multi ? (o as ActiveSelection).getObjects() : [o];
  const locked = objs.every((x) => (x as any).locked);
  const isGroup = o instanceof Group && !multi;
  const texts = objs.filter((x) => x instanceof IText) as IText[];

  return (
    <>
      <div className="props-title">
        {multi ? typeLabel(o) : (o as any).name || typeLabel(o)}
        <span>{multi ? '' : typeLabel(o)}</span>
      </div>
      <div className="props-section" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="icon-row">
          <button className="icon-btn" title="Duplicate" onClick={() => engine.duplicate()}>
            <CopyPlus size={15} />
          </button>
          <button className="icon-btn" title={locked ? 'Unlock' : 'Lock'} onClick={() => engine.toggleLock()}>
            {locked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
          <button className="icon-btn" title="Hide" onClick={() => engine.toggleVisible()}>
            <EyeOff size={15} />
          </button>
          {!multi && (
            <>
              <button className={`icon-btn ${o.flipX ? 'on' : ''}`} title="Flip horizontal" onClick={() => engine.flip('x')} disabled={locked}>
                <FlipHorizontal2 size={15} />
              </button>
              <button className={`icon-btn ${o.flipY ? 'on' : ''}`} title="Flip vertical" onClick={() => engine.flip('y')} disabled={locked}>
                <FlipVertical2 size={15} />
              </button>
            </>
          )}
          {multi && (
            <button className="icon-btn" title="Group" onClick={() => engine.group()}>
              <GroupIcon size={15} />
            </button>
          )}
          {isGroup && (
            <button className="icon-btn" title="Ungroup" onClick={() => engine.ungroup()}>
              <Ungroup size={15} />
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="icon-btn" title="Delete" onClick={() => engine.remove()} disabled={locked}>
            <Trash2 size={15} />
          </button>
        </div>
        {locked && <p className="faint" style={{ fontSize: 11.5, margin: '8px 0 0' }}>Locked — unlock to move or edit.</p>}
      </div>

      {!multi && (o as any).placeholder && (
        <div className="props-section">
          <h6>Photo frame</h6>
          <p className="faint" style={{ fontSize: 12, margin: 0 }}>
            With this frame selected, click any image in Uploads or Photos — it fills the frame (cover-cropped). Re-crop it anytime.
          </p>
        </div>
      )}
      {!multi && <Geometry o={o} disabled={locked} />}
      <Arrange multi={multi} count={objs.length} />
      {texts.length > 0 && <TextProps t={texts[0]} multi={multi} />}
      {!multi && o instanceof IText && <TransformProps t={o} />}
      {multi && texts.length === 1 && objs.some((x) => x.type === 'path') && (
        <div className="props-section">
          <h6>Text on path</h6>
          <button className="btn block" onClick={() => engine.textOnPath()}>
            Put text on this path
          </button>
          <p className="faint" style={{ fontSize: 11.5, margin: '8px 0 0' }}>The path becomes the text's baseline (and is hidden). Undo restores it.</p>
        </div>
      )}
      {!multi && !(o instanceof IText) && !(o instanceof FabricImage) && !(o instanceof Group) && <ShapeProps o={o} />}
      {!multi && o instanceof FabricImage && <ImageProps img={o} />}
      {!multi && !(o as any).placeholder && <FxLabSection o={o} />}
      {!multi && !(o instanceof IText) && !(o instanceof FabricImage) && (o instanceof Group || o.type === 'path') && <ColorsProps o={o} />}
      <VectorProps o={o} objs={objs} multi={multi} />
      <Appearance o={o} />
      <EffectsSection o={o} />
      {!multi && (o as any).fx?.texture && (
        <div className="props-section">
          <h6>Print texture</h6>
          <TextureControls o={o} />
        </div>
      )}
      {!multi && <ShadowProps o={o} />}
    </>
  );
}

function Geometry({ o, disabled }: { o: FabricObject; disabled: boolean }) {
  const engine = useEngine();
  const [lockRatio, setLockRatio] = useState(true);
  const g = engine.geometry(o);
  const isText = o instanceof IText;
  return (
    <div className="props-section">
      <h6>Position &amp; size</h6>
      <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="grid2" style={{ marginBottom: 8 }}>
          <NumberField label="X" value={g.x} onChange={(v) => engine.setGeometry({ x: v })} />
          <NumberField label="Y" value={g.y} onChange={(v) => engine.setGeometry({ y: v })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <NumberField label="W" value={g.w} min={1} onChange={(v) => engine.setGeometry({ w: v }, lockRatio)} />
          <NumberField label="H" value={g.h} min={1} onChange={(v) => !isText && engine.setGeometry({ h: v }, lockRatio)} title={isText ? 'Text height follows its content' : undefined} />
          <button className={`icon-btn sm ${lockRatio ? 'on' : ''}`} title={lockRatio ? 'Proportions locked' : 'Proportions unlocked'} onClick={() => setLockRatio(!lockRatio)}>
            {lockRatio ? <Link2 size={13} /> : <Link2Off size={13} />}
          </button>
        </div>
        <div className="grid2">
          <NumberField label="°" value={g.angle} precision={1} min={-360} max={360} onChange={(v) => engine.setGeometry({ angle: v })} />
          <div />
        </div>
      </fieldset>
    </div>
  );
}

function Arrange({ multi, count }: { multi: boolean; count: number }) {
  const engine = useEngine();
  const a = (k: AlignKind) => (multi ? engine.align(k) : engine.alignToPage(k));
  return (
    <div className="props-section">
      <h6>
        {multi ? 'Align selection' : 'Align to page'}
        {multi && (
          <button className="btn ghost sm" style={{ height: 20, textTransform: 'none', letterSpacing: 0 }} onClick={() => engine.alignToPage('hcenter')} title="Center the whole selection on the page">
            Center on page
          </button>
        )}
      </h6>
      <div className="icon-row" style={{ justifyContent: 'space-between' }}>
        <button className="icon-btn" title="Align left" onClick={() => a('left')}>
          <AlignStartVertical size={15} />
        </button>
        <button className="icon-btn" title="Align horizontal centers" onClick={() => a('hcenter')}>
          <AlignCenterVertical size={15} />
        </button>
        <button className="icon-btn" title="Align right" onClick={() => a('right')}>
          <AlignEndVertical size={15} />
        </button>
        <button className="icon-btn" title="Align top" onClick={() => a('top')}>
          <AlignStartHorizontal size={15} />
        </button>
        <button className="icon-btn" title="Align vertical centers" onClick={() => a('vcenter')}>
          <AlignCenterHorizontal size={15} />
        </button>
        <button className="icon-btn" title="Align bottom" onClick={() => a('bottom')}>
          <AlignEndHorizontal size={15} />
        </button>
      </div>
      {multi && (
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn sm" style={{ flex: 1 }} disabled={count < 3} onClick={() => engine.distribute('h')} title="Needs 3+ objects">
            <AlignHorizontalSpaceAround size={13} /> Distribute H
          </button>
          <button className="btn sm" style={{ flex: 1 }} disabled={count < 3} onClick={() => engine.distribute('v')} title="Needs 3+ objects">
            <AlignVerticalSpaceAround size={13} /> Distribute V
          </button>
        </div>
      )}
      <h6 style={{ marginTop: 14 }}>Layer order</h6>
      <div className="icon-row" style={{ justifyContent: 'space-between' }}>
        <button className="btn sm" onClick={() => engine.arrange('front')} title="Bring to front">
          <BringToFront size={13} /> Front
        </button>
        <button className="icon-btn sm" onClick={() => engine.arrange('forward')} title="Bring forward">
          <ChevronUp size={15} />
        </button>
        <button className="icon-btn sm" onClick={() => engine.arrange('backward')} title="Send backward">
          <ChevronDown size={15} />
        </button>
        <button className="btn sm" onClick={() => engine.arrange('back')} title="Send to back">
          <SendToBack size={13} /> Back
        </button>
      </div>
    </div>
  );
}

function TextProps({ t, multi }: { t: IText; multi: boolean }) {
  const engine = useEngine();
  const weights = weightsFor(t.fontFamily);
  const weight = Number(t.fontWeight) || 400;
  const setCase = (mode: 'upper' | 'lower' | 'title') => {
    const conv = (s: string) => (mode === 'upper' ? s.toUpperCase() : mode === 'lower' ? s.toLowerCase() : s.toLowerCase().replace(/(^|\s|-)\S/g, (m) => m.toUpperCase()));
    engine.setProps({ text: conv(t.text) });
  };
  const stroke = typeof t.stroke === 'string' && t.strokeWidth > 0 ? t.stroke : null;
  return (
    <div className="props-section">
      <h6>Typography{multi ? ' (all text)' : ''}</h6>
      <div className="row" style={{ gap: 6, marginBottom: 8 }}>
        <button className="font-field" onClick={() => useEditor.setState({ panel: 'fonts' })} title="Browse 1,900+ fonts">
          <span style={{ fontFamily: `"${t.fontFamily}"` }}>{t.fontFamily}</span>
          <ChevronDown size={13} />
        </button>
        <button className="icon-btn" title="Compare fonts for this text" onClick={() => useEditor.setState({ compare: {} })}>
          <Columns3 size={15} />
        </button>
      </div>
      <div className="grid2" style={{ marginBottom: 8 }}>
        <select className="select" value={weight} onChange={(e) => engine.setFontWeight(+e.target.value)}>
          {(weights.includes(weight) ? weights : [...weights, weight].sort()).map((w) => (
            <option key={w} value={w}>
              {WEIGHT_NAMES[w] ?? w} {w}
            </option>
          ))}
        </select>
        <NumberField label="Size" value={t.fontSize} min={1} max={4000} precision={1} onChange={(v, live) => engine.setProps({ fontSize: v }, { live })} />
      </div>
      <div className="row" style={{ marginBottom: 8, gap: 6 }}>
        <div className="seg" style={{ flex: 1 }}>
          <button className={weight >= 700 ? 'on' : ''} title="Bold" onClick={() => engine.setFontWeight(weight >= 700 ? 400 : weights.includes(700) ? 700 : Math.max(...weights))}>
            <Bold size={13} />
          </button>
          <button className={t.fontStyle === 'italic' ? 'on' : ''} title="Italic (synthesised if the font has no italic)" onClick={() => engine.setProps({ fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' })}>
            <Italic size={13} />
          </button>
          <button className={t.underline ? 'on' : ''} title="Underline" onClick={() => engine.setProps({ underline: !t.underline })}>
            <Underline size={13} />
          </button>
          <button className={t.linethrough ? 'on' : ''} title="Strikethrough" onClick={() => engine.setProps({ linethrough: !t.linethrough })}>
            <Strikethrough size={13} />
          </button>
        </div>
        <div className="seg" style={{ flex: 1 }}>
          {(['left', 'center', 'right', 'justify'] as const).map((a) => {
            const I = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[a];
            return (
              <button key={a} className={t.textAlign === a ? 'on' : ''} title={`Align ${a}`} onClick={() => engine.setProps({ textAlign: a })}>
                <I size={13} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="prop-row">
        <span>Spacing</span>
        <RangeField value={t.charSpacing} min={-200} max={1000} step={5} onChange={(v, live) => engine.setProps({ charSpacing: v }, { live })} />
      </div>
      <div className="prop-row">
        <span>Line height</span>
        <RangeField value={t.lineHeight} min={0.5} max={3} step={0.01} precision={2} onChange={(v, live) => engine.setProps({ lineHeight: v }, { live })} />
      </div>
      <div className="prop-row">
        <span>Case</span>
        <div className="seg">
          <button onClick={() => setCase('upper')} title="UPPERCASE">
            AA
          </button>
          <button onClick={() => setCase('title')} title="Title Case">
            Aa
          </button>
          <button onClick={() => setCase('lower')} title="lowercase">
            aa
          </button>
        </div>
      </div>
      <div className="prop-row">
        <span>Colour</span>
        <ColorField value={typeof t.fill === 'string' ? t.fill : '#000000'} onChange={(v, live) => engine.setProps({ fill: v }, { live })} />
      </div>
      <div className="prop-row">
        <span>Highlight</span>
        <ColorField value={t.textBackgroundColor || null} allowNone onNone={() => engine.setProps({ textBackgroundColor: '' })} onChange={(v, live) => engine.setProps({ textBackgroundColor: v }, { live })} />
      </div>
      <div className="prop-row">
        <span>Outline</span>
        <ColorField
          value={stroke}
          allowNone
          onNone={() => engine.setProps({ stroke: null, strokeWidth: 0 })}
          onChange={(v, live) => engine.setProps({ stroke: v, strokeWidth: t.strokeWidth || Math.max(1, Math.round(t.fontSize / 30)), paintFirst: 'stroke', strokeLineJoin: 'round' }, { live })}
        />
      </div>
      {stroke && (
        <div className="prop-row">
          <span>Outline width</span>
          <RangeField value={t.strokeWidth} min={0} max={Math.max(40, Math.round(t.fontSize / 3))} step={0.5} precision={1} onChange={(v, live) => engine.setProps({ strokeWidth: v }, { live })} />
        </div>
      )}
      {!multi && (
        <p className="faint" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
          Double-click the text on canvas to edit it. Curves and arcs: Transform. Glows, outlines and 3D: Effects.
        </p>
      )}
    </div>
  );
}

function ShapeProps({ o }: { o: FabricObject }) {
  const engine = useEngine();
  const isStrokeOnly = !o.fill || o.fill === '' || o.fill === 'transparent';
  const fill = typeof o.fill === 'string' && o.fill ? o.fill : null;
  const stroke = typeof o.stroke === 'string' && o.stroke && o.strokeWidth > 0 ? o.stroke : null;
  const complexFill = o.fill && typeof o.fill !== 'string';
  return (
    <div className="props-section">
      <h6>Fill &amp; stroke</h6>
      <div className="prop-row">
        <span>Fill</span>
        {complexFill ? <span className="faint">Gradient / pattern (editable in Stage 2)</span> : <ColorField value={fill} allowNone onNone={() => engine.setProps({ fill: '' })} onChange={(v, live) => engine.setProps({ fill: v }, { live })} />}
      </div>
      <div className="prop-row">
        <span>Stroke</span>
        <ColorField
          value={stroke}
          allowNone={!isStrokeOnly}
          onNone={() => engine.setProps({ stroke: null, strokeWidth: 0 })}
          onChange={(v, live) => engine.setProps({ stroke: v, strokeWidth: o.strokeWidth || 4, strokeUniform: true }, { live })}
        />
      </div>
      {stroke && (
        <>
          <div className="prop-row">
            <span>Width</span>
            <RangeField value={o.strokeWidth} min={0} max={200} step={0.5} precision={1} onChange={(v, live) => engine.setProps({ strokeWidth: v, strokeUniform: true }, { live })} />
          </div>
          <div className="prop-row">
            <span>Style</span>
            <div className="seg">
              <button className={!o.strokeDashArray ? 'on' : ''} onClick={() => engine.setProps({ strokeDashArray: null })}>
                Solid
              </button>
              <button className={o.strokeDashArray?.[0] === o.strokeWidth * 3 ? 'on' : ''} onClick={() => engine.setProps({ strokeDashArray: [o.strokeWidth * 3, o.strokeWidth * 2] })}>
                Dash
              </button>
              <button className={o.strokeDashArray?.[0] === 0 ? 'on' : ''} onClick={() => engine.setProps({ strokeDashArray: [0, o.strokeWidth * 2], strokeLineCap: 'round' })}>
                Dot
              </button>
            </div>
          </div>
        </>
      )}
      {o instanceof Rect && (
        <div className="prop-row">
          <span>Corners</span>
          <RangeField value={o.rx ?? 0} min={0} max={Math.round(Math.min(o.width, o.height) / 2)} onChange={(v, live) => engine.setProps({ rx: v, ry: v }, { live })} />
        </div>
      )}
    </div>
  );
}

const LIGHT: [keyof Adjust, string, number, number][] = [
  ['exposure', 'Exposure', -2, 2],
  ['contrast', 'Contrast', -1, 1],
  ['highlights', 'Highlights', -1, 1],
  ['shadows', 'Shadows', -1, 1],
  ['whites', 'Whites', -1, 1],
  ['blacks', 'Blacks', -1, 1],
];
const COLOR: [keyof Adjust, string, number, number][] = [
  ['temperature', 'Temperature', -1, 1],
  ['tint', 'Tint', -1, 1],
  ['saturation', 'Saturation', -1, 1],
  ['vibrance', 'Vibrance', -1, 1],
];
const DETAIL: [keyof Adjust, string, number, number][] = [
  ['clarity', 'Clarity', -1, 1],
  ['vignette', 'Vignette', -1, 1],
  ['grain', 'Grain', 0, 1],
];
const MASKS: { kind: any; label: string }[] = [
  { kind: null, label: 'None' },
  { kind: 'ellipse', label: 'Oval' },
  { kind: 'rounded', label: 'Rounded' },
  { kind: 'arch', label: 'Arch' },
  { kind: 'star', label: 'Star' },
  { kind: 'heart', label: 'Heart' },
  { kind: 'hexagon', label: 'Hexagon' },
  { kind: 'diamond', label: 'Diamond' },
];

function ImageProps({ img }: { img: FabricImage }) {
  const engine = useEngine();
  const st = engine.photoState(img);
  const [tab, setTab] = useState<'adjust' | 'filters' | 'mask'>('adjust');
  const set = (patch: Partial<PhotoState>, live = false) => engine.setPhoto(img, { ...st, ...patch }, live);
  const setAdj = (k: keyof Adjust, v: number, live: boolean) => set({ adjust: { ...st.adjust, [k]: v } }, live);
  const orig = (img as any)._originalElement ?? img.getElement();
  const natural = { w: orig?.naturalWidth || orig?.width || img.width, h: orig?.naturalHeight || orig?.height || img.height };
  const cropped = (img.cropX ?? 0) > 0 || (img.cropY ?? 0) > 0 || img.width < natural.w - 0.5 || img.height < natural.h - 0.5;
  const edited = !!st.preset || st.sharpness > 0 || st.blur > 0 || Object.values(st.adjust).some((v) => v !== 0);
  const previews = useMemo(() => {
    const out: Record<string, string> = {};
    if (!orig) return out;
    try {
      for (const p of [{ id: '' }, ...PRESETS]) out[p.id] = presetPreview(orig, natural.w, natural.h, p.id || null);
    } catch {
      /* cross-origin or unloaded image */
    }
    return out;
  }, [orig]);  
  const slider = ([k, label, min, max]: [keyof Adjust, string, number, number]) => (
    <div key={k} className="prop-row">
      <span>{label}</span>
      <RangeField value={Math.round(st.adjust[k] * 100)} min={min * 100} max={max * 100} onChange={(v, live) => setAdj(k, v / 100, live)} />
    </div>
  );
  return (
    <div className="props-section">
      <h6>
        Photo
        <span className="tag" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Non-destructive
        </span>
      </h6>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn sm ai" style={{ flex: 1 }} onClick={() => engine.openImageTool('cutout', img)} disabled={(img as any).locked} data-testid="remove-bg">
          <Scissors size={13} /> {(img as any).originalAssetId ? 'Refine cutout' : 'Remove BG'}
        </button>
        <button className="btn sm ai" style={{ flex: 1 }} onClick={() => engine.openImageTool('erase', img)} disabled={(img as any).locked} data-testid="magic-erase">
          <Wand2 size={13} /> Magic eraser
        </button>
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn sm ai" style={{ flex: 1 }} onClick={() => engine.openImageTool('enhance', img)} disabled={(img as any).locked} data-testid="enhance">
          <Sparkles size={13} /> Enhance 2×
        </button>
      </div>
      {(img as any).originalAssetId && (
        <button className="btn sm block" style={{ marginBottom: 8 }} onClick={() => engine.restoreOriginalImage(img)} title="Put the original pixels back (undo AI edits)">
          <RotateCcw size={13} /> Restore original
        </button>
      )}
      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn sm" style={{ flex: 1 }} onClick={() => engine.openCrop()} disabled={(img as any).locked}>
          <Crop size={13} /> Crop
        </button>
        {cropped && (
          <button className="btn sm" onClick={() => engine.applyCrop(img, { x: 0, y: 0, w: natural.w, h: natural.h })} title="Restore the full original image">
            Reset crop
          </button>
        )}
        {edited && (
          <button
            className="btn sm"
            title="Hold to see the original"
            onPointerDown={() => engine.comparePhoto(img, true)}
            onPointerUp={() => engine.comparePhoto(img, false)}
            onPointerLeave={() => engine.comparePhoto(img, false)}
          >
            Before
          </button>
        )}
      </div>
      <div className="seg" style={{ marginBottom: 10 }}>
        <button className={tab === 'adjust' ? 'on' : ''} onClick={() => setTab('adjust')}>
          Adjust
        </button>
        <button className={tab === 'filters' ? 'on' : ''} onClick={() => setTab('filters')}>
          Filters
        </button>
        <button className={tab === 'mask' ? 'on' : ''} onClick={() => setTab('mask')}>
          Mask
        </button>
      </div>
      {tab === 'adjust' && (
        <>
          <div className="subhead">Light</div>
          {LIGHT.map(slider)}
          <div className="subhead">Colour</div>
          {COLOR.map(slider)}
          <div className="subhead">Detail & effects</div>
          {DETAIL.map(slider)}
          <div className="prop-row">
            <span>Sharpness</span>
            <RangeField value={Math.round(st.sharpness * 100)} min={0} max={100} onChange={(v, live) => set({ sharpness: v / 100 }, live)} />
          </div>
          <div className="prop-row">
            <span>Blur</span>
            <RangeField value={Math.round(st.blur * 100)} min={0} max={100} onChange={(v, live) => set({ blur: v / 100 }, live)} />
          </div>
        </>
      )}
      {tab === 'filters' && (
        <>
          <div className="filter-grid">
            {[{ id: '', label: 'Original' }, ...PRESETS].map((p) => (
              <button key={p.id} className={(st.preset ?? '') === p.id ? 'on' : ''} onClick={() => set({ preset: p.id || null, amount: st.preset ? st.amount : 1 })}>
                {previews[p.id] ? <img src={previews[p.id]} alt="" /> : <span className="filter-ph" />}
                <small>{p.label}</small>
              </button>
            ))}
          </div>
          {st.preset && (
            <div className="prop-row" style={{ marginTop: 10 }}>
              <span>Intensity</span>
              <RangeField value={Math.round(st.amount * 100)} min={0} max={100} unit="%" onChange={(v, live) => set({ amount: v / 100 }, live)} />
            </div>
          )}
        </>
      )}
      {tab === 'mask' && (
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {MASKS.map((m) => (
            <button key={m.label} className={((img as any).maskKind ?? null) === m.kind ? 'on' : ''} style={{ flex: '1 0 30%' }} onClick={() => engine.maskImage(img, m.kind)}>
              {m.label}
            </button>
          ))}
        </div>
      )}
      {edited && (
        <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => engine.setPhoto(img, { adjust: { ...NEUTRAL }, preset: null, amount: 1, sharpness: 0, blur: 0 })}>
          <RotateCcw size={13} /> Reset all edits
        </button>
      )}
      <PhotoCredit assetId={(img as any).assetId} />
      <p className="faint" style={{ fontSize: 11.5, margin: '8px 0 0' }}>
        Source {natural.w}×{natural.h}. Edits are stored as instructions — the original photo is never altered.
      </p>
    </div>
  );
}

function Appearance({ o }: { o: FabricObject }) {
  const engine = useEngine();
  return (
    <div className="props-section">
      <h6>Appearance</h6>
      <div className="prop-row">
        <span>Opacity</span>
        <RangeField value={Math.round((o.opacity ?? 1) * 100)} min={0} max={100} unit="%" onChange={(v, live) => engine.setProps({ opacity: v / 100 }, { live })} />
      </div>
      <div className="prop-row">
        <span>Blend</span>
        <select className="select" value={(o.globalCompositeOperation as string) || 'source-over'} onChange={(e) => engine.setProps({ globalCompositeOperation: e.target.value })}>
          {BLEND.map((b) => (
            <option key={b} value={b}>
              {b === 'source-over' ? 'Normal' : b.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ShadowProps({ o }: { o: FabricObject }) {
  const engine = useEngine();
  const s = o.shadow as Shadow | null;
  const cfg = s ? { color: s.color, blur: s.blur, offsetX: s.offsetX, offsetY: s.offsetY } : null;
  const base = Math.max(4, Math.round(Math.min(o.getScaledWidth(), o.getScaledHeight()) / 30));
  return (
    <div className="props-section">
      <h6>
        Drop shadow
        <Toggle on={!!s} onChange={(v) => engine.setShadow(v ? { color: 'rgba(0,0,0,0.35)', blur: base * 2, offsetX: base / 2, offsetY: base } : null)} />
      </h6>
      {cfg && (
        <>
          <div className="prop-row">
            <span>Colour</span>
            <ColorField value={cfg.color} onChange={(v, live) => engine.setShadow({ ...cfg, color: v }, live)} />
          </div>
          <div className="prop-row">
            <span>Blur</span>
            <RangeField value={cfg.blur} min={0} max={200} onChange={(v, live) => engine.setShadow({ ...cfg, blur: v }, live)} />
          </div>
          <div className="grid2">
            <NumberField label="X" value={cfg.offsetX} onChange={(v, live) => engine.setShadow({ ...cfg, offsetX: v }, live)} />
            <NumberField label="Y" value={cfg.offsetY} onChange={(v, live) => engine.setShadow({ ...cfg, offsetY: v }, live)} />
          </div>
        </>
      )}
    </div>
  );
}

function TransformProps({ t }: { t: IText }) {
  const engine = useEngine();
  const warp: Warp | null = (t as any).warp ?? null;
  const type = warp?.kind ?? 'none';
  const defaults: Record<string, Warp> = { arc: { kind: 'arc', amount: 40 }, circle: { kind: 'circle', amount: 0 }, wave: { kind: 'wave', amount: 40, cycles: 1.5 } };
  return (
    <div className="props-section">
      <h6>Transform</h6>
      <div className="seg" style={{ marginBottom: 10 }}>
        {WARPS.map((w) => (
          <button key={w.kind} className={type === w.kind ? 'on' : ''} onClick={() => engine.setWarp(w.kind === 'none' ? null : defaults[w.kind])}>
            {w.label}
          </button>
        ))}
        {type === 'path' && <button className="on">Path</button>}
      </div>
      {warp && warp.kind === 'arc' && (
        <div className="prop-row">
          <span>Bend</span>
          <RangeField value={warp.amount} min={-100} max={100} onChange={(v, live) => engine.setWarp({ ...warp, amount: v || 1 }, live)} />
        </div>
      )}
      {warp && warp.kind === 'circle' && (
        <div className="prop-row">
          <span>Spacing</span>
          <RangeField value={warp.amount} min={0} max={200} onChange={(v, live) => engine.setWarp({ ...warp, amount: v }, live)} />
        </div>
      )}
      {warp && warp.kind === 'wave' && (
        <>
          <div className="prop-row">
            <span>Height</span>
            <RangeField value={warp.amount} min={-100} max={100} onChange={(v, live) => engine.setWarp({ ...warp, amount: v }, live)} />
          </div>
          <div className="prop-row">
            <span>Waves</span>
            <RangeField value={warp.cycles ?? 1.5} min={0.5} max={6} step={0.5} precision={1} onChange={(v, live) => engine.setWarp({ ...warp, cycles: v }, live)} />
          </div>
        </>
      )}
      <p className="faint" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
        {warp ? 'Text stays editable — double-click to retype; the curve follows. Works best on a single line.' : 'Select text plus a drawn path (pen/shape) to set text on any path.'}
      </p>
    </div>
  );
}

const BOOL_ICONS: Record<string, string> = {
  unite: 'M3 3h7v4h4v7H7v-4H3z',
  subtract: 'M3 3h7v4H7v3H3z',
  intersect: 'M7 7h3v3H7z',
  exclude: 'M3 3h7v4H7v3H3zM10 7h4v7H7v-4h3z',
};

function VectorProps({ o, objs, multi }: { o: FabricObject; objs: FabricObject[]; multi: boolean }) {
  const engine = useEngine();
  const nodeEditing = useEditor((s) => s.nodeEditing);
  const busy = useEditor((s) => s.busy);
  const run = (p: Promise<any>) => p.catch((e) => toast(e?.message ?? String(e), 'error'));
  const isPath = o instanceof Path || o instanceof Polygon || o instanceof Polyline;
  const isShape = !isPath && !(o instanceof IText) && !(o instanceof FabricImage) && !(o instanceof Group);
  const canBool = multi && objs.length >= 2 && !objs.some((x) => x instanceof FabricImage);
  if (!isPath && !isShape && !(o instanceof IText) && !canBool) return null;
  return (
    <div className="props-section">
      <h6>Vector{busy && <span className="faint" style={{ textTransform: 'none', letterSpacing: 0 }}>{busy}</span>}</h6>
      {canBool && (
        <>
          <div className="seg" style={{ marginBottom: 6 }}>
            {(['unite', 'subtract', 'intersect', 'exclude'] as const).map((op) => (
              <button key={op} title={op === 'subtract' ? 'Subtract (front shapes cut the back one)' : op[0].toUpperCase() + op.slice(1)} disabled={!!busy} onClick={() => run(engine.booleanOp(op))}>
                <svg width="17" height="17" viewBox="0 0 17 17">
                  <path d="M3 3h7v7H3z" fill="none" stroke="currentColor" strokeOpacity=".35" />
                  <path d="M7 7h7v7H7z" fill="none" stroke="currentColor" strokeOpacity=".35" />
                  <path d={BOOL_ICONS[op]} fill="currentColor" fillRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 11.5, margin: '0 0 4px' }}>Unite · Subtract · Intersect · Exclude. Text is outlined automatically; the back-most shape keeps its style.</p>
        </>
      )}
      {!multi && isPath && (
        <button className={`btn block ${nodeEditing ? 'on' : ''}`} onClick={() => (nodeEditing ? engine.exitNodeEdit() : engine.editNodes(o))}>
          {nodeEditing ? 'Done editing points' : 'Edit points'}
        </button>
      )}
      {!multi && isShape && (
        <button className="btn block" onClick={() => run(engine.convertToPath(o))}>
          Convert to editable path
        </button>
      )}
      {!multi && o instanceof IText && (
        <button className="btn block" disabled={!!busy} onClick={() => run(engine.outlineText(o))} title="Uses the real font file — glyph-accurate vectors">
          Convert text to outlines
        </button>
      )}
      {!multi && isPath && <p className="faint" style={{ fontSize: 11.5, margin: '8px 0 0' }}>Double-click a path to edit its points. Drag anchors and handles; Esc to finish.</p>}
    </div>
  );
}

function ColorsProps({ o }: { o: FabricObject }) {
  const engine = useEngine();
  // read fresh each render: replacing a colour updates the object, so the list follows
  const colors = engine.colorsOf(o).slice(0, 12);
  if (!colors.length) return null;
  return (
    <div className="props-section">
      <h6>Colours</h6>
      {colors.map((c, i) => (
        <div key={i} className="prop-row">
          <span>Colour {i + 1}</span>
          <ColorField value={c} onChange={(v, live) => engine.replaceColor(o, c, v.toLowerCase(), live)} />
        </div>
      ))}
    </div>
  );
}

/** Attribution for stock photos (required for CC BY / BY-SA). */
function PhotoCredit({ assetId }: { assetId?: string }) {
  const [credit, setCredit] = useState<Asset['credit'] | null>(null);
  useEffect(() => {
    let alive = true;
    if (assetId) getAsset(assetId).then((a) => alive && setCredit(a?.credit ?? null));
    else setCredit(null);
    return () => {
      alive = false;
    };
  }, [assetId]);
  if (!credit) return null;
  return (
    <div className="credit-box">
      <b>Photo credit</b>
      <span>
        {credit.author} · {credit.license} · {credit.source}
      </span>
      <div className="row" style={{ gap: 6, marginTop: 6 }}>
        <button
          className="btn sm"
          onClick={async () => {
            await navigator.clipboard.writeText(creditLine(credit)).catch(() => {});
            toast('Credit copied', 'success');
          }}
        >
          Copy credit
        </button>
        <a className="btn ghost sm" href={credit.sourceUrl} target="_blank" rel="noreferrer noopener">
          Source
        </a>
      </div>
    </div>
  );
}
