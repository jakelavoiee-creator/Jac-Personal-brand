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

type Fmt = RasterFormat | 'svg' | 'pdf';

const FORMATS: { id: Fmt; label: string; note: string }[] = [
  { id: 'png', label: 'PNG', note: 'Best quality, supports transparency' },
  { id: 'jpeg', label: 'JPG', note: 'Small files for photos' },
  { id: 'webp', label: 'WEBP', note: 'Modern web format, transparency' },
  { id: 'svg', label: 'SVG', note: 'Scalable vector — shapes, graphics and text stay sharp at any size' },
  { id: 'pdf', label: 'PDF', note: 'Print-ready, multi-page, with optional bleed and crop marks' },
];

const MAX_PIXELS = 16384 * 16384 * 0.6; // conservative cross-browser canvas area budget

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const pageIndex = useEditor((s) => s.pageIndex);
  const [format, setFormat] = useState<Fmt>('png');
  const [scale, setScale] = useState(project.width * project.height > 12e6 ? 1 : 2);
  const [quality, setQuality] = useState(92);
  const [transparent, setTransparent] = useState(engine.page.background === null);
  const [pages, setPages] = useState<'current' | 'all' | 'pick'>(project.pages.length > 1 ? 'all' : 'current');
  const [picked, setPicked] = useState<Set<number>>(new Set([pageIndex]));
  const [outline, setOutline] = useState(true);
  const [pdfMode, setPdfMode] = useState<'vector' | 'raster'>('vector');
  const [dpi, setDpi] = useState(300);
  const [bleed, setBleed] = useState(false);
  const [marks, setMarks] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const raster = format === 'png' || format === 'jpeg' || format === 'webp';
  const w = Math.round(project.width * scale);
  const h = Math.round(project.height * scale);
  const tooBig = raster && w * h > MAX_PIXELS;
  const indices = pages === 'current' ? [pageIndex] : pages === 'all' ? project.pages.map((_, i) => i) : [...picked].sort((a, b) => a - b);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const docDpi = project.dpi ?? 96;
  const inches = `${(project.width / docDpi).toFixed(2)} × ${(project.height / docDpi).toFixed(2)} in`;

  const run = async () => {
    if (!indices.length) return;
    try {
      await engine.saveNow(); // ensures current page objects are serialized
      const name = slug(project.title);
      const sel = indices.map((i) => project.pages[i]);
      if (format === 'pdf') {
        const { exportPDF } = await import('../../lib/exportVector');
        setBusy('Preparing PDF…');
        const blob = await exportPDF(project, sel, { mode: pdfMode, dpi, bleedMM: bleed ? 3 : 0, cropMarks: marks }, (m) => setBusy(m));
        downloadBlob(blob, `${name}.pdf`);
        toast(`Exported ${sel.length}-page PDF`, 'success');
        onClose();
        return;
      }
      const files: { name: string; blob: Blob }[] = [];
      for (const [n, i] of indices.entries()) {
        setBusy(`Rendering page ${i + 1} (${n + 1}/${indices.length})…`);
        const fname = indices.length > 1 ? `${name}-page-${String(i + 1).padStart(2, '0')}.${ext}` : `${name}.${ext}`;
        if (format === 'svg') {
          const { pageToSVG } = await import('../../lib/exportVector');
          const svg = await pageToSVG(project, project.pages[i], { outlineText: outline });
          files.push({ name: fname, blob: new Blob([svg], { type: 'image/svg+xml' }) });
        } else {
          const { blob } = await renderPage(project, project.pages[i], { scale, format, quality: quality / 100, transparent: transparent && format !== 'jpeg' });
          files.push({ name: fname, blob });
        }
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

  const summary =
    format === 'pdf'
      ? `${inches}${bleed ? ' + 3 mm bleed' : ''} · ${indices.length} page${indices.length > 1 ? 's' : ''} → 1 PDF`
      : format === 'svg'
        ? `${project.width} × ${project.height} vector${indices.length > 1 ? ` · ${indices.length} pages → ZIP` : ''}`
        : `${w} × ${h} px${indices.length > 1 ? ` · ${indices.length} pages → ZIP` : ''}`;

  return (
    <Modal
      title="Export"
      onClose={onClose}
      footer={
        <>
          <span className="faint" style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 12 }}>
            {busy ?? summary}
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
            <button key={f.id} className={format === f.id ? 'on' : ''} title={f.note} onClick={() => setFormat(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <small className="faint">{FORMATS.find((f) => f.id === format)?.note}.</small>
      </div>

      {raster && (
        <>
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
        </>
      )}

      {format === 'svg' && (
        <div className="field">
          <span>Text</span>
          <div className="seg">
            <button className={outline ? 'on' : ''} onClick={() => setOutline(true)}>
              Outlined (exact)
            </button>
            <button className={!outline ? 'on' : ''} onClick={() => setOutline(false)}>
              Live text
            </button>
          </div>
          <small className="faint">
            {outline ? 'Glyphs become vector shapes — opens identically everywhere (Illustrator, Figma, browsers).' : 'Text stays editable and links its web fonts; apps without the fonts will substitute.'} Effects, shadows and blend modes are embedded as high-resolution images.
          </small>
        </div>
      )}

      {format === 'pdf' && (
        <>
          <div className="field">
            <span>Type</span>
            <div className="seg">
              <button className={pdfMode === 'vector' ? 'on' : ''} onClick={() => setPdfMode('vector')}>
                Vector
              </button>
              <button className={pdfMode === 'raster' ? 'on' : ''} onClick={() => setPdfMode('raster')}>
                High-res image
              </button>
            </div>
            <small className="faint">
              {pdfMode === 'vector' ? 'Shapes and outlined text stay vector (smallest, sharpest). Effects are embedded at the chosen DPI.' : 'Each page is one high-resolution image — every pixel exactly as on canvas.'}
            </small>
          </div>
          <div className="field">
            <span>Resolution</span>
            <div className="seg">
              {[150, 300, 600].map((d) => (
                <button key={d} className={dpi === d ? 'on' : ''} onClick={() => setDpi(d)}>
                  {d} DPI
                </button>
              ))}
            </div>
            <small className="faint">Page size {inches} (document set at {docDpi} DPI).</small>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="muted">Bleed (3 mm) — include artwork past the edge</span>
            <Toggle on={bleed} onChange={setBleed} />
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="muted">Crop marks</span>
            <Toggle on={marks} onChange={setMarks} />
          </div>
          <p className="faint" style={{ fontSize: 11.5, marginTop: -4 }}>RGB colour. Ask your printer whether they convert to CMYK — most do automatically.</p>
        </>
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
