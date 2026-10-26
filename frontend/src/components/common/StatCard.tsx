import type { ReactNode } from 'react';
import MoneyText, { type MoneyTone, type MoneySize } from './MoneyText';

export interface StatCardProps {
  label: string;
  amount: string | number;
  tone?: MoneyTone;
  size?: MoneySize;
  accentBarColor?: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({
  label,
  amount,
  tone = 'default',
  size = 'lg',
  accentBarColor,
  icon,
  onClick,
  className = '',
}: StatCardProps) {
  const CardWrapper = onClick ? 'button' : 'div';
  const interactiveProps = onClick
    ? {
        type: 'button' as const,
        onClick,
      }
    : {};

  return (
    <CardWrapper
      {...interactiveProps}
      className={`relative flex flex-col justify-between rounded-xl bg-card border border-border/40 p-4 text-left shadow-xs transition-colors overflow-hidden ${
        onClick
          ? 'cursor-pointer hover:bg-surface-container-high/40 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
          : ''
      } ${className}`}
    >
      {accentBarColor && (
        <span
          data-testid="stat-accent-bar"
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: accentBarColor }}
          aria-hidden="true"
        />
      )}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-on-surface-variant truncate">
          {label}
        </span>
        {icon && (
          <div className="text-on-surface-variant shrink-0" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      <div>
        <MoneyText amount={amount} tone={tone} size={size} />
      </div>
    </CardWrapper>
  );
}
