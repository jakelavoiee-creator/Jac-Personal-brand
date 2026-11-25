import { useEffect, useState } from 'react';
import { navigate, toast } from '../store/app';
import { TEMPLATES, templateThumb, projectFromTemplate, type Template } from '../templates';
import { createProject } from '../lib/projects';

const KITS: { title: string; blurb: string; ids: string[] }[] = [
  { title: 'Launch a clothing brand', blurb: 'Tee graphics, labels and tags that work together', ids: ['sw-winged-crest', 'ab-hangtag', 'ab-neck-label', 'ab-chest-mark', 'so-drop'] },
  { title: 'Quiet luxury', blurb: 'Gold, serif and restraint', ids: ['lx-monogram', 'lx-perfume', 'lx-card', 'bm-invitation', 'pa-skincare'] },
  { title: 'Release week', blurb: 'Cover, single announcement and gig poster', ids: ['al-midnight-drive', 'mu-new-single', 'mu-gig-poster', 'al-velvet-hours', 'al-loud'] },
  { title: 'Retro & vintage', blurb: 'Sunsets, neon and heritage type', ids: ['rt-good-vibes', 'rt-diner', 'vt-garage', 'vt-coffee-label', 'vt-forever-wild'] },
];

const PAIRINGS: { head: string; hw: number; body: string; bw: number; mood: string; sample: string }[] = [
  { head: 'Playfair Display', hw: 700, body: 'Inter', bw: 400, mood: 'Editorial classic', sample: 'The Art of Slow Living' },
  { head: 'Bodoni Moda', hw: 600, body: 'Satoshi', bw: 400, mood: 'Fashion house', sample: 'Maison Aura' },
  { head: 'Clash Display', hw: 600, body: 'General Sans', bw: 400, mood: 'Modern brand', sample: 'Build Something Bold' },
  { head: 'Anton', hw: 400, body: 'Space Grotesk', bw: 400, mood: 'Streetwear', sample: 'NO DAYS OFF' },
  { head: 'Cinzel', hw: 600, body: 'Cormorant Garamond', bw: 400, mood: 'Heritage luxury', sample: 'Atelier Collection' },
  { head: 'Fraunces', hw: 600, body: 'DM Sans', bw: 400, mood: 'Warm & friendly', sample: 'Good Things Take Time' },
  { head: 'Unbounded', hw: 700, body: 'Inter', bw: 400, mood: 'Tech & future', sample: 'Next Generation' },
  { head: 'Gambetta', hw: 500, body: 'Switzer', bw: 400, mood: 'Literary', sample: 'Notes on Craft' },
];

function usePairFonts() {
  const [ready, setReady] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      await import('../lib/fontCatalog'); // registers Google vs Fontshare sources
      const { ensureFont } = await import('../lib/fonts');
      await Promise.all(PAIRINGS.flatMap((p) => [ensureFont(p.head, p.hw), ensureFont(p.body, p.bw)]));
      if (alive) setReady((n) => n + 1);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

export default function DiscoverView() {
  usePairFonts();
  const [busy, setBusy] = useState<string | null>(null);
  const open = async (t: Template) => {
    setBusy(t.id);
    try {
      navigate({ name: 'editor', id: (await projectFromTemplate(t)).id });
    } catch (e: any) {
      toast(e?.message ?? 'Could not open template', 'error');
      setBusy(null);
    }
  };
  const startPairing = async (p: (typeof PAIRINGS)[number]) => {
    const proj = await createProject({ title: `${p.head} + ${p.body}`, width: 1080, height: 1350 });
    const { buildTemplatePages } = await import('../templates/build');
    proj.pages = await buildTemplatePages({
      id: 'pairing',
      name: '',
      category: '',
      w: 1080,
      h: 1350,
      bg: '#f4f1ea',
      tags: '',
      pages: [
        [
          { t: 'text', text: p.sample, font: p.head, weight: p.hw, size: 96, x: 540, y: 560, color: '#16130f', width: 900, lineHeight: 1.05 },
          { t: 'text', text: 'Pair a characterful headline with a quiet, readable body face. Edit this text to start.', font: p.body, weight: p.bw, size: 32, x: 540, y: 780, color: '#4a453f', width: 760, lineHeight: 1.45 },
        ],
      ],
    });
    const { putProject } = await import('../lib/db');
    await putProject(proj);
    navigate({ name: 'editor', id: proj.id });
  };
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Discover</h2>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Curated starting points — themed template kits and tested font pairings.
      </p>
      {KITS.map((k) => (
        <section key={k.title} className="section">
          <div className="section-head">
            <h2>
              {k.title} <span className="faint" style={{ fontWeight: 400 }}>— {k.blurb}</span>
            </h2>
          </div>
          <div className="tpl-strip">
            {k.ids.map((id) => TEMPLATES.find((t) => t.id === id)!).map((t) => (
              <button key={t.id} className="tpl-strip-item" disabled={!!busy} onClick={() => open(t)} title={t.name}>
                <img src={templateThumb(t)} alt={t.name} loading="lazy" />
                <small>{busy === t.id ? 'Opening…' : t.name}</small>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="section">
        <div className="section-head">
          <h2>Font pairings</h2>
        </div>
        <div className="pairings">
          {PAIRINGS.map((p) => (
            <button key={p.head + p.body} className="pairing" onClick={() => startPairing(p)} title="Start a design with this pairing">
              <span className="pairing-mood">{p.mood}</span>
              <span style={{ fontFamily: `"${p.head}"`, fontWeight: p.hw, fontSize: 30, lineHeight: 1.1, display: 'block' }}>{p.sample}</span>
              <span style={{ fontFamily: `"${p.body}"`, fontWeight: p.bw, fontSize: 14, color: '#5c564e', display: 'block', marginTop: 8 }}>A quiet, readable companion for body copy and captions.</span>
              <span className="pairing-names">
                {p.head} · {p.body}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
