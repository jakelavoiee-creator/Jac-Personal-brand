/**
 * Brush panel — expressive raster brushes with symmetry, painting onto paint
 * layers (move, blend, mask or FX them like any other layer).
 */
import { useEffect } from 'react';
import { Check, FlipHorizontal, FlipVertical, Grid2x2, Layers, Plus, Sparkle } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { ColorField, RangeField } from '../../ui/controls';
import { BRUSHES, type BrushKind, type Symmetry } from '../brush';

const SWATCHES = ['#ff2bd6', '#3cf2ff', '#ffe66d', '#7c5cff', '#00ffa3', '#ff6f61', '#ffffff', '#111111'];

/** tiny preview stroke for each brush */
function BrushIcon({ kind }: { kind: BrushKind }) {
  const c = '#e9e9e9';
  return (
    <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden>
      {kind === 'round' && <path d="M4 16 C14 4, 24 22, 44 8" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />}
      {kind === 'airbrush' && <path d="M4 16 C14 4, 24 22, 44 8" stroke={c} strokeOpacity=".35" strokeWidth="9" fill="none" strokeLinecap="round" />}
      {kind === 'spray' && [...Array(28)].map((_, i) => <rect key={i} x={6 + ((i * 37) % 36)} y={6 + ((i * 53) % 12)} width="1.4" height="1.4" fill={c} />)}
      {kind === 'chalk' && <path d="M4 16 C14 4, 24 22, 44 8" stroke={c} strokeWidth="6" strokeDasharray="1 1.5" fill="none" />}
      {kind === 'marker' && <path d="M4 15 L44 9" stroke={c} strokeOpacity=".6" strokeWidth="7" fill="none" />}
      {kind === 'neon' && (
        <>
          <path d="M4 16 C14 4, 24 22, 44 8" stroke="#ff2bd6" strokeOpacity=".35" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M4 16 C14 4, 24 22, 44 8" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'calligraphy' && <path d="M4 18 C12 2, 22 22, 30 6 S40 16, 44 10" stroke={c} strokeWidth="3" fill="none" transform="skewX(-12)" />}
      {kind === 'stars' && [8, 22, 36].map((x, i) => <polygon key={i} points="0,-6 1.8,-1.8 6,-1.8 2.6,1 4,5.6 0,2.8 -4,5.6 -2.6,1 -6,-1.8 -1.8,-1.8" transform={`translate(${x},${i % 2 ? 9 : 15})`} fill={c} />)}
      {kind === 'confetti' && ['#ff2bd6', '#3cf2ff', '#ffe66d', '#00ffa3', '#7c5cff'].map((f, i) => <rect key={i} x={6 + i * 8} y={6 + ((i * 7) % 10)} width="6" height="3" fill={f} transform={`rotate(${i * 37} ${9 + i * 8} ${8 + ((i * 7) % 10)})`} />)}
      {kind === 'bubbles' && [10, 24, 37].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 9 : 14} r={3 + i * 1.5} stroke={c} fill="none" />)}
      {kind === 'smudge' && <path d="M4 12 C16 6, 28 18, 44 12" stroke="url(#sg)" strokeWidth="8" fill="none" strokeLinecap="round" />}
      {kind === 'smudge' && (
        <defs>
          <linearGradient id="sg">
            <stop offset="0" stopColor="#ff2bd6" />
            <stop offset="1" stopColor="#3cf2ff" stopOpacity=".2" />
          </linearGradient>
        </defs>
      )}
      {kind === 'eraser' && <rect x="12" y="6" width="24" height="12" rx="2" stroke={c} fill="none" />}
    </svg>
  );
}

