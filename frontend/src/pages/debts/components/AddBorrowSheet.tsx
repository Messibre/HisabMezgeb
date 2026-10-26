import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import BottomSheet from '@/components/common/BottomSheet';
import AmountInput from '@/components/common/AmountInput';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import { useCreateBorrowRecord } from '@/hooks/useDebtCustomerDetail';
import { todayLocal, isFutureDate } from '@/lib/date';

interface AddBorrowSheetProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBorrowSheet({ customerId, open, onOpenChange }: AddBorrowSheetProps) {
  const { t } = useTranslation();
  const today = todayLocal();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [itemsDescription, setItemsDescription] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [itemsError, setItemsError] = useState('');

  const createBorrow = useCreateBorrowRecord();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setItemsError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('entries.errorAmountPositive', 'Amount must be greater than 0'));
      return;
    }

    if (!itemsDescription.trim()) {
      setItemsError(t('debts.itemsRequired', 'Please describe what was borrowed'));
      return;
    }

    if (isFutureDate(date)) {
      setAmountError(t('entries.errorFutureDate', 'Date cannot be in the future'));
      return;
    }

    try {
      await createBorrow.mutateAsync({
        customerId,
        payload: {
          date,
          amount: parsedAmount,
          itemsDescription: itemsDescription.trim(),
          note: note.trim() || undefined,
        },
      });

      toast.success(t('common.save', 'Saved'));
      setAmount('');
      setItemsDescription('');
      setNote('');
      onOpenChange(false);
    } catch {
      toast.error(t('common.error', 'Failed to save borrow record'));
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('debts.addBorrow', 'Add Borrow')}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <AmountInput
          id="borrow-amount"
          value={amount}
          onChange={(val) => {
            setAmount(val);
            setAmountError('');
          }}
          error={amountError}
        />

        <div className="bg-card border border-border/40 rounded-xl p-3 flex items-center justify-between">
          <label htmlFor="borrow-date" className="text-xs font-semibold text-muted-foreground">
            {t('entries.dateLabel', 'Date')}
          </label>
          <input
            id="borrow-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs bg-muted/60 text-foreground px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <FormField
          label={t('debts.itemsDescriptionLabel', 'What did they take?')}
          id="borrow-items"
          error={itemsError}
        >
          <textarea
            id="borrow-items"
            rows={2}
            value={itemsDescription}
            onChange={(e) => {
              setItemsDescription(e.target.value);
              setItemsError('');
            }}
            placeholder={t('debts.itemsPlaceholder', 'e.g. 2 bags of sugar, oil')}
            className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </FormField>

        <FormField
          label={t('debts.noteLabel', 'Note')}
          id="borrow-note"
          optional
        >
          <PillInput
            id="borrow-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
          />
        </FormField>

        <div className="pt-2">
          <button
            type="submit"
            disabled={createBorrow.isPending}
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {createBorrow.isPending
              ? t('common.loading', 'Loading...')
              : t('debts.saveBorrow', 'Save Borrow')}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
