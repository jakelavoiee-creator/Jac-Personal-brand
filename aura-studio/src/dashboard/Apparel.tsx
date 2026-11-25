/**
 * Apparel — the Tapstitch garment library. Browse every active Tapstitch
 * product, inspect its colours and real print areas, and start a garment
 * project that previews your artwork on the actual product.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, KeyRound, Loader2, Search, Shirt, X } from 'lucide-react';
import { catalog, CATEGORIES, defaultTechnique, designAreas, fulfillmentCenter, hasTapstitch, inCategory, type TsCatalog, type TsProduct } from '../lib/tapstitch';
import { createGarmentProject, renderPiece } from '../lib/garment';
import { navigate, toast } from '../store/app';

const PAGE = 60;
const productUrl = (p: TsProduct) => `https://www.tapstitch.com/custom/${p.style_code.toLowerCase()}-${p.title.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export default function ApparelView() {
  const [items, setItems] = useState<TsProduct[] | null>(null);
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [tech, setTech] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<TsProduct | null>(null);
  const keyed = hasTapstitch();

  useEffect(() => {
    if (!keyed) return;
    let dead = false;
    catalog((sofar, total) => !dead && (setProgress({ n: sofar.length, total }), setItems([...sofar])))
      .then((all) => !dead && (setItems(all), setProgress(null)))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [keyed]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (items ?? []).filter(
      (p) => (cat === 'all' || inCategory(p, cat)) && (tech === 'all' || p.techniques.some((t) => t.code === tech)) && words.every((w) => `${p.title} ${p.style_code}`.toLowerCase().includes(w)),
    );
  }, [items, q, cat, tech]);
  useEffect(() => setShown(PAGE), [q, cat, tech]);

  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Apparel</h2>
        <span className="faint small">Garment library by Tapstitch · {fulfillmentCenter() === 'usa' ? 'USA' : 'International'} fulfilment</span>
      </div>
      {!keyed ? (
        <div className="connect-card">
          <Shirt size={22} />
          <div>
            <h3>Connect Tapstitch to load the garment library</h3>
            <ol>
              <li>
                Log in at <b>tapstitch.com</b> and open <b>tapstitch.com/developers/tokens</b>.
              </li>
              <li>
                Click <b>Add token</b>, name it (e.g. “Aura”), and copy the <b>secret</b> it shows.
              </li>
              <li>
                Paste it in <b>Settings → Tapstitch API token</b>.
              </li>
            </ol>
            <p className="muted small">Free with a Tapstitch account. The token stays in this browser and is only sent to Tapstitch.</p>
            <button className="btn primary" onClick={() => navigate({ name: 'settings' })}>
              <KeyRound size={14} /> Open Settings
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="apparel-bar">
            <div className="search">
              <Search size={14} />
              <input className="input" placeholder="Search 1,400+ garments — hoodie, oversized, heavyweight…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="apparel-search" />
            </div>
            <div className="seg compact">
              {['all', 'DTG', 'DTF'].map((t) => (
                <button key={t} className={tech === t ? 'on' : ''} onClick={() => setTech(t)}>
                  {t === 'all' ? 'All prints' : t}
                </button>
              ))}
            </div>
          </div>
          <div className="chips" style={{ margin: '12px 0 16px' }}>
            <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          {error && <p className="err">{error}</p>}
          {progress && (
            <p className="faint small" data-testid="apparel-progress">
              <Loader2 size={12} className="spin" /> Loading the Tapstitch catalogue… {progress.n} / {progress.total}
            </p>
          )}
          {items && (
            <p className="faint small" style={{ margin: '0 0 10px' }} data-testid="apparel-count">
              {filtered.length} garments
            </p>
          )}
          <div className="garment-grid">
            {filtered.slice(0, shown).map((p) => (
              <button key={p.id} className="garment-card" onClick={() => setOpen(p)} data-testid="garment-card">
                <div className="img">{p.main_image?.url && <img src={p.main_image.url} alt={p.title} loading="lazy" />}</div>
                <b>{p.title}</b>
                <span className="meta">
                  {p.price && <span>from ${p.price.amount}</span>}
                  <span className="dots">
                    {p.colors.slice(0, 7).map((c) => (
                      <i key={c.id} style={{ background: c.value }} title={c.name} />
                    ))}
                    {p.colors.length > 7 && <em>+{p.colors.length - 7}</em>}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {filtered.length > shown && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button className="btn" onClick={() => setShown(shown + PAGE)}>
                Show more ({filtered.length - shown} left)
              </button>
            </div>
          )}
          <p className="faint small" style={{ marginTop: 24 }}>
            Product data, photos and mockup layers come live from Tapstitch’s official API and stay Tapstitch’s property; Aura uses them to preview your designs on their garments.
          </p>
        </>
      )}
      {open && <ProductSheet p={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ProductSheet({ p, onClose }: { p: TsProduct; onClose: () => void }) {
  const [tech, setTech] = useState(defaultTechnique(p));
  const [areas, setAreas] = useState<TsCatalog | null>(null);
  const [color, setColor] = useState('');
  const [piece, setPiece] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAreas(null);
    setError('');
    designAreas(p.id, tech)
      .then((c) => {
        setAreas(c);
        setColor((cur) => (c.colors.some((x) => x.id === cur) ? cur : c.colors[0]?.id ?? ''));
        setPiece(c.print_areas[0].piece);
      })
      .catch((e) => setError(e.message));
  }, [p.id, tech]);

  useEffect(() => {
    if (!areas || !color || !piece || !preview.current) return;
    let dead = false;
    renderPiece(areas, piece, color, null, { size: 760, outlines: true, noArt: true })
      .then((c) => {
        if (dead || !preview.current) return;
        c.className = 'garment-preview';
        preview.current.replaceChildren(c);
      })
      .catch((e) => setError(e.message));
    return () => {
      dead = true;
    };
  }, [areas, color, piece]);

  const start = async () => {
    if (!areas) return;
    setBusy(true);
    try {
      const proj = await createGarmentProject(p, areas, color);
      navigate({ name: 'editor', id: proj.id });
    } catch (e: any) {
      toast(e.message, 'error');
      setBusy(false);
    }
  };

  const area = areas?.print_areas.find((a) => a.piece === piece);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal product-sheet" role="dialog" aria-label={p.title}>
        <div className="modal-head">
          <h3>{p.title}</h3>
          <span className="faint small">{p.style_code}</span>
          <a className="btn sm ghost" href={productUrl(p)} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>
            View on Tapstitch <ExternalLink size={12} />
          </a>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="product-body">
          <div className="product-stage">
            <div ref={preview} className="preview-box" data-testid="garment-preview">
              {!error && <Loader2 size={20} className="spin" />}
            </div>
            {areas && (
              <div className="seg compact" style={{ justifyContent: 'center' }}>
                {areas.print_areas.map((a) => (
                  <button key={a.piece} className={piece === a.piece ? 'on' : ''} onClick={() => setPiece(a.piece)}>
                    {a.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-info">
            {error && <p className="err small">{error}</p>}
            {p.price && (
              <p className="price">
                ${p.price.amount} <span className="faint small">blank, before printing</span>
              </p>
            )}
            <div className="field">
              <span>Print technique</span>
              <div className="seg">
                {p.techniques.map((t) => (
                  <button key={t.code} className={tech === t.code ? 'on' : ''} onClick={() => setTech(t.code)}>
                    {t.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span>Colour · {areas?.colors.find((c) => c.id === color)?.name ?? '…'}</span>
              <div className="swatches">
                {(areas?.colors ?? []).map((c) => (
                  <button key={c.id} className={`sw ${color === c.id ? 'on' : ''}`} style={{ background: c.value }} title={c.name} onClick={() => setColor(c.id)} />
                ))}
              </div>
            </div>
            <div className="field">
              <span>Sizes</span>
              <div className="faint small">{p.sizes.join(' · ')}</div>
            </div>
            {area && (
              <div className="field">
                <span>Print placements · {area.title}</span>
                <div className="placements">
                  {area.placements.map((pl) => (
                    <div key={pl.id}>
                      <b>{pl.title}</b>
                      <span className="faint">{pl.price ? `+$${pl.price.amount}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="muted small desc">{p.description}</p>
            <button className="btn primary block" disabled={!areas || busy} onClick={start} data-testid="design-garment">
              {busy ? <Loader2 size={14} className="spin" /> : <Shirt size={14} />} Design this garment
            </button>
            <p className="faint small">Opens a design with one page per print area ({areas?.print_areas.map((a) => a.title).join(', ') ?? '…'}), the real garment behind your artwork, and live mockups.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
