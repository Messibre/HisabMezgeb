import { useTranslation } from 'react-i18next';
import { ShoppingBasket, Banknote, Clock } from 'lucide-react';
import MoneyText from '@/components/common/MoneyText';
import { formatDate } from '@/lib/date';
import type { DebtHistoryItem } from '@/types/api';

interface DebtHistoryListProps {
  history: DebtHistoryItem[];
  onSelectRecord: (record: DebtHistoryItem) => void;
  syncStatus?: 'pending' | 'synced';
}

export function DebtHistoryList({
  history,
  onSelectRecord,
  syncStatus,
}: DebtHistoryListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">
        {t('debts.history', 'History')}
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t('debts.noActivity', 'No activity yet for this customer.')}
        </p>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => {
            const isBorrow = item.kind === 'borrow';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectRecord(item)}
                className={`w-full rounded-xl bg-card hover:bg-muted/40 p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border/40 border-l-[5px] ${
                  isBorrow ? 'border-l-money-out' : 'border-l-money-in'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isBorrow
                          ? 'bg-money-out/10 text-money-out'
                          : 'bg-money-in/10 text-money-in'
                      }`}
                    >
                      {isBorrow ? (
                        <ShoppingBasket className="w-5 h-5" />
                      ) : (
                        <Banknote className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground">
                          {isBorrow
                            ? t('debts.borrowed', 'Borrowed')
                            : t('debts.paid', 'Paid')}
                        </span>
                        {syncStatus === 'pending' && (
                          <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right pl-3">
                    <MoneyText
                      amount={item.amount}
                      tone={isBorrow ? 'out' : 'in'}
                      size="md"
                    />
                  </div>
                </div>

                {/* Items description for borrows */}
                {isBorrow && item.itemsDescription && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    {item.itemsDescription}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
