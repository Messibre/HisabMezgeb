import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-error text-on-error p-3 text-center font-label-lg text-label-lg shadow-md">
      <span className="flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-xl">wifi_off</span>
        {t('common.offlineBanner')}
      </span>
    </div>
  );
}
