import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PixelSvgIcon from '@/components/PixelSvgIcon';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconChevronRight, IconExternalLink, IconFolder, IconFolderOpen, IconMusic, IconSearch, IconSunglasses, IconX } from '@tabler/icons-react';
import MusicLinkDialog from '@/components/resources/MusicLinkDialog';

interface MusicLinksMessage {
  links?: string[];
}

interface MusicLinksChannel {
  name: string;
  messages?: MusicLinksMessage[];
}

interface MusicLinksCategory {
  name: string;
  channels?: MusicLinksChannel[];
}

interface MusicLinksData {
  categories?: MusicLinksCategory[];
}

interface MusicLinkItem {
  id: string;
  category: string;
  channel: string;
  link: string;
}

const PAGE_SIZE = 24;

const normalizeLabel = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

const extractYoutubeVideoId = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1);
      return id || null;
    }

    if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }

      if (url.pathname.startsWith('/shorts/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[1] || null;
      }

      if (url.pathname.startsWith('/embed/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getEmbedInfo = (link: string) => {
  const videoId = extractYoutubeVideoId(link);

  if (videoId) {
    return {
      isYoutube: true,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  return {
    isYoutube: false,
    thumbnailUrl: null,
    embedUrl: null,
  };
};

// YouTube titles via oEmbed (through noembed for CORS). Cached per video id so
// repeated views don't refetch.
const youtubeTitleCache = new Map<string, string | null>();
const youtubeTitlePending = new Map<string, Promise<string | null>>();

const fetchYoutubeTitle = (videoId: string): Promise<string | null> => {
  if (youtubeTitleCache.has(videoId)) return Promise.resolve(youtubeTitleCache.get(videoId) ?? null);
  const pending = youtubeTitlePending.get(videoId);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      const data: { title?: unknown } = await res.json();
      const title = typeof data?.title === 'string' && data.title ? data.title : null;
      youtubeTitleCache.set(videoId, title);
      return title;
    } catch {
      youtubeTitleCache.set(videoId, null);
      return null;
    } finally {
      youtubeTitlePending.delete(videoId);
    }
  })();

  youtubeTitlePending.set(videoId, request);
  return request;
};

const YoutubeEmbed = ({ embedUrl, title, thumbnailUrl }: { embedUrl: string; title: string; thumbnailUrl?: string | null }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full bg-muted">
      {!loaded && (
        <div className="absolute inset-0 overflow-hidden">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs">Loading video…</span>
          </div>
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title}
        onLoad={() => setLoaded(true)}
        className={cn('h-full w-full transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

const YoutubeLinkLabel = ({ item }: { item: MusicLinkItem }) => {
  const videoId = extractYoutubeVideoId(item.link);
  const [title, setTitle] = useState<string | null>(
    videoId ? youtubeTitleCache.get(videoId) ?? null : null,
  );

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    fetchYoutubeTitle(videoId).then((resolved) => {
      if (active) setTitle(resolved);
    });
    return () => {
      active = false;
    };
  }, [videoId]);

  const label = title ?? (videoId ? 'YouTube video' : item.link);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
      title={item.link}
    >
      <img src="/assets/youtube_icon.png" alt="" className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
};

const MusicPacksTab = () => {
  const [musicLinksData, setMusicLinksData] = useState<MusicLinksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copyrightLink, setCopyrightLink] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMusicLinks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch('/data/music-links.json');
      if (!response.ok) {
        throw new Error(`Failed to load music links (${response.status})`);
      }

      const data: MusicLinksData = await response.json();
      if (!data || !Array.isArray(data.categories)) {
        throw new Error('Music links data format is invalid');
      }

      setMusicLinksData(data);
      const firstCategory = data.categories[0]?.name || null;
      setSelectedCategory(firstCategory);
      if (firstCategory) {
        setExpandedCategories(new Set([firstCategory]));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load music links';
      setLoadError(errorMessage);
      setMusicLinksData({ categories: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMusicLinks();
  }, [loadMusicLinks]);

  const allLinks = useMemo<MusicLinkItem[]>(() => {
    if (!musicLinksData?.categories) return [];

    const links: MusicLinkItem[] = [];

    musicLinksData.categories.forEach(category => {
      category.channels?.forEach(channel => {
        channel.messages?.forEach((message, messageIndex) => {
          message.links?.forEach((link, linkIndex) => {
            links.push({
              id: `${category.name}-${channel.name}-${messageIndex}-${linkIndex}`,
              category: category.name,
              channel: channel.name,
              link,
            });
          });
        });
      });
    });

    return links;
  }, [musicLinksData]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLinks.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allLinks]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLinks.forEach(item => {
      const key = `${item.category}::${item.channel}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [allLinks]);

  const filteredCategories = useMemo(() => {
    const categories = musicLinksData?.categories ?? [];
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map(category => {
        const categoryMatches = category.name.toLowerCase().includes(query);
        const matchedChannels = (category.channels ?? []).filter(channel => {
          const channelMatches = channel.name.toLowerCase().includes(query);
          return categoryMatches || channelMatches;
        });

        if (categoryMatches) {
          return category;
        }

        return {
          ...category,
          channels: matchedChannels,
        };
      })
      .filter(category => (category.channels?.length ?? 0) > 0 || category.name.toLowerCase().includes(query));
  }, [musicLinksData, searchQuery]);

  const filteredLinks = useMemo(() => {
    return allLinks.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesChannel = selectedChannel ? item.channel === selectedChannel : true;
      return matchesCategory && matchesChannel;
    });
  }, [allLinks, selectedCategory, selectedChannel]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedChannel]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= filteredLinks.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredLinks.length));
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount, filteredLinks.length]);

  const displayedLinks = useMemo(() => filteredLinks.slice(0, visibleCount), [filteredLinks, visibleCount]);

  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedChannel(null);
    setExpandedCategories(prev => new Set(prev).add(categoryName));
  }, []);

  const handleSelectChannel = useCallback((categoryName: string, channelName: string) => {
    setSelectedCategory(categoryName);
    setSelectedChannel(channelName);
    setExpandedCategories(prev => new Set(prev).add(categoryName));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        <div className="h-[70vh] rounded-lg border border-border bg-card animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`music-links-skeleton-${idx}`} className="aspect-video rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="md:sticky md:top-28 md:h-[calc(100vh-8rem)]">
          <div className="md:h-full flex flex-col bg-card border border-border rounded-lg  overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <PixelSvgIcon name="music" className="h-4 w-4 text-primary" />
                Music Packs Browser
              </div>
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cato or sub cat..."
                  className="h-8 pl-8 pr-8 text-sm "
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="p-2">
                <motion.button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedChannel(null);
                  }}
                  whileHover={{ x: 2 }}
                  className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${!selectedCategory && !selectedChannel ? 'bg-primary/20 text-primary' : 'hover:bg-accent'}`}
                >
                  <IconFolderOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">All Music Links</span>
                  <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-auto">
                    {allLinks.length}
                  </span>
                </motion.button>

                {filteredCategories.map(category => {
                  const isExpanded = expandedCategories.has(category.name);
                  const isCategorySelected = selectedCategory === category.name && !selectedChannel;

                  return (
                    <div key={category.name} className="mt-1">
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                      >
                        {isExpanded ? <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        {isExpanded ? <IconFolderOpen className="h-4 w-4 text-yellow-500" /> : <IconFolder className="h-4 w-4 text-yellow-500/80" />}
                        <span className="text-sm truncate">{normalizeLabel(category.name)}</span>
                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-auto">
                          {categoryCounts[category.name] || 0}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <button
                              onClick={() => handleSelectCategory(category.name)}
                              className={`w-[calc(100%-1.5rem)] text-left ml-6 mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${isCategorySelected ? 'bg-primary/20 text-primary' : 'hover:bg-accent'}`}
                            >
                              <IconFolder className="h-4 w-4 text-yellow-500/80" />
                              <span className="text-sm truncate">All in {normalizeLabel(category.name)}</span>
                            </button>

                            {(category.channels ?? []).map(channel => {
                              const isChannelSelected = selectedCategory === category.name && selectedChannel === channel.name;
                              const countKey = `${category.name}::${channel.name}`;

                              return (
                                <button
                                  key={`${category.name}-${channel.name}`}
                                  onClick={() => handleSelectChannel(category.name, channel.name)}
                                  className={`w-[calc(100%-1.5rem)] text-left ml-6 mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${isChannelSelected ? 'bg-primary/20 text-primary' : 'hover:bg-accent'}`}
                                >
                                  <IconFolder className="h-4 w-4 text-yellow-500/80" />
                                  <span className="text-sm truncate">{normalizeLabel(channel.name)}</span>
                                  <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-auto">
                                    {channelCounts[countKey] || 0}
                                  </span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {loadError && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">
              Couldn&apos;t load music packs: {loadError}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadMusicLinks}>
              Retry
            </Button>
          </div>
        )}

        <div className="mb-4 px-1">
          <h2 className="text-2xl font-geist font-bold">Music Packs</h2>
          <p className="text-sm text-muted-foreground">
            Browsing {selectedChannel ? normalizeLabel(selectedChannel) : selectedCategory ? normalizeLabel(selectedCategory) : 'All categories'} • {filteredLinks.length} links
          </p>
        </div>

        {displayedLinks.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No links found for this selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedLinks.map(item => {
              const embedInfo = getEmbedInfo(item.link);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex flex-col border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div className="mb-3 aspect-video overflow-hidden border border-border/70 bg-muted">
                    {embedInfo.isYoutube && embedInfo.embedUrl ? (
                      <YoutubeEmbed
                        embedUrl={embedInfo.embedUrl}
                        title={item.link}
                        thumbnailUrl={embedInfo.thumbnailUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <IconMusic className="h-10 w-10 opacity-50" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <YoutubeLinkLabel item={item} />
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCopyrightLink(item.link)}
                        className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <IconSunglasses className="h-3.5 w-3.5" />
                        Check copyright
                      </button>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center text-primary transition-colors hover:text-primary/80"
                        aria-label="Open on YouTube"
                      >
                        <IconExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground/80">
                    {normalizeLabel(item.category)} / {normalizeLabel(item.channel)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {visibleCount < filteredLinks.length && (
          <div ref={loadMoreRef} className="h-12 mt-4 flex items-center justify-center text-xs text-muted-foreground">
            Loading more embeds...
          </div>
        )}

        <MusicLinkDialog
          link={copyrightLink ?? ''}
          open={!!copyrightLink}
          onClose={() => setCopyrightLink(null)}
        />
      </div>
    </div>
  );
};

export default MusicPacksTab;
