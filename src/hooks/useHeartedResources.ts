
import { useCallback, useEffect, useState } from 'react';
import { useUserFavorites } from './useUserFavorites';
import { useFavoriteFolders } from './useFavoriteFolders';
import { useAuth } from './useAuth';
import { getResourceUrl, Resource } from '@/types/resources';

export const useHeartedResources = () => {
  const { user } = useAuth();
  const userFavorites = useUserFavorites();
  const { folders } = useFavoriteFolders();
  const localStorageKey = 'heartedResources';

  const getLocalHeartedResources = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const setLocalHeartedResources = (resources: string[]) => {
    localStorage.setItem(localStorageKey, JSON.stringify(resources));
  };

  const [heartedResources, setHeartedResources] = useState<string[]>(() => getLocalHeartedResources());

  useEffect(() => {
    const handleLocalUpdate = () => {
      setHeartedResources(getLocalHeartedResources());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === localStorageKey) {
        setHeartedResources(getLocalHeartedResources());
      }
    };

    window.addEventListener('localFavoritesChanged', handleLocalUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('localFavoritesChanged', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [getLocalHeartedResources]);

  const toggleHeart = (resource: Resource | string): Promise<{ action: 'added' | 'removed' }> => {
    const resourceUrl = typeof resource === 'string' ? resource : getResourceUrl(resource);
    if (!resourceUrl) return Promise.resolve({ action: 'removed' });
    const current = getLocalHeartedResources();
    const isCurrentlyHearted = current.includes(resourceUrl);
    const newHearted = isCurrentlyHearted
      ? current.filter(id => id !== resourceUrl)
      : [...current, resourceUrl];

    setLocalHeartedResources(newHearted);
    setHeartedResources(newHearted);
    window.dispatchEvent(new CustomEvent('localFavoritesChanged'));
    return Promise.resolve({ action: isCurrentlyHearted ? 'removed' : 'added' });
  };

  const isHearted = (resource: Resource | string) => {
    const resourceUrl = typeof resource === 'string' ? resource : getResourceUrl(resource);
    if (!resourceUrl) return false;
    return getLocalHeartedResources().includes(resourceUrl);
  };

  if (user) {
    const toggleHeart = (resource: Resource | string): Promise<{ action: 'added' | 'removed' }> => {
      const resourceUrl = typeof resource === 'string' ? resource : getResourceUrl(resource);
      if (!resourceUrl) return Promise.resolve({ action: 'removed' });
      return userFavorites.toggleFavorite(resourceUrl);
    };

    const isHearted = (resource: Resource | string) => {
      const resourceUrl = typeof resource === 'string' ? resource : getResourceUrl(resource);
      if (!resourceUrl) return false;
      return userFavorites.isFavorited(resourceUrl);
    };

    return {
      heartedResources: userFavorites.favorites,
      toggleHeart,
      isHearted,
      isLoading: userFavorites.isLoading,
      moveFavorite: userFavorites.moveFavorite,
      addFavoriteToFolder: userFavorites.addFavoriteToFolder,
      getFolderItemCount: userFavorites.getFolderItemCount,
      folders,
    };
  }

  return {
    heartedResources,
    toggleHeart,
    isHearted,
    isLoading: false,
    moveFavorite: (_resourceUrl: string, _folderId: string | null) => { },
    addFavoriteToFolder: (_resourceUrl: string, _folderId: string) => { },
    getFolderItemCount: (_folderId: string | null) => 0,
    folders: [] as ReturnType<typeof useFavoriteFolders>['folders'],
  };
};
