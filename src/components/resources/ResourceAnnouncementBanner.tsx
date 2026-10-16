import { useState } from "react";
import { IconArrowRight, IconX } from "@tabler/icons-react";

const DISMISSED_KEY = "resources-announcement-dismissed-v1";
const readDismissed = () => {
  try { return localStorage.getItem(DISMISSED_KEY) === "true"; } catch { return false; }
};

export default function ResourceAnnouncementBanner({ onExplore }: { onExplore: () => void }) {
  const [visible, setVisible] = useState(() => !readDismissed());
  if (!visible) return null;
  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* Best-effort persistence. */ }
    setVisible(false);
  };
  return <aside className="mx-auto mb-6 flex max-w-5xl items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-foreground">New: Minecraft Creator-Safe Playlist</p>
      <p className="truncate text-muted-foreground">Browse 725 creator-friendly tracks and the latest shader tools.</p>
    </div>
    <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary" onClick={onExplore}>Explore <IconArrowRight className="h-4 w-4" /></button>
    <button type="button" aria-label="Dismiss announcement" onClick={dismiss} className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"><IconX className="h-4 w-4" /></button>
  </aside>;
}
