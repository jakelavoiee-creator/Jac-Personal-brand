import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Asset, Folder, Project } from './types';

interface VersoDB extends DBSchema {
  projects: { key: string; value: Project; indexes: { updatedAt: number } };
  assets: { key: string; value: Asset; indexes: { createdAt: number } };
  folders: { key: string; value: Folder };
}

let dbp: Promise<IDBPDatabase<VersoDB>> | null = null;

export function db() {
  if (!dbp) {
    dbp = openDB<VersoDB>('verso-studio', 1, {
      upgrade(d) {
        const p = d.createObjectStore('projects', { keyPath: 'id' });
        p.createIndex('updatedAt', 'updatedAt');
        const a = d.createObjectStore('assets', { keyPath: 'id' });
        a.createIndex('createdAt', 'createdAt');
        d.createObjectStore('folders', { keyPath: 'id' });
      },
    });
  }
  return dbp;
}

/* ---------- projects ---------- */
// Writes still in flight (e.g. the editor's final flush on close). Listing waits
// for them so the dashboard never shows a stale copy of a just-closed design.
const pending = new Set<Promise<unknown>>();
const track = <T,>(p: Promise<T>) => {
  pending.add(p);
  p.finally(() => pending.delete(p)).catch(() => {});
  return p;
};

export async function listProjects(): Promise<Project[]> {
  await Promise.allSettled([...pending]);
  const all = await (await db()).getAll('projects');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getProject(id: string) {
  return (await db()).get('projects', id);
}
export async function putProject(p: Project) {
  await track(db().then((d) => d.put('projects', p)));
}
export async function deleteProject(id: string) {
  await (await db()).delete('projects', id);
}

/* ---------- assets ---------- */
export async function listAssets(): Promise<Asset[]> {
  const all = await (await db()).getAll('assets');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
export async function getAsset(id: string) {
  return (await db()).get('assets', id);
}
export async function putAsset(a: Asset) {
  await (await db()).put('assets', a);
}
export async function deleteAsset(id: string) {
  await (await db()).delete('assets', id);
}

/* ---------- folders ---------- */
export async function listFolders(kind: Folder['kind']): Promise<Folder[]> {
  const all = await (await db()).getAll('folders');
  return all.filter((f) => f.kind === kind).sort((a, b) => a.createdAt - b.createdAt);
}
export async function putFolder(f: Folder) {
  await (await db()).put('folders', f);
}
export async function deleteFolder(id: string) {
  await (await db()).delete('folders', id);
}
