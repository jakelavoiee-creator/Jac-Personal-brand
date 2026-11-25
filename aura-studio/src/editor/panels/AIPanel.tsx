/**
 * Editor AI panel: design assistant (Claude), image generation (OpenAI) and
 * the image tools. Every tool says where it runs and whether it costs money.
 */
import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Cpu, KeyRound, Loader2, Maximize2, Scissors, Send, Sparkles, Undo2, Wand2, Copy } from 'lucide-react';
import { FabricImage } from 'fabric';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import AIGenerate from './AIGenerate';
import { askAssistant, assistantModel, hasAnthropic, type AssistantAction, type ChatTurn } from '../../lib/ai/assistant';
import { hasOpenAI } from '../../lib/ai/openai';
import { listBrands } from '../../lib/db';
import { toast } from '../../store/app';
import type { Asset } from '../../lib/types';

type Tab = 'assistant' | 'generate' | 'image';
interface Turn extends ChatTurn {
  actions?: AssistantAction[];
  applied?: boolean;
  picked?: boolean[];
}

const QUICK = ['Critique this design and fix the biggest issue', 'Suggest a stronger font pairing', 'Make it feel more premium', 'Improve the visual hierarchy', 'Write 3 headline options for this'];

export default function AIPanel() {
  const engine = useEngine();
  useEditor((s) => s.selVersion);
  const [tab, setTab] = useState<Tab>('assistant');
  const active = engine.active();
  const img = active instanceof FabricImage ? active : null;
  const settings = () => (location.hash = '#/settings');

  return (
    <div className="ai-panel">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'assistant' ? 'on' : ''} onClick={() => setTab('assistant')}>
          Assistant
        </button>
        <button className={tab === 'generate' ? 'on' : ''} onClick={() => setTab('generate')}>
          Generate
        </button>
        <button className={tab === 'image' ? 'on' : ''} onClick={() => setTab('image')}>
          Image
        </button>
      </div>
      {tab === 'assistant' && <Assistant onSettings={settings} />}
      {tab === 'generate' && <AIGenerate compact onOpenSettings={settings} onUse={(a: Asset) => engine.addAsset(a)} />}
      {tab === 'image' && <ImageTools img={img} />}
    </div>
  );
}

function ImageTools({ img }: { img: FabricImage | null }) {
  const engine = useEngine();
  const open = (k: Parameters<typeof engine.openImageTool>[0]) => img && engine.openImageTool(k, img);
  const paid = hasOpenAI();
  const Item = (p: { icon: any; title: string; desc: string; free?: boolean; onClick: () => void; id: string; disabled?: boolean }) => (
    <button className="ai-tool" onClick={p.onClick} disabled={!img || p.disabled} data-testid={`tool-${p.id}`}>
      <p.icon size={16} />
      <span>
        <b>{p.title}</b>
        <small>{p.desc}</small>
      </span>
      <i className={`tag ${p.free ? 'local' : 'paid'}`}>{p.free ? 'Free' : 'Paid'}</i>
    </button>
  );
  return (
    <div className="ai-tools">
      {!img && <p className="muted small">Select a photo on the page to use these tools.</p>}
      <h6 className="ai-h">
        <Cpu size={12} /> On your device
      </h6>
      <Item id="cutout" icon={Scissors} title="Remove background" desc="AI cutout with refine brushes" free onClick={() => open('cutout')} />
      <Item id="erase" icon={Wand2} title="Magic eraser" desc="Paint over objects to remove them" free onClick={() => open('erase')} />
      <Item id="enhance" icon={Sparkles} title="Enhance 2×" desc="AI super-resolution, sharper detail" free onClick={() => open('enhance')} />
      <h6 className="ai-h">
        <KeyRound size={12} /> Your OpenAI key
      </h6>
      <Item id="genfill" icon={Sparkles} title="Generative fill" desc="Replace, add or remove anything — or swap the background" onClick={() => open('genfill')} />
      <Item id="expand" icon={Maximize2} title="Expand" desc="Grow the frame and continue the picture" onClick={() => open('expand')} />
      {!paid && <p className="faint small">Paid tools open, but need an OpenAI key in Settings to run.</p>}
    </div>
  );
}

