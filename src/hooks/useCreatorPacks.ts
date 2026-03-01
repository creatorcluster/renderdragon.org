import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CreatorPack {
    id: string;
    user_id: string;
    title: string;
    slug: string;
    small_description: string;
    description: string;
    cover_image_url: string | null;
    external_link: string;
    tags: string[];
    status: 'pending' | 'approved' | 'rejected';
    review_reason?: string | null;
    created_at: string;
    // Joined profile data
    profiles?: {
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
    };
}

export interface CreateCreatorPackInput {
    title: string;
    small_description: string;
    description: string;
    cover_image_url: string | null;
    external_link: string;
    tags: string[];
}

export interface UpdateCreatorPackInput {
    title?: string;
    small_description?: string;
    description?: string;
    cover_image_url?: string | null;
    external_link?: string;
    tags?: string[];
}

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

export const useCreatorPacks = () => {
    const { user } = useAuth();
    const [packs, setPacks] = useState<CreatorPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPacks = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('status', 'approved') // Only fetch approved packs for public view
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPacks((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching creator packs:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPackBySlug = useCallback(async (slug: string): Promise<CreatorPack | null> => {
        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            return data as any;
        } catch (error) {
            console.error('Error fetching creator pack:', error);
            return null;
        }
    }, []);

    const createPack = useCallback(async (input: CreateCreatorPackInput) => {
        if (!user) {
            toast.error('You must be signed in to create a creator pack.');
            return null;
        }

        const slug = slugify(input.title);

        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .insert({
                    user_id: user.id,
                    title: input.title,
                    slug,
                    small_description: input.small_description,
                    description: input.description,
                    cover_image_url: input.cover_image_url,
                    external_link: input.external_link,
                    tags: input.tags,
                    status: 'pending', // New packs start as pending
                })
                .select('*, profiles(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            toast.success('Creator pack submitted for review!');
            return data as any as CreatorPack;
        } catch (error: any) {
            console.error('Error creating creator pack:', error);
            if (error.code === '23505') {
                toast.error('A pack with this title already exists. Choose a different title.');
            } else {
                toast.error('Failed to create creator pack.');
            }
            return null;
        }
    }, [user]);

    const updatePack = useCallback(async (id: string, input: UpdateCreatorPackInput) => {
        if (!user) {
            toast.error('You must be signed in to update a creator pack.');
            return null;
        }

        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .update({
                    title: input.title,
                    small_description: input.small_description,
                    description: input.description,
                    ...(input.cover_image_url !== undefined && { cover_image_url: input.cover_image_url }),
                    external_link: input.external_link,
                    tags: input.tags,
                    status: 'pending', // Reset status to pending on update
                    review_reason: null, // Clear review reason on update
                })
                .eq('id', id)
                .eq('user_id', user.id)
                .select('*, profiles(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            const updatedPack = data as any as CreatorPack;

            setPacks(prev => prev.map(p => p.id === id ? updatedPack : p));
            toast.success('Creator pack updated and submitted for re-review!');
            return updatedPack;
        } catch (error: any) {
            console.error('Error updating creator pack:', error);
            if (error.code === '23505') {
                toast.error('A pack with this title already exists. Choose a different title.');
            } else {
                toast.error('Failed to update creator pack. You might not have permission.');
            }
            return null;
        }
    }, [user]);

    const deletePack = useCallback(async (id: string) => {
        if (!user) {
            toast.error('You must be signed in to delete a creator pack.');
            return;
        }

        try {
            const { error } = await (supabase as any)
                .from('creator_packs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id); // Ensure they can only delete their own

            if (error) throw error;

            setPacks(prev => prev.filter(p => p.id !== id));
            toast.success('Creator pack deleted.');
        } catch (error) {
            console.error('Error deleting pack:', error);
            toast.error('Failed to delete creator pack.');
        }
    }, [user]);

    const uploadCoverImage = useCallback(async (file: File): Promise<string | null> => {
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        try {
            const { error } = await supabase.storage
                .from('creator_packs_covers')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('creator_packs_covers')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            toast.error('Failed to upload cover image.');
            return null;
        }
    }, [user]);

    useEffect(() => {
        fetchPacks();
    }, [fetchPacks]);

    const fetchUserPacks = useCallback(async () => {
        if (!user) return [];
        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as any) as CreatorPack[];
        } catch (error) {
            console.error('Error fetching user creator packs:', error);
            toast.error('Failed to load your creator packs.');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch pending packs (for admins)
    const fetchPendingPacks = useCallback(async (): Promise<CreatorPack[]> => {
        try {
            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .select('*, profiles:user_id(username, display_name, avatar_url)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return ((data as any) || []).map((pack: any) => ({
                id: pack.id,
                user_id: pack.user_id,
                title: pack.title,
                slug: pack.slug,
                small_description: pack.small_description,
                description: pack.description,
                cover_image_url: pack.cover_image_url,
                created_at: pack.created_at,
                external_link: pack.external_link,
                tags: pack.tags || [],
                status: pack.status,
                review_reason: pack.review_reason,
                profiles: pack.profiles,
            }));
        } catch (err: any) {
            console.error('Error fetching pending packs:', err);
            toast.error("Failed to fetch pending creator packs.");
            return [];
        }
    }, []);

    // Admin function to approve or reject a pack
    const reviewPack = useCallback(async (id: string, status: 'approved' | 'rejected', review_reason?: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const updateData: any = { status };
            if (status === 'rejected') {
                updateData.review_reason = review_reason;
            } else {
                updateData.review_reason = null;
            }

            const { data, error } = await (supabase as any)
                .from('creator_packs')
                .update(updateData)
                .eq('id', id)
                .select('*, profiles:user_id(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            const updatedPack: CreatorPack = {
                id: (data as any).id,
                user_id: (data as any).user_id,
                title: (data as any).title,
                slug: (data as any).slug,
                small_description: (data as any).small_description,
                description: (data as any).description,
                cover_image_url: (data as any).cover_image_url,
                created_at: (data as any).created_at,
                external_link: (data as any).external_link,
                tags: (data as any).tags || [],
                status: (data as any).status,
                review_reason: (data as any).review_reason,
                profiles: (data as any).profiles,
            };

            // If approved, add it to the public packs list if not already there
            if (status === 'approved') {
                setPacks(prev => {
                    if (prev.some(p => p.id === id)) {
                        return prev.map(p => p.id === id ? updatedPack : p);
                    }
                    return [updatedPack, ...prev];
                });
            } else {
                // If rejected, remove it from the public list just in case
                setPacks(prev => prev.filter(p => p.id !== id));
            }

            toast.success(`Pack has been ${status}.`);

            return updatedPack;
        } catch (err: any) {
            console.error('Error reviewing pack:', err);
            toast.error(err.message || "Failed to review creator pack.");
            return null;
        }
    }, []);


    return {
        packs,
        isLoading,
        fetchPackBySlug,
        fetchUserPacks,
        createPack,
        updatePack,
        deletePack,
        uploadCoverImage,
        fetchPendingPacks,
        reviewPack
    };
};
