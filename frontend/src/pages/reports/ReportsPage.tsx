import { useTranslation } from 'react-i18next';

/**
 * Stub page — see [6. Frontend UI, Pages & Components] section 6.2 for the
 * full spec (period picker, summary cards, expense breakdown, CSV export).
 */
export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-foreground">{t('pages.reports')}</h1>
      <p className="text-muted-foreground text-sm mt-2">{t('common.comingSoon')}</p>
    </div>
  );
}
