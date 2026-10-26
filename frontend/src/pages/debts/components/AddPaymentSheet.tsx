import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import BottomSheet from '@/components/common/BottomSheet';
import AmountInput from '@/components/common/AmountInput';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import SegmentedControl from '@/components/common/SegmentedControl';
import { useCreatePayment } from '@/hooks/useDebtCustomerDetail';
import { todayLocal, isFutureDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';

interface AddPaymentSheetProps {
  customerId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaymentSheet({
  customerId,
  balance,
  open,
  onOpenChange,
}: AddPaymentSheetProps) {
  const { t } = useTranslation();
  const today = todayLocal();
  const [paymentType, setPaymentType] = useState<'full' | 'part'>('part');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');

  const createPayment = useCreatePayment();

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await createPayment.mutateAsync({
        customerId,
        payload: {
          date,
          amount: parsedAmount,
          note: note.trim() || undefined,
        },
      });

      toast.success(t('common.save', 'Saved'));
      setAmount('');
      setNote('');
      setPaymentType('part');
      onOpenChange(false);
    } catch {
      toast.error(t('common.error', 'Failed to save payment'));
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('debts.addPayment', 'Add Payment')}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Full amount / Part of it toggle */}
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

        <div className="bg-card border border-border/40 rounded-xl p-3 flex items-center justify-between">
          <label htmlFor="payment-date" className="text-xs font-semibold text-muted-foreground">
            {t('entries.dateLabel', 'Date')}
          </label>
          <input
            id="payment-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs bg-muted/60 text-foreground px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <FormField
          label={t('debts.noteLabel', 'Note')}
          id="payment-note"
          optional
        >
          <PillInput
            id="payment-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
          />
        </FormField>

        {/* Reminder helper text */}
        <p className="text-xs text-muted-foreground text-center bg-primary/5 border border-primary/15 rounded-xl p-3">
          {t(
            'debts.paymentAmountHelper',
            "Remember to include this cash in today's income total."
          )}
        </p>

        <div className="pt-2">
          <button
            type="submit"
            disabled={createPayment.isPending}
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {createPayment.isPending
              ? t('common.loading', 'Loading...')
              : t('debts.savePayment', 'Save Payment')}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
