import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { deleteBrand, listAssets, listBrands, putBrand } from '../lib/db';
import { uid } from '../lib/ids';
import { ACCEPTED_UPLOADS, assetURL, importFile } from '../lib/assets';
import { pickFiles } from '../lib/download';
import type { Asset, BrandColor, BrandFont, BrandKit } from '../lib/types';
import { toast } from '../store/app';
import { ColorField } from '../ui/controls';

export function newBrand(name = 'New brand'): BrandKit {
  const now = Date.now();
  return {
    id: uid('b_'),
    name,
    colors: [
      { name: 'Ink', hex: '#111111', role: 'primary' },
      { name: 'Paper', hex: '#f4f1ea', role: 'neutral' },
      { name: 'Signal', hex: '#e63946', role: 'accent' },
    ],
    fonts: {
      heading: { family: 'Playfair Display', weight: 700 },
      subheading: { family: 'Inter', weight: 600, tracking: 200, caps: true },
      body: { family: 'Inter', weight: 400 },
    },
    logos: [],
    assets: [],
    guidelines: '',
    createdAt: now,
    updatedAt: now,
  };
}

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');

/** Load the font stylesheet so previews render in the brand's real fonts. */
function useFontCSS(families: string[]) {
  useEffect(() => {
    import('../lib/fontCatalog').then(({ findFont }) => {
      import('../lib/fonts').then(({ ensureFont }) => families.forEach((f) => findFont(f) && ensureFont(f, findFont(f)!.weights[0])));
    });
  }, [families.join('|')]);  
}

