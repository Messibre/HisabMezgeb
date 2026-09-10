export type PeriodType = 'today' | 'week' | 'month' | 'custom';

interface PeriodPickerProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

const OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  return (
    <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex h-12 flex-shrink-0 items-center justify-center rounded-full px-6 text-[16px] font-semibold transition-transform active:scale-95 ${
              isActive
                ? 'bg-primary-container text-on-primary'
                : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
