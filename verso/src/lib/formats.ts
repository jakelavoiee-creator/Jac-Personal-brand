export interface Format {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'social' | 'print' | 'branding' | 'custom';
  /** pages created on open (e.g. carousels) */
  pages?: number;
  transparent?: boolean;
  dpi?: number;
  note?: string;
}

const inch = (inches: number, dpi: number) => Math.round(inches * dpi);

export const FORMATS: Format[] = [
  // Social
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
  { id: 'ig-portrait', name: 'Instagram Portrait', width: 1080, height: 1350, category: 'social' },
  { id: 'ig-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { id: 'ig-carousel', name: 'Instagram Carousel', width: 1080, height: 1350, category: 'social', pages: 3, note: '3 slides' },
  { id: 'tiktok', name: 'TikTok Cover', width: 1080, height: 1920, category: 'social' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'social' },
  { id: 'yt-banner', name: 'YouTube Banner', width: 2560, height: 1440, category: 'social' },
  { id: 'fb-post', name: 'Facebook Post', width: 1200, height: 630, category: 'social' },
  { id: 'fb-cover', name: 'Facebook Cover', width: 851, height: 315, category: 'social' },
  { id: 'pinterest', name: 'Pinterest Pin', width: 1000, height: 1500, category: 'social' },
  { id: 'linkedin', name: 'LinkedIn Post', width: 1200, height: 1200, category: 'social' },

  // Print & editorial (pixel size = inches × DPI)
  { id: 'poster', name: 'Poster 18×24 in', width: inch(18, 150), height: inch(24, 150), category: 'print', dpi: 150, note: '150 DPI · export 2× for 300' },
  { id: 'flyer', name: 'Flyer (Letter)', width: inch(8.5, 300), height: inch(11, 300), category: 'print', dpi: 300 },
  { id: 'magazine', name: 'Magazine Cover', width: inch(8.5, 300), height: inch(11, 300), category: 'print', dpi: 300 },
  { id: 'album', name: 'Album Cover', width: 3000, height: 3000, category: 'print', note: 'Streaming spec' },
  { id: 'brochure', name: 'Tri-fold Brochure', width: inch(11, 300), height: inch(8.5, 300), category: 'print', dpi: 300, pages: 2, note: 'Outside + inside' },
  { id: 'business-card', name: 'Business Card', width: inch(3.5, 300), height: inch(2, 300), category: 'print', dpi: 300, pages: 2, note: 'Front + back' },
  { id: 'invitation', name: 'Invitation 5×7 in', width: inch(5, 300), height: inch(7, 300), category: 'print', dpi: 300 },
  { id: 'packaging-print', name: 'Packaging Panel', width: 3000, height: 2000, category: 'print' },

  // Branding
  { id: 'logo', name: 'Logo', width: 1000, height: 1000, category: 'branding', transparent: true },
  { id: 'brand-board', name: 'Brand Identity Board', width: 1920, height: 1080, category: 'branding' },
  { id: 'clothing', name: 'Clothing Graphic', width: 4500, height: 5400, category: 'branding', transparent: true, note: 'Transparent · POD spec' },
  { id: 'tshirt', name: 'T-Shirt Front Print', width: 4500, height: 5400, category: 'branding', transparent: true, pages: 2, note: 'Front + back' },
  { id: 'hoodie', name: 'Hoodie Print', width: 4200, height: 4800, category: 'branding', transparent: true, pages: 2, note: 'Front + back' },
  { id: 'product-ad', name: 'Product Advertisement', width: 1080, height: 1350, category: 'branding' },
  { id: 'label', name: 'Label 3×2 in', width: inch(3, 300), height: inch(2, 300), category: 'branding', dpi: 300 },
  { id: 'packaging', name: 'Packaging Design', width: 3000, height: 2000, category: 'branding' },

  // Custom
  { id: 'blank', name: 'Blank Canvas', width: 1920, height: 1080, category: 'custom' },
  { id: 'transparent', name: 'Transparent Canvas', width: 2000, height: 2000, category: 'custom', transparent: true },
  { id: 'a4', name: 'Print-ready A4', width: 2480, height: 3508, category: 'custom', dpi: 300, note: '300 DPI' },
];

export const CATEGORIES: { id: Format['category']; label: string }[] = [
  { id: 'social', label: 'Social Media' },
  { id: 'print', label: 'Print & Editorial' },
  { id: 'branding', label: 'Branding & Apparel' },
  { id: 'custom', label: 'Custom' },
];

export const RESIZE_PRESETS = [
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Instagram Portrait', width: 1080, height: 1350 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'TikTok', width: 1080, height: 1920 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'YouTube Banner', width: 2560, height: 1440 },
  { name: 'Facebook Cover', width: 851, height: 315 },
  { name: 'LinkedIn Post', width: 1200, height: 1200 },
  { name: 'Pinterest Pin', width: 1000, height: 1500 },
];
