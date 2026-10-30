import { useTranslation } from 'react-i18next';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

/**
 * Small banner shown when a new service worker version is waiting.
 * - Only appears when updateReady is true (needRefresh && !isDirty).
 * - Never auto-reloads; user must tap "Update".
 * - Also shows a one-time "Ready to work offline" message on first install.
 */
export function PWAUpdateBanner() {
  const { t } = useTranslation();
  const { offlineReady, updateReady, applyUpdate, dismissOfflineReady } = usePWAUpdate();

  if (!offlineReady && !updateReady) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-16 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-border bg-card p-3 shadow-lg"
    >
      {offlineReady && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-foreground">
            {t('pwa.offlineReady', 'Ready to work offline')}
          </p>
          <button
            type="button"
            onClick={dismissOfflineReady}
            className="shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {t('pwa.dismiss', 'OK')}
          </button>
        </div>
      )}

      {updateReady && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-foreground">
            {t('pwa.updateAvailable', 'New version available')}
          </p>
          <button
            type="button"
            onClick={applyUpdate}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {t('pwa.update', 'Update')}
          </button>
        </div>
      )}
    </div>
  );
}

