import { useState } from 'react';
import { ChevronDown, ChevronRight, Dices, X } from 'lucide-react';
import { ActiveSelection, IText, type FabricObject } from 'fabric';
import { useEngine } from './Editor';
import { shade, TEXTURES, type FX } from '../lib/fx';
import { ColorField, RangeField, Toggle } from '../ui/controls';

/** Reference size so presets scale with the object (font size for text). */
export function refSize(o: FabricObject) {
  if (o instanceof IText) return o.fontSize;
  return Math.max(8, Math.min(o.width ?? 100, o.height ?? 100));
}
export function mainColor(o: FabricObject) {
  const t = o instanceof ActiveSelection ? o.getObjects()[0] : o;
  const f = (t as any)?.fill;
  return typeof f === 'string' && f && f !== 'transparent' ? f : '#111111';
}

const GOLD = ['#7a5a12', '#f9e7a1', '#b88a2e', '#fff4c9', '#8a6d1f'];
const CHROME = ['#2b2b2b', '#f4f4f4', '#7b7b7b', '#ffffff', '#3a3a3a'];
const SUNSET = ['#ff5f6d', '#ffc371'];
const NEON = ['#00f0ff', '#ff00e5'];

export const PRESETS: { id: string; label: string; make: (s: number, c: string) => FX }[] = [
  { id: 'none', label: 'None', make: () => ({}) },
  { id: 'outline', label: 'Outline', make: (s) => ({ outline: { width: s * 0.035, color: '#111111' } }) },
  { id: 'double', label: 'Double outline', make: (s, c) => ({ outline: { width: s * 0.03, color: '#ffffff' }, outline2: { width: s * 0.03, color: shade(c, -0.6) } }) },
  { id: 'hollow', label: 'Hollow', make: (s, c) => ({ hollow: { width: s * 0.025, color: c } }) },
  { id: 'extrude', label: '3D extrusion', make: (s, c) => ({ extrude: { depth: s * 0.09, angle: 45, color: shade(c, -0.35), shade: true } }) },
  { id: 'long', label: 'Long shadow', make: (s, c) => ({ longShadow: { length: s * 0.8, angle: 45, color: shade(c, -0.65), fade: true } }) },
  { id: 'offset', label: 'Offset', make: (s) => ({ offset: { x: s * 0.045, y: s * 0.045, color: '#f26419', outlineOnly: false, width: s * 0.02 } }) },
  { id: 'retro', label: 'Retro', make: (s) => ({ outline: { width: s * 0.025, color: '#111111' }, offset: { x: s * 0.06, y: s * 0.06, color: '#e63946', outlineOnly: false, width: s * 0.02 } }) },
  { id: 'layered', label: 'Layered', make: (s) => ({ layers: { count: 3, distance: s * 0.035, angle: 45, colors: ['#f6ae2d', '#f26419', '#33658a'] } }) },
  { id: 'echo', label: 'Echo outline', make: (s, c) => ({ offset: { x: s * 0.05, y: s * 0.05, color: c, outlineOnly: true, width: s * 0.02 } }) },
  // light or neutral text gets a cyan tube glow; saturated colours glow in their own hue
  { id: 'neon', label: 'Neon glow', make: (s, c) => ({ glow: { color: isLightOrNeutral(c) ? NEON[0] : c, blur: s * 0.12, strength: 3 } }) },
  { id: 'gold', label: 'Metallic gold', make: (s) => ({ gradient: { stops: GOLD, angle: 90 }, outline: { width: s * 0.012, color: '#4a3508' } }) },
  { id: 'chrome', label: 'Chrome', make: (s) => ({ gradient: { stops: CHROME, angle: 90 }, outline: { width: s * 0.012, color: '#111111' } }) },
  { id: 'sunset', label: 'Gradient', make: () => ({ gradient: { stops: SUNSET, angle: 0 } }) },
  { id: 'vintage', label: 'Vintage print', make: (s) => ({ offset: { x: s * 0.03, y: s * 0.03, color: '#c0392b', outlineOnly: false, width: 0 }, texture: { kind: 'vintage', intensity: 0.55, scale: s * 0.1, seed: 3, angle: 45 } }) },
  { id: 'distressed', label: 'Distressed', make: (s) => ({ texture: { kind: 'distressed', intensity: 0.5, scale: s * 0.12, seed: 11, angle: 45 } }) },
];

function isLightOrNeutral(c: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return sat < 40 || 0.2126 * r + 0.7152 * g + 0.0722 * b > 200;
}

