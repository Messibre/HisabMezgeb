import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';
import AppHeader from '@/components/common/AppHeader';
import { PeriodPicker, type PeriodType } from '@/components/common/PeriodPicker';
import StatCard from '@/components/common/StatCard';
import CategoryBreakdownList from '@/components/common/CategoryBreakdownList';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonBlock } from '@/components/common/SkeletonRow';
import { useReportSummary } from '@/hooks/useReportSummary';
import { useDebtsPeriodReport } from '@/hooks/useDebtsPeriodReport';
import { useExpenseBreakdown } from '@/hooks/useExpenseBreakdown';
import ExportSheet from '@/components/common/ExportSheet';
import {
  todayLocal,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatDate,
} from '@/lib/date';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import DateSelect from '@/components/common/DateSelect';

export default function ReportsPage() {
  const { t } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.reports', noindex: true });
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customFrom, setCustomFrom] = useState(() => startOfWeek());
  const [customTo, setCustomTo] = useState(() => todayLocal());
  const [showExportSheet, setShowExportSheet] = useState(false);

  const { from, to } = useMemo(() => {
    const today = todayLocal();
    switch (period) {
      case 'today':
        return { from: today, to: today };
      case 'week':
        return { from: startOfWeek(today), to: endOfWeek(today) };
      case 'month':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'custom':
        return {
          from: customFrom || today,
          to: customTo || today,
        };
    }
  }, [period, customFrom, customTo]);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useReportSummary(from, to);

  const {
    data: debtsPeriod,
    isLoading: isDebtsLoading,
    isError: isDebtsError,
    refetch: refetchDebts,
  } = useDebtsPeriodReport(from, to);

  const {
    data: expenseBreakdown,
    isLoading: isBreakdownLoading,
    isError: isBreakdownError,
    refetch: refetchBreakdown,
  } = useExpenseBreakdown(from, to);

  const isLoading = isSummaryLoading || isDebtsLoading || isBreakdownLoading;
  const isError = isSummaryError || isDebtsError || isBreakdownError;

  const handleRefetchAll = () => {
    void refetchSummary();
    void refetchDebts();
    void refetchBreakdown();
  };

  const isAllZero =
    summary &&
    summary.totalIncome === 0 &&
    summary.totalBusinessExpenses === 0 &&
    summary.totalPersonalDraws === 0 &&
    summary.totalFundingIn === 0 &&
    summary.totalFundingOut === 0 &&
    (!debtsPeriod ||
      (debtsPeriod.totalNewlyBorrowed === 0 && debtsPeriod.totalRepaidInPeriod === 0));

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title={t('reports.title', 'Reports')} />

      <div className="mx-auto max-w-md sm:max-w-2xl lg:max-w-[1100px] px-4 pt-4 space-y-6">
        <section className="space-y-3">
          <PeriodPicker value={period} onChange={setPeriod} />

          {period === 'custom' && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant/40 bg-card p-3">
              <div>
                <DateSelect
                  label={t('reports.fromDate', 'From')}
                  id="custom-from"
                  value={customFrom}
                  max={customTo}
                  onChange={(ymd) => {
                    setCustomFrom(ymd);
                  }}
                />
              </div>
              <div>
                <DateSelect
                  label={t('reports.toDate', 'To')}
                  id="custom-to"
                  value={customTo}
                  min={customFrom}
                  onChange={(ymd) => {
                    setCustomTo(ymd);
                  }}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-on-surface-variant">
            {formatDate(from)} – {formatDate(to)}
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-4" data-testid="reports-skeleton">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 col-span-2 w-full" />
            </div>
            <SkeletonBlock className="h-40 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            message={t('errorBoundary.message', 'Please try refreshing the page.')}
            onRetry={handleRefetchAll}
          />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {t('reports.overview', 'Overview')}
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard
                  label={t('reports.totalIncome', 'Total Income')}
                  amount={summary?.totalIncome ?? null}
                  tone="in"
                  icon={<TrendingUp className="h-4 w-4 text-money-in" />}
                />
                <StatCard
                  label={t('reports.businessExpenses', 'Shop Expenses')}
                  amount={summary?.totalBusinessExpenses ?? null}
                  tone="out"
                  icon={<TrendingDown className="h-4 w-4 text-money-out" />}
                />
                <StatCard
                  label={t('reports.personalDraws', 'Personal Draws')}
                  amount={summary?.totalPersonalDraws ?? null}
                  tone="neutral"
                  icon={<Wallet className="h-4 w-4 text-money-neutral" />}
                />
                <StatCard
                  label={t('money.owedToYou', 'Owed to you')}
                  amount={summary?.totalOwedByCustomers ?? null}
                  tone="owed"
                  icon={<Users className="h-4 w-4 text-money-neutral" />}
                />
                <StatCard
                  label={t('reports.fundingIn', 'Funding In')}
                  amount={summary?.totalFundingIn ?? null}
                  tone="in"
                  icon={<ArrowDownRight className="h-4 w-4 text-money-in" />}
                />
                <StatCard
                  label={t('reports.fundingOut', 'Funding Out')}
                  amount={summary?.totalFundingOut ?? null}
                  tone="out"
                  icon={<ArrowUpRight className="h-4 w-4 text-money-out" />}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {t('reports.expenseBreakdown', 'Expense Breakdown')}
              </h2>
              <CategoryBreakdownList
                items={expenseBreakdown || []}
                totalExpenses={
                  (summary?.totalBusinessExpenses ?? 0) + (summary?.totalPersonalDraws ?? 0)
                }
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {t('reports.debtActivity', 'Debt Activity (This Period)')}
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard
                  label={t('reports.newlyBorrowed', 'Newly Borrowed')}
                  amount={debtsPeriod?.totalNewlyBorrowed ?? null}
                  tone="neutral"
                  size="md"
                />
                <StatCard
                  label={t('reports.repaid', 'Repaid')}
                  amount={debtsPeriod?.totalRepaidInPeriod ?? null}
                  tone="in"
                  size="md"
                />
              </div>
            </section>

            {isAllZero && (
              <div
                className="rounded-xl border border-outline-variant/40 bg-card p-6 text-center text-sm text-on-surface-variant"
                data-testid="reports-empty-notice"
              >
                <FileSpreadsheet className="mx-auto h-8 w-8 text-on-surface-variant/60 mb-2" />
                <p className="font-medium text-foreground">
                  {t('reports.noData', 'No data for this period yet')}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {t(
                    'reports.noDataDescription',
                    'Transactions entered for this date range will appear here.'
                  )}
                </p>
              </div>
            )}

            <section className="pt-2">
              <button
                type="button"
                onClick={() => setShowExportSheet(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high border border-outline-variant/60 text-foreground font-semibold shadow-xs transition-colors hover:bg-surface-container-highest active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>{t('reports.export', 'Export')}</span>
              </button>
            </section>
          </>
        )}
      </div>

      <ExportSheet
        open={showExportSheet}
        onOpenChange={setShowExportSheet}
        type="report"
        reportParams={{ from, to }}
      />
    </div>
  );
}
