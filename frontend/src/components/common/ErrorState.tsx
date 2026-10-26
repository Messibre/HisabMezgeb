import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorState({
  message,
  onRetry,
  retryLabel,
  className = '',
}: ErrorStateProps) {
  const { t } = useTranslation();
  const effectiveRetryLabel = retryLabel || t('common.tryAgain', 'Try Again');

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[var(--money-out)]/10 border border-[var(--money-out)]/20 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--money-out)]/20 text-[var(--money-out)] mb-3">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center rounded-full bg-surface-container-high px-5 text-sm font-medium text-foreground hover:bg-surface-container-highest transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
        >
          {effectiveRetryLabel}
        </button>
      )}
    </div>
  );
}
