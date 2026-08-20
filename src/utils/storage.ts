const K = {
  URL: 'sona_url',
  VOL: 'sona_vol',
  THEME: 'sona_theme',
  RECENTS: 'sona_recents',
} as const;

export type Theme = 'dark' | 'light';

export interface RecentPlaylist {
  id: string;
  url: string;
  /** Filled in from oEmbed once it resolves; the id stands in until then. */
  title?: string;
  author?: string;
  playedAt: number;
}

/** Guards against hand-edited or stale localStorage rather than trusting it. */
function isRecent(v: unknown): v is RecentPlaylist {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.url === 'string' && typeof r.playedAt === 'number';
}

export const storage = {
  getUrl: (): string => localStorage.getItem(K.URL) ?? '',
  setUrl: (v: string) => localStorage.setItem(K.URL, v),
  getVolume: (): number => {
    const v = localStorage.getItem(K.VOL);
    return v != null ? Math.max(0, Math.min(100, parseInt(v, 10))) : 80;
  },
  setVolume: (v: number) => localStorage.setItem(K.VOL, String(v)),
  getTheme: (): Theme => (localStorage.getItem(K.THEME) === 'light' ? 'light' : 'dark'),
  setTheme: (v: Theme) => localStorage.setItem(K.THEME, v),
  getRecents: (): RecentPlaylist[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(K.RECENTS) ?? '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(isRecent).sort((a, b) => b.playedAt - a.playedAt);
    } catch {
      return [];
    }
  },
  setRecents: (v: RecentPlaylist[]) => localStorage.setItem(K.RECENTS, JSON.stringify(v)),
};
