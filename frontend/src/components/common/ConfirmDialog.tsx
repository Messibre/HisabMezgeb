import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  tone?: 'danger' | 'default';
  loading?: boolean;
  className?: string;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'danger',
  loading = false,
  className = '',
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const effectiveConfirm = confirmLabel || t('common.save', 'Confirm');
  const effectiveCancel = cancelLabel || t('common.cancel', 'Cancel');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel?.();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel, onOpenChange]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel?.();
      onOpenChange(false);
    }
  };

  const handleCancelClick = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const isDanger = tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className={`w-full max-w-sm rounded-2xl bg-card border border-border/40 p-6 shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          {isDanger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--money-out)]/20 text-[var(--money-out)]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-foreground">
            {title}
          </h2>
        </div>

        <p id="confirm-dialog-message" className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleCancelClick}
            className="inline-flex h-11 items-center justify-center rounded-full border border-outline/30 px-5 text-sm font-medium text-foreground hover:bg-surface-container-high transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {effectiveCancel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 shadow-xs ${
              isDanger
                ? 'bg-[var(--money-out)] text-white hover:bg-[var(--money-out)]/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {loading ? t('common.loading', 'Loading...') : effectiveConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