function Assistant({ onSettings }: { onSettings: () => void }) {
  const engine = useEngine();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const keyed = hasAnthropic();

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  const send = async (q = text) => {
    if (!q.trim() || busy) return;
    setError('');
    const history: Turn[] = [...turns, { role: 'user', text: q.trim() }];
    setTurns(history);
    setText('');
    setBusy(true);
    abort.current = new AbortController();
    try {
      // the brand kit chosen in the Brand panel (if any)
      let brandId = '';
      try {
        brandId = localStorage.getItem('aura.brand.active') || '';
      } catch {
        /* storage unavailable */
      }
      const brands = await listBrands();
      const brand = brands.find((b) => b.id === brandId) ?? (brands.length === 1 ? brands[0] : undefined);
      const res = await askAssistant(
        history.map((t) => ({ role: t.role, text: t.role === 'assistant' && t.actions?.length ? `${t.text}\n(Proposed edits: ${t.actions.map((a) => a.label).join('; ')}${t.applied ? ' — applied' : ' — not applied'})` : t.text })),
        { page: engine.describePage(), image: await engine.pageImage(1024), brand: brand ? { name: brand.name, colors: brand.colors, fonts: brand.fonts } : undefined },
        abort.current.signal,
      );
      setTurns([...history, { role: 'assistant', text: res.reply, actions: res.actions, picked: res.actions.map(() => true) }]);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? String(e));
    } finally {
      abort.current = null;
      setBusy(false);
    }
  };

  const apply = async (i: number) => {
    const t = turns[i];
    const acts = (t.actions ?? []).filter((_, k) => t.picked?.[k]);
    const n = await engine.applyAssistantActions(acts);
    setTurns(turns.map((x, k) => (k === i ? { ...x, applied: true } : x)));
    toast(`${n} edit${n === 1 ? '' : 's'} applied — ⌘Z to undo`, 'success');
  };

  return (
    <div className="assistant">
      {!keyed && (
        <div className="ai-key-note">
          <KeyRound size={14} />
          <span>
            The assistant uses <b>your Anthropic API key</b> and is billed by Anthropic per message.
          </span>
          <button className="btn sm" onClick={onSettings}>
            Settings
          </button>
        </div>
      )}
      <div className="chat" ref={scroller} data-testid="chat">
        {!turns.length && (
          <div className="chat-empty">
            <Bot size={22} />
            <p>Ask for direction or edits. The assistant sees your page and its selection, and can change text, fonts, colours and layout for you.</p>
            <div className="quick">
              {QUICK.map((q) => (
                <button key={q} className="chip" disabled={!keyed || busy} onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`msg ${t.role}`}>
            <div className="bubble">
              {t.text.split('\n').map((l, k) => (
                <p key={k}>{l}</p>
              ))}
              {t.role === 'assistant' && t.text && (
                <button className="icon-btn sm copy" title="Copy" onClick={() => navigator.clipboard?.writeText(t.text)}>
                  <Copy size={12} />
                </button>
              )}
            </div>
            {!!t.actions?.length && (
              <div className="actions" data-testid="assistant-actions">
                {t.actions.map((a, k) => (
                  <label key={k} className={t.applied ? 'done' : ''}>
                    <input type="checkbox" checked={!!t.picked?.[k]} disabled={t.applied} onChange={(e) => setTurns(turns.map((x, j) => (j === i ? { ...x, picked: x.picked!.map((p, m) => (m === k ? e.target.checked : p)) } : x)))} />
                    {a.label}
                  </label>
                ))}
                {t.applied ? (
                  <button className="btn sm ghost" onClick={() => engine.undo()}>
                    <Undo2 size={13} /> Undo
                  </button>
                ) : (
                  <button className="btn sm primary" onClick={() => apply(i)} disabled={!t.picked?.some(Boolean)} data-testid="apply-actions">
                    <Check size={13} /> Apply {t.picked?.filter(Boolean).length} edit{t.picked?.filter(Boolean).length === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg assistant">
            <div className="bubble thinking">
              <Loader2 size={13} className="spin" /> Looking at your design…
              <button className="btn sm ghost" onClick={() => abort.current?.abort()}>
                Stop
              </button>
            </div>
          </div>
        )}
        {error && <p className="err small">{error}</p>}
      </div>
      <div className="composer">
        <textarea
          className="input"
          rows={2}
          value={text}
          placeholder={keyed ? 'Ask or direct — e.g. “make the headline bolder and warmer”' : 'Add an Anthropic key to chat'}
          disabled={!keyed}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          data-testid="assistant-input"
        />
        <button className="btn primary" disabled={!keyed || busy || !text.trim()} onClick={() => send()} aria-label="Send">
          <Send size={14} />
        </button>
      </div>
      <p className="faint small">
        <span className="tag paid">Paid</span> Claude ({assistantModel()}) · your page’s layers and a snapshot image are sent to Anthropic.
      </p>
    </div>
  );
}
