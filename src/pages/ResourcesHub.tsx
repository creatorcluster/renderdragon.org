import { useRef, useEffect, useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResources } from '@/hooks/useResources';
import { useMinecraftMusic, ensurePlaylistCached } from '@/hooks/useMinecraftMusic';
import { Resource, getResourceUrl } from '@/types/resources';
import { MusicMood } from '@/types/music';
import { DownloadProgress } from '@/lib/download';
import { buildMusicLink } from '@/utils/musicLink';
import { fetchFromAssetsApi } from '@/lib/assetsApi';
import ResourceFilters from '@/components/resources/ResourceFilters';
import SortSelector from '@/components/resources/SortSelector';
import ResourcesList from '@/components/resources/ResourcesList';
import FavoritesTab from '@/components/resources/FavoritesTab';
import CreatorPacksTab from '@/components/resources/CreatorPacksTab';
import MusicPacksTab from '@/components/resources/MusicPacksTab';
import MusicMoodFilter from '@/components/resources/MusicMoodFilter';
import MinecraftMusicFilter from '@/components/resources/MinecraftMusicFilter';
import MusicLinkDialog from '@/components/resources/MusicLinkDialog';
import McSoundsBrowser from '@/components/resources/McSoundsBrowser';
import McIconsBrowser from '@/components/resources/McIconsBrowser';
import AuthDialog from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { IconHeart, IconSearch, IconPackage, IconMusic, IconMoodHappy, IconFilter, IconPlayerPlay, IconAlbum } from '@tabler/icons-react';
import { Helmet } from "react-helmet-async";



