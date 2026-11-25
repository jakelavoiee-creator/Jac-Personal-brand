/**
 * AI Studio — generation, history of AI images, and an honest map of which
 * AI tools run free on this device and which use the user's own paid keys.
 */
import { useEffect, useState } from 'react';
import { Bot, Cpu, KeyRound, Maximize2, Scissors, Sparkles, Wand2 } from 'lucide-react';
import { FabricImage } from 'fabric';
import AIGenerate from '../editor/panels/AIGenerate';
import { listAssets, putProject } from '../lib/db';
import { assetURL } from '../lib/assets';
import { createProject } from '../lib/projects';
import { CUSTOM_PROPS } from '../lib/render';
import { uid } from '../lib/ids';
import { isAIAsset } from '../lib/ai/save';
import { hasOpenAI } from '../lib/ai/openai';
import { hasAnthropic } from '../lib/ai/assistant';
import { navigate, toast } from '../store/app';
import type { Asset } from '../lib/types';

const TOOLS = [
  { icon: Scissors, name: 'Remove background', where: 'local', desc: 'ORMBG / BiRefNet / MODNet on your device, refine brushes, colour-clean edges' },
  { icon: Wand2, name: 'Magic eraser', where: 'local', desc: 'LaMa inpainting on your device, or instant quick fill' },
  { icon: Sparkles, name: 'Enhance 2×', where: 'local', desc: 'Swin2SR super-resolution on your device' },
  { icon: Sparkles, name: 'Text to image', where: 'paid', desc: 'OpenAI image models with styles, references and variations' },
  { icon: Sparkles, name: 'Generative fill & background scenes', where: 'paid', desc: 'Masked edits with OpenAI — only the selected pixels change' },
  { icon: Maximize2, name: 'Expand', where: 'paid', desc: 'Outpaint to a new frame with OpenAI' },
  { icon: Bot, name: 'Design assistant', where: 'paid', desc: 'Claude reviews your page and applies edits (Anthropic key)' },
];

/** Open an asset in a new design sized to the image. */
async function designFrom(a: Asset) {
  const p = await createProject({ title: a.name.slice(0, 60) || 'AI image', width: a.width, height: a.height });
  const img = await FabricImage.fromURL(assetURL(a));
  img.set({ left: a.width / 2, top: a.height / 2 });
  (img as any).id = uid('o_');
  (img as any).name = a.name;
  (img as any).assetId = a.id;
  p.pages[0].objects = [img.toObject(CUSTOM_PROPS as any)];
  await putProject(p);
  navigate({ name: 'editor', id: p.id });
}

export default function AIStudioView() {
  const [history, setHistory] = useState<Asset[]>([]);
  const refresh = () => listAssets().then((a) => setHistory(a.filter(isAIAsset)));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>AI Studio</h2>
      </div>
      <p className="muted" style={{ maxWidth: 700, marginTop: 0 }}>
        Real models only. Tools marked <span className="tag local">Free</span> run on your device after a one-time model download — nothing is uploaded. Tools marked <span className="tag paid">Paid</span> use your own API keys and are billed by the provider.
      </p>

      <div className="ai-studio">
        <section className="ai-studio-gen">
          <h3>
            <Sparkles size={15} /> Generate
          </h3>
          <AIGenerate
            onOpenSettings={() => navigate({ name: 'settings' })}
            onUse={(a) => designFrom(a).catch((e) => toast(e.message, 'error'))}
          />
        </section>
        <aside className="ai-studio-side">
          <h3>Tools</h3>
          <div className="ai-map">
            {TOOLS.map((t) => (
              <div key={t.name} className="ai-map-row">
                <t.icon size={15} />
                <div>
                  <b>{t.name}</b>
                  <span>{t.desc}</span>
                </div>
                <i className={`tag ${t.where === 'local' ? 'local' : 'paid'}`}>{t.where === 'local' ? 'Free' : 'Paid'}</i>
              </div>
            ))}
          </div>
          <div className="ai-keys">
            <span>
              <KeyRound size={13} /> OpenAI {hasOpenAI() ? <b className="ok">connected</b> : <b>not set</b>}
            </span>
            <span>
              <KeyRound size={13} /> Anthropic {hasAnthropic() ? <b className="ok">connected</b> : <b>not set</b>}
            </span>
            <span>
              <Cpu size={13} /> On-device models {self.crossOriginIsolated ? <b className="ok">multi-threaded</b> : <b>single-threaded</b>}
            </span>
            <button className="btn sm" onClick={() => navigate({ name: 'settings' })}>
              Manage keys
            </button>
          </div>
          <p className="faint small">Image tools open from the editor: select a photo, then the AI Tools panel or the Photo section in Properties.</p>
        </aside>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Your AI images</h2>
          <span className="faint small">{history.length} saved in Uploads</span>
        </div>
        {history.length ? (
          <div className="ai-history">
            {history.map((a) => (
              <figure key={a.id}>
                <img src={assetURL(a)} alt={a.name} loading="lazy" />
                <figcaption>
                  <span title={a.credit?.title}>{a.credit?.title ?? a.name}</span>
                  <button className="btn sm" onClick={() => designFrom(a).catch((e) => toast(e.message, 'error'))}>
                    Design with it
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="muted">Generated images appear here and in Uploads.</p>
        )}
      </section>
    </>
  );
}
