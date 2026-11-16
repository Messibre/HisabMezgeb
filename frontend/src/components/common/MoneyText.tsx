import { useTranslation } from 'react-i18next';
import { formatMoney, parseAmount, moneySign, UNKNOWN_VALUE, type MoneyTone } from '@/lib/money';

export type { MoneyTone };
export type MoneySize = 'sm' | 'md' | 'lg' | 'xl';

export interface MoneyTextProps {
  /** null or undefined means "unknown" and renders a dash, never 0. */
  amount: string | number | null | undefined;
  tone?: MoneyTone;
  size?: MoneySize;
  showCurrency?: boolean;
  currency?: string;
  showSign?: boolean;
  className?: string;
}

export default function MoneyText({
  amount,
  tone = 'default',
  size = 'md',
  showCurrency = true,
  currency,
  showSign = false,
  className = '',
}: MoneyTextProps) {
  const { t, i18n } = useTranslation();
  const effectiveCurrency = currency || t('common.currency', 'ETB');

  const numeric = parseAmount(amount);
  const isUnknown = numeric === null;
  // Normalizes -0 and negative inputs: the sign comes from the tone, not the value.
  const magnitude = isUnknown ? 0 : Math.abs(numeric) + 0;
  const formattedValue = isUnknown
    ? UNKNOWN_VALUE
    : formatMoney(magnitude, { showCurrency: false, lang: i18n.language });

  const getToneClass = () => {
    switch (tone) {
      case 'in':
        return size === 'sm' ? 'text-[var(--money-in-strong)]' : 'text-[var(--money-in)]';
      case 'out':
        return size === 'sm' ? 'text-[var(--money-out-strong)]' : 'text-[var(--money-out)]';
      case 'neutral':
      case 'owed':
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
  const sign = moneySign(numeric, tone, showSign);
  const toneLabel =
    tone === 'in'
      ? t('common.income', 'Income')
      : tone === 'out'
        ? t('common.expense', 'Expense')
        : tone === 'owed'
          ? t('money.owedToYou', 'Owed to you')
          : '';

  return (
    <span
      className={`inline-flex items-baseline font-mono-numbers ${getToneClass()} ${sizeStyle.wrapper} ${className}`}
    >
      {showCurrency && !isUnknown && (
        <span className={sizeStyle.currency}>{effectiveCurrency}</span>
      )}
      <span>{sign}{formattedValue}</span>
      {toneLabel && <span className="sr-only"> ({toneLabel})</span>}
    </span>
  );
}
