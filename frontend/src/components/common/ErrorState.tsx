import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <p className="max-w-[280px] text-[18px] leading-relaxed text-on-surface-variant">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-12 items-center gap-2 rounded-full bg-primary-container px-6 text-[16px] font-semibold text-on-primary transition-transform active:scale-95"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
