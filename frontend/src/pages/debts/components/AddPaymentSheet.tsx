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
import SegmentedControl from '@/components/common/SegmentedControl';
import { useCreatePayment } from '@/hooks/useDebtCustomerDetail';
import { todayLocal, isFutureDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import DateSelect from '@/components/common/DateSelect';

interface AddPaymentSheetProps {
  customerId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaymentSheet({ customerId, balance, open, onOpenChange }: AddPaymentSheetProps) {
  const { t } = useTranslation();
  const today = todayLocal();
  const [paymentType, setPaymentType] = useState<'full' | 'part'>('part');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');

  const createPayment = useCreatePayment();
  const isOnline = useOnlineStatus();
  const { run: runGuarded, busy: isSubmitting } = useSubmitGuard();
  const showSaved = useSaveFeedbackStore((st) => st.showSaved);
  const showFailed = useSaveFeedbackStore((st) => st.showFailed);
  const draftKey = `payment:${customerId}`;
  useFormDraft(draftKey, { amount, note }, (draft) => {
    if (draft.amount) setAmount(draft.amount);
    if (draft.note) setNote(draft.note);
  });

  const handleTypeChange = (newType: string) => {
    setPaymentType(newType as 'full' | 'part');
    if (newType === 'full') {
      setAmount(String(balance));
      setAmountError('');
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setAmountError('');
    // If user edits amount manually, move segmented control to 'part'
    if (parseFloat(val) !== balance) {
      setPaymentType('part');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    void runGuarded(submit);
  };

  const submit = async () => {
    setAmountError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('entries.errorAmountPositive', 'Amount must be greater than 0'));
      return;
    }

    if (parsedAmount > balance) {
      setAmountError(
        t('debts.paymentMaxError', {
          balance: formatMoney(balance),
          defaultValue: `Cannot be more than what is owed (ETB ${formatMoney(balance)})`,
        })
      );
      return;
    }

    if (isFutureDate(date)) {
      setAmountError(t('entries.errorFutureDate', 'Date cannot be in the future'));
      return;
    }

    try {
      const created = await createPayment.mutateAsync({
        customerId,
        payload: {
          date,
          amount: parsedAmount,
          note: note.trim() || undefined,
        },
      });

      showSaved({ kind: 'payment', date, amount: parsedAmount, recordId: created?.payment?.id });
      clearDraft(draftKey);
      setAmount('');
      setNote('');
      setPaymentType('part');
      onOpenChange(false);
    } catch (err) {
      showFailed({ kind: 'payment', message: t(toUserError(err).messageKey) });
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('debts.addPayment', 'Add Payment')}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <SegmentedControl
          name="payment-type"
          value={paymentType}
          onChange={handleTypeChange}
          options={[
            { value: 'full', label: t('debts.fullAmount', 'Full amount') },
            { value: 'part', label: t('debts.partOfIt', 'Part of it') },
          ]}
        />

        <AmountInput
          id="payment-amount"
          value={amount}
          onChange={handleAmountChange}
          error={amountError}
        />

        <div className="bg-card border border-border/40 rounded-xl p-3">
          <DateSelect
            label={t('entries.dateLabel', 'Date')}
            id="payment-date"
            value={date}
            max={today}
            onChange={(ymd) => {
              setDate(ymd);
            }}
          />
        </div>

        <FormField label={t('debts.noteLabel', 'Note')} id="payment-note" optional>
          <PillInput
            id="payment-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
          />
        </FormField>

        <p className="text-xs text-muted-foreground text-center bg-primary/5 border border-primary/15 rounded-xl p-3">
          {t('debts.paymentAmountHelper', "Remember to include this cash in today's income total.")}
        </p>

        <div className="pt-2">
          <button
            type="submit"
            disabled={createPayment.isPending || isSubmitting || !isOnline}
            aria-describedby={!isOnline ? 'payment-offline-notice' : undefined}
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {createPayment.isPending || isSubmitting
              ? t('common.loading', 'Loading...')
              : t('debts.savePayment', 'Save Payment')}
          </button>
          {!isOnline && <OfflineSaveNotice id="payment-offline-notice" />}
        </div>
      </form>
    </BottomSheet>
  );
}
