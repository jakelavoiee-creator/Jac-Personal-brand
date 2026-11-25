/**
 * Mockups panel — live Tapstitch garment previews.
 *  • Garment projects: every piece rendered with its page artwork, colour and
 *    fabric realism; downloads for mockups and per-placement print files.
 *  • Any other design: try the current page on any Tapstitch garment.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileArchive, KeyRound, Loader2, Package, Search, Shirt } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { RangeField } from '../../ui/controls';
import { GARMENT_SCALE, hasInk, printFile, renderPiece, createGarmentProject } from '../../lib/garment';
import { catalog, defaultTechnique, designAreas, hasTapstitch, type TsCatalog, type TsProduct } from '../../lib/tapstitch';
import { downloadBlob } from '../../lib/download';
import { makeZip } from '../../lib/zip';
import { navigate, toast } from '../../store/app';
import { putProject } from '../../lib/db';

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Export failed'))), 'image/png'));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function MockupsPanel({ onPerspective }: { onPerspective?: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project);
  if (!project) return null;
  return (
    <div className="mockups-panel">
      {project.garment ? <GarmentMockups /> : <TryOn />}
      <div className="mk-other">
        <h6 className="ai-h">
          <Package size={12} /> Packaging, posters, bags & your photos
        </h6>
        <button className="ai-tool" onClick={() => (onPerspective ? onPerspective() : useEditor.setState({ perspective: true }))} data-testid="open-perspective">
          <Package size={16} />
          <span>
            <b>Place on a photo</b>
            <small>Your own product or scene photo — 4-corner perspective, lighting blend</small>
          </span>
          <i className="tag local">Free</i>
        </button>
      </div>
    </div>
  );
  void engine;
}

/* ---------------- garment project ---------------- */

function GarmentMockups() {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const pageIndex = useEditor((s) => s.pageIndex);
  const objVersion = useEditor((s) => s.objVersion);
  const g = project.garment!;
  const [shots, setShots] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const timer = useRef(0);

  const pieces = project.pages.map((p, i) => ({ page: p, i, area: g.catalog.print_areas.find((a) => a.piece === g.pages[p.id]) })).filter((x) => x.area);
  const current = pieces.find((x) => x.i === pageIndex) ?? pieces[0];

  // re-render mockups shortly after edits, colour or realism changes
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const next: Record<string, string> = {};
      for (const x of pieces) {
        const art = await engine.pageCanvas(x.i, 1400 / project.width);
        const c = await renderPiece(g.catalog, x.area!.piece, g.colorId, { kind: 'page', image: art }, { size: x.i === current?.i ? 900 : 320, realism: g.realism });
        next[x.page.id] = c.toDataURL('image/jpeg', 0.88);
      }
      setShots(next);
    }, 450);
    return () => window.clearTimeout(timer.current);
  }, [objVersion, g.colorId, g.realism, pageIndex, project.pages.length]);  

  const mockupBlob = async (i: number, piece: string, size = 2000) => {
    const art = await engine.pageCanvas(i, size / project.width);
    return toBlob(await renderPiece(g.catalog, piece, g.colorId, { kind: 'page', image: art }, { size, realism: g.realism }));
  };
  const color = g.catalog.colors.find((c) => c.id === g.colorId);
  const base = `${slug(g.title)}-${slug(color?.name ?? '')}`;

  const download = async (all: boolean) => {
    setBusy(all ? 'Preparing mockups and print files…' : 'Rendering mockup…');
    try {
      if (!all) {
        downloadBlob(await mockupBlob(current!.i, current!.area!.piece), `${base}-${current!.area!.piece}-mockup.png`);
      } else {
        const files: { name: string; blob: Blob }[] = [];
        let empty = 0;
        for (const x of pieces) {
          files.push({ name: `mockups/${base}-${x.area!.piece}.png`, blob: await mockupBlob(x.i, x.area!.piece) });
          const page = await engine.pageCanvas(x.i, 1);
          const k = project.width / g.catalog.canvas.width;
          for (const pl of x.area!.placements) {
            if (!hasInk(page, pl, k)) {
              empty++;
              continue;
            }
            files.push({ name: `print-files/${x.area!.piece}-${pl.id}.png`, blob: await toBlob(printFile(page, pl, k)) });
          }
        }
        files.push({ name: 'README.txt', blob: new Blob([`${g.title} (${g.styleCode}) — ${color?.name} — ${g.technique}\nTapstitch product: ${g.productId}\n\nprint-files/: one transparent PNG per printed placement, ${GARMENT_SCALE}× the Tapstitch design-area size. Upload these to Tapstitch for production.\nmockups/: previews made in Aura Studio from Tapstitch mockup layers.\n${empty ? `\n${empty} empty placement(s) skipped.` : ''}`], { type: 'text/plain' }) });
        downloadBlob(await makeZip(files), `${base}-mockups-and-print-files.zip`);
        toast(`Exported ${files.filter((f) => f.name.startsWith('print')).length} print file(s) and ${pieces.length} mockup(s)`, 'success');
      }
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="garment-mockups">
      <div className="mk-head">
        <Shirt size={14} />
        <div>
          <b>{g.title}</b>
          <span className="faint small">
            {g.styleCode} · {g.technique} · Tapstitch
          </span>
        </div>
      </div>
      <div className="mk-main" data-testid="mockup-main">
        {current && shots[current.page.id] ? <img src={shots[current.page.id]} alt="Mockup" /> : <Loader2 size={18} className="spin" />}
      </div>
      <div className="mk-pieces">
        {pieces.map((x) => (
          <button key={x.page.id} className={x.i === pageIndex ? 'on' : ''} onClick={() => engine.gotoPage(x.i)} title={x.area!.title}>
            {shots[x.page.id] ? <img src={shots[x.page.id]} alt="" /> : <span />}
            <small>{x.area!.title}</small>
          </button>
        ))}
      </div>
      <div className="field">
        <span>Colour · {color?.name}</span>
        <div className="swatches">
          {g.catalog.colors.map((c) => (
            <button key={c.id} className={`sw ${g.colorId === c.id ? 'on' : ''}`} style={{ background: c.value }} title={c.name} onClick={() => engine.setGarment({ colorId: c.id })} data-testid="garment-color" />
          ))}
        </div>
      </div>
      <div className="prop-row">
        <span>Fabric realism</span>
        <RangeField value={Math.round(g.realism * 100)} min={0} max={100} onChange={(v) => engine.setGarment({ realism: v / 100 })} unit="%" />
      </div>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm" style={{ flex: 1 }} disabled={!!busy} onClick={() => download(false)} data-testid="download-mockup">
          <Download size={13} /> Mockup PNG
        </button>
        <button className="btn sm primary" style={{ flex: 1.4 }} disabled={!!busy} onClick={() => download(true)} data-testid="download-all">
          <FileArchive size={13} /> Mockups + print files
        </button>
      </div>
      {busy && (
        <p className="faint small">
          <Loader2 size={12} className="spin" /> {busy}
        </p>
      )}
      <p className="faint small">Design inside the dashed print areas — anything outside them isn’t printed. Print files are cut per placement at {GARMENT_SCALE}× Tapstitch’s design-area size.</p>
    </div>
  );
}

