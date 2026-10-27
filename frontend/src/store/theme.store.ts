import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hisab-theme';
export const LIGHT_THEME_COLOR = '#f9f9f8';
export const DARK_THEME_COLOR = '#111411';

/**
 * Returns the OS/system preferred color scheme.
 */
export function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeSystemTheme(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => {
    mediaQuery.removeEventListener('change', callback);
  };
}

function getSystemThemeSnapshot(): ResolvedTheme {
  return getSystemPreference();
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return 'light';
}

/**
 * Updates the <meta name="theme-color"> tags.
 * When in system mode: keeps two tags with media="(prefers-color-scheme: ...)" as default.
 * When user explicitly chooses light or dark: updates to a single active tag without media.
 */
export function updateThemeColorMeta(resolved: ResolvedTheme, mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const existingTags = document.querySelectorAll('meta[name="theme-color"]');
  existingTags.forEach((tag) => tag.remove());

  if (mode === 'system') {
    const lightTag = document.createElement('meta');
    lightTag.setAttribute('name', 'theme-color');
    lightTag.setAttribute('media', '(prefers-color-scheme: light)');
    lightTag.setAttribute('content', LIGHT_THEME_COLOR);
    document.head.appendChild(lightTag);

    const darkTag = document.createElement('meta');
    darkTag.setAttribute('name', 'theme-color');
    darkTag.setAttribute('media', '(prefers-color-scheme: dark)');
    darkTag.setAttribute('content', DARK_THEME_COLOR);
    document.head.appendChild(darkTag);
  } else {
    const singleTag = document.createElement('meta');
    singleTag.setAttribute('name', 'theme-color');
    singleTag.setAttribute('content', resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    document.head.appendChild(singleTag);
  }
}

/**
 * Applies the resolved theme and mode to document root and theme-color meta tags.
 */
export function applyTheme(resolved: ResolvedTheme, mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.style.colorScheme = resolved;

  updateThemeColorMeta(resolved, mode);
}

export interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.mode === 'system' ? getSystemPreference() : state.mode;
          applyTheme(resolved, state.mode);
        }
      },
    }
  )
);

// Apply immediately on store initialization if in browser
if (typeof window !== 'undefined') {
  const currentMode = useThemeStore.getState().mode;
  const initialResolved = currentMode === 'system' ? getSystemPreference() : currentMode;
  applyTheme(initialResolved, currentMode);
}

// Keep DOM synced whenever mode changes in store
useThemeStore.subscribe((state) => {
  const resolved = state.mode === 'system' ? getSystemPreference() : state.mode;
  applyTheme(resolved, state.mode);
});

/**
 * Primary theme hook.
 * Returns { mode, resolved, setMode }.
 * In 'system' mode: listens to matchMedia('(prefers-color-scheme: dark)') and updates live.
 * Cleans up media listener on unmount or when mode changes.
 */
export function useTheme(): {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
} {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const systemTheme = useSyncExternalStore(
    mode === 'system' ? subscribeSystemTheme : () => () => {},
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolved: ResolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    applyTheme(resolved, mode);
  }, [resolved, mode]);

  return { mode, resolved, setMode };
}
