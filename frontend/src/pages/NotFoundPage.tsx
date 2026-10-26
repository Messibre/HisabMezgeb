import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';

export interface NotFoundPageProps {
  insideLayout?: boolean;
}

export default function NotFoundPage({ insideLayout = false }: NotFoundPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === 'authenticated';
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = t('notFound.documentTitle', 'Page not found - Hisab Mezgeb');
    headingRef.current?.focus();
  }, [t]);

  const handlePrimaryClick = () => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN);
    }
  };

  return (
    <main
      role="main"
      className={`${
        insideLayout ? 'min-h-[70vh]' : 'min-h-screen'
      } flex flex-col items-center justify-center p-6 text-center bg-background`}
    >
      {/* Friendly, accessible inline SVG illustration */}
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-container-high/60 text-muted-foreground mb-6 shadow-xs">
        <svg
          className="h-12 w-12 text-primary/80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
        </svg>
      </div>

      <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1">
        404
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-foreground mb-2 outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xs"
      >
        {t('notFound.heading', 'Page Not Found')}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t('notFound.message', "We couldn't find the page you're looking for.")}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <Button
          type="button"
          onClick={handlePrimaryClick}
          className="w-full h-11 text-base font-medium shadow-sm"
        >
          {isAuthenticated
            ? t('notFound.goHome', 'Go to Home')
            : t('notFound.goLogin', 'Go to Login')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleBackClick}
          className="w-full h-11 text-base font-medium"
        >
          {t('notFound.goBack', 'Go back')}
        </Button>
      </div>
    </main>
  );
}
