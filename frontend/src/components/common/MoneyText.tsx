import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/lib/money';

export type MoneyTone = 'in' | 'out' | 'neutral' | 'default';
export type MoneySize = 'sm' | 'md' | 'lg' | 'xl';

export interface MoneyTextProps {
  amount: string | number;
  tone?: MoneyTone;
  size?: MoneySize;
  showCurrency?: boolean;
  currency?: string;
  className?: string;
}

export default function MoneyText({
  amount,
  tone = 'default',
  size = 'md',
  showCurrency = true,
  currency,
  className = '',
}: MoneyTextProps) {
  const { t, i18n } = useTranslation();
  const effectiveCurrency = currency || t('common.currency', 'ETB');

  const formattedValue = formatMoney(amount, {
    showCurrency: false,
    lang: i18n.language,
  });

  const getToneClass = () => {
    switch (tone) {
      case 'in':
        return size === 'sm' ? 'text-[var(--money-in-strong)]' : 'text-[var(--money-in)]';
      case 'out':
        return size === 'sm' ? 'text-[var(--money-out-strong)]' : 'text-[var(--money-out)]';
      case 'neutral':
        return size === 'sm' ? 'text-[var(--money-neutral-strong)]' : 'text-[var(--money-neutral)]';
      case 'default':
      default:
        return 'text-foreground';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          wrapper: 'text-sm font-medium',
          currency: 'text-xs font-normal mr-1 opacity-80',
        };
      case 'lg':
        return {
          wrapper: 'text-lg font-bold',
          currency: 'text-sm font-normal mr-1.5 opacity-80',
        };
      case 'xl':
        return {
          wrapper: 'text-2xl font-bold tracking-tight',
          currency: 'text-sm font-normal mr-1.5 opacity-80',
        };
      case 'md':
      default:
        return {
          wrapper: 'text-base font-semibold',
          currency: 'text-xs font-normal mr-1 opacity-80',
        };
    }
  };

  const sizeStyle = getSizeClasses();

  return (
    <span
      className={`inline-flex items-baseline font-mono-numbers ${getToneClass()} ${sizeStyle.wrapper} ${className}`}
    >
      {showCurrency && (
        <span className={sizeStyle.currency}>{effectiveCurrency}</span>
      )}
      <span>{formattedValue}</span>
    </span>
  );
}
