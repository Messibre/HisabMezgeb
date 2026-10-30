import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import {
  useIsStandalone,
  useInstallPrompt,
  useIsIOSSafariNotInstalled,
} from '@/hooks/useInstallPrompt';
import { useDirtyStore } from '@/store/dirty.store';

describe('PWA Build Artifacts & Configuration', () => {
  const distDir = path.resolve(__dirname, '../dist');

  it('generates sw.js, manifest, and workbox bundle in dist', () => {
    expect(fs.existsSync(path.join(distDir, 'sw.js'))).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'manifest.webmanifest'))).toBe(true);
  });

  it('manifest specifies start_url "/home", display "standalone", and correct scope and id', () => {
    const manifestRaw = fs.readFileSync(path.join(distDir, 'manifest.webmanifest'), 'utf8');
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.start_url).toBe('/home');
    expect(manifest.display).toBe('standalone');
    expect(manifest.scope).toBe('/');
    expect(manifest.id).toBe('/');
    expect(manifest.name).toBe('Hisab Mezgeb');
    expect(manifest.short_name).toBe('Hisab Mezgeb');
    expect(manifest.theme_color).toBe('#2e5a27');
    expect(manifest.background_color).toBe('#f9f9f8');

    // Icon presence
    const icon192 = manifest.icons.find((i: { sizes: string }) => i.sizes === '192x192');
    const icon512 = manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && (!i.purpose || i.purpose === 'any'));
    const iconMaskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === 'maskable');

    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(iconMaskable).toBeDefined();
  });

  it('sw.js precache list strictly contains NO /api entries', () => {
    const swContent = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf8');
    // Regex checking the precache array items
    const matches = swContent.match(/\{url:"[^"]+",revision:[^}]+\}/g) || [];
    expect(matches.length).toBeGreaterThan(0);

    for (const entry of matches) {
      expect(entry).not.toMatch(/\/api\//i);
    }
  });

  it('sw.js configures denylist for /api/ and extensions in navigation route and uses NetworkOnly for /api', () => {
    const swContent = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf8');
    expect(swContent).toContain('/^\\/api\\//');
    expect(swContent).toContain('/\\.[a-zA-Z0-9]+$/');
    expect(swContent).toContain('NetworkOnly');
  });
});

describe('useDirtyStore', () => {
  beforeEach(() => {
    useDirtyStore.setState({ isDirty: false });
  });

  it('defaults to clean and allows toggling dirty state', () => {
    const { result } = renderHook(() => useDirtyStore());
    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setDirty(true);
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setDirty(false);
    });
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useIsStandalone', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns false when neither media query nor navigator.standalone is true', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsStandalone());
    expect(result.current).toBe(false);
  });

  it('returns true when window.matchMedia matches display-mode: standalone', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsStandalone());
    expect(result.current).toBe(true);
  });
});

describe('useInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('captures beforeinstallprompt event, allows prompt invocation and tracks dismissal for 30 days', async () => {
    const promptMock = vi.fn().mockResolvedValue({ outcome: 'accepted' });
    const mockEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<{ outcome: string }>;
      userChoice: Promise<{ outcome: string }>;
      platforms: string[];
    };
    mockEvent.prompt = promptMock;
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
    mockEvent.platforms = ['web'];

    // Dispatch global event before hook
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canPrompt).toBe(true);
    expect(result.current.showBanner).toBe(true);

    // Call prompt
    await act(async () => {
      await result.current.promptInstall();
    });
    expect(promptMock).toHaveBeenCalled();

    // After accepted, event is cleared
    expect(result.current.canPrompt).toBe(false);

    // Now test dismissal
    const mockEvent2 = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<{ outcome: string }>;
      userChoice: Promise<{ outcome: string }>;
      platforms: string[];
    };
    mockEvent2.prompt = vi.fn();
    act(() => {
      window.dispatchEvent(mockEvent2);
    });

    const { result: result2 } = renderHook(() => useInstallPrompt());
    expect(result2.current.showBanner).toBe(true);

    act(() => {
      result2.current.dismissBanner();
    });
    expect(result2.current.showBanner).toBe(false);

    // Stored in localStorage
    expect(localStorage.getItem('hisab-install-dismissed')).toBeTruthy();
  });
});

describe('useIsIOSSafariNotInstalled', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('detects iOS Safari when running in browser mode', () => {
    // iPhone Safari UA string
    const iPhoneSafariUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

    Object.defineProperty(navigator, 'userAgent', {
      value: iPhoneSafariUA,
      configurable: true,
    });

    const { result } = renderHook(() => useIsIOSSafariNotInstalled());
    expect(result.current).toBe(true);
  });

  it('returns false for Android Chrome UA', () => {
    const androidChromeUA =
      'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';

    Object.defineProperty(navigator, 'userAgent', {
      value: androidChromeUA,
      configurable: true,
    });

    const { result } = renderHook(() => useIsIOSSafariNotInstalled());
    expect(result.current).toBe(false);
  });

  it('returns false for Chrome on iOS (CriOS)', () => {
    const iOSChromeUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1';

    Object.defineProperty(navigator, 'userAgent', {
      value: iOSChromeUA,
      configurable: true,
    });

    const { result } = renderHook(() => useIsIOSSafariNotInstalled());
    expect(result.current).toBe(false);
  });
});
