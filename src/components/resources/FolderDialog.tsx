import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FavoriteFolder } from '@/hooks/useFavoriteFolders';
import { cn } from '@/lib/utils';

interface FolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string | null) => Promise<void> | void;
    initialData?: FavoriteFolder | null;
    mode: 'create' | 'edit';
}

const COMMON_COLORS = [
    'var(--primary)',
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#d946ef', // fuchsia
    '#f43f5e', // rose
];

const FolderDialog = ({ isOpen, onClose, onSave, initialData, mode }: FolderDialogProps) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData && mode === 'edit') {
                setName(initialData.name);
                setColor(initialData.color);
            } else {
                setName('');
                setColor(null);
            }
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(name.trim(), color);
        } catch (error) {
            console.error('Failed to save folder:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create New Folder' : 'Edit Folder'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                            id="folder-name"
                            placeholder="e.g. My Awesome Assets"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pixel-corners"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Folder Color (Optional)</Label>
                        <div className="flex flex-wrap gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setColor(null)}
                                className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center border-2",
                                    color === null ? "border-primary" : "border-transparent bg-muted/20"
                                )}
                                title="Default"
                            >
                                {color === null && <span className="text-[10px]">None</span>}
                            </button>
                            {COMMON_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110 border-2",
                                        color === c ? "border-foreground scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Color ${c}`}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="pixel-corners">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isSaving} className="pixel-corners">
                            {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FolderDialog;
