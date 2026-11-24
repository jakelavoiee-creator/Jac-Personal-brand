export interface PageData {
  id: string;
  /** CSS colour, or null for a transparent page */
  background: string | null;
  /** Serialized fabric objects (FabricObject#toObject output) */
  objects: any[];
  thumb?: string;
}

export interface Guides {
  v: number[];
  h: number[];
}

export interface Project {
  id: string;
  title: string;
  width: number;
  height: number;
  /** Print documents remember their DPI so exports can report physical size */
  dpi?: number;
  formatId?: string;
  pages: PageData[];
  thumbnail?: string;
  favorite: boolean;
  folderId: string | null;
  trashedAt: number | null;
  createdAt: number;
  updatedAt: number;
  guides?: Guides;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
  favorite: boolean;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  kind: 'project' | 'asset';
  createdAt: number;
}
