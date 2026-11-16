import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/common/BottomSheet';
import { todayLocal, isFutureDate } from '@/lib/date';
import DateSelect from '@/components/common/DateSelect';

interface CustomRangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFrom: string;
  initialTo: string;
  onApply: (from: string, to: string) => void;
}

export function CustomRangeSheet({
  open,
  onOpenChange,
  initialFrom,
  initialTo,
  onApply,
}: CustomRangeSheetProps) {
  const { t } = useTranslation();
  const today = todayLocal();
  const [from, setFrom] = useState(initialFrom || today);
  const [to, setTo] = useState(initialTo || today);
  const [error, setError] = useState('');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFutureDate(from) || isFutureDate(to)) {
      setError(t('entries.errorFutureDate', 'Date cannot be in the future'));
      return;
    }
    if (from > to) {
      setError('Start date must be before or equal to end date');
      return;
    }
    setError('');
    onApply(from, to);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('entries.customRangeTitle', 'Select Custom Range')}
    >
      <form onSubmit={handleApply} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <DateSelect
              label={t('reports.fromDate', 'From')}
              id="custom-from"
              value={from}
              max={today}
              onChange={(ymd) => {
                setFrom(ymd);
                setError('');
              }}
            />
          </div>

          <div>
            <DateSelect
              label={t('reports.toDate', 'To')}
              id="custom-to"
              value={to}
              max={today}
              onChange={(ymd) => {
                setTo(ymd);
                setError('');
              }}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm"
        >
          {t('entries.applyRange', 'Apply Range')}
        </button>
      </form>
    </BottomSheet>
  );
}