export default function BrushPanel() {
  const engine = useEngine();
  const st = useEditor((s) => s.brushStyle);
  const tool = useEditor((s) => s.tool);
  useEditor((s) => s.selVersion);
  const set = engine.setBrushStyle.bind(engine);

  // opening the panel picks up the brush; closing it puts it down
  useEffect(() => {
    if (useEditor.getState().tool !== 'brush') engine.setTool('brush');
    return () => {
      if (useEditor.getState().tool === 'brush') engine.setTool('select');
    };
  }, [engine]);

  const sym: { id: Symmetry; label: string; icon: any }[] = [
    { id: 'none', label: 'Off', icon: null },
    { id: 'x', label: 'Mirror', icon: FlipHorizontal },
    { id: 'y', label: 'Flip', icon: FlipVertical },
    { id: 'quad', label: 'Quad', icon: Grid2x2 },
    { id: 'radial', label: 'Mandala', icon: Sparkle },
  ];
  const layerName = (engine.brush?.layer as any)?.name;

  return (
    <div className="brush-panel">
      {tool !== 'brush' && (
        <button className="btn primary block" onClick={() => engine.setTool('brush')}>
          Pick up the brush
        </button>
      )}
      <div className="brush-grid">
        {BRUSHES.map((b) => (
          <button key={b.kind} className={st.kind === b.kind ? 'on' : ''} title={b.hint} onClick={() => set({ kind: b.kind, spacing: b.spacing })} data-testid={`brush-${b.kind}`}>
            <BrushIcon kind={b.kind} />
            <small>{b.label}</small>
          </button>
        ))}
      </div>
      <div className="field">
        <span>Colour</span>
        <div className="swatch-row">
          {SWATCHES.map((c) => (
            <button key={c} className={`sw ${st.color === c && !st.rainbow ? 'on' : ''}`} style={{ background: c }} onClick={() => set({ color: c, rainbow: false })} />
          ))}
          <button className={`sw rainbow ${st.rainbow ? 'on' : ''}`} title="Rainbow — colour flows along the stroke" onClick={() => set({ rainbow: !st.rainbow })} data-testid="brush-rainbow" />
        </div>
        <ColorField value={st.color} onChange={(v) => set({ color: v, rainbow: false })} />
      </div>
      <div className="prop-row">
        <span>Size</span>
        <RangeField value={st.size} min={1} max={600} onChange={(v) => set({ size: v })} unit="px" />
      </div>
      <div className="prop-row">
        <span>Opacity</span>
        <RangeField value={Math.round(st.opacity * 100)} min={1} max={100} onChange={(v) => set({ opacity: v / 100 })} unit="%" />
      </div>
      {(st.kind === 'round' || st.kind === 'eraser') && (
        <div className="prop-row">
          <span>Hardness</span>
          <RangeField value={Math.round(st.hardness * 100)} min={0} max={100} onChange={(v) => set({ hardness: v / 100 })} unit="%" />
        </div>
      )}
      <div className="prop-row">
        <span>Spacing</span>
        <RangeField value={Math.round(st.spacing * 100)} min={2} max={200} onChange={(v) => set({ spacing: v / 100 })} unit="%" />
      </div>
      <div className="prop-row">
        <span>Jitter</span>
        <RangeField value={Math.round(st.jitter * 100)} min={0} max={100} onChange={(v) => set({ jitter: v / 100 })} unit="%" />
      </div>
      <div className="field" style={{ marginTop: 6 }}>
        <span>Symmetry</span>
        <div className="seg">
          {sym.map((s) => (
            <button key={s.id} className={st.symmetry === s.id ? 'on' : ''} onClick={() => set({ symmetry: s.id })} title={s.label} data-testid={`sym-${s.id}`}>
              {s.icon ? <s.icon size={13} /> : s.label}
            </button>
          ))}
        </div>
        {st.symmetry === 'radial' && (
          <div className="prop-row" style={{ marginTop: 6 }}>
            <span>Segments</span>
            <RangeField value={st.radial} min={2} max={16} onChange={(v) => set({ radial: v })} />
          </div>
        )}
      </div>
      <div className="row" style={{ gap: 6, marginTop: 4 }}>
        <button className="btn sm" style={{ flex: 1 }} onClick={() => engine.newPaintLayer()} data-testid="new-paint-layer">
          <Plus size={13} /> New paint layer
        </button>
        <button className="btn sm primary" onClick={() => useEditor.setState({ panel: null })} title="Put the brush down (Esc)">
          <Check size={13} /> Done
        </button>
      </div>
      <p className="faint small">
        <Layers size={11} /> {layerName ? `Painting on “${layerName}”. ` : 'Your first stroke creates a paint layer. '}Select a paint layer to keep painting on it. [ ] size · Esc done · Space to pan.
      </p>
    </div>
  );
}
