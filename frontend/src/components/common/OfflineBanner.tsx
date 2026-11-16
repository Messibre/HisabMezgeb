import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const BACK_ONLINE_MS = 3000;

/**
 * A slim strip in the page flow, right under the header (never on top of it).
 * Offline it says plainly that entries cannot be saved; after reconnecting it
 * shows a short "back online" note once.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();
  const [showBackOnline, setShowBackOnline] = useState(false);

  // State changes happen in the event handlers, so the note appears only after a real reconnect.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleOnline = () => {
      setShowBackOnline(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    };
    const handleOffline = () => {
      clearTimeout(timer);
      setShowBackOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  const offline = !isOnline;
  const Icon = offline ? WifiOff : Wifi;

  return (
    <div
      role="status"
      data-testid="offline-banner"
      className={`flex w-full items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium ${
        offline
          ? 'bg-[var(--money-neutral)]/15 text-[var(--money-neutral-strong)]'
          : 'bg-primary/10 text-primary'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{offline ? t('common.offlineBanner') : t('common.backOnline')}</span>
    </div>
  );
}
