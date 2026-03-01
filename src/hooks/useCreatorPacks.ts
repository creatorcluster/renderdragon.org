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
    profiles?: {
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
    };
}

interface CreatorPackRow {
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
    review_reason: string | null;
    created_at: string;
}

interface CreatorPackWithProfiles extends CreatorPackRow {
    profiles: {
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'An unknown error occurred';
};

const getPostgresErrorCode = (error: unknown): string | null => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return (error as { code: string }).code;
    }
    return null;
};

const mapToCreatorPack = (row: CreatorPackWithProfiles): CreatorPack => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    slug: row.slug,
    small_description: row.small_description,
    description: row.description,
    cover_image_url: row.cover_image_url,
    external_link: row.external_link,
    tags: row.tags || [],
    status: row.status,
    review_reason: row.review_reason,
    created_at: row.created_at,
    profiles: row.profiles || undefined,
});

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
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

export const useCreatorPacks = () => {
    const { user } = useAuth();
    const [packs, setPacks] = useState<CreatorPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPacks = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPacks((data as CreatorPackWithProfiles[])?.map(mapToCreatorPack) || []);
        } catch (error: unknown) {
            console.error('Error fetching creator packs:', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPackBySlug = useCallback(async (slug: string): Promise<CreatorPack | null> => {
        try {
            const { data, error } = await supabase
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            return data ? mapToCreatorPack(data as CreatorPackWithProfiles) : null;
        } catch (error: unknown) {
            console.error('Error fetching creator pack:', getErrorMessage(error));
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
            const { data, error } = await supabase
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
                    status: 'pending',
                })
                .select('*, profiles(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            toast.success('Creator pack submitted for review!');
            return mapToCreatorPack(data as CreatorPackWithProfiles);
        } catch (error: unknown) {
            console.error('Error creating creator pack:', getErrorMessage(error));
            if (getPostgresErrorCode(error) === '23505') {
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
            const { data, error } = await supabase
                .from('creator_packs')
                .update({
                    title: input.title,
                    small_description: input.small_description,
                    description: input.description,
                    ...(input.cover_image_url !== undefined && { cover_image_url: input.cover_image_url }),
                    external_link: input.external_link,
                    tags: input.tags,
                    status: 'pending',
                    review_reason: null,
                })
                .eq('id', id)
                .eq('user_id', user.id)
                .select('*, profiles(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            const updatedPack = mapToCreatorPack(data as CreatorPackWithProfiles);

            setPacks(prev => prev.map(p => p.id === id ? updatedPack : p));
            toast.success('Creator pack updated and submitted for re-review!');
            return updatedPack;
        } catch (error: unknown) {
            console.error('Error updating creator pack:', getErrorMessage(error));
            if (getPostgresErrorCode(error) === '23505') {
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
            const { error } = await supabase
                .from('creator_packs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setPacks(prev => prev.filter(p => p.id !== id));
            toast.success('Creator pack deleted.');
        } catch (error: unknown) {
            console.error('Error deleting pack:', getErrorMessage(error));
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
        } catch (error: unknown) {
            console.error('Error uploading cover image:', getErrorMessage(error));
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
            const { data, error } = await supabase
                .from('creator_packs')
                .select('*, profiles(username, display_name, avatar_url)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as CreatorPackWithProfiles[])?.map(mapToCreatorPack) || [];
        } catch (error: unknown) {
            console.error('Error fetching user creator packs:', getErrorMessage(error));
            toast.error('Failed to load your creator packs.');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchPendingPacks = useCallback(async (): Promise<CreatorPack[]> => {
        try {
            const { data, error } = await supabase
                .from('creator_packs')
                .select('*, profiles:user_id(username, display_name, avatar_url)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data as CreatorPackWithProfiles[])?.map(mapToCreatorPack) || [];
        } catch (error: unknown) {
            console.error('Error fetching pending packs:', getErrorMessage(error));
            toast.error("Failed to fetch pending creator packs.");
            return [];
        }
    }, []);

    const reviewPack = useCallback(async (id: string, status: 'approved' | 'rejected', review_reason?: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const updateData: { status: 'approved' | 'rejected'; review_reason: string | null } = {
                status,
                review_reason: status === 'rejected' ? review_reason ?? null : null,
            };

            const { data, error } = await supabase
                .from('creator_packs')
                .update(updateData)
                .eq('id', id)
                .select('*, profiles:user_id(username, display_name, avatar_url)')
                .single();

            if (error) throw error;

            const updatedPack = mapToCreatorPack(data as CreatorPackWithProfiles);

            if (status === 'approved') {
                setPacks(prev => {
                    if (prev.some(p => p.id === id)) {
                        return prev.map(p => p.id === id ? updatedPack : p);
                    }
                    return [updatedPack, ...prev];
                });
            } else {
                setPacks(prev => prev.filter(p => p.id !== id));
            }

            toast.success(`Pack has been ${status}.`);

            return updatedPack;
        } catch (error: unknown) {
            console.error('Error reviewing pack:', getErrorMessage(error));
            toast.error(getErrorMessage(error) || "Failed to review creator pack.");
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
