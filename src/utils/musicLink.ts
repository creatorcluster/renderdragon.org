import { Resource } from '@/types/resources';
import { getResourceUrl } from '@/lib/resourcesRepo';

export const MUSIC_LINK_PATH = '/api/music-link';

const pickDirectUrl = (resource: Resource): string => {
  const candidates = [getResourceUrl(resource), resource.download_url, resource.preview_url, resource.image_url];
  return candidates.find((value) => !!value && !value.startsWith('blob:')) || '';
};

export const buildMusicLink = (resource: Resource): string => {
  const params = new URLSearchParams();

  if (resource.title) params.set('name', resource.title);
  const directUrl = pickDirectUrl(resource);
  if (directUrl) params.set('url', directUrl);
  if (resource.credit) params.set('credits', resource.credit);
  if (resource.category) params.set('category', resource.category);
  if (resource.filetype) params.set('ext', resource.filetype);
  if (resource.filename) params.set('file', resource.filename);
  if (resource.id !== undefined && resource.id !== null) params.set('id', String(resource.id));

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://renderdragon.org';
  return `${origin}${MUSIC_LINK_PATH}?${params.toString()}`;
};
