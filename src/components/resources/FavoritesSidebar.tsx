import React, { useState, useMemo } from 'react';
import { IconFolder, IconFolderOpen, IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconDownload } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useFavoriteFolders, FavoriteFolder } from '@/hooks/useFavoriteFolders';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface FavoritesSidebarProps {
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: () => void;
    onEditFolder: (folder: FavoriteFolder) => void;
    onDeleteFolder: (folderId: string) => void;
    onDownloadFolder: (folder: FavoriteFolder) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const FolderItem = ({
    folder,
    level = 0,
    selectedFolderId,
    onSelect,
    onEdit,
    onDelete,
    onDownload,
    getChildren
}: {
    folder: FavoriteFolder;
    level?: number;
    selectedFolderId: string | null;
    onSelect: (id: string) => void;
    onEdit: (folder: FavoriteFolder) => void;
    onDelete: (id: string) => void;
    onDownload: (folder: FavoriteFolder) => void;
    getChildren: (parentId: string) => FavoriteFolder[];
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folder.id}`,
        data: {
            type: 'Folder',
            folder
        }
    });

    const childrenFolders = getChildren(folder.id);
    const hasChildren = childrenFolders.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
        <div>
            <div
                ref={setNodeRef}
                className={cn(
                    "flex items-center justify-between group py-1.5 px-2 rounded-md cursor-pointer transition-colors mb-0.5",
                    isSelected ? "bg-primary/20 text-primary" : "hover:bg-muted/50",
                    isOver && "bg-primary/30 ring-2 ring-primary ring-inset",
                    level > 0 && "ml-4 border-l border-border pl-2"
                )}
                onClick={() => onSelect(folder.id)}
            >
                <div className="flex items-center gap-2 flex-grow overflow-hidden">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className={cn("p-0.5 rounded-sm hover:bg-muted/80 opacity-0 transition-opacity", hasChildren && "opacity-100")}
                        disabled={!hasChildren}
                    >
                        {isOpen ? <IconFolderOpen size={16} /> : <IconFolder size={16} />}
                    </button>

                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color || 'var(--primary)' }}
                    />
                    <span className="truncate text-sm font-medium">
                        {folder.name}
                    </span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconDotsVertical size={14} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(folder); }}>
                            <IconDownload size={14} className="mr-2" /> Download Zip
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(folder); }}>
                            <IconEdit size={14} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
                            className="text-destructive focus:bg-destructive/10"
                        >
                            <IconTrash size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isOpen && hasChildren && (
                <div className="mt-1">
                    {childrenFolders.map(child => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            getChildren={getChildren}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FavoritesSidebar = ({
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
    onDownloadFolder,
    searchQuery,
    onSearchChange
}: FavoritesSidebarProps) => {
    const { folders, isLoading } = useFavoriteFolders();

    const { isOver: isOverRoot, setNodeRef: setRootNodeRef } = useDroppable({
        id: `folder-root`,
        data: {
            type: 'FolderRoot'
        }
    });

    const rootFolders = useMemo(() => {
        return folders.filter(f => !f.parent_id);
    }, [folders]);

    const getChildren = (parentId: string) => {
        return folders.filter(f => f.parent_id === parentId);
    };

    const filteredFolders = useMemo(() => {
        if (!searchQuery) return rootFolders;
        const query = searchQuery.toLowerCase();
        return folders.filter(f => f.name.toLowerCase().includes(query));
    }, [folders, rootFolders, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-card/50 border border-border/50 rounded-xl overflow-hidden pixel-corners backdrop-blur-sm">
            <div className="p-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-vt323 text-xl font-medium">My Folders</h3>
                    <Button size="icon" variant="ghost" onClick={onCreateFolder} className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors">
                        <IconPlus size={18} />
                    </Button>
                </div>

                <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search folders..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/50 pixel-corners"
                    />
                </div>
            </div>

            <ScrollArea className="flex-grow p-3">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : folders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <IconFolder className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No folders yet.</p>
                        <p className="text-xs mt-1">Create one to organize favorites.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <div
                            ref={setRootNodeRef}
                            className={cn(
                                "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer mb-2 transition-colors",
                                selectedFolderId === null ? "bg-primary/20 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground",
                                isOverRoot && "bg-primary/30 ring-2 ring-primary ring-inset"
                            )}
                            onClick={() => onSelectFolder(null)}
                        >
                            <IconFolderOpen size={18} />
                            <span>All Favorites</span>
                        </div>

                        <div className="space-y-1">
                            {searchQuery ? (
                                filteredFolders.map(folder => (
                                    <FolderItem
                                        key={folder.id}
                                        folder={folder}
                                        selectedFolderId={selectedFolderId}
                                        onSelect={onSelectFolder}
                                        onEdit={onEditFolder}
                                        onDelete={onDeleteFolder}
                                        onDownload={onDownloadFolder}
                                        getChildren={getChildren}
                                    />
                                ))
                            ) : (
                                rootFolders.map(folder => (
                                    <FolderItem
                                        key={folder.id}
                                        folder={folder}
                                        selectedFolderId={selectedFolderId}
                                        onSelect={onSelectFolder}
                                        onEdit={onEditFolder}
                                        onDelete={onDeleteFolder}
                                        onDownload={onDownloadFolder}
                                        getChildren={getChildren}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default FavoritesSidebar;
