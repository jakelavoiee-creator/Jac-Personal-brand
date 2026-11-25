import { useEffect, useMemo, useState } from 'react';
import { Check, Shuffle, Star, X } from 'lucide-react';
import { ActiveSelection, IText } from 'fabric';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { allFonts, closestWeight, favoriteFonts, findFont, markFontUsed, POPULAR, STYLE_CATEGORIES, toggleFavoriteFont } from '../../lib/fontCatalog';
import { FontPreview } from '../panels/FontsPanel';
import { RangeField } from '../../ui/controls';

const COUNTS = [10, 20, 30, 50];
type Case = 'as' | 'upper' | 'lower' | 'title';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export default function FontCompare() {
  const engine = useEngine();
  const cfg = useEditor((s) => s.compare);
  const close = () => useEditor.setState({ compare: null });
  const sel = engine.active();
  const selText = ((sel instanceof ActiveSelection ? sel.getObjects() : sel ? [sel] : []).find((o) => o instanceof IText) as IText | undefined)?.text?.split('\n')[0];
  const [text, setText] = useState(selText || 'Aura Studio');
  const [debounced, setDebounced] = useState(text);
  const [count, setCount] = useState(cfg?.families ? Math.min(50, Math.max(10, cfg.families.length)) : 20);
  const [source, setSource] = useState<string>(cfg?.families ? 'collection' : 'Popular');
  const [weight, setWeight] = useState(400);
  const [tracking, setTracking] = useState(0);
  const [kase, setCase] = useState<Case>('as');
  const [size, setSize] = useState(34);
  const [dark, setDark] = useState(false);
  const [seed, setSeed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [favs, setFavs] = useState(favoriteFonts());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 350);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);  

  const families = useMemo(() => {
    let pool: string[];
    if (source === 'collection' && cfg?.families) pool = [...new Set(cfg.families)];
    else if (source === 'Popular') pool = POPULAR;
    else if (source === 'Favorites') pool = favs;
    else pool = allFonts().filter((f) => f.tags.includes(source)).map((f) => f.family);
    if (seed) {
      const r = seeded(seed);
      pool = [...pool].sort(() => r() - 0.5);
    }
    return pool.slice(0, count);
  }, [source, count, seed, favs, cfg]);

  const shown = kase === 'upper' ? debounced.toUpperCase() : kase === 'lower' ? debounced.toLowerCase() : kase === 'title' ? debounced.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()) : debounced;

  const use = async (family: string) => {
    const f = findFont(family);
    const w = f ? closestWeight(f.weights, weight) : weight;
    markFontUsed(family);
    const applied = await engine.applyFontSpec({ family, weight: w, tracking, caps: kase === 'upper' });
    if (!applied) await engine.addText({ text: shown, fontFamily: family, fontWeight: w, size: 110, letterSpacing: tracking });
    close();
  };

  if (!cfg) return null;
  return (
    <div className="compare">
      <header className="compare-head">
        <div>
          <h3>Typography comparison{cfg.title ? ` · ${cfg.title}` : ''}</h3>
          <span className="faint">Same words, {families.length} fonts. Pick one and insert it.</span>
        </div>
        <button className="icon-btn" onClick={close} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="compare-controls">
        <input className="input compare-text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Type your word or phrase" autoFocus />
        <div className="seg">
          {COUNTS.map((c) => (
            <button key={c} className={count === c ? 'on' : ''} onClick={() => setCount(c)}>
              {c}
            </button>
          ))}
        </div>
        <select className="select" style={{ width: 160 }} value={source} onChange={(e) => (setSource(e.target.value), setSeed(0))}>
          {cfg.families && <option value="collection">{cfg.title ?? 'Collection'}</option>}
          <option value="Popular">Popular</option>
          <option value="Favorites">Favorites ({favs.length})</option>
          {STYLE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn sm" onClick={() => setSeed(Math.floor(Math.random() * 1e9) + 1)} title="Random selection from this source">
          <Shuffle size={13} /> Shuffle
        </button>
        <select className="select" style={{ width: 120 }} value={weight} onChange={(e) => setWeight(+e.target.value)} title="Closest available weight is used per font">
          {[100, 300, 400, 500, 700, 900].map((w) => (
            <option key={w} value={w}>
              Weight {w}
            </option>
          ))}
        </select>
        <div className="seg">
          {(['as', 'upper', 'title', 'lower'] as Case[]).map((c) => (
            <button key={c} className={kase === c ? 'on' : ''} onClick={() => setCase(c)}>
              {c === 'as' ? 'Aa' : c === 'upper' ? 'AA' : c === 'title' ? 'Tt' : 'aa'}
            </button>
          ))}
        </div>
        <div className="compare-slider">
          <span>Spacing</span>
          <RangeField value={tracking} min={-100} max={600} step={10} onChange={(v) => setTracking(v)} />
        </div>
        <div className="compare-slider">
          <span>Size</span>
          <RangeField value={size} min={16} max={96} onChange={(v) => setSize(v)} />
        </div>
        <button className={`btn sm ${dark ? 'on' : ''}`} onClick={() => setDark(!dark)}>
          {dark ? 'Light' : 'Dark'} cards
        </button>
      </div>
      <div className="compare-grid">
        {!families.length && <p className="faint">No fonts in this source yet — star fonts to fill Favorites.</p>}
        {families.map((fam) => {
          const f = findFont(fam);
          const w = f ? closestWeight(f.weights, weight) : weight;
          return (
            <div key={fam} className={`compare-card ${dark ? 'dark' : ''} ${picked === fam ? 'picked' : ''}`} onClick={() => setPicked(fam)}>
              <div className="compare-sample">
                <FontPreview key={fam + w + shown} family={fam} weight={w} text={shown || ' '} size={size} style={{ letterSpacing: tracking / 1000 + 'em', whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.1 }} />
              </div>
              <div className="compare-meta">
                <span>
                  {fam} <em>{w}</em>
                </span>
                <button
                  className={`icon-btn sm star ${favs.includes(fam) ? 'on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteFont(fam);
                    setFavs(favoriteFonts());
                  }}
                >
                  <Star size={13} fill={favs.includes(fam) ? 'currentColor' : 'none'} />
                </button>
                <button className="btn sm" onClick={(e) => (e.stopPropagation(), use(fam))}>
                  <Check size={13} /> Use
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {picked && (
        <footer className="compare-foot">
          <span>
            Selected: <b>{picked}</b>
          </span>
          <button className="btn primary" onClick={() => use(picked)}>
            {sel ? 'Apply to selection' : 'Insert into canvas'}
          </button>
        </footer>
      )}
    </div>
  );
}
