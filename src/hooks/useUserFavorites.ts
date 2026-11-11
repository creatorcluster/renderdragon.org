import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  subscribeGuestFavorites,
  getGuestFavoritesSnapshot,
  writeGuestFavorites,
  GuestFavorite,
} from '@/utils/guestFavorites';

export const MAX_FOLDER_ITEMS = 40;

export interface UserFavorite {
  resource_url: string;
  folder_id: string | null;
}

export const useUserFavorites = () => {
  const { user } = useAuth();
  const isGuest = !user;
  const queryClient = useQueryClient();
  const [isSchemaReady, setIsSchemaReady] = useState(true);

  // Guest (signed-out) favourites, held in localStorage by the guest store.
  const guestFavorites = useSyncExternalStore(
    subscribeGuestFavorites,
    getGuestFavoritesSnapshot,
    getGuestFavoritesSnapshot,
  );

  const { data: userFavorites = [], isLoading } = useQuery({
    queryKey: ['userFavorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      if (!isSchemaReady) return [];

      const { data, error } = await supabase
        .from('user_favorites')
        .select('resource_url, folder_id')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42703' || error.message.includes('resource_url')) {
          setIsSchemaReady(false);
          toast.error('Favorites storage needs a database update');
          return [];
        }
        console.error('Error fetching favorites:', error);
        toast.error('Failed to load favorites');
        throw error;
      }

      return (data as unknown as UserFavorite[])?.filter(fav => fav.resource_url != null) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Favourites that are currently visible in the UI (guest local or backend).
  const favoritesData = (isGuest ? guestFavorites : userFavorites) as UserFavorite[];

  const favorites = favoritesData.map(f => f.resource_url);

  const toggleMutation = useMutation({
    mutationFn: async (resourceUrl: string) => {
      if (!user) throw new Error('User not authenticated');
      if (!isSchemaReady) throw new Error('Favorites storage needs a database update');

      const isFavorited = favorites.includes(resourceUrl);

      if (isFavorited) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_url', resourceUrl);
        if (error) throw error;
        return { action: 'removed' as const, resourceUrl };
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .upsert(
            { user_id: user.id, resource_url: resourceUrl },
            { onConflict: 'user_id,resource_url', ignoreDuplicates: true }
          );
        if (error) throw error;
        return { action: 'added' as const, resourceUrl };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
      toast.success(data.action === 'added' ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('database update')) {
        toast.error('Favorites storage needs a database update');
        return;
      }
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  });

  const addFavoriteToFolderMutation = useMutation({
    mutationFn: async ({ resourceUrl, folderId }: { resourceUrl: string; folderId: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Check folder limit
      const folderCount = favoritesData.filter(f => f.folder_id === folderId).length;
      if (folderCount >= MAX_FOLDER_ITEMS) {
        throw new Error('FOLDER_FULL');
      }

      // Upsert the favorite with the folder_id
      const { error } = await supabase
        .from('user_favorites')
        .upsert(
          { user_id: user.id, resource_url: resourceUrl, folder_id: folderId },
          { onConflict: 'user_id,resource_url' }
        );
      if (error) throw error;
      return { resourceUrl, folderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
      toast.success('Added to folder');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'FOLDER_FULL') {
        toast.error(`This folder already has ${MAX_FOLDER_ITEMS} items. Please create another folder.`);
        return;
      }
      console.error('Error adding favorite to folder:', error);
      toast.error('Failed to add to folder');
    }
  });

  const moveFavoriteMutation = useMutation({
    mutationFn: async ({ resourceUrl, folderId }: { resourceUrl: string, folderId: string | null }) => {
      if (!user) throw new Error('User not authenticated');

      // Check folder limit when moving to a folder (not when unassigning)
      if (folderId) {
        const folderCount = favoritesData.filter(f => f.folder_id === folderId).length;
        if (folderCount >= MAX_FOLDER_ITEMS) {
          throw new Error('FOLDER_FULL');
        }
      }

      const { error } = await supabase
        .from('user_favorites')
        .update({ folder_id: folderId })
        .eq('user_id', user.id)
        .eq('resource_url', resourceUrl);

      if (error) throw error;
      return { resourceUrl, folderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
      toast.success('Favorite moved to folder');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'FOLDER_FULL') {
        toast.error(`This folder already has ${MAX_FOLDER_ITEMS} items. Please create another folder.`);
        return;
      }
      console.error('Error moving favorite:', error);
      toast.error('Failed to move favorite');
    }
  });

  // ---- Guest (local) operations ------------------------------------------
  const upsertGuestFavorite = (resourceUrl: string, folderId: string | null = null): GuestFavorite[] => {
    const next: GuestFavorite[] = [...guestFavorites];
    const idx = next.findIndex(f => f.resource_url === resourceUrl);
    if (idx >= 0) {
      next[idx] = { resource_url: resourceUrl, folder_id: folderId };
    } else {
      next.push({ resource_url: resourceUrl, folder_id: folderId });
    }
    writeGuestFavorites(next);
    return next;
  };

  const toggleGuestFavorite = (resourceUrl: string): { action: 'added' | 'removed' } => {
    const isCurrently = guestFavorites.some(f => f.resource_url === resourceUrl);
    const next = isCurrently
      ? guestFavorites.filter(f => f.resource_url !== resourceUrl)
      : [...guestFavorites, { resource_url: resourceUrl, folder_id: null }];
    writeGuestFavorites(next);
    return { action: isCurrently ? 'removed' : 'added' };
  };

  const toggleFavorite = (resourceUrl: string): Promise<{ action: 'added' | 'removed' }> => {
    if (!resourceUrl) {
      toast.error('Unable to favorite this resource');
      return Promise.resolve({ action: 'removed' });
    }
    if (isGuest) {
      const result = toggleGuestFavorite(resourceUrl);
      toast.success(result.action === 'added' ? 'Added to favorites' : 'Removed from favorites');
      return Promise.resolve(result);
    }
    if (!isSchemaReady) {
      toast.error('Favorites storage needs a database update');
      return Promise.resolve({ action: 'removed' });
    }
    return toggleMutation.mutateAsync(resourceUrl);
  };

  const moveFavorite = (resourceUrl: string, folderId: string | null) => {
    if (!resourceUrl) return;
    if (isGuest) {
      const next = guestFavorites.map(f =>
        f.resource_url === resourceUrl ? { ...f, folder_id: folderId } : f
      );
      writeGuestFavorites(next);
      toast.success('Favorite moved to folder');
      return;
    }
    moveFavoriteMutation.mutate({ resourceUrl, folderId });
  };

  const addFavoriteToFolder = (resourceUrl: string, folderId: string) => {
    if (!resourceUrl) return;
    if (isGuest) {
      const count = getGuestFolderItemCount(folderId);
      if (count >= MAX_FOLDER_ITEMS) {
        toast.error(`This folder already has ${MAX_FOLDER_ITEMS} items. Please create another folder.`);
        return;
      }
      upsertGuestFavorite(resourceUrl, folderId);
      toast.success('Added to folder');
      return;
    }
    addFavoriteToFolderMutation.mutate({ resourceUrl, folderId });
  };

  const getFolderItemCount = (folderId: string | null): number => {
    return favoritesData.filter(f => f.folder_id === folderId).length;
  };

  // Used while computing guest folder limits before a write.
  const getGuestFolderItemCount = (folderId: string): number => {
    return guestFavorites.filter(f => f.folder_id === folderId).length;
  };

  const isFavorited = (resourceUrl: string) => favorites.includes(resourceUrl);

  return {
    favoritesData,
    favorites,
    isLoading,
    toggleFavorite,
    moveFavorite,
    addFavoriteToFolder,
    getFolderItemCount,
    isFavorited,
  };
};
