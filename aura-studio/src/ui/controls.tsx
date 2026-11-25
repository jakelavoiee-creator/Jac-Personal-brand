import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../store/app';

/* Number input with drag-to-scrub label (like pro design tools). */
export function NumberField(props: {
  label?: ReactNode;
  value: number;
  onChange: (v: number, live: boolean) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  precision?: number;
  title?: string;
}) {
  const { value, onChange, step = 1, min = -Infinity, max = Infinity, precision = 0 } = props;
  const fmt = (v: number) => (Number.isFinite(v) ? (+v.toFixed(precision)).toString() : '');
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmt(value));
  }, [value]);  

  const clampV = (v: number) => Math.min(max, Math.max(min, v));
  const commit = () => {
    const v = parseFloat(text);
    if (Number.isFinite(v)) onChange(clampV(v), false);
    else setText(fmt(value));
  };

  const scrub = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const start = value;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const mult = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
      onChange(clampV(+(start + Math.round(dx / 2) * step * mult).toFixed(precision)), true);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  return (
    <div className="num" title={props.title}>
      {props.label !== undefined && <label onPointerDown={scrub}>{props.label}</label>}
      <input
        value={text}
        inputMode="decimal"
        onFocus={(e) => {
          focused.current = true;
          e.target.select();
        }}
        onBlur={() => {
          focused.current = false;
          commit();
        }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            const v = clampV(+(value + d).toFixed(precision));
            setText(fmt(v));
            onChange(v, false);
          }
          e.stopPropagation();
        }}
      />
      {props.unit && <span className="unit">{props.unit}</span>}
    </div>
  );
}

export function RangeField(props: { value: number; min: number; max: number; step?: number; onChange: (v: number, live: boolean) => void; unit?: string; precision?: number }) {
  return (
    <div className="range">
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value), true)}
        onPointerUp={(e) => props.onChange(parseFloat((e.target as HTMLInputElement).value), false)}
        onKeyUp={(e) => props.onChange(parseFloat((e.target as HTMLInputElement).value), false)}
      />
      <NumberField value={props.value} min={props.min} max={props.max} step={props.step ?? 1} precision={props.precision} unit={props.unit} onChange={props.onChange} />
    </div>
  );
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function toHex(c: unknown): string {
  if (typeof c !== 'string' || !c) return '';
  if (HEX.test(c)) return c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c.toLowerCase();
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(c);
  if (m) return '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('');
  return c;
}

export function ColorField(props: { value: string | null; onChange: (v: string, live: boolean) => void; allowNone?: boolean; onNone?: () => void }) {
  const hex = toHex(props.value);
  const [text, setText] = useState(hex);
  useEffect(() => setText(hex), [hex]);
  return (
    <div className="color-field">
      <div className={`swatch ${!props.value ? 'none' : ''}`} style={props.value ? { background: props.value } : undefined}>
        <input type="color" value={HEX.test(hex) ? hex : '#000000'} onInput={(e) => props.onChange((e.target as HTMLInputElement).value, true)} onChange={(e) => props.onChange(e.target.value, false)} />
      </div>
      <input
        className="input"
        value={props.value ? text : 'None'}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const v = text.startsWith('#') ? text : '#' + text;
          if (HEX.test(v)) props.onChange(v, false);
          else setText(hex);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
      {props.allowNone && props.value && (
        <button className="icon-btn sm" title="Remove" onClick={props.onNone}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Toggle(props: { on: boolean; onChange: (v: boolean) => void; title?: string }) {
  return <button className={`toggle ${props.on ? 'on' : ''}`} title={props.title} aria-pressed={props.on} onClick={() => props.onChange(!props.on)} />;
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [props.onClose]);  
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
      <div
        className={`modal ${props.wide ? 'wide' : ''}`}
        role="dialog"
        aria-label={props.title}
        onKeyDown={(e) => {
          // keep editor shortcuts from firing behind the dialog, but honour Escape
          e.stopPropagation();
          if (e.key === 'Escape') props.onClose();
        }}
      >
        <div className="modal-head">
          <h3>{props.title}</h3>
          <button className="icon-btn sm" onClick={props.onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">{props.children}</div>
        {props.footer && <div className="modal-foot">{props.footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismiss);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export interface MenuItem {
  label?: string;
  icon?: ReactNode;
  kbd?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  sep?: boolean;
}

export function PopMenu(props: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: props.x, y: props.y });
  useEffect(() => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ x: Math.min(props.x, innerWidth - r.width - 8), y: Math.min(props.y, innerHeight - r.height - 8) });
    }
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && props.onClose();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    setTimeout(() => window.addEventListener('mousedown', close), 0);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [props.x, props.y]);  
  return (
    <div className="menu" ref={ref} style={{ left: pos.x, top: pos.y }} onContextMenu={(e) => e.preventDefault()}>
      {props.items.map((it, i) =>
        it.sep ? (
          <hr key={i} />
        ) : (
          <button
            key={i}
            disabled={it.disabled}
            className={it.danger ? 'danger' : ''}
            onClick={() => {
              props.onClose();
              it.onClick?.();
            }}
          >
            {it.icon}
            {it.label}
            {it.kbd && <span className="kbd">{it.kbd}</span>}
          </button>
        ),
      )}
    </div>
  );
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? '⌘' : 'Ctrl+';
