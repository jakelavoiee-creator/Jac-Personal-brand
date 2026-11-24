import { useEffect, useRef, useState } from 'react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { Modal } from '../../ui/controls';

type Box = { x: number; y: number; w: number; h: number };
const RATIOS: { label: string; r: number | null }[] = [
  { label: 'Free', r: null },
  { label: 'Original', r: -1 },
  { label: '1:1', r: 1 },
  { label: '4:5', r: 4 / 5 },
  { label: '3:2', r: 3 / 2 },
  { label: '16:9', r: 16 / 9 },
  { label: '9:16', r: 9 / 16 },
];

export default function CropDialog() {
  const engine = useEngine();
  const img = useEditor((s) => s.cropping);
  const close = () => useEditor.setState({ cropping: null });
  const imgRef = useRef<HTMLImageElement>(null);
  const [disp, setDisp] = useState(0); // display px per source px
  const orig = img ? img.getOriginalSize() : { width: 1, height: 1 };
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 1, h: 1 });
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (img) setBox({ x: img.cropX ?? 0, y: img.cropY ?? 0, w: img.width, h: img.height });
  }, [img]);

  if (!img) return null;
  const N = { w: orig.width, h: orig.height };
  const clampBox = (b: Box): Box => {
    const w = Math.min(Math.max(8, b.w), N.w);
    const h = Math.min(Math.max(8, b.h), N.h);
    return { w, h, x: Math.min(Math.max(0, b.x), N.w - w), y: Math.min(Math.max(0, b.y), N.h - h) };
  };

  const applyRatio = (r: number | null) => {
    setRatio(r);
    if (r === null) return;
    const rr = r === -1 ? N.w / N.h : r;
    let w = box.w;
    let h = w / rr;
    if (h > N.h) {
      h = N.h;
      w = h * rr;
    }
    if (w > N.w) {
      w = N.w;
      h = w / rr;
    }
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    setBox(clampBox({ x: cx - w / 2, y: cy - h / 2, w, h }));
  };

  const startDrag = (e: React.PointerEvent, handle: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, b: { ...box } };
    const rr = ratio === null ? null : ratio === -1 ? N.w / N.h : ratio;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / disp;
      const dy = (ev.clientY - start.y) / disp;
      const b = { ...start.b };
      if (handle === 'move') {
        b.x += dx;
        b.y += dy;
        return setBox(clampBox(b));
      }
      const left = handle === 'nw' || handle === 'sw';
      const top = handle === 'nw' || handle === 'ne';
      let x1 = b.x;
      let y1 = b.y;
      let x2 = b.x + b.w;
      let y2 = b.y + b.h;
      if (left) x1 = Math.min(x2 - 8, Math.max(0, x1 + dx));
      else x2 = Math.max(x1 + 8, Math.min(N.w, x2 + dx));
      if (top) y1 = Math.min(y2 - 8, Math.max(0, y1 + dy));
      else y2 = Math.max(y1 + 8, Math.min(N.h, y2 + dy));
      let w = x2 - x1;
      let h = y2 - y1;
      if (rr) {
        h = w / rr;
        if (top) y1 = y2 - h;
        else y2 = y1 + h;
        if (y1 < 0 || y2 > N.h) return;
      }
      setBox(clampBox({ x: x1, y: y1, w, h }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const s = disp;
  return (
    <Modal
      title="Crop image"
      wide
      onClose={close}
      footer={
        <>
          <span className="faint" style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 12 }}>
            {Math.round(box.w)} × {Math.round(box.h)} px of {N.w} × {N.h} — original pixels are kept, so you can re-crop anytime.
          </span>
          <button className="btn ghost" onClick={() => setBox({ x: 0, y: 0, w: N.w, h: N.h })}>
            Reset
          </button>
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => {
              engine.applyCrop(img, { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) });
              close();
            }}
          >
            Apply crop
          </button>
        </>
      }
    >
      <div className="tabs">
        {RATIOS.map((r) => (
          <button key={r.label} className={`tab ${ratio === r.r ? 'on' : ''}`} onClick={() => applyRatio(r.r)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="crop-stage">
        <div style={{ position: 'relative' }}>
          <img ref={imgRef} src={img.getSrc()} alt="" draggable={false} onLoad={(e) => setDisp((e.target as HTMLImageElement).clientWidth / N.w)} />
          {s > 0 && (
            <div className="crop-box" style={{ left: box.x * s, top: box.y * s, width: box.w * s, height: box.h * s }} onPointerDown={(e) => startDrag(e, 'move')}>
              {(['nw', 'ne', 'sw', 'se'] as const).map((hd) => (
                <div
                  key={hd}
                  className="crop-h"
                  onPointerDown={(e) => startDrag(e, hd)}
                  style={{ left: hd.includes('w') ? -6 : undefined, right: hd.includes('e') ? -6 : undefined, top: hd.includes('n') ? -6 : undefined, bottom: hd.includes('s') ? -6 : undefined, cursor: hd === 'nw' || hd === 'se' ? 'nwse-resize' : 'nesw-resize' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
