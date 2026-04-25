export interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  userId: string;
  createdAt: any;
}

export type StylePreset = 'Realistic' | '3D Render' | 'Watercolor' | 'Pixel Art' | 'None';
