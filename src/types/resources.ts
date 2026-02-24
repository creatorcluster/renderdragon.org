

export interface Resource {
  id: number | string;
  title: string;
  category: 'music' | 'sfx' | 'images' | 'animations' | 'fonts' | 'presets' | 'minecraft-icons' | 'mcsounds';
  subcategory?: string;
  credit?: string;
  filetype?: string;
  software?: string;
  image_url?: string;
  description?: string;
  preview_url?: string;
  download_url?: string;
  download_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const getResourceUrl = (resource: Resource): string => {
  return resource.download_url || resource.preview_url || resource.image_url || '';
};

export interface ResourcesData {
  music: Resource[];
  sfx: Resource[];
  images: Resource[];
  animations: Resource[];
  fonts: Resource[];
  presets: Resource[];
  minecraft_icons: Resource[];
}
