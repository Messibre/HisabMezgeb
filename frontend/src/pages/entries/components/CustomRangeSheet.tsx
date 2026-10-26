import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/common/BottomSheet';
import { todayLocal, isFutureDate } from '@/lib/date';

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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="custom-from" className="block text-xs font-medium text-muted-foreground mb-1">
              From
            </label>
            <input
              id="custom-from"
              type="date"
              max={today}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setError('');
              }}
              className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="custom-to" className="block text-xs font-medium text-muted-foreground mb-1">
              To
            </label>
            <input
              id="custom-to"
              type="date"
              max={today}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setError('');
              }}
              className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
