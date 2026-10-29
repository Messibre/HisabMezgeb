import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import BottomSheet from '@/components/common/BottomSheet';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import { useUpdateDebtCustomer } from '@/hooks/useDebtCustomers';

interface EditCustomerSheetProps {
  customerId: string;
  initialName: string;
  initialNote: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditCustomerForm({
  customerId,
  initialName,
  initialNote,
  onClose,
}: {
  customerId: string;
  initialName: string;
  initialNote: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [nameError, setNameError] = useState('');

  const updateCustomer = useUpdateDebtCustomer();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('debts.nameRequired', 'Customer name is required'));
      return;
    }

    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        payload: {
          name: trimmed,
          note: note.trim() || undefined,
        },
      });

      toast.success(t('common.save', 'Saved'));
      onClose();
    } catch {
      toast.error(t('common.error', 'Failed to update customer'));
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 pt-1">
      <FormField
        label={t('debts.customerName', 'Customer Name')}
        id="edit-customer-name"
        error={nameError}
      >
        <PillInput
          id="edit-customer-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError('');
          }}
        />
      </FormField>

      <FormField
        label={t('debts.noteLabel', 'Note')}
        id="edit-customer-note"
        optional
      >
        <PillInput
          id="edit-customer-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('debts.notePlaceholder', 'e.g. phone or place (optional)')}
        />
      </FormField>

      <div className="pt-2">
        <button
          type="submit"
          disabled={updateCustomer.isPending}
          className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {updateCustomer.isPending
            ? t('common.loading', 'Loading...')
            : t('common.save', 'Save')}
        </button>
      </div>
    </form>
  );
}

export function EditCustomerSheet({
  customerId,
  initialName,
  initialNote,
  open,
  onOpenChange,
}: EditCustomerSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('debts.editCustomer', 'Edit customer')}
    >
      <EditCustomerForm
        key={`${customerId}-${initialName}`}
        customerId={customerId}
        initialName={initialName}
        initialNote={initialNote}
        onClose={() => onOpenChange(false)}
      />
    </BottomSheet>
  );
}
