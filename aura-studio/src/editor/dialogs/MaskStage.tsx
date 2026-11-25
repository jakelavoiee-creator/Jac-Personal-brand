/**
 * Zoomable, pannable image stage with a brush — shared by the AI image tools.
 * The parent renders into `canvasRef` (full image resolution); this component
 * scales it on screen and reports brush strokes in image pixels.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Hand, Maximize, Minus, Plus } from 'lucide-react';

export interface StrokePoint {
  x: number;
  y: number;
  /** brush radius in image pixels */
  r: number;
}

export function MaskStage(props: {
  canvasRef: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  /** brush diameter in screen pixels; 0 hides the brush */
  brush: number;
  brushColor?: string;
  backdrop: 'checker' | 'white' | 'black' | 'none';
  onStroke?: (phase: 'start' | 'move' | 'end', p: StrokePoint) => void;
  children?: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [fit, setFit] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [hand, setHand] = useState(false);
  const [space, setSpace] = useState(false);
  const drawing = useRef(false);
  const panning = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  const computeFit = useCallback(() => {
    const el = wrap.current;
    if (!el || !props.width) return 0;
    return Math.min((el.clientWidth - 48) / props.width, (el.clientHeight - 48) / props.height, 4);
  }, [props.width, props.height]);

  useLayoutEffect(() => {
    const f = computeFit();
    setFit(f);
    setScale(f);
  }, [computeFit]);

  useEffect(() => {
    const ro = new ResizeObserver(() => setFit(computeFit()));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [computeFit]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target as HTMLElement)?.closest('input,textarea')) {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /** zoom keeping the point under the cursor (or the centre) fixed */
  const zoomTo = (next: number, at?: { x: number; y: number }) => {
    const el = wrap.current;
    if (!el) return;
    const s = Math.min(8, Math.max(fit * 0.5, next));
    const r = el.getBoundingClientRect();
    const ax = at ? at.x - r.left : el.clientWidth / 2;
    const ay = at ? at.y - r.top : el.clientHeight / 2;
    const ix = (el.scrollLeft + ax - pad(scale, el.clientWidth, props.width)) / scale;
    const iy = (el.scrollTop + ay - pad(scale, el.clientHeight, props.height)) / scale;
    setScale(s);
    requestAnimationFrame(() => {
      el.scrollLeft = ix * s + pad(s, el.clientWidth, props.width) - ax;
      el.scrollTop = iy * s + pad(s, el.clientHeight, props.height) - ay;
    });
  };

  const toImage = (e: React.PointerEvent): StrokePoint => {
    const c = props.canvasRef.current!;
    const r = c.getBoundingClientRect();
    const k = props.width / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, r: (props.brush / 2) * k };
  };

  const panMode = hand || space;
  const onDown = (e: React.PointerEvent) => {
    if (e.button === 1 || panMode) {
      const el = wrap.current!;
      panning.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0 || !props.brush || !props.onStroke) return;
    drawing.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    props.onStroke('start', toImage(e));
  };
  const onMove = (e: React.PointerEvent) => {
    const w = wrap.current!.getBoundingClientRect();
    setCursor({ x: e.clientX - w.left + wrap.current!.scrollLeft, y: e.clientY - w.top + wrap.current!.scrollTop });
    if (panning.current) {
      const p = panning.current;
      wrap.current!.scrollLeft = p.sl - (e.clientX - p.x);
      wrap.current!.scrollTop = p.st - (e.clientY - p.y);
      return;
    }
    if (drawing.current) {
      // coalesced events give smooth strokes on fast pen / mouse moves
      const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [];
      if (evs.length > 1) for (const ce of evs) props.onStroke!('move', toImage({ clientX: ce.clientX, clientY: ce.clientY } as any));
      else props.onStroke!('move', toImage(e));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    if (panning.current) panning.current = null;
    if (drawing.current) {
      drawing.current = false;
      props.onStroke!('end', toImage(e));
    }
  };

  const el = wrap.current;
  const padX = el ? pad(scale, el.clientWidth, props.width) : 24;
  const padY = el ? pad(scale, el.clientHeight, props.height) : 24;
  return (
    <div className="mstage-outer">
      <div
        ref={wrap}
        className={`mstage ${panMode ? 'pan' : props.brush ? 'brush' : ''}`}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomTo(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
          }
        }}
        onPointerLeave={() => setCursor(null)}
      >
        <div style={{ padding: `${padY}px ${padX}px`, width: 'max-content' }}>
          <canvas
            ref={props.canvasRef}
            className={`mstage-canvas bd-${props.backdrop}`}
            style={{ width: props.width * scale, height: props.height * scale }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            data-testid="mask-canvas"
          />
        </div>
        {cursor && props.brush > 0 && !panMode && (
          <div className="mstage-brush" style={{ left: cursor.x, top: cursor.y, width: props.brush, height: props.brush, borderColor: props.brushColor ?? '#fff' }} />
        )}
        {props.children}
      </div>
      <div className="mstage-zoom">
        <button className="icon-btn sm" title="Zoom out" onClick={() => zoomTo(scale / 1.25)}>
          <Minus size={14} />
        </button>
        <button className="zoom-pct" title="Fit" onClick={() => zoomTo(fit)}>
          {Math.round(scale * 100)}%
        </button>
        <button className="icon-btn sm" title="Zoom in" onClick={() => zoomTo(scale * 1.25)}>
          <Plus size={14} />
        </button>
        <button className="icon-btn sm" title="Fit to screen" onClick={() => zoomTo(fit)}>
          <Maximize size={13} />
        </button>
        <button className="zoom-pct" title="Actual pixels" onClick={() => zoomTo(1)}>
          1:1
        </button>
        <button className={`icon-btn sm ${hand ? 'on' : ''}`} title="Pan (or hold Space)" onClick={() => setHand(!hand)}>
          <Hand size={14} />
        </button>
      </div>
    </div>
  );
}

function pad(scale: number, view: number, size: number) {
  return Math.max(24, (view - size * scale) / 2);
}

/** Paint a soft round dab, interpolating from the previous point. */
export function paintDab(ctx: CanvasRenderingContext2D, from: StrokePoint | null, to: StrokePoint, hardness: number, mode: 'paint' | 'erase', color = '#fff') {
  ctx.save();
  ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
  const r = Math.max(0.5, to.r);
  const steps = from ? Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, r * 0.25))) : 1;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from ? from.x + (to.x - from.x) * t : to.x;
    const y = from ? from.y + (to.y - from.y) * t : to.y;
    const g = ctx.createRadialGradient(x, y, r * Math.min(0.99, hardness), x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = hardness >= 0.99 ? color : g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hexA(c: string, a: number) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c);
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : `rgba(255,255,255,${a})`;
}
