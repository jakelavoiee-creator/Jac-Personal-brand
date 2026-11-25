import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Columns3, Search, Star, Upload } from 'lucide-react';
import { ActiveSelection, IText } from 'fabric';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import {
  allFonts,
  customFonts,
  favoriteFonts,
  FONT_ACCEPT,
  importFontFile,
  markFontUsed,
  POPULAR,
  previewFamily,
  recentFonts,
  STYLE_CATEGORIES,
  toggleFavoriteFont,
  type CatalogFont,
} from '../../lib/fontCatalog';
import { COLLECTIONS, type CollectionFont, type FontCollection } from '../../data/font-collections';
import { pickFiles } from '../../lib/download';
import { toast } from '../../store/app';

type Tab = 'browse' | 'collections' | 'favorites' | 'recent' | 'uploaded';
const PAGE = 60;

/** Renders `text` in `family` once the row scrolls into view (subset preview face). */
export function FontPreview({ family, text, weight = 400, italic, size = 18, style }: { family: string; text: string; weight?: number; italic?: boolean; size?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [alias, setAlias] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        previewFamily(family, weight, text).then((a) => !cancelled && setAlias(a));
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [family, weight, text]);
  return (
    <span
      ref={ref}
      style={{
        fontFamily: alias ? `"${alias}", system-ui` : 'system-ui',
        fontWeight: weight,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        opacity: alias ? 1 : 0.35,
        transition: 'opacity .15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...style,
      }}
    >
      {text}
    </span>
  );
}

