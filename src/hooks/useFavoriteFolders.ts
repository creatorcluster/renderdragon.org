import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  subscribeGuestFolders,
  getGuestFoldersSnapshot,
  readGuestFavorites,
  writeGuestFavorites,
  writeGuestFolders,
  GuestFolder,
  genId,
} from '@/utils/guestFavorites';

export interface FavoriteFolder {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    parent_id: string | null;
    created_at: string;
}

export const useFavoriteFolders = () => {
    const { user } = useAuth();
    const isGuest = !user;
    const queryClient = useQueryClient();

    // Guest (signed-out) folders, held in localStorage by the guest store.
    const guestFolders = useSyncExternalStore(
        subscribeGuestFolders,
        getGuestFoldersSnapshot,
        getGuestFoldersSnapshot,
    );

    // Fetch all folders for the user
    const { data: userFolders = [], isLoading } = useQuery({
        queryKey: ['favoriteFolders', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('user_favorite_folders')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching favorite folders:', error);
                toast.error('Failed to load folders');
                throw error;
            }

            return data as FavoriteFolder[];
        },
        enabled: !!user?.id,
    });

    const folders = (isGuest ? guestFolders : userFolders) as FavoriteFolder[];

    const sortFolders = (list: FavoriteFolder[]) =>
        [...list].sort((a, b) => a.name.localeCompare(b.name));

    const createGuestFolder = (name: string, parent_id: string | null, color: string | null): GuestFolder => {
        const folder: GuestFolder = {
            id: genId(),
            user_id: '',
            name,
            parent_id,
            color: color || null,
            created_at: new Date().toISOString(),
        };
        const next = sortFolders([...guestFolders, folder]);
        writeGuestFolders(next);
        toast.success('Folder created successfully');
        return folder;
    };

    const updateGuestFolder = (id: string, updates: Partial<Pick<FavoriteFolder, 'name' | 'parent_id' | 'color'>>) => {
        const next = sortFolders(guestFolders.map(f =>
            f.id === id ? { ...f, ...updates } : f
        ));
        writeGuestFolders(next);
        toast.success('Folder updated successfully');
    };

    const deleteGuestFolder = (id: string) => {
        const next = guestFolders.filter(f => f.id !== id);
        writeGuestFolders(next);
        const favorites = readGuestFavorites();
        if (favorites.some(f => f.folder_id === id)) {
            writeGuestFavorites(
                favorites.map(f => (f.folder_id === id ? { ...f, folder_id: null } : f))
            );
        }
        toast.success('Folder deleted successfully');
    };

    // Create a new folder
    const createFolderMutation = useMutation({
        mutationFn: async ({ name, parent_id, color }: { name: string; parent_id?: string | null; color?: string | null }) => {
            const { data, error } = await supabase
                .from('user_favorite_folders')
                .insert({
                    user_id: user!.id,
                    name,
                    parent_id: parent_id || null,
                    color: color || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favoriteFolders', user?.id] });
            toast.success('Folder created successfully');
        },
        onError: (error) => {
            console.error('Error creating folder:', error);
            toast.error('Failed to create folder');
        }
    });

    // Update a folder
    const updateFolderMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<FavoriteFolder, 'name' | 'parent_id' | 'color'>> }) => {
            const { data, error } = await supabase
                .from('user_favorite_folders')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user!.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favoriteFolders', user?.id] });
            toast.success('Folder updated successfully');
        },
        onError: (error) => {
            console.error('Error updating folder:', error);
            toast.error('Failed to update folder');
        }
    });

    // Delete a folder
    const deleteFolderMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('user_favorite_folders')
                .delete()
                .eq('id', id)
                .eq('user_id', user!.id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favoriteFolders', user?.id] });
            // Also invalidate favorites since their folder_id might have been set to null via ON DELETE SET NULL
            queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
            toast.success('Folder deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting folder:', error);
            toast.error('Failed to delete folder');
        }
    });

    return {
        folders,
        isLoading,
        createFolder: (name: string, parent_id?: string | null, color?: string | null) => {
            if (isGuest) {
                return Promise.resolve(createGuestFolder(name, parent_id || null, color || null));
            }
            return createFolderMutation.mutateAsync({ name, parent_id, color });
        },
        updateFolder: (id: string, updates: Partial<Pick<FavoriteFolder, 'name' | 'parent_id' | 'color'>>) => {
            if (isGuest) {
                updateGuestFolder(id, updates);
                return Promise.resolve();
            }
            return updateFolderMutation.mutateAsync({ id, updates });
        },
        deleteFolder: (id: string) => {
            if (isGuest) {
                deleteGuestFolder(id);
                return Promise.resolve(id);
            }
            return deleteFolderMutation.mutateAsync(id);
        },
        isCreating: createFolderMutation.isPending,
        isUpdating: updateFolderMutation.isPending,
        isDeleting: deleteFolderMutation.isPending,
    };
};