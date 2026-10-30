import { useTranslation } from 'react-i18next';
import { useInstallPrompt, useIsIOSSafariNotInstalled } from '@/hooks/useInstallPrompt';

/**
 * Dismissible install banner for Android/Chrome (uses beforeinstallprompt).
 * Hidden when the app is already installed or the user dismissed within 30 days.
 */
export function InstallBanner() {
  const { t } = useTranslation();
  const { showBanner, promptInstall, dismissBanner } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div
      role="complementary"
      aria-label={t('pwa.installApp', 'Install app')}
      className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 shadow-sm"
    >
      <p className="text-sm text-foreground">
        {t('pwa.installBannerText', 'Install Hisab Mezgeb for quick access')}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={dismissBanner}
          className="rounded-md px-2 py-1.5 text-xs text-muted-foreground"
        >
          {t('pwa.notNow', 'Not now')}
        </button>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          {t('pwa.install', 'Install')}
        </button>
      </div>
    </div>
  );
}

/**
 * Install button for Settings page — shows when the install prompt is available.
 */
export function InstallButton() {
  const { t } = useTranslation();
  const { canPrompt, promptInstall } = useInstallPrompt();

  if (!canPrompt) return null;

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className="w-full rounded-md border border-primary bg-background px-4 py-3 text-base font-medium text-primary"
    >
      {t('pwa.installApp', 'Install app')}
    </button>
  );
}

/**
 * iOS Safari "Add to Home Screen" instruction card.
 * Shown only in iOS Safari when the app is NOT already installed.
 */
export function IOSInstallCard() {
  const { t } = useTranslation();
  const showIOSCard = useIsIOSSafariNotInstalled();

  if (!showIOSCard) return null;

  return (
    <div className="mx-4 mt-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-foreground mb-2">
        {t('pwa.iosInstallTitle', 'Install this app')}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(
          'pwa.iosInstallInstructions',
          'Tap the Share button (□↑), then tap "Add to Home Screen"'
        )}
      </p>
    </div>
  );
}