export default function FontsPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const [tab, setTab] = useState<Tab>('browse');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [limit, setLimit] = useState(PAGE);
  const [favs, setFavs] = useState(favoriteFonts());
  const [collection, setCollection] = useState<FontCollection | null>(null);
  const [, force] = useState(0);

  const active = engine.active();
  const texts = (active instanceof ActiveSelection ? active.getObjects() : active ? [active] : []).filter((o) => o instanceof IText) as IText[];
  const current = texts[0]?.fontFamily ?? null;
  const sampleFromSelection = texts[0]?.text?.split('\n')[0]?.slice(0, 24);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let l: CatalogFont[];
    if (tab === 'favorites') l = favs.map((f) => allFonts().find((x) => x.family === f)).filter(Boolean) as CatalogFont[];
    else if (tab === 'recent') l = recentFonts().map((f) => allFonts().find((x) => x.family === f)).filter(Boolean) as CatalogFont[];
    else if (tab === 'uploaded') l = [...customFonts];
    else {
      l = allFonts();
      if (cat !== 'All') l = l.filter((f) => f.tags.includes(cat));
      if (!ql && cat === 'All') {
        const rank = new Map(POPULAR.map((f, i) => [f, i]));
        l = [...l].sort((a, b) => (rank.get(a.family) ?? 1e4) - (rank.get(b.family) ?? 1e4) || a.family.localeCompare(b.family));
      }
    }
    if (ql) l = l.filter((f) => f.family.toLowerCase().includes(ql) || f.tags.some((t) => t.toLowerCase() === ql));
    return l;
  }, [tab, q, cat, favs]);  

  useEffect(() => setLimit(PAGE), [tab, q, cat]);

  const apply = async (spec: { family: string; weight?: number; italic?: boolean; tracking?: number; caps?: boolean }, sample?: string) => {
    // hand keyboard focus back to the canvas so shortcuts work right after picking a font
    (document.activeElement as HTMLElement | null)?.blur?.();
    markFontUsed(spec.family);
    const applied = await engine.applyFontSpec(spec);
    if (!applied) {
      const text = sample ?? spec.family;
      await engine.addText({ text: spec.caps ? text.toUpperCase() : text, fontFamily: spec.family, fontWeight: spec.weight ?? 400, size: 100, letterSpacing: spec.tracking });
      if (spec.italic) engine.setProps({ fontStyle: 'italic' });
    }
  };

  const upload = async () => {
    const files = await pickFiles(FONT_ACCEPT);
    for (const f of files) {
      try {
        const font = await importFontFile(f);
        toast(`Font “${font.family}” added`, 'success');
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
    setTab('uploaded');
    force((n) => n + 1);
  };

  const fav = (family: string) => {
    toggleFavoriteFont(family);
    setFavs(favoriteFonts());
  };

  if (collection) return <CollectionView c={collection} onBack={() => setCollection(null)} onApply={apply} sample={sampleFromSelection} />;

  return (
    <>
      <div className="search" style={{ marginBottom: 8 }}>
        <Search size={14} />
        <input placeholder={`Search ${allFonts().length.toLocaleString()} fonts`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 32 }} />
      </div>
      <div className="font-tabs">
        {(['browse', 'collections', 'favorites', 'recent', 'uploaded'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'browse' ? 'All' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 6, margin: '8px 0' }}>
        <button className="btn sm" style={{ flex: 1 }} onClick={() => useEditor.setState({ compare: {} })} title="Compare up to 50 fonts side by side">
          <Columns3 size={13} /> Compare fonts
        </button>
        <button className="btn sm" style={{ flex: 1 }} onClick={upload} title="Upload a TTF, OTF, WOFF or WOFF2 you're licensed to use">
          <Upload size={13} /> Upload font
        </button>
      </div>

      {tab === 'collections' ? (
        <div className="collections">
          {COLLECTIONS.map((c) => (
            <button key={c.id} className="collection-card" onClick={() => setCollection(c)}>
              <div className="collection-strip">
                {c.fonts.slice(0, 3).map((f, i) => (
                  <FontPreview key={i} family={f.family} weight={f.weight} italic={f.italic} text={f.caps ? c.sample.toUpperCase() : c.sample} size={17} />
                ))}
              </div>
              <b>{c.name}</b>
              <small>
                {c.fonts.length} fonts · {c.mood}
              </small>
            </button>
          ))}
        </div>
      ) : (
        <>
          {tab === 'browse' && (
            <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ marginBottom: 8 }}>
              <option value="All">All styles</option>
              {STYLE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
          {!texts.length && <p className="faint" style={{ fontSize: 12, margin: '0 0 8px' }}>Select a text layer to apply a font — or click one to add new text.</p>}
          {!list.length && (
            <p className="faint" style={{ fontSize: 12 }}>
              {tab === 'favorites' ? 'Star fonts to collect them here.' : tab === 'recent' ? 'Fonts you use appear here.' : tab === 'uploaded' ? 'Upload fonts you hold a licence for (TTF, OTF, WOFF, WOFF2).' : 'No fonts match.'}
            </p>
          )}
          <div className="font-list" onScroll={() => {}}>
            {list.slice(0, limit).map((f) => (
              <div key={f.family} className={`font-row ${current === f.family ? 'on' : ''}`} onClick={() => apply({ family: f.family, weight: f.weights.includes(400) ? 400 : f.weights[0] })} title={`${f.family} · ${f.tags.join(', ')}`}>
                <FontPreview family={f.family} text={f.family} weight={f.weights.includes(400) ? 400 : f.weights[0]} size={19} />
                <small>
                  {f.source === 'fontshare' ? 'Fontshare · ' : ''}
                  {f.weights.length > 1 ? `${f.weights.length} weights` : f.tags[0]}
                </small>
                <button className={`icon-btn sm star ${favs.includes(f.family) ? 'on' : ''}`} onClick={(e) => (e.stopPropagation(), fav(f.family))} aria-label="Favourite">
                  <Star size={13} fill={favs.includes(f.family) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
          {list.length > limit && (
            <button className="btn ghost block sm" style={{ marginTop: 6 }} onClick={() => setLimit(limit + PAGE)}>
              Show more ({(list.length - limit).toLocaleString()} left)
            </button>
          )}
        </>
      )}
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        {allFonts().length.toLocaleString()} fonts free for commercial use — Google Fonts (OFL/Apache) and Fontshare (ITF Free Font License) — plus your uploads.
      </p>
    </>
  );
}

function CollectionView({ c, onBack, onApply, sample }: { c: FontCollection; onBack: () => void; onApply: (f: CollectionFont, sample?: string) => void; sample?: string }) {
  const text = sample || c.sample;
  return (
    <>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 6, paddingLeft: 2 }}>
        <ChevronLeft size={14} /> Collections
      </button>
      <h4 style={{ margin: '2px 0 2px', fontSize: 15 }}>{c.name}</h4>
      <p className="faint" style={{ fontSize: 12, margin: '0 0 8px' }}>{c.mood}</p>
      <button className="btn sm block" style={{ marginBottom: 10 }} onClick={() => useEditor.setState({ compare: { families: c.fonts.map((f) => f.family), title: c.name } })}>
        <Columns3 size={13} /> Compare all {c.fonts.length} in the studio
      </button>
      <div className="collection-list">
        {c.fonts.map((f, i) => (
          <button key={i} onClick={() => onApply({ ...f, family: f.family }, text)} title="Apply to selected text, or add new text">
            <FontPreview family={f.family} weight={f.weight} italic={f.italic} text={f.caps ? text.toUpperCase() : text} size={24} style={{ letterSpacing: f.tracking ? f.tracking / 1000 + 'em' : undefined, display: 'block' }} />
            <small>
              {f.family}
              {f.weight && f.weight !== 400 ? ` ${f.weight}` : ''}
              {f.italic ? ' Italic' : ''}
              {f.similarTo && <em> · similar to {f.similarTo}</em>}
            </small>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>
        Commercial typefaces can't be bundled, so their closest free alternatives are shown (“similar to”). Own a licence? Upload the real font with Upload font.
      </p>
    </>
  );
}
