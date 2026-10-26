import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AmountInput from '@/components/common/AmountInput';
import { formatDate } from '@/lib/date';
import {
  useUpdateIncome,
  useDeleteIncome,
  useUpdateExpense,
  useDeleteExpense,
  useUpdateFunding,
  useDeleteFunding,
} from '@/hooks/useEntryMutations';
import type { EntryItem } from './EntryListCard';

interface EditEntrySheetProps {
  entry: EntryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditEntryFormProps {
  entry: EntryItem;
  onClose: () => void;
}

function EditEntryForm({ entry, onClose }: EditEntryFormProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(String(entry.amount));
  const [note, setNote] = useState(entry.note || '');
  const [amountError, setAmountError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateFunding = useUpdateFunding();
  const deleteFunding = useDeleteFunding();

  const isIncome = entry.entryType === 'income';
  const isExpense = entry.entryType === 'expense';
  const isFunding = entry.entryType === 'funding';

  const isSaving =
    updateIncome.isPending ||
    updateExpense.isPending ||
    updateFunding.isPending;
  const isDeleting =
    deleteIncome.isPending ||
    deleteExpense.isPending ||
    deleteFunding.isPending;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || amount === '') {
      setAmountError(t('entries.errorAmountRequired', 'Enter an amount'));
      return;
    }

    if (isFunding && parsedAmount <= 0) {
      setAmountError(t('entries.errorAmountPositive', 'Amount must be greater than 0'));
      return;
    }

    if ((isIncome || isExpense) && parsedAmount < 0) {
      setAmountError(t('entries.errorAmountRequired', 'Enter an amount'));
      return;
    }

    setAmountError('');

    try {
      if (isIncome) {
        await updateIncome.mutateAsync({
          id: entry.id,
          payload: { amount: parsedAmount, note: note || undefined },
        });
      } else if (isExpense) {
        await updateExpense.mutateAsync({
          id: entry.id,
          payload: { amount: parsedAmount, note: note || undefined },
        });
      } else {
        await updateFunding.mutateAsync({
          id: entry.id,
          payload: { amount: parsedAmount, note: note || undefined },
        });
      }

      toast.success(t('entries.updatedToast', 'Updated'));
      onClose();
    } catch {
      toast.error(t('common.error', 'Failed to update entry'));
    }
  };

  const handleDelete = async () => {
    try {
      if (isIncome) {
        await deleteIncome.mutateAsync(entry.id);
      } else if (isExpense) {
        await deleteExpense.mutateAsync(entry.id);
      } else {
        await deleteFunding.mutateAsync(entry.id);
      }

      toast.success(t('entries.deletedToast', 'Deleted'));
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      toast.error(t('common.error', 'Failed to delete entry'));
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="space-y-4">
        <AmountInput
          id="edit-amount"
          value={amount}
          onChange={(val) => {
            setAmount(val);
            setAmountError('');
          }}
          error={amountError}
        />

        <div>
          <label htmlFor="edit-note" className="block text-xs font-medium text-muted-foreground mb-1">
            {t('entries.noteLabel', 'Note')}
          </label>
          <input
            id="edit-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
            className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-[52px] px-4 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            aria-label={t('entries.deleteEntry', 'Delete Entry')}
          >
            <Trash2 className="w-5 h-5" />
            <span>{t('entries.delete', 'Delete')}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? t('common.loading', 'Loading...') : t('entries.updateEntry', 'Update Entry')}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('entries.deleteConfirmTitle', 'Delete Entry?')}
        message={t('entries.deleteConfirmMessage', 'Are you sure you want to delete this entry? It can be entered again later.')}
        confirmLabel={t('entries.delete', 'Delete')}
        onConfirm={handleDelete}
        tone="danger"
        loading={isDeleting}
      />
    </>
  );
}

export function EditEntrySheet({ entry, open, onOpenChange }: EditEntrySheetProps) {
  const { t } = useTranslation();

  if (!entry) return null;

  const isExpense = entry.entryType === 'expense';
  const isFunding = entry.entryType === 'funding';

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('entries.editEntry', 'Edit Entry')}
      description={`${formatDate(entry.date)} • ${
        isExpense ? entry.categoryName : isFunding ? entry.type : t('entries.tabIncome')
      }`}
    >
      <EditEntryForm
        key={entry.id}
        entry={entry}
        onClose={() => onOpenChange(false)}
      />
    </BottomSheet>
  );
}
