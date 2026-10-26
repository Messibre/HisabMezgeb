import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Check } from 'lucide-react';
import MoneyText from '@/components/common/MoneyText';
import { buildDebtCustomerDetailPath } from '@/constants';
import type { DebtCustomer } from '@/types/api';

interface CustomerCardProps {
  customer: DebtCustomer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const { t } = useTranslation();
  const hasDebt = customer.balance > 0;
  const initial = Array.from(customer.name.trim())[0] || '?';

  return (
    <Link
      to={buildDebtCustomerDetailPath(customer.id)}
      className={`w-full min-h-[56px] rounded-xl bg-card hover:bg-muted/40 p-3.5 flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border/40 border-l-[5px] ${
        hasDebt ? 'border-l-money-out' : 'border-l-outline/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center shrink-0 select-none"
          aria-hidden="true"
        >
          {initial}
        </div>

        {/* Name & Note */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {customer.name}
          </h3>
          {customer.note && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {customer.note}
            </p>
          )}
        </div>
      </div>

      {/* Balance or Settled */}
      <div className="flex items-center gap-2 shrink-0 pl-3">
        {hasDebt ? (
          <MoneyText amount={customer.balance} tone="out" size="md" />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
            <Check className="w-3.5 h-3.5 text-money-in" />
            <span>{t('debts.settled', 'Settled')}</span>
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
