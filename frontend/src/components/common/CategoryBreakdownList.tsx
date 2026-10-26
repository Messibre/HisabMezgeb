import { useTranslation } from 'react-i18next';
import type { ExpenseBreakdownItem } from '@/types/api';
import MoneyText from './MoneyText';

interface CategoryBreakdownListProps {
  items: ExpenseBreakdownItem[];
  totalExpenses?: number;
}

export default function CategoryBreakdownList({
  items,
  totalExpenses: explicitTotal,
}: CategoryBreakdownListProps) {
  const { t } = useTranslation();

  // Filter out zero-amount items to only display categories that had spending,
  // or sort them descending by amount
  const sortedItems = [...items].sort((a, b) => b.total - a.total);
  const activeItems = sortedItems.filter((item) => item.total > 0);

  const calculatedTotal = sortedItems.reduce((acc, curr) => acc + curr.total, 0);
  const total = explicitTotal !== undefined && explicitTotal > 0 ? explicitTotal : calculatedTotal;
  const maxAmount = activeItems.length > 0 ? activeItems[0].total : 0;

  if (activeItems.length === 0) {
    return (
      <div className="rounded-xl border border-outline-variant/40 bg-card p-6 text-center text-sm text-on-surface-variant">
        {t('reports.noExpenseBreakdown', 'No expenses recorded in this period')}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-outline-variant/40 bg-card p-4">
      {activeItems.map((item) => {
        const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
        const barWidth = maxAmount > 0 ? Math.round((item.total / maxAmount) * 100) : 0;
        const isPersonal = item.group === 'personal';

        return (
          <div key={item.categoryId} className="space-y-1.5" data-testid={`category-breakdown-${item.categoryId}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{item.categoryName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isPersonal
                      ? 'bg-money-neutral/15 text-money-neutral-strong'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  {isPersonal
                    ? t('reports.groupPersonal', 'Personal')
                    : t('reports.groupBusiness', 'Business')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">{percentage}%</span>
                <MoneyText amount={item.total} tone="out" size="sm" />
              </div>
            </div>

            {/* Horizontal progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isPersonal ? 'bg-money-neutral' : 'bg-money-out'
                }`}
                style={{ width: `${barWidth}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={item.categoryName}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
