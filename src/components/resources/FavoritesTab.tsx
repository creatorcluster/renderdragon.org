import { motion } from 'framer-motion';
import { useHeartedResources } from '@/hooks/useHeartedResources';
import { useResources } from '@/hooks/useResources';
import { getResourceUrl, Resource } from '@/types/resources';
import ResourceCard from './ResourceCard';
import ResourceCardSkeleton from './ResourceCardSkeleton';
import { IconHeart } from '@tabler/icons-react';

interface FavoritesTabProps {
  onSelectResource: (resource: Resource) => void;
}

const FavoritesTab = ({ onSelectResource }: FavoritesTabProps) => {
  const { heartedResources, isLoading: favoritesLoading } = useHeartedResources();
  const { resources, isLoading: resourcesLoading } = useResources();

  const isLoading = favoritesLoading || resourcesLoading;

  const favoriteResources = resources.filter(resource => {
    const resourceUrl = getResourceUrl(resource);
    return resourceUrl ? heartedResources.includes(resourceUrl) : false;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <ResourceCardSkeleton key={`fav-skel-${idx}`} />
        ))}
      </div>
    );
  }

  if (favoriteResources.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <IconHeart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-vt323 mb-2">No favorites yet</h3>
        <p className="text-muted-foreground">
          Start exploring resources and add them to your favorites!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {favoriteResources.map(resource => {
        const resourceUrl = getResourceUrl(resource);
        return (
        <ResourceCard
          key={`${resource.id}-${resourceUrl}`}
          resource={resource}
          onClick={onSelectResource}
        />
        );
      })}
    </div>
  );
};

export default FavoritesTab;
