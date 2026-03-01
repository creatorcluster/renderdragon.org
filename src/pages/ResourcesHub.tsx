import { useRef, useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResources } from '@/hooks/useResources';
import { Resource } from '@/types/resources';
import ResourceFilters from '@/components/resources/ResourceFilters';
import SortSelector from '@/components/resources/SortSelector';
import ResourcesList from '@/components/resources/ResourcesList';
import FavoritesTab from '@/components/resources/FavoritesTab';
import CreatorPacksTab from '@/components/resources/CreatorPacksTab';
import McSoundsBrowser from '@/components/resources/McSoundsBrowser';
import McIconsBrowser from '@/components/resources/McIconsBrowser';
import AuthDialog from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { IconArrowUp, IconHeart, IconSearch, IconPackage } from '@tabler/icons-react';
import { Helmet } from "react-helmet-async";



const ResourceDetailDialog = lazy(() => import('@/components/resources/ResourceDetailDialog'));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cow-purple"></div>
  </div>
);

const ResourcesHub = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resources' | 'favorites' | 'creator-packs'>('resources');


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
    fontPreviewText,
    setFontPreviewText,
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
  } = useResources();

  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const isMcSoundsView = selectedCategory === 'mcsounds';
  const isMcIconsView = selectedCategory === 'minecraft-icons';

  const mcsoundsResourceCount = useMemo(() => {
    if (!isMcSoundsView) return {};
    const countMap: Record<string, number> = {};
    resources.forEach(r => {
      if (r.subcategory) {
        countMap[r.subcategory] = (countMap[r.subcategory] || 0) + 1;
      }
    });
    return countMap;
  }, [resources, isMcSoundsView]);

  const mciconsResourceCount = useMemo(() => {
    if (!isMcIconsView) return {};
    const countMap: Record<string, number> = {};
    resources.forEach(r => {
      if (r.subcategory) {
        countMap[r.subcategory] = (countMap[r.subcategory] || 0) + 1;
      }
    });
    return countMap;
  }, [resources, isMcIconsView]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset > 400;
      setShowScrollTop(scrolled);
    };

    const handleShowFavorites = () => {
      setActiveTab('favorites');
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('showFavorites', handleShowFavorites);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('showFavorites', handleShowFavorites);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'favorites') setActiveTab('favorites');
    else if (tabParam === 'creator-packs') setActiveTab('creator-packs');
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const onDownload = (resource: Resource) => {
    const success = handleDownload(resource);
    if (success) {
      toast.info('Download starting...', {
        description: 'Downloading resource...',
        duration: 3000,
      });
    } else {
      toast.error('Download error');
    }
  };

  const renderContent = () => (
    <>
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
        fontPreviewText={fontPreviewText}
        onFontPreviewTextChange={setFontPreviewText}
      />

      {(selectedCategory === 'minecraft-icons' || selectedCategory === 'mcsounds') && (
        <p className="text-xs text-center text-muted-foreground mb-6 -mt-4 opacity-50 hover:opacity-100 transition-opacity">
          Powered by Hamburger API
        </p>
      )}

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
        fontPreviewText={fontPreviewText}
      />
    </>
  );

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-vt323 font-bold mb-2 text-center">Resources Hub</h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">Discover and download a wide range of resources to enhance your RenderDragon experience.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Button
                variant={activeTab === 'resources' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('resources')}
                className="pixel-corners"
              >
                <IconSearch className="h-4 w-4 mr-2" />
                Resources
              </Button>
              <div className="relative">
                <Button
                  variant={activeTab === 'favorites' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('favorites')}
                  className="pixel-corners"
                >
                  <IconHeart className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
                <span className="absolute -top-2 -right-3 bg-cow-purple text-white text-[10px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wide border border-background shadow-sm z-10 pointer-events-none">
                  NEW
                </span>
              </div>
              <div className="relative">
                <Button
                  variant={activeTab === 'creator-packs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('creator-packs')}
                  className="pixel-corners"
                >
                  <IconPackage className="h-4 w-4 mr-2" />
                  Creator Packs
                </Button>
                <span className="absolute -top-2 -right-3 bg-cow-purple text-white text-[10px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wide border border-background shadow-sm z-10 pointer-events-none">
                  NEW
                </span>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'favorites' ? (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-7xl mx-auto"
                >
                  <FavoritesTab onSelectResource={setSelectedResource} />
                </motion.div>
              ) : activeTab === 'creator-packs' ? (
                <motion.div
                  key="creator-packs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CreatorPacksTab />
                </motion.div>
              ) : (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {(isMcSoundsView || isMcIconsView) && !isMobile ? (
                    <div className="flex gap-6 max-w-7xl mx-auto">
                      <div className="flex-1 min-w-0">
                        {renderContent()}
                      </div>
                      <div className="w-80 flex-shrink-0">
                        <div className="sticky top-28 h-[calc(100vh-8rem)]">
                          {isMcSoundsView ? (
                            <McSoundsBrowser
                              subcategories={availableSubcategories}
                              selectedSubcategory={selectedSubcategory}
                              onSubcategoryChange={handleSubcategoryChange}
                              resourceCount={mcsoundsResourceCount}
                            />
                          ) : (
                            <McIconsBrowser
                              subcategories={availableSubcategories}
                              selectedSubcategory={selectedSubcategory}
                              onSubcategoryChange={handleSubcategoryChange}
                              resourceCount={mciconsResourceCount}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      {renderContent()}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />


      <Suspense fallback={null}>
        <ResourceDetailDialog
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onDownload={onDownload}
          loadedFonts={loadedFonts}
          setLoadedFonts={setLoadedFonts}
          filteredResources={filteredResources}
          onSelectResource={setSelectedResource}
          isFavoritesView={activeTab === 'favorites'}
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
