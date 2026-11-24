import { getAsset, putAsset, putProject } from './db';
import { uid } from './ids';
import type { Project } from './types';

const toDataURL = (b: Blob) =>
  new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(b);
  });

function collectAssetIds(p: Project) {
  const ids = new Set<string>();
  const walk = (list: any[]) => list?.forEach((o) => (o.assetId && ids.add(o.assetId), o.objects && walk(o.objects)));
  p.pages.forEach((pg) => walk(pg.objects));
  return [...ids];
}

/** Serialize a project with its images embedded, so it can be reopened anywhere. */
export async function exportProjectFile(p: Project): Promise<Blob> {
  const assets: any[] = [];
  for (const id of collectAssetIds(p)) {
    const a = await getAsset(id);
    if (a) assets.push({ ...a, blob: undefined, data: await toDataURL(a.blob) });
  }
  const payload = { format: 'verso-project', version: 1, project: { ...p, thumbnail: undefined }, assets };
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

export async function importProjectFile(file: File): Promise<Project> {
  const json = JSON.parse(await file.text());
  if (json?.format !== 'verso-project' || !json.project) throw new Error('Not a Verso project file.');
  for (const a of json.assets || []) {
    const blob = await (await fetch(a.data)).blob();
    const { data, ...rest } = a;
    void data;
    await putAsset({ ...rest, blob });
  }
  const now = Date.now();
  const p: Project = { ...json.project, id: uid('p_'), trashedAt: null, createdAt: now, updatedAt: now };
  await putProject(p);
  return p;
}
