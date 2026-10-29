import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Plus, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/common/AppHeader';
import MoneyText from '@/components/common/MoneyText';
import SkeletonRow from '@/components/common/SkeletonRow';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import BottomSheet from '@/components/common/BottomSheet';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import { useDebtCustomers, useCreateDebtCustomer } from '@/hooks/useDebtCustomers';
import { useReportSummary } from '@/hooks/useReportSummary';
import { todayLocal } from '@/lib/date';
import { buildDebtCustomerDetailPath } from '@/constants';
import { CustomerCard } from './components/CustomerCard';
import type { DebtCustomer } from '@/types/api';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function DebtsListPage() {
  const { t } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.debts', noindex: true });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state synchronized with ?q=
  const initialQuery = searchParams.get('q') || '';
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchValue);
      if (searchValue.trim()) {
        setSearchParams({ q: searchValue.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setSearchParams]);

  // Queries
  const today = todayLocal();
  const { data: reportData } = useReportSummary(today, today);
  const totalOwed = reportData?.totalOwedByCustomers ?? 0;

  const {
    data: customers = [],
    isLoading,
    isError,
    refetch,
  } = useDebtCustomers(debouncedQuery.trim() || undefined);

  // Sort: highest balance first, then name; settled (balance === 0) at bottom
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a: DebtCustomer, b: DebtCustomer) => {
      const aSettled = a.balance <= 0;
      const bSettled = b.balance <= 0;

      if (aSettled && !bSettled) return 1;
      if (!aSettled && bSettled) return -1;

      // Both unsettled: highest balance first
      if (!aSettled && !bSettled) {
        if (b.balance !== a.balance) {
          return b.balance - a.balance;
        }
      }

      // If balances equal or both settled: sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [customers]);

  // New Customer BottomSheet state
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [nameError, setNameError] = useState('');

  const createCustomer = useCreateDebtCustomer();

  const handleOpenNewCustomer = (prefilledName = '') => {
    setNewName(prefilledName);
    setNewNote('');
    setNameError('');
    setIsNewCustomerOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setNameError(t('debts.nameRequired', 'Customer name is required'));
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Name must be 100 characters or less');
      return;
    }

    try {
      const created = await createCustomer.mutateAsync({
        name: trimmedName,
        note: newNote.trim() || undefined,
      });

      toast.success(t('common.save', 'Saved'));
      setIsNewCustomerOpen(false);
      navigate(buildDebtCustomerDetailPath(created.id));
    } catch {
      toast.error(t('common.error', 'Failed to save customer'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title={t('pages.debts', 'Debts')} />

      <div className="max-w-md mx-auto px-4 py-3 space-y-4">
        {/* Search Bar */}
        <div role="search" className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t('debts.searchPlaceholder', 'Search customer by name')}
              className="w-full h-11 pl-10 pr-10 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t('debts.clearSearch', 'Clear search')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Total Owed Hero Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 text-center shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {t('debts.totalOwed', 'Total Owed')}
          </span>
          <MoneyText amount={totalOwed} tone="out" size="xl" />
        </div>

        {/* Customers List Section */}
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="space-y-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : isError ? (
            <ErrorState
              message={t('common.error', 'Failed to load debt customers')}
              onRetry={() => refetch()}
            />
          ) : sortedCustomers.length === 0 ? (
            debouncedQuery.trim() ? (
              /* Search Empty State */
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-card/60 border border-border/30">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {t('debts.noCustomerFound', {
                    text: debouncedQuery.trim(),
                    defaultValue: `No customer found for “${debouncedQuery.trim()}”`,
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleOpenNewCustomer(debouncedQuery.trim())}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {t('debts.addCustomerNamed', {
                      text: debouncedQuery.trim(),
                      defaultValue: `Add “${debouncedQuery.trim()}”`,
                    })}
                  </span>
                </button>
              </div>
            ) : (
              /* No Customers at all */
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title={t('debts.noCustomers', 'No customers yet. Tap + to add one.')}
              />
            )
          ) : (
            sortedCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button (+) */}
      <button
        type="button"
        onClick={() => handleOpenNewCustomer('')}
        aria-label={t('debts.addCustomerAria', 'Add customer')}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* New Customer BottomSheet */}
      <BottomSheet
        open={isNewCustomerOpen}
        onOpenChange={setIsNewCustomerOpen}
        title={t('debts.newCustomer', 'New Customer')}
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 pt-1">
          <FormField
            label={t('debts.customerName', 'Customer Name')}
            id="new-customer-name"
            error={nameError}
          >
            <PillInput
              id="new-customer-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameError('');
              }}
              placeholder={t('debts.namePlaceholder', 'Enter customer name')}
            />
          </FormField>

          <FormField
            label={t('debts.noteLabel', 'Note')}
            id="new-customer-note"
            optional
          >
            <PillInput
              id="new-customer-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t('debts.notePlaceholder', 'e.g. phone or place (optional)')}
            />
          </FormField>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {createCustomer.isPending
                ? t('common.loading', 'Loading...')
                : t('debts.saveCustomer', 'Save Customer')}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
