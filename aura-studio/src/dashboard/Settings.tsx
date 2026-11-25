import { useEffect, useState } from 'react';
import { toast } from '../store/app';

const KEYS: { id: string; label: string; hint: string; plain?: boolean; options?: [string, string][] }[] = [
  { id: 'tapstitch', label: 'Tapstitch API token', hint: 'Free with a Tapstitch account — the garment library for apparel previews (tapstitch.com/developers/tokens → Add token → copy the secret)' },
  { id: 'tapstitchCenter', label: 'Tapstitch fulfilment centre', hint: 'Which catalogue to browse', options: [['international', 'International'], ['usa', 'USA']] },
  { id: 'openai', label: 'OpenAI API key', hint: 'Paid — text-to-image, generative fill, expand (billed by OpenAI)' },
  { id: 'openaiModel', label: 'OpenAI image model', hint: 'Optional — default gpt-image-1', plain: true },
  { id: 'anthropic', label: 'Anthropic API key', hint: 'Paid — design assistant and prompt enhancement (billed by Anthropic)' },
  { id: 'anthropicModel', label: 'Claude model', hint: 'Optional — default claude-opus-5-5', plain: true },
  { id: 'openverseId', label: 'Openverse client ID', hint: 'Free — enables Openverse photo search (register at api.openverse.org)' },
  { id: 'openverseSecret', label: 'Openverse client secret', hint: 'Free — paired with the client ID above' },
];

const CAPS: [string, string, 'local' | 'soon' | 'paid', string][] = [
  ['Design editor, layers, text, shapes', 'Free · runs locally', 'local', 'Available'],
  ['Projects, autosave, assets (IndexedDB)', 'Free · runs locally', 'local', 'Available'],
  ['PNG / JPG / WEBP / transparent export', 'Free · runs locally', 'local', 'Available'],
  ['Google Fonts library', 'Free · fonts download from Google', 'local', 'Curated set now · full library Stage 2'],
  ['SVG / PDF export (vector, bleed, crop marks)', 'Free · runs locally', 'local', 'Available'],
  ['Templates, brand kits, smart resize', 'Free · runs locally', 'local', 'Available'],
  ['Stock photos (Wikimedia Commons, Openverse)', 'Free · Openverse needs a free API key', 'soon', 'Available'],
  ['Photo adjustments, filters, masks', 'Free · runs locally', 'local', 'Available'],
  ['Background removal (ORMBG / BiRefNet / MODNet)', 'Free · on-device · 7–192 MB model download, once', 'local', 'Available'],
  ['Magic eraser (LaMa) & quick fill', 'Free · on-device · 208 MB model download, once (quick fill: none)', 'local', 'Available'],
  ['Enhance 2× (Swin2SR)', 'Free · on-device · 8–54 MB model download, once', 'local', 'Available'],
  ['Text-to-image, references, variations', 'Paid · your OpenAI key, billed per image', 'paid', 'Available · verified with mocked API responses'],
  ['Generative fill, background scenes, expand', 'Paid · your OpenAI key, billed per image', 'paid', 'Available · verified with mocked API responses'],
  ['AI design assistant (Claude)', 'Paid · your Anthropic key, billed per message', 'paid', 'Available · verified with mocked API responses'],
  ['Apparel library & garment mockups (Tapstitch)', 'Free · your Tapstitch account token · catalogue and mockup layers from Tapstitch', 'soon', 'Available'],
  ['Print files per placement', 'Free · runs locally', 'local', 'Available'],
  ['Cloud sync & share links', 'Needs your own Supabase project (free tier)', 'soon', 'Awaiting setup'],
];

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(`aura.key.${k}`) || localStorage.getItem(`verso.key.${k}`) || '';
    } catch {
      return '';
    }
  },
  set: (k: string, v: string) => {
    try {
      if (v) localStorage.setItem(`aura.key.${k}`, v);
      else localStorage.removeItem(`aura.key.${k}`);
    } catch {
      /* storage unavailable */
    }
  },
};

export default function SettingsView() {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(KEYS.map((k) => [k.id, store.get(k.id)])));
  const [usage, setUsage] = useState<string>('');
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage !== undefined) setUsage(`${(e.usage / 1024 / 1024).toFixed(1)} MB used of ~${((e.quota ?? 0) / 1024 / 1024 / 1024).toFixed(1)} GB available`);
    });
  }, []);
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Settings</h2>
      </div>

      <section className="section" style={{ marginTop: 8 }}>
        <div className="section-head">
          <h2>Capabilities &amp; costs</h2>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Aura is free-first. Everything marked local runs in your browser with no account. Paid inference is only ever used with keys you add below.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Cost model</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {CAPS.map(([f, c, k, s]) => (
              <tr key={f}>
                <td>{f}</td>
                <td>
                  <span className={`tag ${k}`}>{k === 'local' ? 'Local' : k === 'paid' ? 'Paid API' : 'Optional'}</span> <span className="muted">{c}</span>
                </td>
                <td className={s === 'Available' ? '' : 'muted'}>{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>External API keys</h2>

        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Keys are stored only in this browser (localStorage) and are sent only to the provider they belong to. Anyone with access to this browser profile can read them — use keys with spending limits.
        </p>
        <div style={{ display: 'grid', gap: 2, maxWidth: 620 }}>
          {KEYS.map((k) => (
            <label key={k.id} className="field">
              <span>
                {k.label} <span className="faint">— {k.hint}</span>
              </span>
              {k.options ? (
                <select className="select" value={vals[k.id] || k.options[0][0]} onChange={(e) => setVals({ ...vals, [k.id]: e.target.value })}>
                  {k.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
              <input
                className="input"
                type={(k as any).plain ? 'text' : 'password'}
                value={vals[k.id]}
                placeholder={(k as any).plain ? 'Default' : 'Not set'}
                onChange={(e) => setVals({ ...vals, [k.id]: e.target.value })}
                autoComplete="off"
              />
              )}
            </label>
          ))}
          <div>
            <button
              className="btn primary"
              onClick={() => {
                KEYS.forEach((k) => store.set(k.id, vals[k.id].trim()));
                toast('Settings saved', 'success');
              }}
            >
              Save keys
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Storage</h2>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Designs and uploads live in IndexedDB on this device. {usage}
        </p>
        <p className="faint">Tip: export a project file from the editor’s Share menu to back up or move a design between browsers.</p>
      </section>
    </>
  );
}
