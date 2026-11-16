import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import DebtsListPage from './DebtsListPage';
import DebtCustomerDetailPage from './DebtCustomerDetailPage';

/**
 * Phones: /debts is the list and /debts/:id the ledger, as separate pages.
 * 1024px and up: the list stays on the left and the open ledger is on the right.
 */
export default function DebtsLayout() {
  const { t } = useTranslation();
  const { customerId } = useParams<{ customerId: string }>();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!isDesktop) return customerId ? <DebtCustomerDetailPage /> : <DebtsListPage />;

  return (
    <div className="grid min-h-screen grid-cols-[minmax(320px,400px)_1fr] divide-x divide-border">
      <div className="min-w-0">
        <DebtsListPage />
      </div>
      <div className="min-w-0">
        {customerId ? (
          <DebtCustomerDetailPage key={customerId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-on-surface-variant">
            <Users className="h-10 w-10" aria-hidden="true" />
            <p className="text-sm">{t('debts.selectCustomer')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