const ResourceDetailDialog = lazy(() => import('@/components/resources/ResourceDetailDialog'));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const ResourcesHub = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resources' | 'favorites' | 'creator-packs' | 'music-packs'>('resources');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [mobileMoodFilterOpen, setMobileMoodFilterOpen] = useState(false);
  const [musicView, setMusicView] = useState<'community' | 'minecraft'>('community');
  const [musicLink, setMusicLink] = useState<{ resource: Resource; link: string } | null>(null);

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
  const isMusicView = selectedCategory === 'music';
  const isMinecraftMusicView = isMusicView && musicView === 'minecraft';

  const minecraftMusic = useMinecraftMusic(isMinecraftMusicView);

  const [musicMoodsData, setMusicMoodsData] = useState<MusicMood[]>([]);

  useEffect(() => {
    ensurePlaylistCached();
  }, []);

  useEffect(() => {
    if (isMusicView && musicMoodsData.length === 0) {
      fetchFromAssetsApi('/music_moods')
        .then(res => res.json())
        .then(data => setMusicMoodsData(data))
        .catch(err => console.error('Failed to load music moods:', err));
    }
  }, [isMusicView, musicMoodsData.length]);

  const moodFilteredResources = useMemo(() => {
    if (!isMusicView || isMinecraftMusicView || selectedMoods.length === 0) return filteredResources;

    const moodsMap = new Map(musicMoodsData.map(item => [item.filename.toLowerCase(), item.moods]));

    return filteredResources.filter(resource => {
      const filename = (resource.filename || resource.title).toLowerCase();
      const resourceMoods = moodsMap.get(filename);
      if (!resourceMoods) return false;
      return selectedMoods.some(mood => resourceMoods.includes(mood));
    });
  }, [filteredResources, isMusicView, isMinecraftMusicView, selectedMoods, musicMoodsData]);

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
    const handleShowFavorites = () => {
      setActiveTab('favorites');
    };

    window.addEventListener('showFavorites', handleShowFavorites);

    return () => {
      window.removeEventListener('showFavorites', handleShowFavorites);
    };
  }, []);

  useEffect(() => {
    if (isMinecraftMusicView) {
      minecraftMusic.enablePreCache();
      minecraftMusic.setSearchQuery(searchQuery);
    }
  }, [isMinecraftMusicView, minecraftMusic, searchQuery]);

  useEffect(() => {
    if (selectedCategory !== 'music') {
      setSelectedMoods([]);
      setMusicView('community');
    }
  }, [selectedCategory]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'favorites') setActiveTab('favorites');
    else if (tabParam === 'creator-packs') setActiveTab('creator-packs');
    else if (tabParam === 'music-packs') setActiveTab('music-packs');
  }, []);

  // Deep link from a shared music link: /resources?track=<id>&file=<name>&url=<direct>
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || isLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const track = urlParams.get('track');
    const file = urlParams.get('file');
    const directUrl = urlParams.get('url');
    if (!track && !file && !directUrl) return;

    const match = resources.find((resource) =>
      (track && String(resource.id) === track) ||
      (file && resource.filename === file) ||
      (directUrl && getResourceUrl(resource) === directUrl)
    );
    if (!match) return;

    deepLinkHandled.current = true;
    if (match.category === 'music') {
      setActiveTab('resources');
      setMusicView('community');
      handleCategoryChange('music');
    }
    setSelectedResource(match);

    const cleanUrl = new URL(window.location.href);
    ['track', 'cat', 'file', 'url'].forEach((key) => cleanUrl.searchParams.delete(key));
    window.history.replaceState({}, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
  }, [resources, isLoading, setSelectedResource, handleCategoryChange]);

  const handleSearchWrapped = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e);
    if (isMinecraftMusicView) {
      minecraftMusic.setSearchQuery(e.target.value);
    }
  };

  const handleClearSearchWrapped = () => {
    handleClearSearch();
    if (isMinecraftMusicView) {
      minecraftMusic.setSearchQuery('');
    }
  };

  const handleSearchSubmitWrapped = (e: React.FormEvent) => {
    handleSearchSubmit(e);
  };

  const onDownload = async (resource: Resource, onProgress?: (progress: DownloadProgress) => void) => {
    const success = await handleDownload(resource, onProgress);
    if (success) {
      toast.success('Download complete!', {
        description: 'Your download has started.',
        duration: 3000,
      });
    } else {
      toast.error('Download error');
    }
  };

  const onMusicLink = useCallback((resource: Resource) => {
    const link = buildMusicLink(resource);
    setMusicLink({ resource, link });
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Music link copied');
      }).catch(() => {
        // The dialog still lets the user copy the link manually.
      });
    }
  }, []);

  const renderContent = () => (
    <>
      <ResourceFilters
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        availableSubcategories={availableSubcategories}
        onSearch={handleSearchWrapped}
        onClearSearch={handleClearSearchWrapped}
        onSearchSubmit={handleSearchSubmitWrapped}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        isMobile={isMobile}
        inputRef={inputRef}
      />

      {isMusicView && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={musicView === 'community' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMusicView('community')}
            className=""
          >
            <IconMusic className="h-4 w-4 mr-2" />
            Community Music
          </Button>
          <Button
            variant={musicView === 'minecraft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMusicView('minecraft')}
            className=""
          >
            <IconPlayerPlay className="h-4 w-4 mr-2" />
            Minecraft Music
          </Button>
        </div>
      )}

      {isMinecraftMusicView && isMobile && (
        <div className="mb-4">
          <Sheet open={mobileMoodFilterOpen} onOpenChange={setMobileMoodFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full ">
                <IconAlbum className="h-4 w-4 mr-2" />
                Filter by Album
                {minecraftMusic.selectedAlbum && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {minecraftMusic.selectedAlbum}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] ">
              <SheetTitle className="sr-only">Filter Minecraft music</SheetTitle>
              <div className="h-full py-2">
                <h3 className="text-lg mb-4 flex items-center gap-2">
                  <IconAlbum className="h-5 w-5 text-primary" />
                  Filter by Album
                </h3>
                <MinecraftMusicFilter
                  albums={minecraftMusic.albums}
                  albumCounts={minecraftMusic.albumCounts}
                  selectedAlbum={minecraftMusic.selectedAlbum}
                  onAlbumChange={(album) => {
                    minecraftMusic.setSelectedAlbum(album);
                    if (!album) {
                      setMobileMoodFilterOpen(false);
                    }
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {isMusicView && !isMinecraftMusicView && isMobile && (
        <div className="mb-4">
          <Sheet open={mobileMoodFilterOpen} onOpenChange={setMobileMoodFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full ">
                <IconFilter className="h-4 w-4 mr-2" />
                Filter by Mood
                {selectedMoods.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    {selectedMoods.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] ">
              <SheetTitle className="sr-only">Filter music by mood</SheetTitle>
              <div className="h-full py-2">
                <h3 className="text-lg mb-4 flex items-center gap-2">
                  <IconMoodHappy className="h-5 w-5 text-primary" />
                  Filter by Mood
                </h3>
                <MusicMoodFilter
                  selectedMoods={selectedMoods}
                  onMoodChange={(moods) => {
                    setSelectedMoods(moods);
                    if (moods.length === 0) {
                      setMobileMoodFilterOpen(false);
                    }
                  }}
                  moodsData={musicMoodsData}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {isMinecraftMusicView ? (
          <ResourcesList
          resources={minecraftMusic.resources}
          filteredResources={minecraftMusic.resources}
          isLoading={minecraftMusic.isLoading}
          isSearching={!!minecraftMusic.searchQuery}
          selectedCategory="minecraft-music"
          searchQuery={minecraftMusic.searchQuery}
          onSelectResource={setSelectedResource}
          onClearFilters={handleClearSearchWrapped}
          hasCategoryResources={minecraftMusic.resources.length > 0}
            onMusicLink={onMusicLink}
          />
      ) : (
          <ResourcesList
          resources={resources}
          filteredResources={isMusicView ? moodFilteredResources : filteredResources}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSelectResource={setSelectedResource}
          onClearFilters={handleClearSearch}
          hasCategoryResources={hasCategoryResources}
            onMusicLink={onMusicLink}
          />
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Resources Hub</title>
        <meta name="description" content="Explore a vast collection of resources for RenderDragon." />
        <meta property="og:title" content="Resources Hub" />
        <meta property="og:description" content="Explore a vast collection of resources for RenderDragon." />
        <meta property="og:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
        <meta property="og:url" content="https://renderdragon.org/resources" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Resources Hub" />
        <meta name="twitter:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
      </Helmet>

      <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-center">Resources Hub</h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto ">Discover and download a wide range of resources to enhance your RenderDragon experience.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              <Button
                variant={activeTab === 'resources' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('resources')}
                className=""
              >
                <IconSearch className="h-4 w-4 mr-2" />
                Resources
              </Button>
              <div className="relative">
                <Button
                  variant={activeTab === 'favorites' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('favorites')}
                  className=""
                >
                  <IconHeart className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
                <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wide border border-background shadow-sm z-10 pointer-events-none">
                  NEW
                </span>
              </div>
              <div className="relative">
                <Button
                  variant={activeTab === 'creator-packs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('creator-packs')}
                  className=""
                >
                  <IconPackage className="h-4 w-4 mr-2" />
                  Creator Packs
                </Button>
                <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wide border border-background shadow-sm z-10 pointer-events-none">
                  NEW
                </span>
              </div>
              <div className="relative">
                <Button
                  variant={activeTab === 'music-packs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('music-packs')}
                  className=""
                >
                  <IconMusic className="h-4 w-4 mr-2" />
                  Music Packs
                </Button>
                <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wide border border-background shadow-sm z-10 pointer-events-none">
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
                  className="w-full"
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
              ) : activeTab === 'music-packs' ? (
                <motion.div
                  key="music-packs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MusicPacksTab />
                </motion.div>
              ) : (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {(isMcSoundsView || isMcIconsView || isMusicView) && !isMobile ? (
                    <div className="flex gap-6 w-full">
                      {isMusicView && !isMinecraftMusicView && (
                        <div className="w-64 flex-shrink-0">
                          <div className="sticky top-28 h-[calc(100vh-8rem)]">
                            <MusicMoodFilter
                              selectedMoods={selectedMoods}
                              onMoodChange={setSelectedMoods}
                              moodsData={musicMoodsData}
                            />
                          </div>
                        </div>
                      )}
                      {isMinecraftMusicView && (
                        <div className="w-64 flex-shrink-0">
                          <div className="sticky top-28 h-[calc(100vh-8rem)]">
                            <MinecraftMusicFilter
                              albums={minecraftMusic.albums}
                              albumCounts={minecraftMusic.albumCounts}
                              selectedAlbum={minecraftMusic.selectedAlbum}
                              onAlbumChange={minecraftMusic.setSelectedAlbum}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {renderContent()}
                      </div>
                      {(isMcSoundsView || isMcIconsView) && (
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
                      )}
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

      <MusicLinkDialog
        resource={musicLink?.resource ?? null}
        link={musicLink?.link ?? ''}
        onClose={() => setMusicLink(null)}
      />
    </div>
  );
};

export default ResourcesHub;
