import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FavoriteFolder {
    id: string;
    user_id: string;
    name: string;
    parent_id: string | null;
    color: string | null;
    created_at: string;
}

export const useFavoriteFolders = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch all folders for the user
    const { data: folders = [], isLoading } = useQuery({
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

    // Create a new folder
    const createFolderMutation = useMutation({
        mutationFn: async ({ name, parent_id, color }: { name: string; parent_id?: string | null; color?: string | null }) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('user_favorite_folders')
                .insert({
                    user_id: user.id,
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
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('user_favorite_folders')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
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
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('user_favorite_folders')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

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
        createFolder: (name: string, parent_id?: string | null, color?: string | null) =>
            createFolderMutation.mutateAsync({ name, parent_id, color }),
        updateFolder: (id: string, updates: Partial<Pick<FavoriteFolder, 'name' | 'parent_id' | 'color'>>) =>
            updateFolderMutation.mutateAsync({ id, updates }),
        deleteFolder: (id: string) => deleteFolderMutation.mutateAsync(id),
        isCreating: createFolderMutation.isPending,
        isUpdating: updateFolderMutation.isPending,
        isDeleting: deleteFolderMutation.isPending,
    };
};