/** Small static preview tile for a preset (CSS approximation for the button only). */
function PresetTile({ id }: { id: string }) {
  const st: React.CSSProperties = { fontWeight: 900, fontSize: 22, fontFamily: 'Inter', lineHeight: 1, color: '#eee' };
  const map: Record<string, React.CSSProperties> = {
    outline: { WebkitTextStroke: '1.5px #fff', color: '#111' },
    double: { color: '#eee', textShadow: '0 0 0 #fff, 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 2px 2px 0 #666, -2px -2px 0 #666, 2px -2px 0 #666, -2px 2px 0 #666' },
    hollow: { color: 'transparent', WebkitTextStroke: '1.2px #eee' },
    extrude: { textShadow: '1px 1px 0 #777,2px 2px 0 #666,3px 3px 0 #555,4px 4px 0 #444' },
    long: { textShadow: Array.from({ length: 10 }, (_, i) => `${i}px ${i}px 0 rgba(0,0,0,${0.5 - i * 0.04})`).join(',') },
    offset: { textShadow: '3px 3px 0 #f26419' },
    retro: { textShadow: '3px 3px 0 #e63946', WebkitTextStroke: '1px #111' },
    layered: { textShadow: '2px 2px 0 #f6ae2d, 4px 4px 0 #f26419, 6px 6px 0 #33658a' },
    echo: { textShadow: '3px 3px 0 #111, 4px 4px 0 #eee' },
    neon: { color: '#bff', textShadow: '0 0 6px #00f0ff, 0 0 12px #00f0ff' },
    gold: { background: 'linear-gradient(#7a5a12,#f9e7a1,#b88a2e,#fff4c9)', WebkitBackgroundClip: 'text', color: 'transparent' },
    chrome: { background: 'linear-gradient(#2b2b2b,#f4f4f4,#7b7b7b,#fff)', WebkitBackgroundClip: 'text', color: 'transparent' },
    sunset: { background: 'linear-gradient(90deg,#ff5f6d,#ffc371)', WebkitBackgroundClip: 'text', color: 'transparent' },
    vintage: { color: '#d8c7a5', textShadow: '2px 2px 0 #c0392b', opacity: 0.85 },
    distressed: { color: '#ddd', opacity: 0.7 },
    none: { color: '#aaa' },
  };
  return <span style={{ ...st, ...map[id] }}>Aa</span>;
}

type Field = { k: string; label: string; type: 'range' | 'color' | 'bool' | 'angle'; max?: (s: number) => number; min?: number; step?: number };
const EDITORS: { key: keyof FX; label: string; make: (s: number, c: string) => any; fields: Field[] }[] = [
  { key: 'outline', label: 'Outline', make: (s) => ({ width: s * 0.03, color: '#111111' }), fields: [{ k: 'width', label: 'Width', type: 'range', max: (s) => s * 0.25 }, { k: 'color', label: 'Colour', type: 'color' }] },
  { key: 'outline2', label: 'Second outline', make: (s) => ({ width: s * 0.03, color: '#ffffff' }), fields: [{ k: 'width', label: 'Width', type: 'range', max: (s) => s * 0.25 }, { k: 'color', label: 'Colour', type: 'color' }] },
  { key: 'hollow', label: 'Hollow', make: (s, c) => ({ width: s * 0.025, color: c }), fields: [{ k: 'width', label: 'Stroke', type: 'range', max: (s) => s * 0.15 }, { k: 'color', label: 'Colour', type: 'color' }] },
  { key: 'extrude', label: '3D extrusion', make: (s, c) => ({ depth: s * 0.08, angle: 45, color: shade(c, -0.35), shade: true }), fields: [{ k: 'depth', label: 'Depth', type: 'range', max: (s) => s * 0.6 }, { k: 'angle', label: 'Angle', type: 'angle' }, { k: 'color', label: 'Colour', type: 'color' }, { k: 'shade', label: 'Shading', type: 'bool' }] },
  { key: 'longShadow', label: 'Long shadow', make: (s, c) => ({ length: s * 0.8, angle: 45, color: shade(c, -0.65), fade: true }), fields: [{ k: 'length', label: 'Length', type: 'range', max: (s) => s * 4 }, { k: 'angle', label: 'Angle', type: 'angle' }, { k: 'color', label: 'Colour', type: 'color' }, { k: 'fade', label: 'Fade out', type: 'bool' }] },
  { key: 'offset', label: 'Offset copy', make: (s) => ({ x: s * 0.04, y: s * 0.04, color: '#f26419', outlineOnly: false, width: s * 0.02 }), fields: [{ k: 'x', label: 'X', type: 'range', min: -1, max: (s) => s * 0.4 }, { k: 'y', label: 'Y', type: 'range', min: -1, max: (s) => s * 0.4 }, { k: 'color', label: 'Colour', type: 'color' }, { k: 'outlineOnly', label: 'Outline only', type: 'bool' }, { k: 'width', label: 'Line width', type: 'range', max: (s) => s * 0.1 }] },
  { key: 'layers', label: 'Layered copies', make: (s) => ({ count: 3, distance: s * 0.035, angle: 45, colors: ['#f6ae2d', '#f26419', '#33658a'] }), fields: [{ k: 'count', label: 'Layers', type: 'range', min: 1, max: () => 8, step: 1 }, { k: 'distance', label: 'Distance', type: 'range', max: (s) => s * 0.2 }, { k: 'angle', label: 'Angle', type: 'angle' }] },
  { key: 'glow', label: 'Glow', make: (s, c) => ({ color: c, blur: s * 0.1, strength: 2 }), fields: [{ k: 'blur', label: 'Size', type: 'range', max: (s) => s * 0.6 }, { k: 'strength', label: 'Strength', type: 'range', min: 1, max: () => 6, step: 1 }, { k: 'color', label: 'Colour', type: 'color' }] },
  { key: 'gradient', label: 'Gradient fill', make: () => ({ stops: SUNSET, angle: 0 }), fields: [{ k: 'angle', label: 'Angle', type: 'angle' }] },
];

