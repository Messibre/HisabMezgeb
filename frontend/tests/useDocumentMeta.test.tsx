import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

describe('useDocumentMeta', () => {
  const originalTitle = document.title;

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    document.title = 'Original Title';
    const existingRobots = document.querySelector('meta[name="robots"]');
    if (existingRobots) existingRobots.remove();
  });

  afterEach(() => {
    document.title = originalTitle;
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.remove();
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.remove();
  });

  it('sets document.title from i18n key with app name appended', () => {
    renderHook(() =>
      useDocumentMeta({
        titleKey: 'pages.home',
      })
    );

    expect(document.title).toBe('Home - Hisab Mezgeb');
  });

  it('does not duplicate app name if translated key already contains Hisab Mezgeb', () => {
    renderHook(() =>
      useDocumentMeta({
        titleKey: 'notFound.documentTitle',
      })
    );

    expect(document.title).toBe('Page not found - Hisab Mezgeb');
  });

  it('updates document.title when language changes', async () => {
    renderHook(() =>
      useDocumentMeta({
        titleKey: 'pages.home',
      })
    );

    expect(document.title).toBe('Home - Hisab Mezgeb');

    await act(async () => {
      await i18n.changeLanguage('am');
    });
    expect(document.title).toBe('ቤት - Hisab Mezgeb');

    await act(async () => {
      await i18n.changeLanguage('ti');
    });
    expect(document.title).toBe('ቤት - Hisab Mezgeb');
  });

  it('sets meta[name="description"] when descriptionKey is supplied', () => {
    renderHook(() =>
      useDocumentMeta({
        titleKey: 'pages.home',
        fallbackDescription: 'Custom fallback description for testing',
      })
    );

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
  });

  it('adds meta[name="robots" content="noindex, nofollow"] when noindex is true, and removes on unmount', () => {
    const { unmount } = renderHook(() =>
      useDocumentMeta({
        titleKey: 'pages.home',
        noindex: true,
      })
    );

    let robots = document.querySelector('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');

    unmount();
    robots = document.querySelector('meta[name="robots"]');
    expect(robots).toBeNull();
  });

  it('does not add noindex robots tag when noindex is false', () => {
    renderHook(() =>
      useDocumentMeta({
        titleKey: 'auth.loginTitle',
        noindex: false,
      })
    );

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toBeNull();
  });
});
