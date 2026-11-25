import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useEngine } from '../Editor';
import { TEMPLATES, TEMPLATE_CATEGORIES, templateThumb, templateDims, buildTemplate, projectFromTemplate, listUserTemplates, type Template } from '../../templates';
import type { UserTemplate } from '../../lib/types';
import { navigate, toast } from '../../store/app';

export default function TemplatesPanel() {
  const engine = useEngine();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<UserTemplate[]>([]);
  useEffect(() => {
    listUserTemplates().then(setMine);
  }, []);
  const list = useMemo(() => TEMPLATES.filter((t) => (cat === 'All' || t.category === cat) && (!q || `${t.name} ${t.tags} ${t.category}`.toLowerCase().includes(q.toLowerCase()))), [q, cat]);

  const addPages = async (pages: any[], w: number, h: number, name: string) => {
    setBusy(true);
    try {
      await engine.insertPages(pages, w, h);
      toast(`Added “${name}” as ${pages.length > 1 ? `${pages.length} new pages` : 'a new page'}${w !== engine.project.width || h !== engine.project.height ? ' (smart-resized to this design)' : ''}`, 'success');
    } catch (e: any) {
      toast(e?.message ?? 'Could not add template', 'error');
    } finally {
      setBusy(false);
    }
  };
  const use = async (t: Template) => {
    const d = templateDims(t);
    await addPages(await buildTemplate(t), d.width, d.height, t.name);
  };

  return (
    <>
      <div className="search" style={{ marginBottom: 8 }}>
        <Search size={14} />
        <input placeholder={`Search ${TEMPLATES.length} templates`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 32 }} />
      </div>
      <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ marginBottom: 8 }}>
        <option value="All">All categories</option>
        {TEMPLATE_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <p className="faint" style={{ fontSize: 11.5, margin: '0 0 10px' }}>
        Click to add as a new page (resized to fit this design). Use <ExternalLink size={10} /> to open as its own design.
      </p>
      {mine.length > 0 && cat === 'All' && !q && (
        <>
          <h5>My templates</h5>
          <div className="tpl-panel-grid">
            {mine.map((t) => (
              <button key={t.id} className="tpl-panel-item" disabled={busy} onClick={() => addPages(structuredClone(t.pages), t.width, t.height, t.name)} title={t.name}>
                {t.thumbnail && <img src={t.thumbnail} alt="" />}
              </button>
            ))}
          </div>
          <h5>Aura templates</h5>
        </>
      )}
      <div className="tpl-panel-grid">
        {list.map((t) => (
          <div key={t.id} className="tpl-panel-item" role="button" tabIndex={0} title={`${t.name} — ${t.category}`} onClick={() => !busy && use(t)}>
            <img src={templateThumb(t)} alt={t.name} loading="lazy" />
            <button
              className="icon-btn sm tpl-open"
              title="Open as a new design"
              onClick={async (e) => {
                e.stopPropagation();
                const p = await projectFromTemplate(t);
                navigate({ name: 'editor', id: p.id });
              }}
            >
              <ExternalLink size={12} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
