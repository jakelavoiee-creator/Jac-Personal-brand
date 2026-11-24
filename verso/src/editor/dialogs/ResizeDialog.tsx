import { useState } from 'react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RESIZE_PRESETS } from '../../lib/formats';
import { Modal, NumberField } from '../../ui/controls';
import { toast } from '../../store/app';

export default function ResizeDialog({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const [w, setW] = useState(project.width);
  const [h, setH] = useState(project.height);
  const [mode, setMode] = useState<'scale' | 'keep'>('scale');
  const valid = w >= 16 && h >= 16 && w <= 16000 && h <= 16000;
  return (
    <Modal
      title="Resize design"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!valid}
            onClick={async () => {
              await engine.resizeDocument(w, h, mode);
              toast(`Resized to ${w} × ${h}`, 'success');
              onClose();
            }}
          >
            Resize all {project.pages.length > 1 ? `${project.pages.length} pages` : 'pages'}
          </button>
        </>
      }
    >
      <div className="field">
        <span>Presets</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {RESIZE_PRESETS.map((p) => (
            <button key={p.name} className={`tab ${w === p.width && h === p.height ? 'on' : ''}`} onClick={() => (setW(p.width), setH(p.height))} title={`${p.width} × ${p.height}`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: 14 }}>
        <NumberField label="W" unit="px" value={w} min={16} max={16000} onChange={(v) => setW(Math.round(v))} />
        <NumberField label="H" unit="px" value={h} min={16} max={16000} onChange={(v) => setH(Math.round(v))} />
      </div>
      <div className="field">
        <span>Content</span>
        <div className="seg">
          <button className={mode === 'scale' ? 'on' : ''} onClick={() => setMode('scale')}>
            Scale to fit
          </button>
          <button className={mode === 'keep' ? 'on' : ''} onClick={() => setMode('keep')}>
            Keep size, re-centre
          </button>
        </div>
      </div>
      <p className="faint" style={{ margin: 0, fontSize: 12 }}>
        Elements are repositioned and uniformly scaled — never stretched. Undo history resets after a resize. Tip: duplicate the design first from the dashboard to keep the original. Element-aware smart resize (per-element re-layout) ships in Stage 3.
      </p>
    </Modal>
  );
}
