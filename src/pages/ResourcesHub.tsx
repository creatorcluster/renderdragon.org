import { useRef, useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResources } from '@/hooks/useResources';
import { Resource } from '@/types/resources';
import ResourceFilters from '@/components/resources/ResourceFilters';
import ResourcesList from '@/components/resources/ResourcesList';
import AuthDialog from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { IconArrowUp, IconMusic, IconPhoto, IconVideo, IconFileText, IconFileMusic, IconLayoutGrid } from '@tabler/icons-react';
import { Helmet } from "react-helmet-async";

const ResourceDetailDialog = lazy(() => import('@/components/resources/ResourceDetailDialog'));

const categoryMeta: Record<string, { icon: React.ReactNode; label: string }> = {
  music: { icon: <IconMusic className="h-10 w-10" />, label: 'Music' },
  sfx: { icon: <IconFileMusic className="h-10 w-10" />, label: 'SFX' },
  images: { icon: <IconPhoto className="h-10 w-10" />, label: 'Images' },
  animations: { icon: <IconVideo className="h-10 w-10" />, label: 'Animations' },
  fonts: { icon: <IconFileText className="h-10 w-10" />, label: 'Fonts' },
  presets: { icon: <IconFileText className="h-10 w-10" />, label: 'Presets' },
  'minecraft-icons': {
    icon: <IconLayoutGrid className="h-10 w-10" />,
    label: 'Minecraft Icons',
  },
};

function CategoryCards({
  indexData,
  onSelectCategory,
}: {
  indexData: { categories?: Record<string, { count: number }> } | null;
  onSelectCategory: (cat: string) => void;
}) {
  if (!indexData?.categories) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="pixel-card p-6 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded mb-3" />
            <div className="h-5 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(indexData.categories);

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {entries.map(([key, info], idx) => {
        const meta = categoryMeta[key] || {
          icon: <IconFileText className="h-10 w-10" />,
          label: key,
        };
        return (
          <motion.button
            key={key}
            onClick={() => onSelectCategory(key)}
            className="pixel-card p-6 text-left hover:border-cow-purple transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
          >
            <div className="text-cow-purple mb-3">{meta.icon}</div>
            <h3 className="font-minecraftia text-lg">{meta.label}</h3>
            <p className="text-sm text-muted-foreground">
              {info.count.toLocaleString()} resources
            </p>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

const ResourcesHub = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const {
    resources,
    selectedResource,
    setSelectedResource,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    isLoading,
    isSearching,
    loadedFonts,
    setLoadedFonts,
    filteredResources,
    hasCategoryResources,
    handleSearchSubmit,
    handleClearSearch,
    handleCategoryChange,
    handleSubcategoryChange,
    sortOrder,
    handleSortOrderChange,
    handleSearch,
    handleDownload,
    availableSubcategories,
    indexData,
  } = useResources();

  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.pageYOffset > 400;
          setShowScrollTop(scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleShowFavorites = () => {
      setShowFavorites(true);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('showFavorites', handleShowFavorites);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('showFavorites', handleShowFavorites);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'favorites') {
      setShowFavorites(true);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDownload = useMemo(() => (resource: Resource) => {
    const success = handleDownload(resource);
    if (success) {
      toast.info('Download starting...', {
        description: 'Downloading resource...',
        duration: 3000,
      });
    } else {
      toast.error('Download error');
    }
  }, [handleDownload]);

  const handleCloseDetail = useCallback(() => setSelectedResource(null), [setSelectedResource]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Resources Hub</title>
        <meta name="description" content="Explore a vast collection of resources for RenderDragon." />
        <meta property="og:title" content="Resources Hub" />
        <meta property="og:description" content="Explore a vast collection of resources for RenderDragon." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/resources.png" />
        <meta property="og:url" content="https://renderdragon.org/resources" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Resources Hub" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/resources.png" />
      </Helmet>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-minecraftia font-bold mb-2 text-center">Resources Hub</h1>
              <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">Discover and download a wide range of resources to enhance your RenderDragon experience.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {showFavorites ? (
                  <motion.div
                    key="favorites"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-12"
                  >
                    <Button onClick={() => setShowFavorites(false)} className="mb-6">
                      Back to Resources
                    </Button>
                    <p className="text-muted-foreground">
                      Your favorited resources are available on the <a href="/account" className="text-cow-purple underline">Account page</a>.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="browse"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ResourceFilters
                      searchQuery={searchQuery}
                      selectedCategory={selectedCategory}
                      selectedSubcategory={selectedSubcategory}
                      availableSubcategories={availableSubcategories}
                      onSearch={handleSearch}
                      onClearSearch={handleClearSearch}
                      onSearchSubmit={handleSearchSubmit}
                      onCategoryChange={handleCategoryChange}
                      onSubcategoryChange={handleSubcategoryChange}
                      sortOrder={sortOrder}
                      onSortOrderChange={handleSortOrderChange}
                      isMobile={isMobile}
                      inputRef={inputRef}
                    />

                    {selectedCategory === 'minecraft-icons' && (
                      <p className="text-xs text-center text-muted-foreground mb-6 -mt-4 opacity-50 hover:opacity-100 transition-opacity">
                        Powered by Hamburger API
                      </p>
                    )}

                    {selectedCategory === null && !isSearching ? (
                      <CategoryCards
                        indexData={indexData}
                        onSelectCategory={handleCategoryChange}
                      />
                    ) : (
                      <ResourcesList
                        resources={resources}
                        filteredResources={filteredResources}
                        isLoading={isLoading}
                        isSearching={isSearching}
                        selectedCategory={selectedCategory}
                        searchQuery={searchQuery}
                        onSelectResource={setSelectedResource}
                        onClearFilters={handleClearSearch}
                        hasCategoryResources={hasCategoryResources}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <ResourceDetailDialog
          resource={selectedResource}
          onClose={handleCloseDetail}
          onDownload={onDownload}
          loadedFonts={loadedFonts}
          setLoadedFonts={setLoadedFonts}
          filteredResources={filteredResources}
          onSelectResource={setSelectedResource}
          isFavoritesView={showFavorites}
        />
      </Suspense>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />

      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-[9999] h-12 w-12 rounded-full shadow-lg bg-cow-purple hover:bg-cow-purple-dark transition-all duration-300 opacity-90 hover:opacity-100 text-white border-2 border-white/10"
              size="icon"
              aria-label="Scroll to top"
            >
              <IconArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourcesHub;
