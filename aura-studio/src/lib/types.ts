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
  folderId?: string | null;
  /** attribution for stock media (licence, author, source page) */
  credit?: { title?: string; author?: string; license: string; licenseUrl?: string; source: string; sourceUrl: string };
}

export interface Folder {
  id: string;
  name: string;
  kind: 'project' | 'asset';
  createdAt: number;
}

/** A reusable composition saved by the user (built-in templates live in code). */
export interface UserTemplate {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  pages: PageData[];
  thumbnail?: string;
  createdAt: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral';
}

export interface BrandFont {
  family: string;
  weight: number;
  tracking?: number;
  caps?: boolean;
}

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandColor[];
  fonts: { heading: BrandFont; subheading: BrandFont; body: BrandFont };
  logos: string[]; // asset ids
  assets: string[]; // asset ids
  guidelines: string;
  createdAt: number;
  updatedAt: number;
}
