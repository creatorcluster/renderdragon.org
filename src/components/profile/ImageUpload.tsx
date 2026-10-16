import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { IconUpload, IconLoader, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    label?: string;
    bucket?: string;
    folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onUpload,
    currentImage,
    label = "Upload Image",
    bucket = "showcase", // Reusing showcase bucket as it's configured
    folder = "profiles"
}) => {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        try {
            setUploading(true);

            if (!user) {
                toast.error('You must be logged in to upload images');
                setUploading(false);
                return;
            }

            const fileExt = file.name.split('.').pop();
            // Create a path like: {userId}/profiles/{random}.{ext} to keep it organized
            const fileName = `${user.id}/${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            onUpload(data.publicUrl);
            toast.success('Image uploaded successfully');

        } catch (error: unknown) {
            console.error('Upload failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className=""
            >
                {uploading ? (
                    <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <IconUpload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : label}
            </Button>
            {currentImage && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpload('')}
                    title="Remove Image"
                >
                    <IconX className="w-4 h-4 text-muted-foreground" />
                </Button>
            )}
        </div>
    );
};
