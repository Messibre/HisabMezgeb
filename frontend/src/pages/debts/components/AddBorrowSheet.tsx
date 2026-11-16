import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/common/BottomSheet';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { useFormDraft, clearDraft } from '@/hooks/useFormDraft';
import { useSaveFeedbackStore } from '@/store/saveFeedback.store';
import OfflineSaveNotice from '@/components/common/OfflineSaveNotice';
import { toUserError } from '@/lib/errors';
import AmountInput from '@/components/common/AmountInput';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import { useCreateBorrowRecord } from '@/hooks/useDebtCustomerDetail';
import { todayLocal, isFutureDate } from '@/lib/date';
import DateSelect from '@/components/common/DateSelect';

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
  const isOnline = useOnlineStatus();
  const { run: runGuarded, busy: isSubmitting } = useSubmitGuard();
  const showSaved = useSaveFeedbackStore((st) => st.showSaved);
  const showFailed = useSaveFeedbackStore((st) => st.showFailed);
  const draftKey = `borrow:${customerId}`;
  useFormDraft(draftKey, { amount, itemsDescription, note }, (draft) => {
    if (draft.amount) setAmount(draft.amount);
    if (draft.itemsDescription) setItemsDescription(draft.itemsDescription);
    if (draft.note) setNote(draft.note);
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    void runGuarded(submit);
  };

  const submit = async () => {
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
      const created = await createBorrow.mutateAsync({
        customerId,
        payload: {
          date,
          amount: parsedAmount,
          itemsDescription: itemsDescription.trim(),
          note: note.trim() || undefined,
        },
      });

      showSaved({ kind: 'borrow', date, amount: parsedAmount, recordId: created?.id });
      clearDraft(draftKey);
      setAmount('');
      setItemsDescription('');
      setNote('');
      onOpenChange(false);
    } catch (err) {
      showFailed({ kind: 'borrow', message: t(toUserError(err).messageKey) });
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('debts.addBorrow', 'Add Borrow')}>
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

        <div className="bg-card border border-border/40 rounded-xl p-3">
          <DateSelect
            label={t('entries.dateLabel', 'Date')}
            id="borrow-date"
            value={date}
            max={today}
            onChange={(ymd) => {
              setDate(ymd);
            }}
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

        <FormField label={t('debts.noteLabel', 'Note')} id="borrow-note" optional>
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
            disabled={createBorrow.isPending || isSubmitting || !isOnline}
            aria-describedby={!isOnline ? 'borrow-offline-notice' : undefined}
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {createBorrow.isPending || isSubmitting
              ? t('common.loading', 'Loading...')
              : t('debts.saveBorrow', 'Save Borrow')}
          </button>
          {!isOnline && <OfflineSaveNotice id="borrow-offline-notice" />}
        </div>
      </form>
    </BottomSheet>
  );
}
