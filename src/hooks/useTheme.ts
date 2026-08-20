import { useEffect, useState } from 'react';
import { storage, type Theme } from '../utils/storage';

/** Page background colours, mirrored from the --ink token in index.css. */
const CHROME: Record<Theme, string> = { dark: '#060606', light: '#FFFFFF' };

/**
 * Flips the palette by stamping `data-theme` on <html>; every colour in the
 * app resolves through CSS variables, so the whole system follows. The choice
 * persists, and the mobile browser chrome is kept in step with the page.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storage.getTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.setTheme(theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', CHROME[theme]);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
  };
}
