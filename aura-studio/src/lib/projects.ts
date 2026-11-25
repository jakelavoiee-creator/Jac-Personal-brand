import { putProject, getProject } from './db';
import { uid } from './ids';
import type { Format } from './formats';
import type { PageData, Project } from './types';

export function newPage(background: string | null = '#ffffff'): PageData {
  return { id: uid('pg_'), background, objects: [] };
}

export async function createProject(opts: {
  title?: string;
  width: number;
  height: number;
  transparent?: boolean;
  pages?: number;
  format?: Format;
  dpi?: number;
}): Promise<Project> {
  const now = Date.now();
  const n = Math.max(1, opts.pages ?? 1);
  const bg = opts.transparent ? null : '#ffffff';
  const p: Project = {
    id: uid('p_'),
    title: opts.title || 'Untitled design',
    width: Math.round(opts.width),
    height: Math.round(opts.height),
    dpi: opts.dpi,
    formatId: opts.format?.id,
    pages: Array.from({ length: n }, () => newPage(bg)),
    favorite: false,
    folderId: null,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    guides: { v: [], h: [] },
  };
  await putProject(p);
  return p;
}

export async function duplicateProject(id: string) {
  const src = await getProject(id);
  if (!src) return null;
  const now = Date.now();
  const copy: Project = {
    ...structuredClone(src),
    id: uid('p_'),
    title: `${src.title} (copy)`,
    favorite: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  copy.pages = copy.pages.map((pg) => ({ ...pg, id: uid('pg_') }));
  await putProject(copy);
  return copy;
}

/* Portable project file: project JSON + embedded assets as data URLs. */
export const PROJECT_FILE_EXT = '.aura.json';
