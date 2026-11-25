import { useState } from 'react';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RESIZE_PRESETS } from '../../lib/formats';
import { Modal, NumberField } from '../../ui/controls';
import { navigate, toast } from '../../store/app';
import { putProject } from '../../lib/db';
import { uid } from '../../lib/ids';
import { renderThumb } from '../../lib/render';
import type { Project } from '../../lib/types';

type Mode = 'smart' | 'scale' | 'keep';

export default function ResizeDialog({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const [sizes, setSizes] = useState<{ name: string; width: number; height: number }[]>([]);
  const [cw, setCw] = useState(project.width);
  const [ch, setCh] = useState(project.height);
  const [mode, setMode] = useState<Mode>('smart');
  const [asCopy, setAsCopy] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [made, setMade] = useState<Project[]>([]);

  const toggle = (p: { name: string; width: number; height: number }) =>
    setSizes((cur) => (cur.some((x) => x.name === p.name) ? cur.filter((x) => x.name !== p.name) : asCopy ? [...cur, p] : [p]));
  const custom = { name: `Custom ${cw}×${ch}`, width: cw, height: ch };
  const targets = sizes.length ? sizes : [custom];
  const validCustom = cw >= 16 && ch >= 16 && cw <= 16000 && ch <= 16000;

  const run = async () => {
    try {
      if (!asCopy) {
        setBusy('Resizing…');
        await engine.resizeDocument(targets[0].width, targets[0].height, mode);
        toast(`Resized to ${targets[0].width} × ${targets[0].height}`, 'success');
        onClose();
        return;
      }
      await engine.saveNow();
      const src = engine.project;
      const { smartResizePages } = await import('../../lib/smartResize');
      const out: Project[] = [];
      for (const t of targets) {
        setBusy(`Creating ${t.name}…`);
        let pages = structuredClone(src.pages);
        if (mode === 'smart') pages = await smartResizePages(pages, src.width, src.height, t.width, t.height);
        else {
          const s = mode === 'scale' ? Math.min(t.width / src.width, t.height / src.height) : 1;
          const dx = (t.width - src.width * s) / 2;
          const dy = (t.height - src.height * s) / 2;
          pages = pages.map((pg) => ({ ...pg, thumb: undefined, objects: pg.objects.map((o) => ({ ...o, left: o.left * s + dx, top: o.top * s + dy, scaleX: (o.scaleX ?? 1) * s, scaleY: (o.scaleY ?? 1) * s })) }));
        }
        pages = pages.map((pg) => ({ ...pg, id: uid('pg_') }));
        const now = Date.now();
        const p: Project = {
          ...structuredClone(src),
          id: uid('p_'),
          title: `${src.title} — ${t.name}`,
          width: t.width,
          height: t.height,
          dpi: undefined,
          pages,
          favorite: false,
          trashedAt: null,
          createdAt: now,
          updatedAt: now,
          guides: { v: [], h: [] },
        };
        try {
          p.pages[0].thumb = await renderThumb(p, p.pages[0], 320);
          p.thumbnail = p.pages[0].thumb;
        } catch {
          /* thumbnail is regenerated when opened */
        }
        await putProject(p);
        out.push(p);
      }
      setMade(out);
      toast(`Created ${out.length} resized cop${out.length > 1 ? 'ies' : 'y'} — your original is unchanged`, 'success');
    } catch (e: any) {
      console.error(e);
      toast(e?.message ?? 'Resize failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (made.length)
    return (
      <Modal
        title="Resized copies ready"
        onClose={onClose}
        footer={
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        }
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Your original stays as it is. Open a copy to fine-tune it:
        </p>
        <div style={{ display: 'grid', gap: 6 }}>
          {made.map((p) => (
            <button key={p.id} className="btn block" style={{ justifyContent: 'flex-start', height: 54 }} onClick={() => navigate({ name: 'editor', id: p.id })}>
              {p.thumbnail && <img src={p.thumbnail} alt="" style={{ height: 40, maxWidth: 70, objectFit: 'contain' }} />}
              <span style={{ flex: 1, textAlign: 'left' }}>
                {p.title}
                <small className="faint" style={{ display: 'block' }}>
                  {p.width} × {p.height}
                </small>
              </span>
              <ExternalLink size={14} />
            </button>
          ))}
        </div>
      </Modal>
    );

  return (
    <Modal
      title="Resize design"
      onClose={onClose}
      footer={
        <>
          <span className="faint" style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 12 }}>
            {busy ?? (asCopy ? `${targets.length} new design${targets.length > 1 ? 's' : ''}` : 'Changes this design')}
          </span>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!!busy || (!sizes.length && !validCustom)} onClick={run}>
            {busy && <Loader2 size={14} className="spin" />}
            {asCopy ? `Create ${targets.length > 1 ? `${targets.length} copies` : 'copy'}` : 'Resize this design'}
          </button>
        </>
      }
    >
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={asCopy ? 'on' : ''} onClick={() => setAsCopy(true)}>
          Create resized copies
        </button>
        <button className={!asCopy ? 'on' : ''} onClick={() => (setAsCopy(false), setSizes((s) => s.slice(0, 1)))}>
          Resize this design
        </button>
      </div>
      <div className="field">
        <span>{asCopy ? 'Formats — pick as many as you like' : 'Format'}</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {RESIZE_PRESETS.map((p) => {
            const on = sizes.some((x) => x.name === p.name);
            return (
              <button key={p.name} className={`tab ${on ? 'on' : ''}`} onClick={() => toggle(p)} title={`${p.width} × ${p.height}`}>
                {on && <Check size={11} style={{ marginRight: 4, verticalAlign: -1 }} />}
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
      {!sizes.length && (
        <div className="grid2" style={{ marginBottom: 14 }}>
          <NumberField label="W" unit="px" value={cw} min={16} max={16000} onChange={(v) => setCw(Math.round(v))} />
          <NumberField label="H" unit="px" value={ch} min={16} max={16000} onChange={(v) => setCh(Math.round(v))} />
        </div>
      )}
      <div className="field">
        <span>Layout</span>
        <div className="seg">
          <button className={mode === 'smart' ? 'on' : ''} onClick={() => setMode('smart')}>
            Smart
          </button>
          <button className={mode === 'scale' ? 'on' : ''} onClick={() => setMode('scale')}>
            Scale to fit
          </button>
          <button className={mode === 'keep' ? 'on' : ''} onClick={() => setMode('keep')}>
            Keep size
          </button>
        </div>
        <small className="faint">
          {mode === 'smart'
            ? 'Backgrounds re-cover the page, bands stretch, edge pieces stay pinned, and the main content is re-fitted as a group — nothing is stretched.'
            : mode === 'scale'
              ? 'The whole composition scales uniformly and is centred.'
              : 'Elements keep their size; the composition is re-centred.'}
        </small>
      </div>
    </Modal>
  );
}
