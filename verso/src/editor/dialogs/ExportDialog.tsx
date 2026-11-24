import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { renderPage, type RasterFormat } from '../../lib/render';
import { makeZip } from '../../lib/zip';
import { downloadBlob } from '../../lib/download';
import { slug } from '../../lib/ids';
import { toast } from '../../store/app';
import { Modal, RangeField, Toggle } from '../../ui/controls';

const FORMATS: { id: RasterFormat | 'svg' | 'pdf'; label: string; note: string; soon?: boolean }[] = [
  { id: 'png', label: 'PNG', note: 'Best quality, supports transparency' },
  { id: 'jpeg', label: 'JPG', note: 'Small files for photos' },
  { id: 'webp', label: 'WEBP', note: 'Modern web format, transparency' },
  { id: 'svg', label: 'SVG', note: 'Vector — Stage 3', soon: true },
  { id: 'pdf', label: 'PDF', note: 'Print-ready — Stage 3', soon: true },
];

const MAX_PIXELS = 16384 * 16384 * 0.6; // conservative cross-browser canvas area budget

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const pageIndex = useEditor((s) => s.pageIndex);
  const [format, setFormat] = useState<RasterFormat>('png');
  const [scale, setScale] = useState(project.width * project.height > 12e6 ? 1 : 2);
  const [quality, setQuality] = useState(92);
  const [transparent, setTransparent] = useState(engine.page.background === null);
  const [pages, setPages] = useState<'current' | 'all' | 'pick'>('current');
  const [picked, setPicked] = useState<Set<number>>(new Set([pageIndex]));
  const [busy, setBusy] = useState<string | null>(null);

  const w = Math.round(project.width * scale);
  const h = Math.round(project.height * scale);
  const tooBig = w * h > MAX_PIXELS;
  const indices = pages === 'current' ? [pageIndex] : pages === 'all' ? project.pages.map((_, i) => i) : [...picked].sort((a, b) => a - b);
  const ext = format === 'jpeg' ? 'jpg' : format;

  const run = async () => {
    if (!indices.length) return;
    try {
      await engine.saveNow(); // ensures current page objects are serialized
      const name = slug(project.title);
      const files: { name: string; blob: Blob }[] = [];
      for (const [n, i] of indices.entries()) {
        setBusy(`Rendering page ${i + 1} (${n + 1}/${indices.length})…`);
        const { blob } = await renderPage(project, project.pages[i], { scale, format, quality: quality / 100, transparent: transparent && format !== 'jpeg' });
        files.push({ name: indices.length > 1 ? `${name}-page-${String(i + 1).padStart(2, '0')}.${ext}` : `${name}.${ext}`, blob });
      }
      if (files.length === 1) downloadBlob(files[0].blob, files[0].name);
      else {
        setBusy('Packaging ZIP…');
        downloadBlob(await makeZip(files), `${name}.zip`);
      }
      toast(`Exported ${files.length} ${ext.toUpperCase()} file${files.length > 1 ? 's' : ''}`, 'success');
      onClose();
    } catch (e: any) {
      console.error(e);
      toast(e?.message || 'Export failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      title="Export"
      onClose={onClose}
      footer={
        <>
          <span className="faint" style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 12 }}>
            {busy ?? `${w} × ${h} px${indices.length > 1 ? ` · ${indices.length} pages → ZIP` : ''}`}
          </span>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={run} disabled={!!busy || tooBig || !indices.length}>
            {busy ? <Loader2 size={14} className="spin" /> : <Download size={14} />} Download
          </button>
        </>
      }
    >
      <div className="field">
        <span>File type</span>
        <div className="seg">
          {FORMATS.map((f) => (
            <button key={f.id} className={format === f.id ? 'on' : ''} disabled={f.soon} title={f.note} style={f.soon ? { opacity: 0.4 } : undefined} onClick={() => !f.soon && setFormat(f.id as RasterFormat)}>
              {f.label}
            </button>
          ))}
        </div>
        <small className="faint">{FORMATS.find((f) => f.id === format)?.note}. SVG & PDF export ship in Stage 3.</small>
      </div>
      <div className="field">
        <span>Size</span>
        <div className="seg">
          {[0.5, 1, 2, 3, 4].map((s) => (
            <button key={s} className={scale === s ? 'on' : ''} onClick={() => setScale(s)}>
              {s}×
            </button>
          ))}
        </div>
        <small className={tooBig ? '' : 'faint'} style={tooBig ? { color: 'var(--danger)' } : undefined}>
          {w} × {h} px{project.dpi ? ` · ${Math.round(project.dpi * scale)} DPI at print size` : ''}
          {tooBig ? ' — too large for a browser canvas; choose a smaller size.' : ''}
        </small>
      </div>
      {format !== 'png' && (
        <div className="field">
          <span>Quality</span>
          <RangeField value={quality} min={10} max={100} unit="%" onChange={(v) => setQuality(v)} />
        </div>
      )}
      {format !== 'jpeg' && (
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="muted">Transparent background</span>
          <Toggle on={transparent} onChange={setTransparent} />
        </div>
      )}
      {project.pages.length > 1 && (
        <div className="field">
          <span>Pages</span>
          <div className="seg">
            <button className={pages === 'current' ? 'on' : ''} onClick={() => setPages('current')}>
              Current page
            </button>
            <button className={pages === 'all' ? 'on' : ''} onClick={() => setPages('all')}>
              All {project.pages.length}
            </button>
            <button className={pages === 'pick' ? 'on' : ''} onClick={() => setPages('pick')}>
              Choose…
            </button>
          </div>
          {pages === 'pick' && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {project.pages.map((_, i) => (
                <button
                  key={i}
                  className={`tab ${picked.has(i) ? 'on' : ''}`}
                  onClick={() => {
                    const n = new Set(picked);
                    n.has(i) ? n.delete(i) : n.add(i);
                    setPicked(n);
                  }}
                >
                  Page {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
