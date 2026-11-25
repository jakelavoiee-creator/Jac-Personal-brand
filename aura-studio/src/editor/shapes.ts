import { Circle, Path, Polygon, Rect, type FabricObject } from 'fabric';

export type ShapeKind =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'burst'
  | 'hexagon'
  | 'pentagon'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'heart'
  | 'ring'
  | 'arch';

export const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: 'rect', label: 'Rectangle' },
  { kind: 'rounded', label: 'Rounded' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'diamond', label: 'Diamond' },
  { kind: 'pentagon', label: 'Pentagon' },
  { kind: 'hexagon', label: 'Hexagon' },
  { kind: 'star', label: 'Star' },
  { kind: 'burst', label: 'Burst' },
  { kind: 'heart', label: 'Heart' },
  { kind: 'arch', label: 'Arch' },
  { kind: 'ring', label: 'Ring' },
  { kind: 'line', label: 'Line' },
  { kind: 'arrow', label: 'Arrow' },
];

const FILL = '#C9C9C9';

function regular(n: number, r: number, rotate = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const a = rotate + (i * 2 * Math.PI) / n;
    return { x: r + r * Math.cos(a), y: r + r * Math.sin(a) };
  });
}

function star(points: number, outer: number, inner: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    return { x: outer + r * Math.cos(a), y: outer + r * Math.sin(a) };
  });
}

/** SVG path data scaled to a box of `s`. Used for the shape thumbnails too. */
export function shapePath(kind: ShapeKind, s: number): string {
  const p = (pts: { x: number; y: number }[]) => 'M' + pts.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(' L') + ' Z';
  switch (kind) {
    case 'rect':
      return `M0 0 H${s} V${s} H0 Z`;
    case 'rounded': {
      const r = s * 0.18;
      return `M${r} 0 H${s - r} Q${s} 0 ${s} ${r} V${s - r} Q${s} ${s} ${s - r} ${s} H${r} Q0 ${s} 0 ${s - r} V${r} Q0 0 ${r} 0 Z`;
    }
    case 'circle':
      return `M0 ${s / 2} A${s / 2} ${s / 2} 0 1 0 ${s} ${s / 2} A${s / 2} ${s / 2} 0 1 0 0 ${s / 2} Z`;
    case 'triangle':
      return p([{ x: s / 2, y: 0 }, { x: s, y: s }, { x: 0, y: s }]);
    case 'diamond':
      return p([{ x: s / 2, y: 0 }, { x: s, y: s / 2 }, { x: s / 2, y: s }, { x: 0, y: s / 2 }]);
    case 'pentagon':
      return p(regular(5, s / 2));
    case 'hexagon':
      return p(regular(6, s / 2, 0));
    case 'star':
      return p(star(5, s / 2, s * 0.2));
    case 'burst':
      return p(star(14, s / 2, s * 0.38));
    case 'heart':
      return `M${s / 2} ${s * 0.92} C${s * 0.1} ${s * 0.62} 0 ${s * 0.38} 0 ${s * 0.27} C0 ${s * 0.1} ${s * 0.14} 0 ${s * 0.28} 0 C${s * 0.4} 0 ${s * 0.47} ${s * 0.08} ${s / 2} ${s * 0.16} C${s * 0.53} ${s * 0.08} ${s * 0.6} 0 ${s * 0.72} 0 C${s * 0.86} 0 ${s} ${s * 0.1} ${s} ${s * 0.27} C${s} ${s * 0.38} ${s * 0.9} ${s * 0.62} ${s / 2} ${s * 0.92} Z`;
    case 'arch':
      return `M0 ${s} V${s / 2} A${s / 2} ${s / 2} 0 0 1 ${s} ${s / 2} V${s} Z`;
    case 'ring': {
      const r = s / 2;
      const i = s * 0.32;
      return `M0 ${r} A${r} ${r} 0 1 0 ${s} ${r} A${r} ${r} 0 1 0 0 ${r} Z M${r - i} ${r} A${i} ${i} 0 1 1 ${r + i} ${r} A${i} ${i} 0 1 1 ${r - i} ${r} Z`;
    }
    case 'line':
      return `M0 ${s / 2} H${s}`;
    case 'arrow':
      return `M0 ${s / 2} H${s * 0.92} M${s * 0.72} ${s * 0.3} L${s * 0.94} ${s / 2} L${s * 0.72} ${s * 0.7}`;
  }
}

export function makeShape(kind: ShapeKind, size: number): FabricObject {
  const label = SHAPES.find((s) => s.kind === kind)?.label ?? 'Shape';
  const common = { shapeKind: kind, name: label } as any;
  let o: FabricObject;
  switch (kind) {
    case 'rect':
      o = new Rect({ width: size, height: size, fill: FILL, ...common });
      break;
    case 'rounded':
      o = new Rect({ width: size, height: size, rx: size * 0.12, ry: size * 0.12, fill: FILL, ...common });
      break;
    case 'circle':
      o = new Circle({ radius: size / 2, fill: FILL, ...common });
      break;
    case 'triangle':
    case 'diamond':
    case 'pentagon':
    case 'hexagon':
    case 'star':
    case 'burst': {
      const pts =
        kind === 'triangle'
          ? [{ x: size / 2, y: 0 }, { x: size, y: size }, { x: 0, y: size }]
          : kind === 'diamond'
            ? [{ x: size / 2, y: 0 }, { x: size, y: size / 2 }, { x: size / 2, y: size }, { x: 0, y: size / 2 }]
            : kind === 'pentagon'
              ? regular(5, size / 2)
              : kind === 'hexagon'
                ? regular(6, size / 2, 0)
                : kind === 'star'
                  ? star(5, size / 2, size * 0.2)
                  : star(14, size / 2, size * 0.38);
      o = new Polygon(pts, { fill: FILL, ...common });
      break;
    }
    case 'line':
    case 'arrow':
      o = new Path(shapePath(kind, size), {
        fill: '',
        stroke: '#111111',
        strokeWidth: Math.max(2, size * 0.03),
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        strokeUniform: true,
        ...common,
      });
      break;
    default:
      o = new Path(shapePath(kind, size), { fill: FILL, fillRule: 'evenodd', ...common });
  }
  return o;
}
