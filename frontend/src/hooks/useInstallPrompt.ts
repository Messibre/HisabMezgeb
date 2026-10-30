import { useSyncExternalStore, useCallback } from 'react';

/**
 * Detects whether the app is running in standalone (installed PWA) mode.
 *
 * Checks:
 *  1. CSS media query `display-mode: standalone`
 *  2. navigator.standalone (iOS Safari)
 *
 * Returns true when the app is installed and running as a standalone app.
 */

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari sets navigator.standalone
  if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) {
    return true;
  }
  // Standard: check display-mode media query
  if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  return false;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, getIsStandalone, getServerSnapshot);
}

// ─── useOnlineStatus (re-export from existing hook for consistency) ───
// Already exists at @/hooks/useOnlineStatus — just re-exporting for the
// public surface the task requests. No new code needed.

// ─── Install prompt types ───

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = 'hisab-install-dismissed';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Date.now() - ts < DISMISS_DURATION_MS) return true;
    localStorage.removeItem(DISMISS_KEY);
    return false;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage access can fail
  }
}

// ─── Store for the deferred prompt event ───

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let dismissedState = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  dismissedState = isDismissed();
  listeners.forEach((fn) => fn());
}

// Initial state
if (typeof window !== 'undefined') {
  dismissedState = isDismissed();
}

// Capture the event globally once
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  // When the app is installed, clear the deferred prompt
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

function subscribeDeferredPrompt(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

function getServerDeferredPrompt(): BeforeInstallPromptEvent | null {
  return null;
}

function getDismissedSnapshot(): boolean {
  return dismissedState;
}

function getServerDismissedSnapshot(): boolean {
  return false;
}

/**
 * Hook for the A2HS (Add to Home Screen) install prompt on Android/Chrome.
 *
 * Returns:
 *  - canPrompt: true when beforeinstallprompt has fired and user hasn't dismissed
 *  - showBanner: true when canPrompt && not dismissed for 30 days && not installed
 *  - promptInstall: triggers the native install dialog
 *  - dismissBanner: hides the banner for 30 days
 */
export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribeDeferredPrompt, getDeferredPrompt, getServerDeferredPrompt);
  const dismissed = useSyncExternalStore(subscribeDeferredPrompt, getDismissedSnapshot, getServerDismissedSnapshot);
  const isStandalone = useIsStandalone();

  const canPrompt = event !== null && !isStandalone;
  const showBanner = canPrompt && !dismissed;

  const promptInstall = useCallback(async () => {
    if (!event) return;
    const result = await event.prompt();
    if (result.outcome === 'accepted') {
      deferredPrompt = null;
      notifyListeners();
    }
  }, [event]);

  const dismissBanner = useCallback(() => {
    setDismissed();
    notifyListeners(); // trigger re-render
  }, []);

  return {
    canPrompt,
    showBanner,
    promptInstall,
    dismissBanner,
  };
}

/**
 * Detects iOS Safari that is NOT installed as a PWA.
 * Used to show the "Tap Share → Add to Home Screen" card on iPhone/iPad.
 */
export function useIsIOSSafariNotInstalled(): boolean {
  const isStandalone = useIsStandalone();

  if (typeof window === 'undefined') return false;
  if (isStandalone) return false;

  const ua = navigator.userAgent;
  // iOS detection: iPhone, iPad, or iPod
  const isIOS = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Safari detection: Safari in UA but not Chrome/CriOS/Firefox/FxiOS/Edge
  const isSafari = /Safari/.test(ua) && !/CriOS|Chrome|FxiOS|Firefox|EdgiOS/.test(ua);

  return isIOS && isSafari;
}

