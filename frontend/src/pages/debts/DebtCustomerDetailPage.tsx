import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBasket,
  Banknote,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/common/AppHeader';
import MoneyText from '@/components/common/MoneyText';
import SkeletonRow from '@/components/common/SkeletonRow';
import SkeletonBlock from '@/components/common/SkeletonBlock';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { toUserError } from '@/lib/errors';
import {
  useDebtCustomerDetail,
  useDeleteDebtCustomer,
} from '@/hooks/useDebtCustomerDetail';
import { AddBorrowSheet } from './components/AddBorrowSheet';
import { AddPaymentSheet } from './components/AddPaymentSheet';
import { EditCustomerSheet } from './components/EditCustomerSheet';
import { EditHistoryRecordSheet } from './components/EditHistoryRecordSheet';
import { DebtHistoryList } from './components/DebtHistoryList';
import type { DebtHistoryItem } from '@/types/api';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function DebtCustomerDetailPage() {
  const { customerId = '' } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.customerDetail', noindex: true });

  const isEnglish = i18n.language === 'en';

  // Customer detail query
  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useDebtCustomerDetail(customerId);

  const deleteCustomer = useDeleteDebtCustomer();

  // Subsheet states
  const [showBorrowSheet, setShowBorrowSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showEditCustomerSheet, setShowEditCustomerSheet] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DebtHistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // History sorted newest first
  const customerHistory = customer?.history;
  const sortedHistory = useMemo(() => {
    if (!customerHistory) return [];
    return [...customerHistory].sort((a, b) => b.date.localeCompare(a.date));
  }, [customerHistory]);

  const handleDeleteCustomer = async () => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      toast.success(t('entries.deletedToast', 'Deleted'));
      navigate('/debts');
    } catch {
      toast.error(t('common.error', 'Failed to delete customer'));
    }
  };

  // User error transformation
  const userError = isError ? toUserError(error) : null;
  const isNotFound = userError?.kind === 'notFound';

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader
          title={t('debts.ledgerTitle', 'Ledger')}
          onBack={() => navigate('/debts')}
        />
        <main className="max-w-md mx-auto p-4 pt-12">
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
            title={t('debts.customerNotFound', 'Customer not found')}
            description={t(
              'debts.customerNotFoundDesc',
              'This customer may have been deleted or the link is incorrect.'
            )}
            actionLabel={t('debts.backToDebts', 'Back to Debts')}
            onAction={() => navigate('/debts')}
          />
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader
          title={t('debts.ledgerTitle', 'Ledger')}
          onBack={() => navigate('/debts')}
        />
        <main className="max-w-md mx-auto p-4">
          <ErrorState
            message={t(userError?.messageKey || 'errors.server.message')}
            requestId={userError?.requestId}
            onRetry={() => refetch()}
          />
        </main>
      </div>
    );
  }

  const initial = customer ? Array.from(customer.name.trim())[0] || '?' : '';
  const isSettled = customer ? customer.balance <= 0 : false;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader
        title={t('debts.ledgerTitle', 'Ledger')}
        onBack={() => navigate('/debts')}
        rightAction={
          customer ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-30 py-1 overflow-hidden"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditCustomerSheet(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    <span>{t('debts.editCustomer', 'Edit customer')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('debts.deleteCustomer', 'Delete customer')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : null
        }
      />

      <main className="max-w-md mx-auto px-4 py-4 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <SkeletonBlock className="w-16 h-16 rounded-full" />
              <SkeletonBlock className="w-36 h-6 rounded-md" />
              <SkeletonBlock className="w-24 h-4 rounded-md" />
            </div>
            <SkeletonBlock className="w-full h-24 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="w-full h-[52px] rounded-full" />
              <SkeletonBlock className="w-full h-[52px] rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        ) : customer ? (
          <>
            {/* Customer Avatar and Name */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full bg-primary/20 text-primary font-bold text-2xl flex items-center justify-center select-none shadow-xs mb-2"
                aria-hidden="true"
              >
                {initial}
              </div>
              <h1 className="text-xl font-bold text-foreground truncate max-w-xs">
                {customer.name}
              </h1>
              {customer.note && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                  {customer.note}
                </p>
              )}
            </div>

            {/* Balance Card */}
            <div className="bg-card border border-border/40 rounded-2xl p-5 text-center shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
              <span
                className={`block text-xs font-semibold text-muted-foreground mb-1 ${
                  isEnglish ? 'uppercase tracking-wider' : ''
                }`}
              >
                {t('debts.totalUnpaidBalance', 'TOTAL UNPAID BALANCE')}
              </span>

              {isSettled ? (
                <div className="flex items-center justify-center gap-2 text-money-in py-1">
                  <Check className="w-6 h-6" />
                  <span className="text-xl font-bold">
                    {t('debts.allPaid', 'All paid')}
                  </span>
                </div>
              ) : (
                <MoneyText amount={customer.balance} tone="out" size="xl" />
              )}
            </div>

            {/* Action Buttons: Add Borrow & Add Payment (52px height) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowBorrowSheet(true)}
                className="h-[52px] rounded-full border-2 border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ShoppingBasket className="w-5 h-5" />
                <span>{t('debts.addBorrow', 'Add Borrow')}</span>
              </button>

              <button
                type="button"
                disabled={isSettled}
                onClick={() => setShowPaymentSheet(true)}
                className="h-[52px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Banknote className="w-5 h-5" />
                <span>{t('debts.addPayment', 'Add Payment')}</span>
              </button>
            </div>

            {/* History List */}
            <DebtHistoryList
              history={sortedHistory}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
            />
          </>
        ) : null}
      </main>

      {/* Add Borrow BottomSheet */}
      {customer && (
        <AddBorrowSheet
          customerId={customer.id}
          open={showBorrowSheet}
          onOpenChange={setShowBorrowSheet}
        />
      )}

      {/* Add Payment BottomSheet */}
      {customer && (
        <AddPaymentSheet
          customerId={customer.id}
          balance={customer.balance}
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
        />
      )}

      {/* Edit Customer BottomSheet */}
      {customer && (
        <EditCustomerSheet
          customerId={customer.id}
          initialName={customer.name}
          initialNote={customer.note || ''}
          open={showEditCustomerSheet}
          onOpenChange={setShowEditCustomerSheet}
        />
      )}

      {/* Edit/Delete History Record BottomSheet */}
      {customer && (
        <EditHistoryRecordSheet
          customerId={customer.id}
          record={selectedRecord}
          open={!!selectedRecord}
          onOpenChange={(open) => !open && setSelectedRecord(null)}
        />
      )}

      {/* Delete Customer ConfirmDialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('debts.deleteCustomerTitle', 'Delete Customer?')}
        message={t(
          'debts.deleteCustomerMessage',
          'Are you sure you want to delete this customer? Their history will be kept.'
        )}
        confirmLabel={t('entries.delete', 'Delete')}
        onConfirm={handleDeleteCustomer}
        tone="danger"
        loading={deleteCustomer.isPending}
      />
    </div>
  );
}
