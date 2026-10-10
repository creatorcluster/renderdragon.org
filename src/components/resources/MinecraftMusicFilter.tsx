import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconSearch, IconX, IconVinyl, IconMusic, IconDisc } from '@tabler/icons-react';

const albumImageCache = new Map<string, string>();

const getAlbumImageUrl = (albumName: string): string => {
  const cached = albumImageCache.get(albumName);
  if (cached) return cached;
  const sanitized = albumName.replace(/[<>:"/\\|?*]/g, '_').trim();
  const url = `/albums/${sanitized}.jpg`;
  albumImageCache.set(albumName, url);
  return url;
};

const AlbumThumb = ({ album, selected }: { album: string; selected: boolean }) => {
  const src = getAlbumImageUrl(album);
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className={`w-10 h-10 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center ${selected ? 'ring-2 ring-primary/40' : ''} bg-muted`}>
        <IconMusic className="h-5 w-5 text-muted-foreground/60" />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-md flex-shrink-0 overflow-hidden ${selected ? 'ring-2 ring-primary/40' : ''}`}>
      <img
        src={src}
        alt=""
        className="block w-full h-full object-cover"
        loading="eager"
        onError={() => setErrored(true)}
      />
    </div>
  );
};

interface MinecraftMusicFilterProps {
  albums: string[];
  albumCounts: Record<string, number>;
  selectedAlbum: string | null;
  onAlbumChange: (album: string | null) => void;
}

const MinecraftMusicFilter = ({ albums, albumCounts, selectedAlbum, onAlbumChange }: MinecraftMusicFilterProps) => {
  const [albumSearch, setAlbumSearch] = useState('');

  const totalTracks = useMemo(() =>
    Object.values(albumCounts).reduce((sum, c) => sum + c, 0),
    [albumCounts]
  );

  const filteredAlbums = useMemo(() => {
    if (!albumSearch) return albums;
    const searchLower = albumSearch.toLowerCase();
    return albums.filter(a => a.toLowerCase().includes(searchLower));
  }, [albums, albumSearch]);

  if (albums.length === 0) return null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card/80 to-card/30 border border-border rounded-lg  overflow-hidden shadow-lg shadow-primary/5">
      <div className="p-3 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <h3 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          <IconVinyl className="h-4 w-4 text-primary" />
          <span className="text-foreground/80 font-semibold">Albums</span>
          <span className="text-[10px] text-muted-foreground/60 font-normal ml-auto">{albums.length} albums</span>
        </h3>

        <div className="relative mb-2">
          <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search albums..."
            value={albumSearch}
            onChange={(e) => setAlbumSearch(e.target.value)}
            className="pl-8 h-8 text-sm  bg-background border-border/40 focus:border-primary/40"
          />
          {albumSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/60"
              onClick={() => setAlbumSearch('')}
            >
              <IconX className="h-3 w-3" />
            </Button>
          )}
        </div>

        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-primary/10 px-2.5 py-1.5 rounded-md border border-primary/20"
          >
            <AlbumThumb album={selectedAlbum} selected />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary truncate font-medium" title={selectedAlbum}>
                {selectedAlbum}
              </p>
              <p className="text-[10px] text-primary/60">
                {albumCounts[selectedAlbum]} {albumCounts[selectedAlbum] === 1 ? 'track' : 'tracks'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-primary hover:text-primary/80 hover:bg-primary/10 flex-shrink-0 px-2"
              onClick={() => onAlbumChange(null)}
            >
              Clear
            </Button>
          </motion.div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <motion.div
            className={`
              flex items-center gap-3 py-2.5 px-3 rounded-md cursor-pointer mb-1
              transition-all duration-150 group
              ${!selectedAlbum
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'hover:bg-accent border border-transparent'
              }
            `}
            onClick={() => onAlbumChange(null)}
            whileHover={selectedAlbum ? { x: 3 } : {}}
          >
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-md flex-shrink-0
              ${!selectedAlbum ? 'bg-primary/20' : 'bg-muted group-hover:bg-muted'}
              transition-colors duration-150
            `}>
              <IconDisc className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${!selectedAlbum ? 'text-primary' : 'text-foreground/80'}`}>
                All Albums
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/50 bg-background px-2 py-0.5 rounded ml-auto font-mono flex-shrink-0">
              {totalTracks}
            </span>
          </motion.div>

          <div className="h-px bg-border/40 mx-3 my-2" />

          <AnimatePresence>
            {filteredAlbums.map((album, i) => (
              <motion.div
                key={album}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
                className={`
                  flex items-center gap-3 py-2.5 px-3 rounded-md cursor-pointer mb-1
                  transition-all duration-150 group
                  ${selectedAlbum === album
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'hover:bg-accent border border-transparent'
                  }
                `}
                onClick={() => onAlbumChange(album)}
              >
                <AlbumThumb album={album} selected={selectedAlbum === album} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${selectedAlbum === album ? 'font-medium text-primary' : 'text-foreground/80'}`} title={album}>
                    {album}
                  </p>
                  <p className={`text-[10px] truncate ${selectedAlbum === album ? 'text-primary/60' : 'text-muted-foreground/50'}`}>
                    {albumCounts[album]} {albumCounts[album] === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
                <span className={`
                  text-[11px] font-mono flex-shrink-0
                  ${selectedAlbum === album
                    ? 'bg-primary/20 text-primary'
                    : 'bg-background text-muted-foreground/50'
                  }
                  px-2 py-0.5 rounded
                `}>
                  {albumCounts[album]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlbums.length === 0 && albumSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 text-muted-foreground text-sm"
            >
              <IconSearch className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
              No albums match your search
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MinecraftMusicFilter;
