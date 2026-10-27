import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import {
  useThemeStore,
  useTheme,
  THEME_STORAGE_KEY,
  LIGHT_THEME_COLOR,
  DARK_THEME_COLOR,
} from '@/store/theme.store';
import ThemeToggle from '@/components/common/ThemeToggle';

// Mock matchMedia
let mediaListeners: Array<(e: MediaQueryListEvent) => void> = [];
let prefersDark = false;

function setupMatchMedia() {
  mediaListeners = [];
  prefersDark = false;

  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    return {
      matches: prefersDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaListeners = mediaListeners.filter((h) => h !== handler);
        }
      }),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
}

function triggerSystemThemeChange(dark: boolean) {
  prefersDark = dark;
  const event = { matches: dark } as MediaQueryListEvent;
  mediaListeners.forEach((listener) => listener(event));
}

describe('Theme Store & useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    setupMatchMedia();
    useThemeStore.setState({ mode: 'system' });
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((m) => m.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to system mode', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('system');
    expect(result.current.resolved).toBe('light'); // since prefersDark is false by default
  });

  it('persists mode to localStorage under hisab-theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setMode('dark');
    });

    const storedRaw = localStorage.getItem(THEME_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw!);
    expect(stored.state.mode).toBe('dark');
  });

  it('applies dark class and color-scheme dark when mode is dark', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setMode('dark');
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('removes dark class and sets color-scheme light when mode is light', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setMode('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setMode('light');
    });

    expect(result.current.mode).toBe('light');
    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('updates <meta name="theme-color"> correctly in system and manual modes', () => {
    const { result } = renderHook(() => useTheme());

    // In system mode, there are 2 tags with media attributes
    act(() => {
      result.current.setMode('system');
    });
    let metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas.length).toBe(2);
    expect(metas[0].getAttribute('media')).toBe('(prefers-color-scheme: light)');
    expect(metas[0].getAttribute('content')).toBe(LIGHT_THEME_COLOR);
    expect(metas[1].getAttribute('media')).toBe('(prefers-color-scheme: dark)');
    expect(metas[1].getAttribute('content')).toBe(DARK_THEME_COLOR);

    // In manual dark mode, there is a single active tag without media attribute
    act(() => {
      result.current.setMode('dark');
    });
    metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute('media')).toBeNull();
    expect(metas[0].getAttribute('content')).toBe(DARK_THEME_COLOR);

    // In manual light mode, single active tag with light color
    act(() => {
      result.current.setMode('light');
    });
    metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute('media')).toBeNull();
    expect(metas[0].getAttribute('content')).toBe(LIGHT_THEME_COLOR);
  });

  it('system listener updates live when matchMedia changes, and cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useTheme());

    expect(result.current.mode).toBe('system');
    expect(result.current.resolved).toBe('light');
    expect(mediaListeners.length).toBe(1);

    // System switches to dark
    act(() => {
      triggerSystemThemeChange(true);
    });

    expect(result.current.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    // System switches back to light
    act(() => {
      triggerSystemThemeChange(false);
    });

    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');

    // On unmount, listener is removed
    unmount();
    expect(mediaListeners.length).toBe(0);
  });

  it('cleans up system listener when switching from system to manual mode', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('system');
    expect(mediaListeners.length).toBe(1);

    act(() => {
      result.current.setMode('dark');
    });

    expect(mediaListeners.length).toBe(0);
  });

  it('ThemeToggle icon button toggles between light and dark with aria-label and aria-pressed', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');

    // Click to switch to dark
    fireEvent.click(button);
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    // Click again to switch to light
    fireEvent.click(button);
    expect(useThemeStore.getState().mode).toBe('light');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('changing theme does not reload the page or lose form data', () => {
    function FormWithTheme() {
      const { setMode } = useTheme();
      const [text, setText] = useState('');

      return (
        <div>
          <input
            data-testid="test-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button data-testid="set-dark-btn" onClick={() => setMode('dark')}>
            Dark
          </button>
          <button data-testid="set-light-btn" onClick={() => setMode('light')}>
            Light
          </button>
        </div>
      );
    }

    render(<FormWithTheme />);

    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: 'Important financial record' } });
    expect((input as HTMLInputElement).value).toBe('Important financial record');

    // Switch theme
    fireEvent.click(screen.getByTestId('set-dark-btn'));
    expect(useThemeStore.getState().mode).toBe('dark');

    // Input value MUST remain intact
    expect((input as HTMLInputElement).value).toBe('Important financial record');

    // Switch theme again
    fireEvent.click(screen.getByTestId('set-light-btn'));
    expect(useThemeStore.getState().mode).toBe('light');
    expect((input as HTMLInputElement).value).toBe('Important financial record');
  });
});
