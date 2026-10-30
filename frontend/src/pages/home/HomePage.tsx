import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTodayIncome } from '@/hooks/useTodayIncome';
import { useReportSummary } from '@/hooks/useReportSummary';
import { todayLocal, startOfWeek } from '@/lib/date';
import AppHeader from '@/components/common/AppHeader';
import MoneyText from '@/components/common/MoneyText';
import StatCard from '@/components/common/StatCard';
import { SkeletonBlock } from '@/components/common/SkeletonRow';
import ErrorState from '@/components/common/ErrorState';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { InstallBanner, IOSInstallCard } from '@/components/common/InstallPrompts';

export default function HomePage() {
  const { t } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.home', noindex: true });
  const navigate = useNavigate();
  const { account } = useAuthStore();

  const today = useMemo(() => todayLocal(), []);
  const weekStart = useMemo(() => startOfWeek(today), [today]);

  const {
    data: todayIncome,
    isLoading: isIncomeLoading,
    isError: isIncomeError,
    refetch: refetchIncome,
  } = useTodayIncome();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useReportSummary(weekStart, today);

  const shopName = account?.shopName?.trim();

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader />

      {/* PWA Install prompts (Android banner & iOS instructions card) */}
      <InstallBanner />
      <IOSInstallCard />

      <div className="mx-auto max-w-md px-4 pt-4 space-y-6">
        {/* Greeting Section */}
        <section className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {shopName
              ? t('home.greetingWithShop', { name: shopName, defaultValue: `Selam, ${shopName}` })
              : t('home.greetingDefault', 'Selam')}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {t('home.greetingSubtitle', "Let's update your records for today.")}
          </p>
        </section>

        {/* Today's Income Card */}
        <section>
          {isIncomeLoading ? (
            <div
              data-testid="today-income-skeleton"
              className="rounded-2xl bg-card border border-border/40 p-6 flex flex-col items-center justify-center space-y-3 animate-pulse"
            >
              <div className="h-12 w-12 rounded-full bg-surface-container-high" />
              <div className="h-4 w-48 rounded bg-surface-container-high" />
              <div className="h-10 w-36 rounded-full bg-surface-container-high" />
            </div>
          ) : isIncomeError ? (
            <ErrorState
              message={t('common.errorGeneric', 'Failed to load today’s income.')}
              onRetry={() => refetchIncome()}
            />
          ) : todayIncome ? (
            /* Entered state */
            <div className="rounded-2xl bg-card border border-border/40 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-on-surface-variant block">
                  {t('home.todayIncome', "Today's income")}
                </span>
                <MoneyText amount={todayIncome.amount} tone="in" size="xl" />
              </div>
              <Link
                to={`${ROUTES.ENTRIES}?type=income&date=${today}`}
                className="inline-flex h-9 items-center justify-center rounded-full bg-surface-container-high px-4 text-xs font-semibold text-foreground hover:bg-surface-container-highest transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('home.edit', 'Edit')}
              </Link>
            </div>
          ) : (
            /* Not entered state */
            <div className="rounded-2xl bg-card border border-border/40 p-6 text-center shadow-xs space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t('home.todayIncomeNotEntered', "Today's income is not entered yet.")}
              </p>
              <Link
                to={`${ROUTES.ENTRIES}?type=income`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('home.addTodayIncome', "+ Add Today's Income")}
              </Link>
            </div>
          )}
        </section>

        {/* Week Snapshot Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {t('home.thisWeekSnapshot', 'Week Snapshot')}
            </h2>
            <Link
              to={ROUTES.REPORTS}
              className="text-xs font-medium text-primary inline-flex items-center hover:underline"
            >
              <span>{t('pages.reports', 'Reports')}</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {isSummaryLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-24 rounded-xl" />
              <SkeletonBlock className="h-24 rounded-xl" />
              <SkeletonBlock className="h-24 col-span-2 rounded-xl" />
            </div>
          ) : isSummaryError ? (
            <ErrorState
              message={t('common.errorGeneric', 'Failed to load week snapshot.')}
              onRetry={() => refetchSummary()}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={t('home.thisWeeksIncome', "This Week's Income")}
                amount={summary?.totalIncome ?? 0}
                tone="in"
                size="lg"
              />
              <StatCard
                label={t('home.shopExpenses', 'Shop Expenses')}
                amount={summary?.totalBusinessExpenses ?? 0}
                tone="out"
                size="lg"
              />
              <StatCard
                label={t('home.customerDebts', 'Customer Debts')}
                amount={summary?.totalOwedByCustomers ?? 0}
                tone="out"
                size="lg"
                accentBarColor="var(--money-out)"
                icon={<AlertTriangle className="h-5 w-5 text-[var(--money-out)]" />}
                onClick={() => navigate(ROUTES.DEBTS)}
                className="col-span-2"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
