import { storage, type RecentPlaylist } from './storage';
import { fetchPlaylistMeta } from './youtube';

/** How many playlists the start screen offers back. */
export const MAX_RECENTS = 5;

/**
 * Records a playlist as most recently played, moving it to the top rather than
 * duplicating it. The title is backfilled from oEmbed the first time a playlist
 * is seen, so the list survives being written before the name is known.
 */
export function rememberPlaylist(id: string, url: string) {
  const existing = storage.getRecents();
  const prior = existing.find(r => r.id === id);

  const entry: RecentPlaylist = {
    id,
    url,
    title: prior?.title,
    author: prior?.author,
    playedAt: Date.now(),
  };

  storage.setRecents([entry, ...existing.filter(r => r.id !== id)].slice(0, MAX_RECENTS));

  if (entry.title) return;

  fetchPlaylistMeta(id).then(meta => {
    if (!meta) return;
    // Re-read rather than patching the array above — the fetch is in flight
    // while the user is already playing, and storage may have moved on.
    storage.setRecents(
      storage.getRecents().map(r =>
        r.id === id ? { ...r, title: meta.title, author: meta.author } : r
      )
    );
  });
}
