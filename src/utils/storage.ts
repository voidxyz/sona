const K = { URL: 'sona_url', VOL: 'sona_vol' } as const;

export const storage = {
  getUrl: (): string => localStorage.getItem(K.URL) ?? '',
  setUrl: (v: string) => localStorage.setItem(K.URL, v),
  getVolume: (): number => {
    const v = localStorage.getItem(K.VOL);
    return v != null ? Math.max(0, Math.min(100, parseInt(v, 10))) : 80;
  },
  setVolume: (v: number) => localStorage.setItem(K.VOL, String(v)),
};
