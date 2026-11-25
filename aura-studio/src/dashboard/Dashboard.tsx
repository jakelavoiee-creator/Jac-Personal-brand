import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Copy,
  FolderInput,
  FolderPlus,
  Heart,
  Home as HomeIcon,
  Image as ImageIcon,
  LayoutTemplate,
  Compass,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shapes,
  Star,
  Trash2,
  Upload,
  FileUp,
  Folder as FolderIcon,
  X,
} from 'lucide-react';
import { navigate, toast, type Route } from '../store/app';
import { CATEGORIES, FORMATS, type Format } from '../lib/formats';
import {
  deleteAsset,
  deleteFolder,
  deleteProject,
  listAssets,
  listFolders,
  listProjects,
  putAsset,
  putFolder,
  putProject,
} from '../lib/db';
import { createProject, duplicateProject } from '../lib/projects';
import { ACCEPTED_UPLOADS, assetURL, forgetAssetURL, importFile } from '../lib/assets';
import { importProjectFile } from '../lib/portable';
import { pickFiles } from '../lib/download';
import { timeAgo, uid } from '../lib/ids';
import type { Asset, Folder, Project } from '../lib/types';
import { Modal, PopMenu, type MenuItem } from '../ui/controls';
import SettingsView from './Settings';
import BrandsView from './Brands';
import TemplatesView from './Templates';
import DiscoverView from './Discover';
import { TEMPLATES, templateThumb, projectFromTemplate } from '../templates';

