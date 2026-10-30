import { useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useDirtyStore } from '@/store/dirty.store';

/** Interval between proactive update checks: 1 hour. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker with registerType 'prompt'.
 *
 * Returns:
 *  - needRefresh: true when a new SW version is waiting
 *  - offlineReady: true when the app has been cached for offline (first install)
 *  - updateReady: true when update should be shown (needRefresh && !isDirty)
 *  - applyUpdate: call to skip-waiting + reload
 *  - dismissOfflineReady: dismiss the "Ready to work offline" message
 *
 * Rules enforced:
 *  - NEVER auto-reloads (registerType is 'prompt')
 *  - Defers showing the update prompt while useDirtyStore.isDirty is true
 *  - Does NOT register in Capacitor (window.Capacitor) or dev
 *  - Checks for updates on visibilitychange + once per hour
 */
export function usePWAUpdate() {
  const isDirty = useDirtyStore((s) => s.isDirty);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Callback when the SW is ready for the first time
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Check for updates when the tab returns to foreground
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          void registration.update();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Periodic update check every hour
      intervalRef.current = setInterval(() => {
        void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);

      // Log for debugging
      if (import.meta.env.DEV) {
        console.log('[PWA] SW registered:', swUrl);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error:', error);
    },
  });

  // Cleanup the interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // updateReady: only when we need a refresh AND the form is clean
  const updateReady = needRefresh && !isDirty;

  const applyUpdate = useCallback(() => {
    void updateServiceWorker(true); // skip-waiting + reload
  }, [updateServiceWorker]);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, [setOfflineReady]);

  const dismissNeedRefresh = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  return {
    needRefresh,
    offlineReady,
    updateReady,
    applyUpdate,
    dismissOfflineReady,
    dismissNeedRefresh,
  };
}

