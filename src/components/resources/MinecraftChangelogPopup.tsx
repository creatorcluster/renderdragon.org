import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconX, IconBrandSpotify, IconApi, IconMusic, IconAlbum, IconVinyl } from '@tabler/icons-react';

const CHANGELOG_KEY = 'mc-creator-playlist-changelog-dismissed';

const MinecraftChangelogPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(CHANGELOG_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(CHANGELOG_KEY, 'true');
    setOpen(false);
    window.dispatchEvent(new CustomEvent('mc-playlist-dismissed'));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-lg  bg-gradient-to-b from-card/95 to-card/70 border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Minecraft Creator Playlist integration</DialogTitle>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-center leading-tight">
            Minecraft Creator Playlist Integration
          </h1>

          <img
            src="/cover.webp"
            alt="Minecraft Creator Playlist"
            className="w-full rounded-lg border border-border/40"
          />

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground/80 font-medium">
              We've integrated the Minecraft Creator-Safe Playlist API directly into the Resources Hub. Browse, search, and play Minecraft music tracks by album — all in one place.
            </p>

            <div>
              <h4 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <IconVinyl className="h-3.5 w-3.5 text-primary" />
                What's new
              </h4>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <IconMusic className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground/80">725 tracks</strong> from the Creator-Safe Playlist, playable in-browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconAlbum className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground/80">70 album covers</strong> with album-based filtering and search</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconApi className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Powered by the <strong className="text-foreground/80">Minecraft Creator-Safe Playlist API</strong></span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="https://open.spotify.com/playlist/5T4KWhz9Q8r98skQBimtlH"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 transition-colors text-sm font-medium"
              >
                <IconBrandSpotify className="h-5 w-5" />
                Listen on Spotify
                <IconX className="h-3 w-3 ml-auto rotate-45" />
              </a>
              <a
                href="https://github.com/powernplant/minecraft-creator-safe-playlist-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-foreground/5 hover:bg-foreground/10 transition-colors text-sm text-foreground/70"
              >
                <IconApi className="h-4 w-4" />
                API Repository
                <IconX className="h-3 w-3 ml-auto rotate-45" />
              </a>
            </div>
          </div>

          <Button
            onClick={dismiss}
            className="w-full  bg-primary hover:bg-primary/90"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MinecraftChangelogPopup;
