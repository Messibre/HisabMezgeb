import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SnapshotRowProps {
  income: number;
  expenses: number;
  debts: number;
}

function formatAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function SnapshotRow({ income, expenses, debts }: SnapshotRowProps) {
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-2 gap-4">
      <div className="flex min-h-[110px] flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
        <span className="text-[16px] text-on-surface-variant">{t('home.weekIncome')}</span>
        <div className="flex items-baseline gap-1 text-secondary">
          <span className="text-[14px] font-medium opacity-80">ETB</span>
          <span className="text-[24px] font-semibold">{formatAmount(income)}</span>
        </div>
      </div>

      <div className="flex min-h-[110px] flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
        <span className="text-[16px] text-on-surface-variant">{t('home.weekExpenses')}</span>
        <div className="flex items-baseline gap-1 text-on-surface">
          <span className="text-[14px] font-medium opacity-80">ETB</span>
          <span className="text-[24px] font-semibold">{formatAmount(expenses)}</span>
        </div>
      </div>

      <div className="col-span-2 flex min-h-[110px] flex-col justify-between rounded-2xl border-l-8 border-error bg-surface-container-lowest p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-error" />
          <span className="text-[16px] text-on-surface-variant">{t('home.customerDebts')}</span>
        </div>
        <div className="flex items-baseline gap-1 text-error">
          <span className="text-[14px] font-medium opacity-80">ETB</span>
          <span className="text-[24px] font-semibold">{formatAmount(debts)}</span>
        </div>
      </div>
    </section>
  );
}
