import { useEffect, useRef } from 'react';
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

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerElementRef.current = document.activeElement as HTMLElement;

    // Focus initial element (cancel button by default)
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        onOpenChange(false);
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      triggerElementRef.current?.focus?.();
    };
  }, [open, onCancel, onOpenChange]);

  if (!open) return null;

  const handleCancelClick = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const isDanger = tone === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Non-interactive visual backdrop overlay */}
      <div
        aria-hidden="true"
        onClick={loading ? undefined : handleCancelClick}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Accessible Dialog container */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        className={`relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-xl focus:outline-none ${className}`}
      >
        <div className="flex items-center gap-3 mb-3">
          {isDanger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
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
            ref={cancelBtnRef}
            type="button"
            disabled={loading}
            onClick={handleCancelClick}
            className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {effectiveCancel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex h-12 min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 shadow-xs ${
              isDanger
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
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
