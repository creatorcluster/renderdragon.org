import React from 'react';
import { Resource } from '@/types/resources';
import ResourceCard from './ResourceCard';
import { IconFolderX, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ResourceCardSkeleton from './ResourceCardSkeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ResourcesListProps {
  resources: Resource[];
  isLoading: boolean;
  isSearching: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  onSelectResource: (resource: Resource) => void;
  onClearFilters: () => void;
  hasCategoryResources: boolean;
  filteredResources: Resource[];
  fontPreviewText?: string;
}

const ResourcesList = ({
  resources,
  isLoading,
  isSearching,
  selectedCategory,
  searchQuery,
  onSelectResource,
  onClearFilters,
  hasCategoryResources,
  filteredResources,
  fontPreviewText,
}: ResourcesListProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, filteredResources.length]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredResources.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };
  if (isLoading && resources.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const shouldShowNoResourcesMessage =
    (!isLoading && filteredResources.length === 0) ||
    (!isLoading &&
      selectedCategory &&
      selectedCategory !== "favorites" &&
      !hasCategoryResources);

  if (shouldShowNoResourcesMessage) {
    return (
      <motion.div
        className="text-center py-16 space-y-6"
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <IconFolderX className="h-12 w-12 text-yellow-500" />
        </motion.div>
        <motion.h3
          className="text-2xl font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          No resources found
        </motion.h3>
        <motion.p
          className="text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isSearching
            ? `No resources match your search for "${searchQuery}"`
            : selectedCategory === "favorites"
              ? "You have no favorited resources yet"
              : selectedCategory
                ? `No resources found in the "${selectedCategory}" category`
                : "No resources found with the current filters"}
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="pixel-corners"
          >
            <IconX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button
            className="pixel-corners bg-cow-purple hover:bg-cow-purple/80"
            onClick={() =>
              window.open("https://discord.renderdragon.org", "_blank")
            }
          >
            <img
              src="/assets/discord_icon.png"
              alt="Discord"
              className="h-4 w-4 mr-2"
            />
            Contribute Resources
          </Button>
          <Button
            className="pixel-corners bg-cow-purple hover:bg-cow-purple/80"
            onClick={() =>
              window.open(
                "https://creatoronwheels.netlify.app/resources",
                "_blank",
              )
            }
          >
            <img
              src="/assets/domain_icon.png"
              alt="Old site"
              className="h-4 w-4 mr-2"
            />
            Check our Old Site
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {currentItems.map((resource, index) => (
          <motion.div
            key={`resource-${resource.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % itemsPerPage) * 0.05, duration: 0.3 }}
          >
            <ResourceCard
              resource={resource}
              onClick={onSelectResource}
              fontPreviewText={fontPreviewText}
            />
          </motion.div>
        ))}

        {/* Skeleton loaders while fetching additional resources */}
        {isLoading && resources.length > 0 && (
          Array.from({ length: 6 }).map((_, idx) => (
            <ResourceCardSkeleton key={`loader-skeleton-${idx}`} />
          ))
        )}
      </motion.div>

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={cn(
                    "cursor-pointer",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Logic to show limited page numbers with ellipsis
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={cn(
                    "cursor-pointer",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(ResourcesList);