import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useEngine } from '../Editor';
import { GRAPHICS, GRAPHIC_CATEGORIES, type Graphic, type GraphicCategory } from '../../data/graphics';
import { ColorField } from '../../ui/controls';
import { toast } from '../../store/app';

const ILLUSTRATION_CATS: GraphicCategory[] = ['Flowers & Botanicals', 'Retro & Vintage', 'Skulls', 'Wings', 'Flames', 'Geometric & Abstract'];

export default function GraphicsPanel({ illustrations }: { illustrations?: boolean }) {
  const engine = useEngine();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [ink, setInk] = useState('#111111');
  const [accent, setAccent] = useState('#e63946');
  const cats = illustrations ? ILLUSTRATION_CATS : GRAPHIC_CATEGORIES;
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return GRAPHICS.filter((g) => cats.includes(g.category) && (cat === 'All' || g.category === cat) && (!ql || g.name.toLowerCase().includes(ql) || g.tags.includes(ql)));
  }, [q, cat, cats]);
  const groups = useMemo(() => {
    const m = new Map<string, Graphic[]>();
    list.forEach((g) => m.set(g.category, [...(m.get(g.category) ?? []), g]));
    return [...m.entries()];
  }, [list]);

  const insert = (g: Graphic, at?: { x: number; y: number }) => engine.addSVG(g.svg(ink, accent), g.name, at).catch((e) => toast(e.message, 'error'));

  return (
    <>
      <div className="search" style={{ marginBottom: 8 }}>
        <Search size={14} />
        <input placeholder={`Search ${illustrations ? 'illustrations' : `${GRAPHICS.length} graphics`}`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 32 }} />
      </div>
      <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ marginBottom: 8 }}>
        <option value="All">All categories</option>
        {cats.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="grid2" style={{ marginBottom: 6 }}>
        <div>
          <small className="faint">Ink</small>
          <ColorField value={ink} onChange={(v) => setInk(v)} />
        </div>
        <div>
          <small className="faint">Accent</small>
          <ColorField value={accent} onChange={(v) => setAccent(v)} />
        </div>
      </div>
      {groups.map(([c, items]) => (
        <div key={c}>
          <h5>
            {c} <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>· {items.length}</span>
          </h5>
          <div className="graphic-grid">
            {items.map((g) => (
              <button
                key={g.id}
                title={`${g.name} — click or drag onto the canvas`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('application/x-aura-graphic', g.id)}
                onClick={() => insert(g)}
                dangerouslySetInnerHTML={{ __html: g.svg('#e9e6df', '#8f8f8f') }}
              />
            ))}
          </div>
        </div>
      ))}
      {!list.length && <p className="faint">No graphics match.</p>}
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        {GRAPHICS.length} original vector graphics, generated in Aura — no third-party artwork, free to use commercially. Every piece stays editable: recolour it in Properties → Colours, ungroup it, or edit its points. Hand-drawn illustration packs are planned.
      </p>
    </>
  );
}

export function graphicById(id: string) {
  return GRAPHICS.find((g) => g.id === id);
}
