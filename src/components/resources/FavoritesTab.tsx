import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeartedResources } from '@/hooks/useHeartedResources';
import { useUserFavorites } from '@/hooks/useUserFavorites';
import { useResources } from '@/hooks/useResources';
import { getResourceUrl, Resource } from '@/types/resources';
import ResourceCard from './ResourceCard';
import ResourceCardSkeleton from './ResourceCardSkeleton';
import { IconHeart } from '@tabler/icons-react';
import FavoritesSidebar from './FavoritesSidebar';
import { useFavoriteFolders, FavoriteFolder } from '@/hooks/useFavoriteFolders';
import FolderDialog from './FolderDialog';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

interface FavoritesTabProps {
  onSelectResource: (resource: Resource) => void;
}

const DraggableResourceCard = ({ resource, onClick }: { resource: Resource; onClick: (resource: Resource) => void }) => {
  const resourceUrl = getResourceUrl(resource);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resource-${resourceUrl}`,
    data: {
      type: 'Resource',
      resource
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`h-full cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <ResourceCard
        resource={resource}
        onClick={onClick}
      />
    </div>
  );
};

const FavoritesTab = ({ onSelectResource }: FavoritesTabProps) => {
  const { isLoading: favoritesLoading } = useHeartedResources();
  const { favoritesData, moveFavorite } = useUserFavorites();
  const { resources, isLoading: resourcesLoading } = useResources();

  // Folders hook
  const {
    folders,
    createFolder,
    updateFolder,
    deleteFolder
  } = useFavoriteFolders();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragResource, setActiveDragResource] = useState<Resource | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Folder Dialog State
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'edit'>('create');
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const isLoading = favoritesLoading || resourcesLoading;

  const favoriteResources = useMemo(() => {
    return resources.filter(resource => {
      const resourceUrl = getResourceUrl(resource);
      return resourceUrl ? favoritesData.some(f => f.resource_url === resourceUrl) : false;
    });
  }, [resources, favoritesData]);

  const displayedResources = useMemo(() => {
    return favoriteResources.filter(resource => {
      const resourceUrl = getResourceUrl(resource);
      const favData = favoritesData.find(f => f.resource_url === resourceUrl);

      if (selectedFolderId === null) {
        return true; // Show all when no folder is selected
      }

      // We could add recursive checking here to show resources in subfolders
      // but simple direct matching is fine for a first iteration
      return favData?.folder_id === selectedFolderId;
    });
  }, [favoriteResources, favoritesData, selectedFolderId]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Resource') {
      setActiveDragResource(active.data.current.resource);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragResource(null);
    const { active, over } = event;

    if (!over) return;

    if (active.data.current?.type === 'Resource' && over.data.current?.type === 'Folder') {
      const resource = active.data.current.resource;
      const resourceUrl = getResourceUrl(resource);
      const folderId = over.data.current.folder.id;

      if (resourceUrl) {
        moveFavorite(resourceUrl, folderId);
      }
    } else if (active.data.current?.type === 'Resource' && over.data.current?.type === 'FolderRoot') {
      const resource = active.data.current.resource;
      const resourceUrl = getResourceUrl(resource);

      if (resourceUrl) {
        moveFavorite(resourceUrl, null);
      }
    }
  };

  const handleCreateFolderClick = () => {
    setFolderDialogMode('create');
    setEditingFolder(null);
    setIsFolderDialogOpen(true);
  };

  const handleEditFolderClick = (folder: FavoriteFolder) => {
    setFolderDialogMode('edit');
    setEditingFolder(folder);
    setIsFolderDialogOpen(true);
  };

  const handleFolderSave = async (name: string, color: string | null) => {
    if (folderDialogMode === 'create') {
      await createFolder(name, null, color); // null parent ID for now
    } else if (folderDialogMode === 'edit' && editingFolder) {
      await updateFolder(editingFolder.id, { name, color });
    }
    setIsFolderDialogOpen(false);
  };

  const handleDeleteFolderClick = async (folderId: string) => {
    if (window.confirm("Are you sure you want to delete this folder? Resources inside it will become unassigned.")) {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  const handleDownloadFolder = async (folder: FavoriteFolder) => {
    if (isZipping) {
      toast.error('Already downloading a folder, please wait.');
      return;
    }

    const folderResources = favoriteResources.filter(r => {
      const url = getResourceUrl(r);
      return url && favoritesData.find(f => f.resource_url === url)?.folder_id === folder.id;
    });

    if (folderResources.length === 0) {
      toast.error('Folder is empty.');
      return;
    }

    setIsZipping(true);
    toast.info(`Preparing zip map for ${folder.name}...`);

    try {
      const zip = new JSZip();

      for (const resource of folderResources) {
        const url = resource.download_url || getResourceUrl(resource);
        if (!url) continue;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();

          // Generate distinct filename
          const ext = resource.filetype || url.split('.').pop()?.split('?')[0] || 'file';
          let filename = resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          if (resource.credit) {
            filename += `_credit_${resource.credit.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
          }
          zip.file(`${filename}.${ext}`, blob);
        } catch (err) {
          console.error(`Failed to fetch ${url}`, err);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folder.name.replace(/[^a-z0-9]/gi, '_')}.zip`);
      toast.success('Download complete!');
    } catch (error) {
      console.error('Zipping error:', error);
      toast.error('Failed to create zip file.');
    } finally {
      setIsZipping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0 animate-pulse bg-muted/20 h-96 rounded-xl" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ResourceCardSkeleton key={`fav-skel-${idx}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-6 mx-auto w-full text-left">
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="sticky top-28 h-[calc(100vh-8rem)] z-10">
              <FavoritesSidebar
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                onCreateFolder={handleCreateFolderClick}
                onEditFolder={handleEditFolderClick}
                onDeleteFolder={handleDeleteFolderClick}
                onDownloadFolder={handleDownloadFolder}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 z-0">
            {displayedResources.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-muted/5 rounded-xl border border-border/50"
              >
                <IconHeart className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-vt323 mb-2 font-medium">No resources found</h3>
                <p className="text-muted-foreground">
                  {selectedFolderId
                    ? "This folder is currently empty. Drop some resources here!"
                    : "Start exploring resources and add them to your favorites!"}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {displayedResources.map(resource => (
                    <motion.div
                      key={`${resource.id}-${getResourceUrl(resource)}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <DraggableResourceCard
                        resource={resource}
                        onClick={onSelectResource}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeDragResource ? (
            <div className="w-64 opacity-80 rotate-2 scale-105 pointer-events-none shadow-xl">
              <ResourceCard resource={activeDragResource} onClick={() => { }} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onClose={() => setIsFolderDialogOpen(false)}
        onSave={handleFolderSave}
        initialData={editingFolder}
        mode={folderDialogMode}
      />
    </>
  );
};

export default FavoritesTab;
