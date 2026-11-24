import { useEffect, useState } from 'react';
import { toast } from '../store/app';

const KEYS = [
  { id: 'openai', label: 'OpenAI API key', hint: 'Image generation / editing (paid inference)' },
  { id: 'replicate', label: 'Replicate API token', hint: 'Hosted open models: SDXL, FLUX, inpainting (paid inference)' },
  { id: 'stability', label: 'Stability AI API key', hint: 'Generation, inpainting, outpainting (paid inference)' },
  { id: 'anthropic', label: 'Anthropic API key', hint: 'Design assistant (paid inference)' },
  { id: 'fastapi', label: 'Self-hosted processing URL', hint: 'Your own FastAPI/GPU server (hosting required)' },
];

const CAPS: [string, string, 'local' | 'soon' | 'paid', string][] = [
  ['Design editor, layers, text, shapes', 'Free · runs locally', 'local', 'Available'],
  ['Projects, autosave, assets (IndexedDB)', 'Free · runs locally', 'local', 'Available'],
  ['PNG / JPG / WEBP / transparent export', 'Free · runs locally', 'local', 'Available'],
  ['Google Fonts library', 'Free · fonts download from Google', 'local', 'Curated set now · full library Stage 2'],
  ['SVG / PDF export', 'Free · runs locally', 'local', 'Stage 3'],
  ['Background removal (ONNX in browser)', 'Free · local model download (~40–170 MB, once)', 'local', 'Stage 4'],
  ['AI image generation / generative fill', 'Requires a paid provider key or your own GPU server', 'paid', 'Stage 4'],
  ['AI design assistant', 'Requires an LLM provider key', 'paid', 'Stage 4'],
  ['Cloud sync & share links', 'Free tier via optional Supabase project', 'soon', 'Stage 3'],
];

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(`verso.key.${k}`) || '';
    } catch {
      return '';
    }
  },
  set: (k: string, v: string) => {
    try {
      if (v) localStorage.setItem(`verso.key.${k}`, v);
      else localStorage.removeItem(`verso.key.${k}`);
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
          Verso is free-first. Everything marked local runs in your browser with no account. Paid inference is only ever used with keys you add below.
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
          <span className="tag soon">Used from Stage 4</span>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Keys are stored only in this browser (localStorage) and are sent only to the provider they belong to. No AI feature is active in Stage 1, so nothing is called yet.
        </p>
        <div style={{ display: 'grid', gap: 2, maxWidth: 620 }}>
          {KEYS.map((k) => (
            <label key={k.id} className="field">
              <span>
                {k.label} <span className="faint">— {k.hint}</span>
              </span>
              <input
                className="input"
                type={k.id === 'fastapi' ? 'url' : 'password'}
                value={vals[k.id]}
                placeholder={k.id === 'fastapi' ? 'https://…' : 'Not set'}
                onChange={(e) => setVals({ ...vals, [k.id]: e.target.value })}
                autoComplete="off"
              />
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