/* ---------------- try any design on a garment ---------------- */

function TryOn() {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const pageIndex = useEditor((s) => s.pageIndex);
  const objVersion = useEditor((s) => s.objVersion);
  const [items, setItems] = useState<TsProduct[] | null>(null);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<TsProduct | null>(null);
  const [cat, setCat] = useState<TsCatalog | null>(null);
  const [color, setColor] = useState('');
  const [piece, setPiece] = useState('');
  const [placement, setPlacement] = useState('');
  const [scale, setScale] = useState(1);
  const [dy, setDy] = useState(0);
  const [shot, setShot] = useState('');
  const [error, setError] = useState('');
  const keyed = hasTapstitch();

  useEffect(() => {
    if (keyed) catalog().then(setItems).catch((e) => setError(e.message));
  }, [keyed]);

  useEffect(() => {
    if (!pick) return;
    setCat(null);
    setShot('');
    designAreas(pick.id, defaultTechnique(pick))
      .then((c) => {
        setCat(c);
        setColor(c.colors[0].id);
        setPiece(c.print_areas[0].piece);
        setPlacement(c.print_areas[0].placements[0].id);
      })
      .catch((e) => setError(e.message));
  }, [pick]);

  useEffect(() => {
    if (!cat || !piece) return;
    let dead = false;
    (async () => {
      const art = await engine.pageCanvas(pageIndex, Math.min(1, 1600 / Math.max(project.width, project.height)));
      const c = await renderPiece(cat, piece, color, { kind: 'fit', image: art, scale, dy }, { size: 900, placements: [placement] });
      if (!dead) setShot(c.toDataURL('image/jpeg', 0.88));
    })().catch((e) => setError(e.message));
    return () => {
      dead = true;
    };
  }, [cat, piece, color, placement, scale, dy, objVersion, pageIndex]);  

  const results = useMemo(() => {
    const w = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (items ?? []).filter((p) => w.every((x) => p.title.toLowerCase().includes(x))).slice(0, 24);
  }, [items, q]);

  const download = async () => {
    if (!cat) return;
    const art = await engine.pageCanvas(pageIndex, Math.min(2, 3000 / Math.max(project.width, project.height)));
    const c = await renderPiece(cat, piece, color, { kind: 'fit', image: art, scale, dy }, { size: 2000, placements: [placement] });
    downloadBlob(await toBlob(c), `${slug(project.title)}-on-${slug(pick!.title)}.png`);
  };

  /** Start a garment project with this design placed in the chosen print area. */
  const toGarment = async () => {
    if (!cat || !pick) return;
    const gp = await createGarmentProject(pick, cat, color);
    const area = cat.print_areas.find((a) => a.piece === piece)!;
    const pl = area.placements.find((p) => p.id === placement)!;
    const k = gp.width / cat.canvas.width;
    const art = await engine.pageCanvas(pageIndex, Math.min(2, 3000 / Math.max(project.width, project.height)));
    const blob = await toBlob(art);
    const { importFile } = await import('../../lib/assets');
    const asset = await importFile(new File([blob], `${project.title}.png`, { type: 'image/png' }));
    const b = pl.design_area;
    const s = (Math.min((b.width * k) / art.width, (b.height * k) / art.height) * scale);
    const page = gp.pages[cat.print_areas.indexOf(area)];
    page.objects = [
      { type: 'Image', version: '7', src: '', assetId: asset.id, name: project.title, originX: 'center', originY: 'center', left: (b.left + b.width / 2) * k, top: (b.top + b.height / 2 + dy * b.height) * k, scaleX: s, scaleY: s, angle: b.angle || 0, width: art.width, height: art.height, id: `o_${Date.now().toString(36)}` },
    ];
    await putProject(gp);
    navigate({ name: 'editor', id: gp.id });
  };

  if (!keyed)
    return (
      <div className="ai-key-note">
        <KeyRound size={14} />
        <span>
          Connect <b>Tapstitch</b> in Settings to preview designs on 1,400+ real garments (free with a Tapstitch account).
        </span>
      </div>
    );

  return (
    <div className="tryon">
      <h6 className="ai-h">
        <Shirt size={12} /> Try this design on a Tapstitch garment
      </h6>
      {!pick ? (
        <>
          <div className="search-sm">
            <Search size={13} />
            <input className="input" placeholder="Search garments…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} data-testid="tryon-search" />
          </div>
          {!items && !error && (
            <p className="faint small">
              <Loader2 size={12} className="spin" /> Loading catalogue…
            </p>
          )}
          <div className="tryon-grid">
            {results.map((p) => (
              <button key={p.id} onClick={() => setPick(p)} title={p.title} data-testid="tryon-product">
                {p.main_image && <img src={p.main_image.url} alt="" loading="lazy" />}
                <small>{p.title}</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b className="small">{pick.title}</b>
            <button className="btn sm ghost" onClick={() => setPick(null)}>
              Change
            </button>
          </div>
          <div className="mk-main" data-testid="tryon-preview">
            {shot ? <img src={shot} alt="Preview" /> : <Loader2 size={18} className="spin" />}
          </div>
          {cat && (
            <>
              <div className="seg compact">
                {cat.print_areas.map((a) => (
                  <button key={a.piece} className={piece === a.piece ? 'on' : ''} onClick={() => (setPiece(a.piece), setPlacement(a.placements[0].id))}>
                    {a.title}
                  </button>
                ))}
              </div>
              <select className="select" value={placement} onChange={(e) => setPlacement(e.target.value)}>
                {cat.print_areas
                  .find((a) => a.piece === piece)
                  ?.placements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
              <div className="swatches">
                {cat.colors.map((c) => (
                  <button key={c.id} className={`sw ${color === c.id ? 'on' : ''}`} style={{ background: c.value }} title={c.name} onClick={() => setColor(c.id)} />
                ))}
              </div>
              <div className="prop-row">
                <span>Size</span>
                <RangeField value={Math.round(scale * 100)} min={20} max={100} onChange={(v) => setScale(v / 100)} unit="%" />
              </div>
              <div className="prop-row">
                <span>Height</span>
                <RangeField value={Math.round(dy * 100)} min={-40} max={40} onChange={(v) => setDy(v / 100)} unit="%" />
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm" style={{ flex: 1 }} onClick={download}>
                  <Download size={13} /> Mockup
                </button>
                <button className="btn sm primary" style={{ flex: 1.3 }} onClick={toGarment} data-testid="tryon-to-garment">
                  <Shirt size={13} /> Make garment design
                </button>
              </div>
            </>
          )}
        </>
      )}
      {error && <p className="err small">{error}</p>}
    </div>
  );
}