export default function BrandsView() {
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [editing, setEditing] = useState<BrandKit | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const refresh = async () => {
    setBrands(await listBrands());
    setAssets(await listAssets());
  };
  useEffect(() => {
    refresh();
  }, []);
  useFontCSS(brands.flatMap((b) => [b.fonts.heading.family, b.fonts.body.family]));

  if (editing)
    return (
      <BrandEditor
        brand={editing}
        assets={assets}
        onBack={() => (setEditing(null), refresh())}
        onChange={async (b) => {
          setEditing(b);
          await putBrand(b);
        }}
        onAssets={refresh}
      />
    );

  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Brand Kits</h2>
        <button
          className="btn primary"
          onClick={async () => {
            const b = newBrand(`Brand ${brands.length + 1}`);
            await putBrand(b);
            setEditing(b);
          }}
        >
          <Plus size={14} /> New brand
        </button>
      </div>
      <p className="muted" style={{ marginTop: 0, maxWidth: 640 }}>
        Save each brand’s logos, palette and type system once, then apply them to any design from the editor’s Brand panel.
      </p>
      {!brands.length ? (
        <div className="empty">
          <b>No brands yet.</b>Create your first kit — colours, fonts, logos and guidelines in one place.
        </div>
      ) : (
        <div className="brand-grid">
          {brands.map((b) => {
            const logo = assets.find((a) => a.id === b.logos[0]);
            return (
              <button key={b.id} className="brand-card" onClick={() => setEditing(b)}>
                <div className="brand-strip">
                  {b.colors.map((c, i) => (
                    <span key={i} style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                  ))}
                </div>
                <div className="brand-body">
                  {logo ? <img src={assetURL(logo)} alt="" className="brand-logo" /> : <div className="brand-logo ph">{b.name.slice(0, 1)}</div>}
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontFamily: `"${b.fonts.heading.family}"`, fontWeight: b.fonts.heading.weight }}>{b.name}</b>
                    <small>
                      {b.fonts.heading.family} · {b.fonts.body.family}
                    </small>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: BrandFont; onChange: (f: BrandFont) => void }) {
  const [families, setFamilies] = useState<{ family: string; weights: number[] }[]>([]);
  useEffect(() => {
    import('../lib/fontCatalog').then(({ allFonts }) => setFamilies(allFonts().map((f) => ({ family: f.family, weights: f.weights }))));
  }, []);
  useFontCSS([value.family]);
  const weights = families.find((f) => f.family === value.family)?.weights ?? [400, 700];
  const id = `fonts-${label}`;
  return (
    <div className="brand-font">
      <span className="faint">{label}</span>
      <div style={{ fontFamily: `"${value.family}"`, fontWeight: value.weight, fontSize: label === 'Body' ? 18 : 26, letterSpacing: (value.tracking ?? 0) / 1000 + 'em', textTransform: value.caps ? 'uppercase' : 'none', margin: '4px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label === 'Body' ? 'The quick brown fox jumps over the lazy dog' : 'Aa Brand Voice'}
      </div>
      <div className="row" style={{ gap: 6 }}>
        <input className="input" list={id} value={value.family} onChange={(e) => onChange({ ...value, family: e.target.value })} />
        <datalist id={id}>
          {families.slice(0, 2000).map((f) => (
            <option key={f.family} value={f.family} />
          ))}
        </datalist>
        <select className="select" style={{ width: 90 }} value={value.weight} onChange={(e) => onChange({ ...value, weight: +e.target.value })}>
          {weights.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button className={`btn sm ${value.caps ? 'on' : ''}`} title="All caps" onClick={() => onChange({ ...value, caps: !value.caps })}>
          AA
        </button>
      </div>
    </div>
  );
}

function BrandEditor({ brand, assets, onBack, onChange, onAssets }: { brand: BrandKit; assets: Asset[]; onBack: () => void; onChange: (b: BrandKit) => void; onAssets: () => void }) {
  const set = (patch: Partial<BrandKit>) => onChange({ ...brand, ...patch });
  const setColor = (i: number, patch: Partial<BrandColor>) => set({ colors: brand.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const upload = async (into: 'logos' | 'assets') => {
    const files = await pickFiles(ACCEPTED_UPLOADS);
    const ids: string[] = [];
    for (const f of files) {
      try {
        ids.push((await importFile(f)).id);
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
    if (ids.length) {
      set({ [into]: [...brand[into], ...ids] } as any);
      onAssets();
    }
  };
  const byId = (id: string) => assets.find((a) => a.id === id);
  return (
    <>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All brands
      </button>
      <div className="section-head">
        <input className="brand-name-input" value={brand.name} onChange={(e) => set({ name: e.target.value })} aria-label="Brand name" />
        <button
          className="btn danger sm"
          onClick={async () => {
            if (!confirm(`Delete brand “${brand.name}”? Designs keep their current fonts and colours.`)) return;
            await deleteBrand(brand.id);
            onBack();
          }}
        >
          <Trash2 size={13} /> Delete brand
        </button>
      </div>

      <section className="section brand-section">
        <div className="section-head">
          <h2>Logos</h2>
          <button className="btn sm" onClick={() => upload('logos')}>
            <Upload size={13} /> Upload logo
          </button>
        </div>
        <div className="brand-assets">
          {brand.logos.map((id) => byId(id) && (
            <div key={id} className="brand-asset">
              <img src={assetURL(byId(id)!)} alt="" />
              <button className="icon-btn sm" onClick={() => set({ logos: brand.logos.filter((x) => x !== id) })} title="Remove from brand">
                <X size={12} />
              </button>
            </div>
          ))}
          {!brand.logos.length && <p className="faint">Upload PNG or SVG logos (transparent backgrounds work best).</p>}
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-head">
          <h2>Colours</h2>
          <button className="btn sm" onClick={() => set({ colors: [...brand.colors, { name: `Colour ${brand.colors.length + 1}`, hex: '#888888', role: 'accent' }] })}>
            <Plus size={13} /> Add colour
          </button>
        </div>
        <div className="brand-colors">
          {brand.colors.map((c, i) => {
            const [r, g, b] = hexToRgb(c.hex);
            return (
              <div key={i} className="brand-color">
                <div className="brand-color-chip" style={{ background: c.hex }} />
                <input className="input" value={c.name} onChange={(e) => setColor(i, { name: e.target.value })} />
                <ColorField value={c.hex} onChange={(v) => setColor(i, { hex: v })} />
                <div className="row" style={{ gap: 4 }}>
                  {[r, g, b].map((v, k) => (
                    <input
                      key={k}
                      className="input"
                      style={{ width: 52 }}
                      title={['R', 'G', 'B'][k]}
                      value={v}
                      inputMode="numeric"
                      onChange={(e) => {
                        const rgb = [r, g, b];
                        rgb[k] = +e.target.value || 0;
                        setColor(i, { hex: rgbToHex(rgb[0], rgb[1], rgb[2]) });
                      }}
                    />
                  ))}
                </div>
                <select className="select" value={c.role} onChange={(e) => setColor(i, { role: e.target.value as BrandColor['role'] })}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                  <option value="neutral">Neutral</option>
                </select>
                <button className="icon-btn sm" onClick={() => set({ colors: brand.colors.filter((_, j) => j !== i) })} title="Remove">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-head">
          <h2>Typography</h2>
        </div>
        <div className="brand-fonts">
          <FontPicker label="Heading" value={brand.fonts.heading} onChange={(f) => set({ fonts: { ...brand.fonts, heading: f } })} />
          <FontPicker label="Subheading" value={brand.fonts.subheading} onChange={(f) => set({ fonts: { ...brand.fonts, subheading: f } })} />
          <FontPicker label="Body" value={brand.fonts.body} onChange={(f) => set({ fonts: { ...brand.fonts, body: f } })} />
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-head">
          <h2>Brand assets</h2>
          <button className="btn sm" onClick={() => upload('assets')}>
            <Upload size={13} /> Add assets
          </button>
        </div>
        <div className="brand-assets">
          {brand.assets.map((id) => byId(id) && (
            <div key={id} className="brand-asset">
              <img src={assetURL(byId(id)!)} alt="" />
              <button className="icon-btn sm" onClick={() => set({ assets: brand.assets.filter((x) => x !== id) })} title="Remove from brand">
                <X size={12} />
              </button>
            </div>
          ))}
          {!brand.assets.length && <p className="faint">Patterns, product shots, icons — anything you reuse.</p>}
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-head">
          <h2>Guidelines</h2>
        </div>
        <textarea className="input" rows={6} value={brand.guidelines} placeholder="Voice, logo clear space, do’s and don’ts…" onChange={(e) => set({ guidelines: e.target.value })} />
      </section>
    </>
  );
}
