import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Stub page — see [6. Frontend UI, Pages & Components] section 6.2 for the
 * full spec (balance header, Add Borrow / Add Payment, interleaved history).
 */
export default function DebtCustomerDetailPage() {
  const { t } = useTranslation();
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-foreground">{t('pages.customerDetail')}</h1>
      <p className="text-muted-foreground text-sm mt-2">
        {t('pages.customerIdLabel')} {customerId}
      </p>
      <p className="text-muted-foreground text-sm">{t('common.comingSoon')}</p>
    </div>
  );
}
