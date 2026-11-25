/** Template service: built-in + user templates, and turning either into a design. */
import { putProject, listUserTemplates, putUserTemplate, deleteUserTemplate } from '../lib/db';
import { uid } from '../lib/ids';
import type { PageData, Project, UserTemplate } from '../lib/types';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './library';
import type { Template } from './build';

export { TEMPLATES, TEMPLATE_CATEGORIES, listUserTemplates, deleteUserTemplate };
export type { Template };

export const templateThumb = (t: Template) => `/templates/${t.id}.webp`;

export function templateDims(t: Template) {
  const k = t.k ?? 1;
  return { width: Math.round(t.w * k), height: Math.round(t.h * k) };
}

/** Build a built-in template into fresh, editable pages (fabric loads lazily). */
export async function buildTemplate(t: Template): Promise<PageData[]> {
  const { buildTemplatePages } = await import('./build');
  return buildTemplatePages(t);
}

async function thumbFor(size: { width: number; height: number }, page: PageData) {
  try {
    const { renderThumb } = await import('../lib/render');
    return await renderThumb(size, page, 320);
  } catch {
    return undefined;
  }
}

/** Create a new design from a built-in template. */
export async function projectFromTemplate(t: Template): Promise<Project> {
  const pages = await buildTemplate(t);
  const { width, height } = templateDims(t);
  return saveAsProject(t.name, width, height, pages, t.dpi);
}

/** Create a new design from one of the user's saved templates. */
export async function projectFromUserTemplate(t: UserTemplate): Promise<Project> {
  const pages = structuredClone(t.pages).map((p) => ({ ...p, id: uid('pg_') }));
  return saveAsProject(t.name, t.width, t.height, pages);
}

async function saveAsProject(title: string, width: number, height: number, pages: PageData[], dpi?: number) {
  const now = Date.now();
  const thumb = await thumbFor({ width, height }, pages[0]);
  if (thumb) pages[0].thumb = thumb;
  const p: Project = { id: uid('p_'), title, width, height, dpi, pages, thumbnail: thumb, favorite: false, folderId: null, trashedAt: null, createdAt: now, updatedAt: now, guides: { v: [], h: [] } };
  await putProject(p);
  return p;
}

/** Save any design as a reusable template (stored privately in this browser). */
export async function saveProjectAsTemplate(p: Project, name: string, category = 'My templates') {
  const t: UserTemplate = {
    id: uid('t_'),
    name,
    category,
    width: p.width,
    height: p.height,
    pages: structuredClone(p.pages).map((pg) => ({ ...pg, thumb: undefined })),
    thumbnail: p.pages[0]?.thumb ?? p.thumbnail,
    createdAt: Date.now(),
  };
  await putUserTemplate(t);
  return t;
}
