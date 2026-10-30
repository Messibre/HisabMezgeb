import { useTranslation } from 'react-i18next';

export type PeriodType = 'today' | 'week' | 'month' | 'custom';

interface PeriodPickerProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const { t } = useTranslation();

  const options: { value: PeriodType; label: string }[] = [
    { value: 'today', label: t('reports.today', 'Today') },
    { value: 'week', label: t('reports.thisWeek', 'This Week') },
    { value: 'month', label: t('reports.thisMonth', 'This Month') },
    { value: 'custom', label: t('reports.custom', 'Custom') },
  ];
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }

    if (nextIndex !== currentIndex) {
      const nextOption = options[nextIndex];
      onChange(nextOption.value);
      // Focus next button
      const buttons = (e.currentTarget.parentElement?.querySelectorAll('button') || []) as NodeListOf<HTMLButtonElement>;
      buttons[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('reports.period', 'Report period')}
      className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-2"
    >
      {options.map((opt, idx) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex h-12 flex-shrink-0 items-center justify-center rounded-full px-6 text-[15px] font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-on-primary shadow-xs'
                : 'border border-border text-foreground hover:bg-surface-container-low'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
