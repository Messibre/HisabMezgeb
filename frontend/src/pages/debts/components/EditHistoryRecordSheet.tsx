import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AmountInput from '@/components/common/AmountInput';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import {
  useUpdateBorrowRecord,
  useDeleteBorrowRecord,
  useUpdatePayment,
  useDeletePayment,
} from '@/hooks/useDebtCustomerDetail';
import type { DebtHistoryItem } from '@/types/api';

interface EditHistoryRecordSheetProps {
  customerId: string;
  record: DebtHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditRecordForm({
  customerId,
  record,
  onClose,
}: {
  customerId: string;
  record: DebtHistoryItem;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isBorrow = record.kind === 'borrow';

  const [amount, setAmount] = useState(String(record.amount));
  const [itemsDescription, setItemsDescription] = useState(record.itemsDescription || '');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [itemsError, setItemsError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateBorrow = useUpdateBorrowRecord();
  const deleteBorrow = useDeleteBorrowRecord();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const isSaving = updateBorrow.isPending || updatePayment.isPending;
  const isDeleting = deleteBorrow.isPending || deletePayment.isPending;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setItemsError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('entries.errorAmountPositive', 'Amount must be greater than 0'));
      return;
    }

    if (isBorrow && !itemsDescription.trim()) {
      setItemsError(t('debts.itemsRequired', 'Please describe what was borrowed'));
      return;
    }

    try {
      if (isBorrow) {
        await updateBorrow.mutateAsync({
          customerId,
          recordId: record.id,
          payload: {
            amount: parsedAmount,
            itemsDescription: itemsDescription.trim(),
            note: note.trim() || undefined,
          },
        });
      } else {
        await updatePayment.mutateAsync({
          customerId,
          paymentId: record.id,
          payload: {
            amount: parsedAmount,
            note: note.trim() || undefined,
          },
        });
      }

      toast.success(t('common.save', 'Saved'));
      onClose();
    } catch {
      toast.error(t('common.error', 'Failed to update record'));
    }
  };

  const handleDelete = async () => {
    try {
      if (isBorrow) {
        await deleteBorrow.mutateAsync({ customerId, recordId: record.id });
      } else {
        await deletePayment.mutateAsync({ customerId, paymentId: record.id });
      }

      toast.success(t('entries.deletedToast', 'Deleted'));
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      toast.error(t('common.error', 'Failed to delete record'));
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <AmountInput
          id="edit-record-amount"
          value={amount}
          onChange={(val) => {
            setAmount(val);
            setAmountError('');
          }}
          error={amountError}
        />

        {isBorrow && (
          <FormField
            label={t('debts.itemsDescriptionLabel', 'What did they take?')}
            id="edit-record-items"
            error={itemsError}
          >
            <textarea
              id="edit-record-items"
              rows={2}
              value={itemsDescription}
              onChange={(e) => {
                setItemsDescription(e.target.value);
                setItemsError('');
              }}
              className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
        )}

        <FormField
          label={t('debts.noteLabel', 'Note')}
          id="edit-record-note"
          optional
        >
          <PillInput
            id="edit-record-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
          />
        </FormField>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-[52px] px-4 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <Trash2 className="w-5 h-5" />
            <span>{t('entries.delete', 'Delete')}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('debts.deleteRecordTitle', 'Delete Record?')}
        message={t('debts.deleteRecordMessage', 'Are you sure you want to delete this record?')}
        confirmLabel={t('entries.delete', 'Delete')}
        onConfirm={handleDelete}
        tone="danger"
        loading={isDeleting}
      />
    </>
  );
}

export function EditHistoryRecordSheet({
  customerId,
  record,
  open,
  onOpenChange,
}: EditHistoryRecordSheetProps) {
  const { t } = useTranslation();

  if (!record) return null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('debts.editRecord', 'Edit Record')}
    >
      <EditRecordForm
        key={record.id}
        customerId={customerId}
        record={record}
        onClose={() => onOpenChange(false)}
      />
    </BottomSheet>
  );
}
