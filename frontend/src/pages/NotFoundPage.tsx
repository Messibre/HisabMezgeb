import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <p className="text-foreground text-2xl font-semibold">{t('notFound.title')}</p>
      <p className="text-muted-foreground text-sm">{t('notFound.message')}</p>
      <Link to={ROUTES.HOME}>
        <Button>{t('notFound.goHome')}</Button>
      </Link>
    </div>
  );
}
