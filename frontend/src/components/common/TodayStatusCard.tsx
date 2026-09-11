import { Receipt, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TodayStatusCardProps {
  isEntered: boolean;
  onAddIncome: () => void;
}

export function TodayStatusCard({ isEntered, onAddIncome }: TodayStatusCardProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-center gap-6 rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <div className="rounded-full bg-surface-container p-4">
        <Receipt className="h-10 w-10 text-on-surface-variant" />
      </div>
      <h3 className="text-[24px] font-semibold leading-tight text-on-surface">
        {isEntered ? t('home.incomeEntered') : t('home.incomeNotEntered')}
      </h3>
      {!isEntered && (
        <button
          type="button"
          onClick={onAddIncome}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-primary-container px-6 text-[16px] font-semibold text-on-primary shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" />
          {t('home.addTodaySales')}
        </button>
      )}
    </section>
  );
}
