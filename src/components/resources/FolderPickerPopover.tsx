import React, { useState, useRef, useEffect } from 'react';
import { IconFolder, IconPlus, IconAlertTriangle } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { FavoriteFolder } from '@/hooks/useFavoriteFolders';
import { MAX_FOLDER_ITEMS } from '@/hooks/useUserFavorites';
import { ScrollArea } from '@/components/ui/scroll-area';
import FolderDialog from './FolderDialog';
import { useFavoriteFolders } from '@/hooks/useFavoriteFolders';

interface FolderPickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when user picks a folder (null = no folder / unsorted) */
    onSelectFolder: (folderId: string | null) => void;
    folders: FavoriteFolder[];
    /** Returns how many items are in a folder */
    getFolderItemCount: (folderId: string | null) => number;
    /** Position anchor element */
    anchorRef: React.RefObject<HTMLElement | null>;
}

const FolderPickerPopover = ({
    isOpen,
    onClose,
    onSelectFolder,
    folders,
    getFolderItemCount,
    anchorRef,
}: FolderPickerPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { createFolder } = useFavoriteFolders();

    // Position the popover relative to the anchor
    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;

        const rect = anchorRef.current.getBoundingClientRect();
        const popoverWidth = 220;
        const popoverHeight = 300;

        let top = rect.bottom + 8;
        let left = rect.left + rect.width / 2 - popoverWidth / 2;

        // Keep within viewport
        if (left < 8) left = 8;
        if (left + popoverWidth > window.innerWidth - 8) {
            left = window.innerWidth - popoverWidth - 8;
        }
        if (top + popoverHeight > window.innerHeight - 8) {
            top = rect.top - popoverHeight - 8;
        }

        setPosition({ top, left });
    }, [isOpen, anchorRef]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        // Delay to avoid the current click event closing it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorRef]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const rootFolders = folders.filter(f => !f.parent_id);

    const handleFolderClick = (folderId: string | null) => {
        if (folderId) {
            const count = getFolderItemCount(folderId);
            if (count >= MAX_FOLDER_ITEMS) {
                // Don't close, just don't select
                return;
            }
        }
        onSelectFolder(folderId);
        onClose();
    };

    const handleCreateFolder = async (name: string, color: string | null) => {
        try {
            const newFolder = await createFolder(name, null, color);
            setShowCreateDialog(false);
            if (newFolder?.id) {
                onSelectFolder(String(newFolder.id));
                onClose();
            }
        } catch {
            setShowCreateDialog(false);
        }
    };

    return (
        <>
            <div
                ref={popoverRef}
                className="fixed z-[100] bg-card border border-border/60 rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                    top: position.top,
                    left: position.left,
                    width: 220,
                    maxHeight: 340,
                }}
            >
                <div className="px-3 py-2.5 border-b border-border/40">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Save to folder
                    </p>
                </div>

                <ScrollArea className="max-h-[230px]">
                    <div className="p-1.5 space-y-0.5">
                        {/* No folder / unsorted option */}
                        <button
                            onClick={() => handleFolderClick(null)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-muted/50 transition-colors"
                        >
                            <IconFolder size={15} className="text-muted-foreground flex-shrink-0" />
                            <span className="truncate text-muted-foreground">No folder</span>
                        </button>

                        {/* Folder list */}
                        {rootFolders.map(folder => {
                            const count = getFolderItemCount(folder.id);
                            const isFull = count >= MAX_FOLDER_ITEMS;

                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => handleFolderClick(folder.id)}
                                    disabled={isFull}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors",
                                        isFull
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-muted/50 cursor-pointer"
                                    )}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: folder.color || 'var(--primary)' }}
                                    />
                                    <span className="truncate flex-1">{folder.name}</span>
                                    <span className={cn(
                                        "text-[10px] font-mono flex-shrink-0",
                                        isFull ? "text-amber-500" : "text-muted-foreground/60"
                                    )}>
                                        {count}/{MAX_FOLDER_ITEMS}
                                    </span>
                                    {isFull && (
                                        <IconAlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Create folder */}
                <div className="border-t border-border/40 p-1.5">
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-primary/10 text-primary transition-colors"
                    >
                        <IconPlus size={15} className="flex-shrink-0" />
                        <span>Create Folder</span>
                    </button>
                </div>
            </div>

            <FolderDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSave={handleCreateFolder}
                initialData={null}
                mode="create"
            />
        </>
    );
};

export default FolderPickerPopover;
