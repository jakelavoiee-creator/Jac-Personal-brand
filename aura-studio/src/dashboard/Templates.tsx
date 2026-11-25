import { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { navigate, toast } from '../store/app';
import { TEMPLATES, TEMPLATE_CATEGORIES, templateThumb, templateDims, projectFromTemplate, projectFromUserTemplate, listUserTemplates, deleteUserTemplate, type Template } from '../templates';
import type { UserTemplate } from '../lib/types';

export default function TemplatesView({ query }: { query: string }) {
  const [cat, setCat] = useState<string>('All');
  const [mine, setMine] = useState<UserTemplate[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => listUserTemplates().then(setMine);
  useEffect(() => {
    refresh();
  }, []);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => (cat === 'All' || t.category === cat) && (!q || `${t.name} ${t.category} ${t.tags}`.toLowerCase().includes(q)));
  }, [cat, query]);
  const mineFiltered = mine.filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()));

  const use = async (t: Template) => {
    setBusy(t.id);
    try {
      const p = await projectFromTemplate(t);
      navigate({ name: 'editor', id: p.id });
    } catch (e: any) {
      toast(e?.message ?? 'Could not open template', 'error');
      setBusy(null);
    }
  };

  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Templates</h2>
        <span className="faint">{TEMPLATES.length} original templates · every layer editable</span>
      </div>
      <div className="tabs">
        {['All', ...TEMPLATE_CATEGORIES, ...(mine.length ? ['My templates'] : [])].map((c) => (
          <button key={c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      {(cat === 'All' || cat === 'My templates') && mineFiltered.length > 0 && (
        <section className="section" style={{ marginTop: 10 }}>
          <div className="section-head">
            <h2>My templates</h2>
          </div>
          <div className="tpl-grid">
            {mineFiltered.map((t) => (
              <div key={t.id} className="tpl-card" role="button" tabIndex={0} onClick={async () => navigate({ name: 'editor', id: (await projectFromUserTemplate(t)).id })}>
                <div className="tpl-thumb">{t.thumbnail ? <img src={t.thumbnail} alt="" /> : null}</div>
                <div className="tpl-meta">
                  <b>{t.name}</b>
                  <button
                    className="icon-btn sm"
                    title="Delete template"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Delete template “${t.name}”?`)) return;
                      await deleteUserTemplate(t.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <small className="faint">
                  {t.width} × {t.height}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      {cat !== 'My templates' && (
        <div className="tpl-grid" style={{ marginTop: 10 }}>
          {list.map((t) => {
            const d = templateDims(t);
            return (
              <div key={t.id} className="tpl-card" role="button" tabIndex={0} onClick={() => !busy && use(t)} onKeyDown={(e) => e.key === 'Enter' && use(t)}>
                <div className="tpl-thumb">
                  <img src={templateThumb(t)} alt={t.name} loading="lazy" />
                  <span className="tpl-use">{busy === t.id ? <Loader2 size={14} className="spin" /> : 'Use template'}</span>
                </div>
                <div className="tpl-meta">
                  <b>{t.name}</b>
                </div>
                <small className="faint">
                  {t.category} · {d.width} × {d.height}
                  {t.pages.length > 1 ? ` · ${t.pages.length} pages` : ''}
                </small>
              </div>
            );
          })}
          {!list.length && <div className="empty">No templates match.</div>}
        </div>
      )}
    </>
  );
}
