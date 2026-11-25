import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useEngine } from '../Editor';
import { importStock, searchStock, type StockPhoto, type StockProvider } from '../../lib/stock';
import { toast } from '../../store/app';

const SUGGEST = ['texture', 'coffee', 'architecture', 'flowers', 'portrait', 'ocean', 'city night', 'vintage car'];

export default function PhotosPanel() {
  const engine = useEngine();
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState<StockProvider>('openverse');
  const [results, setResults] = useState<StockPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const run = async (query = q, prov = provider, pg = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await searchStock(prov, query, pg);
      setResults((cur) => (pg === 1 ? r : [...cur, ...r]));
      setPage(pg);
      if (!r.length && pg === 1) setError('No commercially usable photos found — try other words.');
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const add = async (p: StockPhoto) => {
    setAdding(p.id);
    try {
      const a = await importStock(p);
      await engine.addAsset(a);
      toast(`Added — ${p.license} by ${p.author}. Credit is saved with the image.`, 'success');
    } catch (e: any) {
      toast(e?.message ?? 'Download failed', 'error');
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <form
        className="search"
        style={{ marginBottom: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <Search size={14} />
        <input placeholder="Search free photos" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ height: 32 }} />
      </form>
      <div className="seg" style={{ marginBottom: 8 }}>
        {(['openverse', 'wikimedia'] as const).map((p) => (
          <button key={p} className={provider === p ? 'on' : ''} onClick={() => (setProvider(p), q && run(q, p))}>
            {p === 'openverse' ? 'Openverse' : 'Wikimedia'}
          </button>
        ))}
      </div>
      {!results.length && !loading && (
        <div className="row" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {SUGGEST.map((s) => (
            <button key={s} className="tab" onClick={() => (setQ(s), run(s))}>
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="faint" style={{ fontSize: 12 }}>{error}</p>}
      <div className="photo-grid">
        {results.map((p) => (
          <button key={p.id} className="photo" onClick={() => add(p)} disabled={!!adding} title={`${p.title}\n${p.author} · ${p.license}`}>
            <img src={p.thumb} alt={p.title} loading="lazy" referrerPolicy="no-referrer" />
            <span className="photo-credit">{adding === p.id ? 'Adding…' : `${p.author} · ${p.license}`}</span>
          </button>
        ))}
      </div>
      {loading && (
        <p className="faint" style={{ fontSize: 12 }}>
          <Loader2 size={12} className="spin" /> Searching…
        </p>
      )}
      {results.length > 0 && !loading && (
        <button className="btn ghost block sm" onClick={() => run(q, provider, page + 1)}>
          Load more
        </button>
      )}
      <p className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>
        Only licences that allow commercial use (CC0, public domain, CC BY, CC BY-SA). CC BY / BY-SA require crediting the author — the credit is saved with each photo (Properties → Photo credit). With a photo frame selected, clicking a photo fills it.
      </p>
    </>
  );
}