const NAV: { id: Route['name']; label: string; icon: any; stage?: string }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'projects', label: 'Projects', icon: Shapes },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'ai', label: 'AI Studio', icon: Bot, stage: 'S4' },
  { id: 'brands', label: 'Brand Kits', icon: Palette },
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function Dashboard({ route }: { route: Route }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const refresh = useCallback(async () => {
    const [p, f] = await Promise.all([listProjects(), listFolders('project')]);
    setProjects(p);
    setFolders(f);
    setLoaded(true);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh, route.name]);

  const open = (p: Project) => navigate({ name: 'editor', id: p.id });

  const createFrom = async (f: Format) => {
    const p = await createProject({ title: f.name, width: f.width, height: f.height, transparent: f.transparent, pages: f.pages, format: f, dpi: f.dpi });
    open(p);
  };

  const uploadMedia = async (files?: File[]) => {
    const list = files ?? (await pickFiles(ACCEPTED_UPLOADS));
    let ok = 0;
    for (const f of list) {
      try {
        await importFile(f);
        ok++;
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
    if (ok) {
      toast(`${ok} file${ok > 1 ? 's' : ''} added to Assets`, 'success');
      navigate({ name: 'assets' });
    }
  };

  const importProject = async () => {
    const [f] = await pickFiles('.json,application/json', false);
    if (!f) return;
    try {
      const p = await importProjectFile(f);
      toast(`Imported “${p.title}”`, 'success');
      refresh();
    } catch (e: any) {
      toast(e.message || 'Import failed', 'error');
    }
  };

  // Drop files anywhere on the dashboard to upload them
  useEffect(() => {
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      depth++;
      setDragging(true);
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) uploadMedia(files);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const live = projects.filter((p) => !p.trashedAt);
  const q = query.trim().toLowerCase();
  const searched = q ? live.filter((p) => p.title.toLowerCase().includes(q)) : live;

  let body: React.ReactNode;
  switch (route.name) {
    case 'home':
      body = (
        <Home
          query={q}
          projects={searched}
          onOpen={open}
          onCreate={createFrom}
          onCustom={() => setNewOpen(true)}
          onUpload={() => uploadMedia()}
          onImport={importProject}
          refresh={refresh}
          folders={folders}
          loaded={loaded}
        />
      );
      break;
    case 'projects':
      body = <ProjectsView title="Projects" projects={searched} folders={folders} onOpen={open} refresh={refresh} showFolders onNew={() => setNewOpen(true)} />;
      break;
    case 'favorites':
      body = <ProjectsView title="Favorites" projects={searched.filter((p) => p.favorite)} folders={folders} onOpen={open} refresh={refresh} emptyText="Star a design to pin it here." />;
      break;
    case 'trash':
      body = <TrashView projects={projects.filter((p) => p.trashedAt)} refresh={refresh} />;
      break;
    case 'assets':
      body = <AssetsView query={q} onUpload={() => uploadMedia()} />;
      break;
    case 'settings':
      body = <SettingsView />;
      break;
    case 'brands':
      body = <BrandsView />;
      break;
    case 'templates':
      body = <TemplatesView query={q} />;
      break;
    case 'discover':
      body = <DiscoverView />;
      break;
    default:
      body = <Roadmap kind={route.name} />;
  }

  return (
    <div className="dash">
      <nav className="dash-nav">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-name">
            AURA<small>Creative Studio</small>
          </div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav-item ${route.name === n.id ? 'on' : ''}`} onClick={() => navigate({ name: n.id } as Route)}>
            <n.icon size={16} />
            {n.label}
            {n.stage && <span className="tag soon">{n.stage}</span>}
          </button>
        ))}
        <div className="nav-sep" />
        <button className={`nav-item ${route.name === 'settings' ? 'on' : ''}`} onClick={() => navigate({ name: 'settings' })}>
          <Settings size={16} />
          Settings
        </button>
      </nav>
      <main className="dash-main">
        <div className="dash-inner">
          <div className="dash-top">
            <div className="search">
              <Search size={15} />
              <input placeholder="Search your designs" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={() => uploadMedia()}>
              <Upload size={14} /> Upload
            </button>
            <button className="btn primary" onClick={() => setNewOpen(true)}>
              <Plus size={15} /> Create design
            </button>
          </div>
          {body}
        </div>
      </main>
      {newOpen && <NewDesignDialog onClose={() => setNewOpen(false)} onCreate={async (o) => open(await createProject(o))} />}
      {dragging && <div className="drop-hint">Drop to upload to Assets</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FormatShape({ f, size = 56 }: { f: Pick<Format, 'width' | 'height' | 'transparent'>; size?: number }) {
  const r = f.width / f.height;
  const w = r >= 1 ? size : size * r;
  const h = r >= 1 ? size / r : size;
  return (
    <div className="format-shape">
      <div className={f.transparent ? 't' : ''} style={{ width: w, height: h }} />
    </div>
  );
}

function Home(props: {
  query: string;
  projects: Project[];
  folders: Folder[];
  onOpen: (p: Project) => void;
  onCreate: (f: Format) => void;
  onCustom: () => void;
  onUpload: () => void;
  onImport: () => void;
  refresh: () => void;
  loaded: boolean;
}) {
  const [cat, setCat] = useState<Format['category']>('social');
  const recent = props.projects.slice(0, 8);
  const favs = props.projects.filter((p) => p.favorite).slice(0, 8);
  return (
    <>
      {!props.query && (
        <div className="hero">
          <div className="faint" style={{ fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Aura Studio
          </div>
          <h1>What are we making today?</h1>
          <p>Typography, apparel, social, print — one workspace. Everything saves locally in your browser.</p>
          <div className="quick">
            <button className="btn primary" onClick={props.onCustom}>
              <Plus size={15} /> Custom size
            </button>
            <button className="btn" onClick={props.onUpload}>
              <Upload size={14} /> Upload media
            </button>
            <button className="btn" onClick={props.onImport}>
              <FileUp size={14} /> Import project file
            </button>
          </div>
        </div>
      )}

      {!props.query && (
        <section className="section">
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`tab ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="formats">
            {FORMATS.filter((f) => f.category === cat).map((f) => (
              <button key={f.id} className="format" onClick={() => props.onCreate(f)} title={`${f.width} × ${f.height} px`}>
                <FormatShape f={f} />
                <div>
                  <b>{f.name}</b>
                  <small>
                    {f.width} × {f.height}
                    {f.note ? ` · ${f.note}` : ''}
                  </small>
                </div>
              </button>
            ))}
            {cat === 'custom' && (
              <button className="format" onClick={props.onCustom}>
                <div className="format-shape">
                  <Plus size={22} color="#888" />
                </div>
                <div>
                  <b>Custom dimensions</b>
                  <small>px · in · mm · cm</small>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {!props.query && <TemplateTeaser />}

      <section className="section">
        <div className="section-head">
          <h2>{props.query ? `Results for “${props.query}”` : 'Recent designs'}</h2>
          {!props.query && props.projects.length > 8 && (
            <button className="btn ghost sm" onClick={() => navigate({ name: 'projects' })}>
              View all
            </button>
          )}
        </div>
        {props.loaded && !recent.length ? (
          <div className="empty">
            <b>{props.query ? 'No designs match.' : 'No designs yet.'}</b>
            {props.query ? 'Try another search.' : 'Pick a format above to start your first design.'}
          </div>
        ) : (
          <ProjectGrid projects={props.query ? props.projects : recent} folders={props.folders} onOpen={props.onOpen} refresh={props.refresh} />
        )}
      </section>

      {!props.query && favs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Favorites</h2>
          </div>
          <ProjectGrid projects={favs} folders={props.folders} onOpen={props.onOpen} refresh={props.refresh} />
        </section>
      )}
    </>
  );
}

function ProjectGrid(props: { projects: Project[]; folders: Folder[]; onOpen: (p: Project) => void; refresh: () => void }) {
  const [menu, setMenu] = useState<{ x: number; y: number; p: Project } | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [moving, setMoving] = useState<Project | null>(null);

  const update = async (p: Project, patch: Partial<Project>) => {
    await putProject({ ...p, ...patch });
    props.refresh();
  };

  const items = (p: Project): MenuItem[] => [
    { label: 'Open', icon: <Pencil size={14} />, onClick: () => props.onOpen(p) },
    { label: 'Rename', icon: <Pencil size={14} />, onClick: () => setRenaming(p) },
    {
      label: 'Duplicate',
      icon: <Copy size={14} />,
      onClick: async () => {
        await duplicateProject(p.id);
        props.refresh();
        toast('Design duplicated', 'success');
      },
    },
    { label: p.favorite ? 'Remove from favorites' : 'Add to favorites', icon: <Star size={14} />, onClick: () => update(p, { favorite: !p.favorite }) },
    { label: 'Move to folder…', icon: <FolderInput size={14} />, onClick: () => setMoving(p) },
    {
      label: 'Save as template',
      icon: <LayoutTemplate size={14} />,
      onClick: async () => {
        const { saveProjectAsTemplate } = await import('../templates');
        await saveProjectAsTemplate(p, p.title);
        toast(`Saved “${p.title}” to My templates`, 'success');
      },
    },
    { sep: true },
    {
      label: 'Move to trash',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: async () => {
        await update(p, { trashedAt: Date.now() });
        toast('Moved to trash');
      },
    },
  ];

  return (
    <>
      <div className="cards">
        {props.projects.map((p) => (
          <div
            key={p.id}
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => props.onOpen(p)}
            onKeyDown={(e) => e.key === 'Enter' && props.onOpen(p)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, p });
            }}
          >
            <div className="card-thumb">{p.thumbnail ? <img src={p.thumbnail} alt="" /> : <FormatShape f={{ width: p.width, height: p.height }} size={80} />}</div>
            <button
              className={`icon-btn sm fav ${p.favorite ? 'on' : ''}`}
              title={p.favorite ? 'Unfavorite' : 'Favorite'}
              onClick={(e) => {
                e.stopPropagation();
                update(p, { favorite: !p.favorite });
              }}
            >
              <Star size={14} fill={p.favorite ? 'currentColor' : 'none'} />
            </button>
            <div className="card-meta">
              <div style={{ minWidth: 0 }}>
                <b>{p.title}</b>
                <small>
                  {p.width}×{p.height} · {p.pages.length > 1 ? `${p.pages.length} pages · ` : ''}
                  {timeAgo(p.updatedAt)}
                </small>
              </div>
              <button
                className="icon-btn sm"
                aria-label="Design options"
                onClick={(e) => {
                  e.stopPropagation();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenu({ x: r.left, y: r.bottom + 4, p });
                }}
              >
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {menu && <PopMenu x={menu.x} y={menu.y} items={items(menu.p)} onClose={() => setMenu(null)} />}
      {renaming && (
        <PromptDialog
          title="Rename design"
          initial={renaming.title}
          onClose={() => setRenaming(null)}
          onSubmit={(v) => {
            update(renaming, { title: v || 'Untitled design' });
            setRenaming(null);
          }}
        />
      )}
      {moving && (
        <Modal title="Move to folder" onClose={() => setMoving(null)}>
          <div style={{ display: 'grid', gap: 4 }}>
            <button className={`nav-item ${!moving.folderId ? 'on' : ''}`} onClick={() => (update(moving, { folderId: null }), setMoving(null))}>
              <HomeIcon size={15} /> No folder
            </button>
            {props.folders.map((f) => (
              <button key={f.id} className={`nav-item ${moving.folderId === f.id ? 'on' : ''}`} onClick={() => (update(moving, { folderId: f.id }), setMoving(null))}>
                <FolderIcon size={15} /> {f.name}
              </button>
            ))}
            {!props.folders.length && <p className="muted">No folders yet — create one from the Projects page.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

function ProjectsView(props: {
  title: string;
  projects: Project[];
  folders: Folder[];
  onOpen: (p: Project) => void;
  refresh: () => void;
  showFolders?: boolean;
  emptyText?: string;
  onNew?: () => void;
}) {
  const [folder, setFolder] = useState<string | null>(null);
  const [sort, setSort] = useState<'updated' | 'name' | 'created'>('updated');
  const [creating, setCreating] = useState(false);
  const list = useMemo(() => {
    let l = props.projects;
    if (folder) l = l.filter((p) => p.folderId === folder);
    return [...l].sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : sort === 'created' ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt));
  }, [props.projects, folder, sort]);
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>{props.title}</h2>
        <div className="row">
          <select className="select" style={{ width: 150 }} value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="updated">Last edited</option>
            <option value="created">Date created</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
      {props.showFolders && (
        <div className="folder-chips">
          <button className={`tab ${!folder ? 'on' : ''}`} onClick={() => setFolder(null)}>
            All designs
          </button>
          {props.folders.map((f) => (
            <span key={f.id} style={{ display: 'inline-flex' }}>
              <button className={`tab ${folder === f.id ? 'on' : ''}`} onClick={() => setFolder(f.id)}>
                <FolderIcon size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
                {f.name}
              </button>
              {folder === f.id && (
                <button
                  className="icon-btn sm"
                  title="Delete folder (designs are kept)"
                  onClick={async () => {
                    for (const p of props.projects.filter((p) => p.folderId === f.id)) await putProject({ ...p, folderId: null });
                    await deleteFolder(f.id);
                    setFolder(null);
                    props.refresh();
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </span>
          ))}
          <button className="btn ghost sm" onClick={() => setCreating(true)}>
            <FolderPlus size={14} /> New folder
          </button>
        </div>
      )}
      {list.length ? (
        <ProjectGrid projects={list} folders={props.folders} onOpen={props.onOpen} refresh={props.refresh} />
      ) : (
        <div className="empty">
          <b>Nothing here yet.</b>
          {props.emptyText ?? (folder ? 'Use “Move to folder…” on a design to file it here.' : 'Create a design to get started.')}
          {props.onNew && !folder && (
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={props.onNew}>
                <Plus size={14} /> Create design
              </button>
            </div>
          )}
        </div>
      )}
      {creating && (
        <PromptDialog
          title="New folder"
          initial=""
          placeholder="Folder name"
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            if (v) await putFolder({ id: uid('f_'), name: v, kind: 'project', createdAt: Date.now() });
            setCreating(false);
            props.refresh();
          }}
        />
      )}
    </>
  );
}

function TrashView({ projects, refresh }: { projects: Project[]; refresh: () => void }) {
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Trash</h2>
        {projects.length > 0 && (
          <button
            className="btn danger sm"
            onClick={async () => {
              if (!confirm(`Permanently delete ${projects.length} design(s)? This cannot be undone.`)) return;
              for (const p of projects) await deleteProject(p.id);
              refresh();
            }}
          >
            Empty trash
          </button>
        )}
      </div>
      {!projects.length ? (
        <div className="empty">
          <b>Trash is empty.</b>Deleted designs stay here until you remove them permanently.
        </div>
      ) : (
        <div className="cards">
          {projects.map((p) => (
            <div key={p.id} className="card">
              <div className="card-thumb">{p.thumbnail ? <img src={p.thumbnail} alt="" /> : <FormatShape f={p} size={80} />}</div>
              <div className="card-meta">
                <div style={{ minWidth: 0 }}>
                  <b>{p.title}</b>
                  <small>Deleted {timeAgo(p.trashedAt!)}</small>
                </div>
                <div className="row" style={{ gap: 2 }}>
                  <button className="icon-btn sm" title="Restore" onClick={async () => (await putProject({ ...p, trashedAt: null }), refresh())}>
                    <RotateCcw size={14} />
                  </button>
                  <button
                    className="icon-btn sm"
                    title="Delete forever"
                    onClick={async () => {
                      if (!confirm(`Permanently delete “${p.title}”?`)) return;
                      await deleteProject(p.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AssetsView({ query, onUpload }: { query: string; onUpload: () => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [renaming, setRenaming] = useState<Asset | null>(null);
  const [moving, setMoving] = useState<Asset | null>(null);
  const [creating, setCreating] = useState(false);
  const refresh = async () => {
    const [a, f] = await Promise.all([listAssets(), listFolders('asset')]);
    setAssets(a.filter((x) => x.type.startsWith('image/')));
    setFolders(f);
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1500); // picks up uploads dropped onto the page
    return () => clearInterval(t);
  }, []);
  const week = Date.now() - 7 * 864e5;
  let list = assets;
  if (query) list = list.filter((a) => a.name.toLowerCase().includes(query));
  if (filter === 'recent') list = list.filter((a) => a.createdAt > week);
  else if (filter === 'fav') list = list.filter((a) => a.favorite);
  else if (filter === 'svg') list = list.filter((a) => a.type === 'image/svg+xml');
  else if (filter === 'stock') list = list.filter((a) => a.credit);
  else if (filter.startsWith('f_')) list = list.filter((a) => a.folderId === filter);
  const total = assets.reduce((s, a) => s + a.size, 0);
  const folder = folders.find((f) => f.id === filter);
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Assets</h2>
        <span className="faint">
          {assets.length} files · {(total / 1024 / 1024).toFixed(1)} MB stored locally
        </span>
      </div>
      <div className="folder-chips">
        {[
          ['all', 'All uploads'],
          ['recent', 'Recently uploaded'],
          ['fav', 'Favorites'],
          ['svg', 'Vectors (SVG)'],
          ['stock', 'Stock photos'],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
        {folders.map((f) => (
          <button key={f.id} className={`tab ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>
            <FolderIcon size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            {f.name}
          </button>
        ))}
        {folder && (
          <button
            className="icon-btn sm"
            title="Delete folder (files are kept)"
            onClick={async () => {
              for (const a of assets.filter((a) => a.folderId === folder.id)) await putAsset({ ...a, folderId: null });
              await deleteFolder(folder.id);
              setFilter('all');
              refresh();
            }}
          >
            <X size={13} />
          </button>
        )}
        <button className="btn ghost sm" onClick={() => setCreating(true)}>
          <FolderPlus size={14} /> New folder
        </button>
        <button className="btn ghost sm" onClick={onUpload}>
          <Upload size={14} /> Upload
        </button>
      </div>
      {!list.length ? (
        <div className="empty">
          <b>No assets here.</b>Upload PNG, JPG, WEBP, GIF, SVG or PDF files — or drop them anywhere on this page. They’re reusable in every design.
        </div>
      ) : (
        <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {list.map((a) => (
            <div key={a.id} className="card">
              <div className="card-thumb" style={{ aspectRatio: '1', background: 'repeating-conic-gradient(#2a2a2a 0 25%, #232323 0 50%) 0 0 / 14px 14px' }}>
                <img src={assetURL(a)} alt={a.name} style={{ boxShadow: 'none', background: 'none' }} />
              </div>
              <button className={`icon-btn sm fav ${a.favorite ? 'on' : ''}`} onClick={async () => (await putAsset({ ...a, favorite: !a.favorite }), refresh())}>
                <Heart size={14} fill={a.favorite ? 'currentColor' : 'none'} />
              </button>
              <div className="card-meta">
                <div style={{ minWidth: 0 }}>
                  <b>{a.name}</b>
                  <small title={a.credit ? `${a.credit.author ?? 'Unknown'} · ${a.credit.license} · ${a.credit.source}` : undefined}>
                    {a.width}×{a.height} · {a.credit ? a.credit.license : a.type.split('/')[1].replace('svg+xml', 'svg').toUpperCase()}
                  </small>
                </div>
                <div className="row" style={{ gap: 0 }}>
                  <button className="icon-btn sm" title="Rename" onClick={() => setRenaming(a)}>
                    <Pencil size={13} />
                  </button>
                  <button className="icon-btn sm" title="Move to folder" onClick={() => setMoving(a)}>
                    <FolderInput size={13} />
                  </button>
                  <button
                    className="icon-btn sm"
                    title="Duplicate"
                    onClick={async () => {
                      await putAsset({ ...a, id: uid('a_'), name: `${a.name} copy`, createdAt: Date.now() });
                      refresh();
                    }}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    className="icon-btn sm"
                    title="Delete"
                    onClick={async () => {
                      if (!confirm(`Delete “${a.name}”? Designs that use it will show an empty image.`)) return;
                      await deleteAsset(a.id);
                      forgetAssetURL(a.id);
                      refresh();
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {renaming && (
        <PromptDialog
          title="Rename asset"
          initial={renaming.name}
          onClose={() => setRenaming(null)}
          onSubmit={async (v) => {
            await putAsset({ ...renaming, name: v || renaming.name });
            setRenaming(null);
            refresh();
          }}
        />
      )}
      {creating && (
        <PromptDialog
          title="New asset folder"
          initial=""
          placeholder="Folder name"
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            if (v) await putFolder({ id: uid('f_'), name: v, kind: 'asset', createdAt: Date.now() });
            setCreating(false);
            refresh();
          }}
        />
      )}
      {moving && (
        <Modal title="Move to folder" onClose={() => setMoving(null)}>
          <div style={{ display: 'grid', gap: 4 }}>
            <button className={`nav-item ${!moving.folderId ? 'on' : ''}`} onClick={async () => (await putAsset({ ...moving, folderId: null }), setMoving(null), refresh())}>
              <ImageIcon size={15} /> No folder
            </button>
            {folders.map((f) => (
              <button key={f.id} className={`nav-item ${moving.folderId === f.id ? 'on' : ''}`} onClick={async () => (await putAsset({ ...moving, folderId: f.id }), setMoving(null), refresh())}>
                <FolderIcon size={15} /> {f.name}
              </button>
            ))}
            {!folders.length && <p className="muted">No folders yet — create one with “New folder”.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

const ROADMAP: Record<string, { title: string; stage: string; intro: string; items: [string, string][] }> = {
  ai: {
    title: 'AI Studio',
    stage: 'Stage 4',
    intro: 'Real models only — no simulated output. Local models run in your browser; generation uses your own API keys (Settings).',
    items: [
      ['Background remover', 'Local ONNX segmentation (RMBG / BiRefNet class) — free, on-device'],
      ['Magic eraser & generative fill', 'Inpainting via configured provider'],
      ['Text-to-image', 'Provider API key required (paid inference)'],
      ['Design assistant', 'Font pairing, palettes, layout critique via configured LLM'],
    ],
  },
};

function Roadmap({ kind }: { kind: string }) {
  const r = ROADMAP[kind];
  if (!r) return null;
  return (
    <>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>
          {r.title} <span className="tag soon" style={{ marginLeft: 8, verticalAlign: 3 }}>In development · {r.stage}</span>
        </h2>
      </div>
      <p className="muted" style={{ maxWidth: 640 }}>
        {r.intro}
      </p>
      <p className="faint">This area isn’t built yet. It’s listed so the roadmap is visible — nothing here pretends to work.</p>
      <div className="roadmap" style={{ marginTop: 18 }}>
        {r.items.map(([t, d]) => (
          <div key={t} className="item">
            <b>{t}</b>
            <span className="muted">{d}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function PromptDialog(props: { title: string; initial: string; placeholder?: string; onClose: () => void; onSubmit: (v: string) => void }) {
  const [v, setV] = useState(props.initial);
  return (
    <Modal
      title={props.title}
      onClose={props.onClose}
      footer={
        <>
          <button className="btn ghost" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => props.onSubmit(v.trim())}>
            Save
          </button>
        </>
      }
    >
      <input className="input" autoFocus value={v} placeholder={props.placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.onSubmit(v.trim())} style={{ height: 34 }} />
    </Modal>
  );
}

const UNITS = { px: 1, in: 1, mm: 1 / 25.4, cm: 1 / 2.54 } as const;

function NewDesignDialog(props: { onClose: () => void; onCreate: (o: { title: string; width: number; height: number; transparent: boolean; dpi?: number }) => void }) {
  const [unit, setUnit] = useState<keyof typeof UNITS>('px');
  const [w, setW] = useState('1080');
  const [h, setH] = useState('1080');
  const [dpi, setDpi] = useState('300');
  const [title, setTitle] = useState('');
  const [transparent, setTransparent] = useState(false);
  const toPx = (v: string) => (unit === 'px' ? parseFloat(v) : parseFloat(v) * UNITS[unit] * parseFloat(dpi));
  const pw = Math.round(toPx(w));
  const ph = Math.round(toPx(h));
  const valid = pw >= 16 && ph >= 16 && pw <= 16000 && ph <= 16000;
  const mp = (pw * ph) / 1e6;
  return (
    <Modal
      title="Custom size"
      onClose={props.onClose}
      footer={
        <>
          <button className="btn ghost" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!valid} onClick={() => props.onCreate({ title: title || `Custom ${pw}×${ph}`, width: pw, height: ph, transparent, dpi: unit === 'px' ? undefined : parseFloat(dpi) })}>
            Create design
          </button>
        </>
      }
    >
      <label className="field">
        <span>Name</span>
        <input className="input" value={title} placeholder="Untitled design" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="grid3">
        <label className="field">
          <span>Width</span>
          <input className="input" value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>Height</span>
          <input className="input" value={h} onChange={(e) => setH(e.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>Unit</span>
          <select className="select" value={unit} onChange={(e) => setUnit(e.target.value as any)}>
            <option value="px">Pixels</option>
            <option value="in">Inches</option>
            <option value="mm">Millimetres</option>
            <option value="cm">Centimetres</option>
          </select>
        </label>
      </div>
      {unit !== 'px' && (
        <label className="field">
          <span>Resolution (DPI)</span>
          <select className="select" value={dpi} onChange={(e) => setDpi(e.target.value)}>
            <option value="72">72 — screen</option>
            <option value="150">150 — large format</option>
            <option value="300">300 — print</option>
          </select>
        </label>
      )}
      <div className="row" style={{ justifyContent: 'space-between', margin: '4px 0 12px' }}>
        <span className="muted">Transparent background</span>
        <button className={`toggle ${transparent ? 'on' : ''}`} onClick={() => setTransparent(!transparent)} />
      </div>
      <p className={valid ? 'faint' : ''} style={{ color: valid ? undefined : 'var(--danger)', margin: 0 }}>
        {valid ? `${pw} × ${ph} px · ${mp.toFixed(1)} MP` : 'Each side must be between 16 and 16,000 px.'}
        {valid && mp > 60 ? ' — very large; editing and export may be slow on some devices.' : ''}
      </p>
    </Modal>
  );
}

const FEATURED = ['sw-winged-crest', 'lx-monogram', 'ed-swiss', 'al-midnight-drive', 'rt-diner', 'so-story-sale', 'vt-garage', 'mb-brand-board'];

function TemplateTeaser() {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <section className="section">
      <div className="section-head">
        <h2>Start from a template</h2>
        <button className="btn ghost sm" onClick={() => navigate({ name: 'templates' })}>
          Browse all {TEMPLATES.length}
        </button>
      </div>
      <div className="tpl-strip">
        {FEATURED.map((id) => TEMPLATES.find((t) => t.id === id)!).map((t) => (
          <button
            key={t.id}
            className="tpl-strip-item"
            title={t.name}
            disabled={!!busy}
            onClick={async () => {
              setBusy(t.id);
              try {
                navigate({ name: 'editor', id: (await projectFromTemplate(t)).id });
              } catch (e: any) {
                toast(e?.message ?? 'Could not open template', 'error');
                setBusy(null);
              }
            }}
          >
            <img src={templateThumb(t)} alt={t.name} loading="lazy" />
            <small>{busy === t.id ? 'Opening…' : t.name}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
