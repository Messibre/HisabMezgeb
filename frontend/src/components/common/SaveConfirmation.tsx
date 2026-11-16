import { useTranslation } from 'react-i18next';
import { CircleCheck, CircleAlert, X } from 'lucide-react';
import { useSaveFeedbackStore } from '@/store/saveFeedback.store';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';

/**
 * One confirmation for every save, in the thumb area above the bottom tab bar.
 * Success repeats what was saved and hides after 4 s; a failure stays until dismissed.
 */
export default function SaveConfirmation() {
  const { t, i18n } = useTranslation();
  const current = useSaveFeedbackStore((s) => s.current);
  const dismiss = useSaveFeedbackStore((s) => s.dismiss);

  if (!current) return null;

  const isSaved = current.status === 'saved';
  const kindLabel = t(`save.kinds.${current.kind}`);
  const Icon = isSaved ? CircleCheck : CircleAlert;

  let detail: string | null = null;
  if (current.status === 'saved') {
    const parts = [
      current.name,
      current.date ? formatDate(current.date) : null,
      current.amount !== undefined
        ? `${formatMoney(current.amount, { lang: i18n.language })} ${t('common.currency', 'ETB')}`
        : null,
    ].filter(Boolean);
    detail = parts.length ? parts.join(' · ') : null;
  } else {
    detail = current.message;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <div
        key={current.id}
        role={isSaved ? 'status' : 'alert'}
        data-testid="save-confirmation"
        className={`pointer-events-auto flex min-h-14 w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${
          isSaved ? 'bg-primary text-primary-foreground' : 'bg-destructive text-white'
        }`}
      >
        <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight">
            {isSaved ? t('save.saved', { kind: kindLabel }) : t('save.failed', { kind: kindLabel })}
          </p>
          {detail && <p className="mt-0.5 text-sm opacity-90 break-words">{detail}</p>}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('save.dismiss')}
          className="shrink-0 rounded-full p-2 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
