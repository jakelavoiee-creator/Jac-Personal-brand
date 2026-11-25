/**
 * Text-to-image generator (paid — the user's own OpenAI key). Shared by the
 * editor's AI panel and the AI Studio page. Results are saved as assets.
 */
import { useEffect, useState } from 'react';
import { ImagePlus, KeyRound, Loader2, Sparkles, Wand, X } from 'lucide-react';
import { ASPECT_SIZE, composePrompt, editImages, generateImages, hasOpenAI, openaiModel, STYLES, type Aspect, type Quality } from '../../lib/ai/openai';
import { saveAIAsset } from '../../lib/ai/save';
import { enhancePrompt, hasAnthropic } from '../../lib/ai/assistant';
import { assetURL } from '../../lib/assets';
import { listAssets } from '../../lib/db';
import { toast } from '../../store/app';
import type { Asset } from '../../lib/types';

export default function AIGenerate(props: { compact?: boolean; onUse?: (a: Asset) => void; onOpenSettings?: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photo');
  const [aspect, setAspect] = useState<Aspect>('square');
  const [quality, setQuality] = useState<Quality>('medium');
  const [n, setN] = useState(props.compact ? 2 : 4);
  const [avoid, setAvoid] = useState('');
  const [transparent, setTransparent] = useState(false);
  const [refs, setRefs] = useState<Asset[]>([]);
  const [picking, setPicking] = useState(false);
  const [library, setLibrary] = useState<Asset[]>([]);
  const [busy, setBusy] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [error, setError] = useState('');
  const keyed = hasOpenAI();

  useEffect(() => {
    if (picking) listAssets().then((a) => setLibrary(a.filter((x) => /^image\/(png|jpe?g|webp)$/.test(x.type)).slice(0, 40)));
  }, [picking]);

  const run = async () => {
    if (!prompt.trim()) return;
    setError('');
    setBusy(`Generating ${n} image${n > 1 ? 's' : ''}…`);
    try {
      const full = composePrompt(prompt, style, avoid);
      const blobs = refs.length
        ? await editImages({ prompt: full, images: refs.map((r) => r.blob), size: ASPECT_SIZE[aspect], quality, n, transparent })
        : await generateImages({ prompt: full, aspect, quality, n, transparent });
      const saved: Asset[] = [];
      for (const b of blobs) saved.push(await saveAIAsset(b, { name: prompt.slice(0, 60), prompt: full, model: openaiModel(), provider: 'OpenAI' }));
      setResults((r) => [...saved, ...r]);
      toast(`${saved.length} image${saved.length > 1 ? 's' : ''} generated — saved to Uploads`, 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy('');
    }
  };

  const improve = async () => {
    setBusy('Writing a richer prompt…');
    setError('');
    try {
      setPrompt(await enhancePrompt(prompt, STYLES.find((s) => s.id === style)?.label ?? ''));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={`aigen ${props.compact ? 'compact' : ''}`}>
      {!keyed && (
        <div className="ai-key-note">
          <KeyRound size={14} />
          <span>
            Generation uses <b>your OpenAI API key</b> and is billed by OpenAI per image. Add a key in Settings.
          </span>
          {props.onOpenSettings && (
            <button className="btn sm" onClick={props.onOpenSettings}>
              Settings
            </button>
          )}
        </div>
      )}
      <label className="field">
        <span>Describe the image</span>
        <textarea className="input prompt" rows={props.compact ? 4 : 3} value={prompt} placeholder="A ceramic coffee cup on travertine, morning light, minimal" onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run(); }} data-testid="ai-prompt" />
      </label>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm" disabled={!prompt.trim() || !!busy || !hasAnthropic()} onClick={improve} title={hasAnthropic() ? 'Expand into a detailed prompt with the design assistant (Claude)' : 'Needs an Anthropic key in Settings'}>
          <Wand size={13} /> Enhance prompt
        </button>
        <span className="faint small">{hasAnthropic() ? 'Uses your Anthropic key' : 'Needs an Anthropic key'}</span>
      </div>
      <div className="field">
        <span>Style</span>
        <div className="chips">
          {STYLES.map((s) => (
            <button key={s.id} className={`chip ${style === s.id ? 'on' : ''}`} onClick={() => setStyle(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="aigen-grid">
        <div className="field">
          <span>Aspect</span>
          <div className="seg">
            {(['square', 'portrait', 'landscape'] as Aspect[]).map((a) => (
              <button key={a} className={aspect === a ? 'on' : ''} onClick={() => setAspect(a)} title={ASPECT_SIZE[a]}>
                {a === 'square' ? '1:1' : a === 'portrait' ? '2:3' : '3:2'}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Quality</span>
          <div className="seg">
            {(['low', 'medium', 'high'] as Quality[]).map((q) => (
              <button key={q} className={quality === q ? 'on' : ''} onClick={() => setQuality(q)}>
                {q[0].toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Images</span>
          <div className="seg">
            {[1, 2, 3, 4].map((k) => (
              <button key={k} className={n === k ? 'on' : ''} onClick={() => setN(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="field">
        <span>Avoid (optional)</span>
        <input className="input" value={avoid} placeholder="text, watermarks, extra fingers" onChange={(e) => setAvoid(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
      </label>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <label className="row small" style={{ gap: 6, color: 'var(--text-2)' }}>
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} /> Transparent background
        </label>
        <button className="btn sm ghost" onClick={() => setPicking(!picking)}>
          <ImagePlus size={13} /> Reference{refs.length ? ` (${refs.length})` : ''}
        </button>
      </div>
      {(picking || refs.length > 0) && (
        <div className="refs">
          {refs.map((r) => (
            <div key={r.id} className="ref" style={{ backgroundImage: `url(${assetURL(r)})` }}>
              <button onClick={() => setRefs(refs.filter((x) => x.id !== r.id))} aria-label="Remove reference">
                <X size={11} />
              </button>
            </div>
          ))}
          {picking &&
            library
              .filter((a) => !refs.some((r) => r.id === a.id))
              .map((a) => <button key={a.id} className="ref add" style={{ backgroundImage: `url(${assetURL(a)})` }} title={`Use “${a.name}” as a reference`} onClick={() => refs.length < 4 && setRefs([...refs, a])} />)}
          <p className="faint small" style={{ gridColumn: '1 / -1' }}>
            References guide subject, product or style (up to 4). The first is the image to transform.
          </p>
        </div>
      )}
      <button className="btn primary block" disabled={!keyed || !prompt.trim() || !!busy} onClick={run} data-testid="ai-generate">
        {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {busy || (refs.length ? 'Generate from references' : 'Generate')}
      </button>
      <p className="faint small">
        <span className="tag paid">Paid</span> OpenAI {openaiModel()} · billed to your OpenAI account per image (higher quality costs more) · prompts and references are sent to OpenAI.
      </p>
      {error && <p className="err small">{error}</p>}
      {results.length > 0 && (
        <div className="aigen-results" data-testid="ai-results">
          {results.map((a) => (
            <button key={a.id} className="result" onClick={() => props.onUse?.(a)} title={props.onUse ? 'Add to design' : a.name} style={{ aspectRatio: `${a.width} / ${a.height}` }}>
              <img src={assetURL(a)} alt={a.name} />
              {props.onUse && <span>Add to design</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