export default function EffectsSection({ o }: { o: FabricObject }) {
  const engine = useEngine();
  const [open, setOpen] = useState<string | null>(null);
  const fx: FX = (o instanceof ActiveSelection ? (o.getObjects()[0] as any)?.fx : (o as any).fx) || {};
  const s = refSize(o instanceof ActiveSelection ? o.getObjects()[0] : o);
  const c = mainColor(o);
  const active = EDITORS.filter((e) => fx[e.key]);

  return (
    <div className="props-section">
      <h6>
        Effects
        {Object.keys(fx).some((k) => k !== 'texture') && (
          <button className="btn ghost sm" style={{ height: 20, textTransform: 'none', letterSpacing: 0 }} onClick={() => engine.setFx(fx.texture ? { texture: fx.texture } : null)}>
            Clear
          </button>
        )}
      </h6>
      <div className="fx-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            title={p.label}
            onClick={() => {
              const next = p.make(s, c);
              // presets restyle the object but keep any texture unless the preset brings one
              engine.setFx({ ...(fx.texture && !next.texture ? { texture: fx.texture } : {}), ...next });
            }}
          >
            <PresetTile id={p.id} />
            <small>{p.label}</small>
          </button>
        ))}
      </div>

      {active.map((e) => {
        const val = fx[e.key] as any;
        const isOpen = open === e.key;
        return (
          <div key={e.key} className="fx-row">
            <div className="fx-row-head" onClick={() => setOpen(isOpen ? null : e.key)}>
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span>{e.label}</span>
              <button className="icon-btn sm" title="Remove effect" onClick={(ev) => (ev.stopPropagation(), engine.patchFx(e.key, null))}>
                <X size={13} />
              </button>
            </div>
            {isOpen && (
              <div className="fx-row-body">
                {e.fields.map((f) => (
                  <div key={f.k} className="prop-row">
                    <span>{f.label}</span>
                    {f.type === 'color' && <ColorField value={val[f.k]} onChange={(v, live) => engine.patchFx(e.key, { ...val, [f.k]: v }, live)} />}
                    {f.type === 'bool' && <Toggle on={!!val[f.k]} onChange={(v) => engine.patchFx(e.key, { ...val, [f.k]: v })} />}
                    {(f.type === 'range' || f.type === 'angle') && (
                      <RangeField
                        value={Math.round(val[f.k] * 10) / 10}
                        min={f.type === 'angle' ? -180 : f.min === -1 ? -Math.round(f.max!(s)) : f.min ?? 0}
                        max={f.type === 'angle' ? 180 : Math.max(1, Math.round(f.max!(s)))}
                        step={f.step ?? (f.type === 'angle' ? 1 : 0.5)}
                        precision={f.step === 1 || f.type === 'angle' ? 0 : 1}
                        onChange={(v, live) => engine.patchFx(e.key, { ...val, [f.k]: v }, live)}
                      />
                    )}
                  </div>
                ))}
                {e.key === 'gradient' && <GradientStops stops={val.stops} onChange={(stops, live) => engine.patchFx('gradient', { ...val, stops }, live)} />}
                {e.key === 'layers' &&
                  Array.from({ length: val.count }, (_, i) => (
                    <div key={i} className="prop-row">
                      <span>Layer {i + 1}</span>
                      <ColorField
                        value={val.colors[i % val.colors.length]}
                        onChange={(v, live) => {
                          const colors = Array.from({ length: val.count }, (_, j) => val.colors[j % val.colors.length]);
                          colors[i] = v;
                          engine.patchFx('layers', { ...val, colors }, live);
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}

      <select
        className="select"
        style={{ marginTop: 8 }}
        value=""
        onChange={(ev) => {
          const ed = EDITORS.find((x) => x.key === ev.target.value);
          if (ed) {
            engine.patchFx(ed.key, ed.make(s, c));
            setOpen(ed.key);
          }
        }}
      >
        <option value="">+ Add effect layer…</option>
        {EDITORS.filter((e) => !fx[e.key]).map((e) => (
          <option key={e.key} value={e.key}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GradientStops({ stops, onChange }: { stops: string[]; onChange: (s: string[], live: boolean) => void }) {
  const presets = [SUNSET, GOLD, CHROME, NEON, ['#000000', '#ffffff'], ['#1b2a41', '#86bbd8'], ['#6d2e46', '#f1d6e4']];
  return (
    <>
      <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {presets.map((p, i) => (
          <button key={i} className="grad-chip" style={{ background: `linear-gradient(90deg, ${p.join(',')})` }} onClick={() => onChange(p, false)} />
        ))}
      </div>
      {stops.map((st, i) => (
        <div key={i} className="prop-row">
          <span>Stop {i + 1}</span>
          <div className="row" style={{ gap: 4 }}>
            <ColorField value={st} onChange={(v, live) => onChange(stops.map((x, j) => (j === i ? v : x)), live)} />
            {stops.length > 2 && (
              <button className="icon-btn sm" onClick={() => onChange(stops.filter((_, j) => j !== i), false)}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ))}
      {stops.length < 6 && (
        <button className="btn ghost sm" onClick={() => onChange([...stops, stops[stops.length - 1]], false)}>
          + Add stop
        </button>
      )}
    </>
  );
}

/* ---------------- texture controls (used in Properties + Textures panel) ---------------- */

export function TextureControls({ o }: { o: FabricObject }) {
  const engine = useEngine();
  const fx: FX = (o as any).fx || {};
  const t = fx.texture;
  if (!t) return null;
  const s = refSize(o);
  const set = (patch: Partial<NonNullable<FX['texture']>>, live = false) => engine.patchFx('texture', { ...t, ...patch }, live);
  return (
    <>
      <div className="prop-row">
        <span>Texture</span>
        <div className="row" style={{ gap: 4 }}>
          <select className="select" value={t.kind} onChange={(e) => set({ kind: e.target.value as any })}>
            {TEXTURES.map((x) => (
              <option key={x.kind} value={x.kind}>
                {x.label}
              </option>
            ))}
          </select>
          <button className="icon-btn sm" title="Remove texture" onClick={() => engine.patchFx('texture', null)}>
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="prop-row">
        <span>Intensity</span>
        <RangeField value={Math.round(t.intensity * 100)} min={0} max={100} unit="%" onChange={(v, live) => set({ intensity: v / 100 }, live)} />
      </div>
      <div className="prop-row">
        <span>Scale</span>
        <RangeField value={Math.round(t.scale * 10) / 10} min={1} max={Math.max(20, Math.round(s * 0.6))} step={0.5} precision={1} onChange={(v, live) => set({ scale: v }, live)} />
      </div>
      {(t.kind === 'halftone' || t.kind === 'newspaper') && (
        <div className="prop-row">
          <span>Rotation</span>
          <RangeField value={t.angle} min={0} max={90} onChange={(v, live) => set({ angle: v }, live)} />
        </div>
      )}
      {(t.kind === 'halftone' || t.kind === 'newspaper' || t.kind === 'vintage') && (
        <div className="prop-row">
          <span>{t.kind === 'vintage' ? 'Tint' : 'Dot colour'}</span>
          <ColorField value={t.color ?? null} allowNone onNone={() => set({ color: undefined })} onChange={(v, live) => set({ color: v }, live)} />
        </div>
      )}
      <div className="prop-row">
        <span>Variation</span>
        <button className="btn sm" onClick={() => set({ seed: Math.floor(Math.random() * 9999) })}>
          <Dices size={13} /> Randomise
        </button>
      </div>
    </>
  );
}
