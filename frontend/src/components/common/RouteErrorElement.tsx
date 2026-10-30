import { useRouteError, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toUserError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function RouteErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userError = toUserError(error);
  const title = t(userError.titleKey, t('errorBoundary.title', 'Something went wrong.'));
  const message = t(userError.messageKey, t('errorBoundary.message', 'Please try refreshing the page.'));

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div
      role="alert"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--money-out)]/20 text-[var(--money-out)] mb-4">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-2">{message}</p>
      {userError.requestId && (
        <p className="text-xs text-muted-foreground mb-4 font-mono select-all">
          {t('errors.reference', 'Reference')}: {userError.requestId}
        </p>
      )}
      <div className="flex items-center gap-3 mt-4">
        <Button variant="outline" onClick={handleRetry}>
          {t('common.tryAgain', 'Try Again')}
        </Button>
        <Button onClick={handleGoHome}>
          {t('errorBoundary.goHome', 'Go to Home')}
        </Button>
      </div>
    </div>
  );
}
