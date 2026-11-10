/**
 * Guest (signed-out) favourites + folders backed by localStorage.
 * Everything here is device-local and never synced across devices.
 * When a user signs in, this data is ignored in favour of the Supabase
 * backend; when they sign out, they return to this local data.
 *
 * This module is the single source of truth for that data: components read it
 * through the snapshot/subscribe pair so there is exactly one copy in the tree
 * and no cross-hook change events are needed.
 */

export const GUEST_FAVORITES_KEY = 'rd_guest_favorites';
export const GUEST_FOLDERS_KEY = 'rd_guest_folders';

const LEGACY_HEARTED_KEY = 'heartedResources';

export interface GuestFavorite {
  resource_url: string;
  folder_id: string | null;
}

export interface GuestFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
}

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `gf-${crypto.randomUUID()}`;
  }
  return `gf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---- Store plumbing -------------------------------------------------------

type Listener = () => void;

const favoriteListeners = new Set<Listener>();
const folderListeners = new Set<Listener>();

// Referentially stable snapshots. `null` means "not read from storage yet".
// They are only ever replaced on write or on a cross-tab `storage` event, which
// is what `useSyncExternalStore` requires: the snapshot must not change identity
// between reads or React re-renders forever.
let favoritesSnapshot: GuestFavorite[] | null = null;
let foldersSnapshot: GuestFolder[] | null = null;

function emit(listeners: Set<Listener>): void {
  // Copy first: a listener may unsubscribe (or subscribe) while we notify.
  for (const listener of Array.from(listeners)) listener();
}

export function subscribeGuestFavorites(listener: Listener): () => void {
  favoriteListeners.add(listener);
  return () => {
    favoriteListeners.delete(listener);
  };
}

export function getGuestFavoritesSnapshot(): GuestFavorite[] {
  if (favoritesSnapshot === null) {
    favoritesSnapshot = readGuestFavorites();
  }
  return favoritesSnapshot;
}

export function subscribeGuestFolders(listener: Listener): () => void {
  folderListeners.add(listener);
  return () => {
    folderListeners.delete(listener);
  };
}

export function getGuestFoldersSnapshot(): GuestFolder[] {
  if (foldersSnapshot === null) {
    foldersSnapshot = readGuestFolders();
  }
  return foldersSnapshot;
}

// Cross-tab updates land as `storage` events; same-tab updates go through the
// write functions below, which notify synchronously.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === null || event.key === GUEST_FAVORITES_KEY) {
      favoritesSnapshot = readGuestFavorites();
      emit(favoriteListeners);
    }
    if (event.key === null || event.key === GUEST_FOLDERS_KEY) {
      foldersSnapshot = readGuestFolders();
      emit(folderListeners);
    }
  });
}

// ---- Favourites -----------------------------------------------------------

function readGuestFavoritesFromStorage(): GuestFavorite[] {
  return safeParse<GuestFavorite[]>(localStorage.getItem(GUEST_FAVORITES_KEY), []);
}

/**
 * Read favourites, migrating the legacy flat "heartedResources" string[]
 * into the { resource_url, folder_id } shape (all unassigned).
 */
export function readGuestFavorites(): GuestFavorite[] {
  const stored = readGuestFavoritesFromStorage();
  if (stored.length > 0) {
    // Real data exists, so any legacy key is dead weight and must not be
    // allowed to resurrect old hearts after the list is emptied.
    localStorage.removeItem(LEGACY_HEARTED_KEY);
    return stored;
  }

  const raw = safeParse<unknown[] | null>(localStorage.getItem(LEGACY_HEARTED_KEY), null);
  if (Array.isArray(raw)) {
    localStorage.removeItem(LEGACY_HEARTED_KEY);
    const migrated = raw
      .filter((x): x is string => typeof x === 'string')
      .map((resource_url) => ({ resource_url, folder_id: null }));
    if (migrated.length > 0) {
      writeGuestFavorites(migrated, false);
    }
    return migrated;
  }
  return [];
}

export function writeGuestFavorites(favorites: GuestFavorite[], shouldNotify = true): void {
  favoritesSnapshot = favorites;
  try {
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Quota or private mode: keep the in-memory snapshot so the session still works.
  }
  if (shouldNotify) emit(favoriteListeners);
}

// ----------------------------------------------------------------- Folders -

export function readGuestFolders(): GuestFolder[] {
  return safeParse<GuestFolder[]>(localStorage.getItem(GUEST_FOLDERS_KEY), []);
}

export function writeGuestFolders(folders: GuestFolder[], shouldNotify = true): void {
  foldersSnapshot = folders;
  try {
    localStorage.setItem(GUEST_FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    // Quota or private mode: keep the in-memory snapshot so the session still works.
  }
  if (shouldNotify) emit(folderListeners);
}
