import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserFavorite {
  resource_url: string;
  folder_id: string | null;
}

export const useUserFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSchemaReady, setIsSchemaReady] = useState(true);

  const { data: favoritesData = [], isLoading } = useQuery({
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

      return (data as UserFavorite[])?.filter(fav => fav.resource_url != null) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

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
        return { action: 'removed', resourceUrl };
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .upsert(
            { user_id: user.id, resource_url: resourceUrl },
            { onConflict: 'user_id,resource_url', ignoreDuplicates: true }
          );
        if (error) throw error;
        return { action: 'added', resourceUrl };
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

  const moveFavoriteMutation = useMutation({
    mutationFn: async ({ resourceUrl, folderId }: { resourceUrl: string, folderId: string | null }) => {
      if (!user) throw new Error('User not authenticated');

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
      console.error('Error moving favorite:', error);
      toast.error('Failed to move favorite');
    }
  });

  const toggleFavorite = (resourceUrl: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    if (!resourceUrl) {
      toast.error('Unable to favorite this resource');
      return;
    }
    if (!isSchemaReady) {
      toast.error('Favorites storage needs a database update');
      return;
    }
    toggleMutation.mutate(resourceUrl);
  };

  const moveFavorite = (resourceUrl: string, folderId: string | null) => {
    if (!user || !resourceUrl) return;
    moveFavoriteMutation.mutate({ resourceUrl, folderId });
  };

  const isFavorited = (resourceUrl: string) => favorites.includes(resourceUrl);

  return {
    favoritesData,
    favorites,
    isLoading,
    toggleFavorite,
    moveFavorite,
    isFavorited,
  };
};
