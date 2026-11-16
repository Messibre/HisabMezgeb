import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

/** Shown under a disabled Save button while there is no connection. */
export default function OfflineSaveNotice({ id }: { id?: string }) {
  const { t } = useTranslation();
  return (
    <p
      id={id}
      className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--money-neutral-strong)]"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t('save.offline')}</span>
    </p>
  );
}
