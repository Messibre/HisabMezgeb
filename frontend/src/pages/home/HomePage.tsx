import { useTranslation } from 'react-i18next';

/**
 * Stub page — see [6. Frontend UI, Pages & Components] section 6.2 for the
 * full spec (today's income status card, week snapshot). Implement once
 * useTodayIncome / useReportSummary exist, per the TDD stub workflow in
 * section 9.0: this stub exists so routing and layout can be built and
 * tested before the real data hooks are wired in.
 */
export default function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-foreground">{t('pages.home')}</h1>
      <p className="text-muted-foreground text-sm mt-2">{t('common.comingSoon')}</p>
    </div>
  );
}
