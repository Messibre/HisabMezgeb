import { ArrowDown, ArrowUp, Landmark, Clock } from 'lucide-react';
import MoneyText from '@/components/common/MoneyText';
import { formatDate } from '@/lib/date';
import type { IncomeEntry, ExpenseWithCategory, FundingEntry } from '@/types/api';

export type EntryItem =
  | ({ entryType: 'income' } & IncomeEntry)
  | ({ entryType: 'expense' } & ExpenseWithCategory)
  | ({ entryType: 'funding' } & FundingEntry);

interface EntryListCardProps {
  entry: EntryItem;
  onClick: () => void;
  syncStatus?: 'pending' | 'synced';
}

export function EntryListCard({ entry, onClick, syncStatus }: EntryListCardProps) {
  const isIncome = entry.entryType === 'income';
  const isExpense = entry.entryType === 'expense';

  const subtitle = isIncome
    ? entry.note || ''
    : isExpense
    ? entry.note
      ? `${entry.categoryName} • ${entry.note}`
      : entry.categoryName
    : (() => {
        const typeLabels: Record<string, string> = {
          salary_injection: 'Salary in',
          borrowed_in: 'Borrowed in',
          borrowed_repaid: 'Borrowed repaid',
        };
        const label = typeLabels[entry.type] || entry.type;
        return entry.note ? `${label} • ${entry.note}` : label;
      })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card hover:bg-muted/50 border border-border rounded-xl p-3.5 flex items-center justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[56px]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isIncome
              ? 'bg-money-in/10 text-money-in'
              : isExpense
              ? 'bg-money-out/10 text-money-out'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {isIncome ? (
            <ArrowDown className="w-5 h-5" />
          ) : isExpense ? (
            <ArrowUp className="w-5 h-5" />
          ) : (
            <Landmark className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground text-sm truncate">
              {formatDate(entry.date)}
            </span>
            {syncStatus === 'pending' && (
              <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" aria-label="Pending sync" />
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right pl-3">
        <MoneyText
          amount={entry.amount}
          tone={isIncome ? 'in' : isExpense ? 'out' : 'neutral'}
          size="md"
        />
      </div>
    </button>
  );
}
