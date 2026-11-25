import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { ActiveSelection, IText, type FabricObject } from 'fabric';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { getAsset, listAssets, listBrands } from '../../lib/db';
import { assetURL } from '../../lib/assets';
import type { Asset, BrandKit } from '../../lib/types';
import { navigate, toast } from '../../store/app';

const KEY = 'aura.brand.active';

export default function BrandPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const [brands, setBrands] = useState<BrandKit[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeId, setActiveId] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    listBrands().then(setBrands);
    listAssets().then(setAssets);
  }, []);
  const brand = brands?.find((b) => b.id === activeId) ?? brands?.[0];
  const choose = (id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  };

  if (!brands) return null;
  if (!brand)
    return (
      <div className="soon-panel">
        <b>No brand kits yet</b>
        Save your logos, colours and fonts once, then apply them to any design from here.
        <div style={{ marginTop: 10 }}>
          <button className="btn primary sm" onClick={() => navigate({ name: 'brands' })}>
            <Palette size={13} /> Create a brand kit
          </button>
        </div>
      </div>
    );

  const sel = engine.active();
  const targets: FabricObject[] = sel ? (sel instanceof ActiveSelection ? sel.getObjects() : [sel]) : [];
  const applyColor = (hex: string) => {
    if (!targets.length) return engine.setBackground(hex);
    engine.setProps({ fill: hex });
  };
  const byId = (id: string) => assets.find((a) => a.id === id);
  const insert = async (id: string) => {
    const a = byId(id) ?? (await getAsset(id));
    if (a) await engine.addAsset(a).catch((e) => toast(e.message, 'error'));
  };
  const hasText = targets.some((t) => t instanceof IText);

  return (
    <>
      <select className="select" value={brand.id} onChange={(e) => choose(e.target.value)} style={{ marginBottom: 10 }}>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <h5>Colours</h5>
      <div className="brand-swatches">
        {brand.colors.map((c, i) => (
          <button key={i} style={{ background: c.hex }} title={`${c.name} · ${c.hex} — ${targets.length ? 'apply to selection' : 'set page background'}`} onClick={() => applyColor(c.hex)} />
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, margin: '6px 0 0' }}>{targets.length ? 'Click a colour to fill the selection.' : 'Nothing selected — clicking sets the page background.'}</p>

      <h5>Typography</h5>
      <div className="text-presets">
        {(['heading', 'subheading', 'body'] as const).map((role) => {
          const f = brand.fonts[role];
          return (
            <button key={role} onClick={() => engine.addBrandText(brand, role)} title={`Add ${role} — ${f.family} ${f.weight}`}>
              <span style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight, fontSize: role === 'heading' ? 22 : role === 'subheading' ? 15 : 13, letterSpacing: (f.tracking ?? 0) / 1000 + 'em', textTransform: f.caps ? 'uppercase' : 'none', display: 'block' }}>
                Add {role}
              </span>
              <small className="faint" style={{ fontSize: 10.5 }}>
                {f.family} {f.weight}
              </small>
            </button>
          );
        })}
      </div>
      {hasText && (
        <button className="btn sm block" style={{ marginTop: 8 }} onClick={async () => toast(`Brand fonts applied to ${await engine.applyBrandFonts(brand, 'selection')} text layer(s)`, 'success')}>
          Apply brand fonts to selection
        </button>
      )}

      {brand.logos.length > 0 && (
        <>
          <h5>Logos</h5>
          <div className="asset-grid">
            {brand.logos.map((id) =>
              byId(id) ? (
                <div key={id} className="asset" role="button" tabIndex={0} onClick={() => insert(id)} title="Insert logo">
                  <img src={assetURL(byId(id)!)} alt="" />
                </div>
              ) : null,
            )}
          </div>
        </>
      )}
      {brand.assets.length > 0 && (
        <>
          <h5>Brand assets</h5>
          <div className="asset-grid">
            {brand.assets.map((id) =>
              byId(id) ? (
                <div key={id} className="asset" role="button" tabIndex={0} onClick={() => insert(id)}>
                  <img src={assetURL(byId(id)!)} alt="" />
                </div>
              ) : null,
            )}
          </div>
        </>
      )}

      <h5>Apply to this design</h5>
      <div style={{ display: 'grid', gap: 6 }}>
        <button className="btn sm block" onClick={async () => toast(`Restyled ${await engine.applyBrandFonts(brand)} text layer(s): largest → heading, mid → subheading, small → body`, 'success')}>
          Apply brand fonts to all text
        </button>
        <button className="btn sm block" onClick={() => toast(`Mapped ${engine.applyBrandColors(brand)} colour(s) onto the brand palette`, 'success')}>
          Apply brand colours
        </button>
      </div>
      {brand.guidelines && (
        <>
          <h5>Guidelines</h5>
          <p className="muted" style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>
            {brand.guidelines}
          </p>
        </>
      )}
      <button className="btn ghost sm" style={{ marginTop: 14 }} onClick={() => navigate({ name: 'brands' })}>
        Edit brand kits
      </button>
    </>
  );
}
