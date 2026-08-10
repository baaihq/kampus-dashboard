import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'kampus-theme';
const FAVORITES_KEY = 'kampus-favorites';
const RECENT_KEY = 'kampus-recent-searches';

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readStored<Theme | null>(THEME_KEY, null);
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    writeStored(THEME_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}

export function useFavorites(): {
  favorites: string[];
  isFavorite: (key: string) => boolean;
  toggleFavorite: (key: string) => void;
} {
  const [favorites, setFavorites] = useState<string[]>(() => readStored<string[]>(FAVORITES_KEY, []));

  const toggleFavorite = useCallback((key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      writeStored(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((key: string) => favorites.includes(key), [favorites]);

  return { favorites, isFavorite, toggleFavorite };
}

export function useRecentSearches(limit = 8): {
  recent: string[];
  addRecent: (term: string) => void;
  clearRecent: () => void;
} {
  const [recent, setRecent] = useState<string[]>(() => readStored<string[]>(RECENT_KEY, []));

  const addRecent = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) return;
      setRecent((prev) => {
        const next = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, limit);
        writeStored(RECENT_KEY, next);
        return next;
      });
    },
    [limit]
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
    writeStored(RECENT_KEY, []);
  }, []);

  return { recent, addRecent, clearRecent };
}
