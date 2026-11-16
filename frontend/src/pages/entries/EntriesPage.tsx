import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Check, Calendar, FileText, ChevronDown } from 'lucide-react';
import AppHeader from '@/components/common/AppHeader';
import SegmentedControl from '@/components/common/SegmentedControl';
import AmountInput from '@/components/common/AmountInput';
import SkeletonRow from '@/components/common/SkeletonRow';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { useCreateIncome } from '@/hooks/useCreateIncome';
import { useCreateExpense } from '@/hooks/useCreateExpense';
import { useCreateFunding } from '@/hooks/useCreateFunding';
import { useUpdateIncome, useUpdateExpense, useUpdateFunding } from '@/hooks/useEntryMutations';
import { useEntryHistory } from '@/hooks/useEntryHistory';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import {
  todayLocal,
  formatDate,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isFutureDate,
} from '@/lib/date';
import { EntryListCard, type EntryItem } from './components/EntryListCard';
import { EditEntrySheet } from './components/EditEntrySheet';
import { CustomRangeSheet } from './components/CustomRangeSheet';
import type { IncomeEntry, ExpenseWithCategory, FundingEntry } from '@/types/api';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { useFormDraft, clearDraft } from '@/hooks/useFormDraft';
import { useSaveFeedbackStore } from '@/store/saveFeedback.store';
import OfflineSaveNotice from '@/components/common/OfflineSaveNotice';
import { toUserError } from '@/lib/errors';
import { categoryLabel } from '@/lib/categories';
import DateSelect from '@/components/common/DateSelect';

type TabType = 'income' | 'expense' | 'funding';
type PeriodType = 'today' | 'week' | 'month' | 'custom';

export default function EntriesPage() {
  const { t } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.entries', noindex: true });
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab from URL ?type=
  const urlType = searchParams.get('type') as TabType | null;
  const activeTab: TabType = urlType === 'expense' || urlType === 'funding' ? urlType : 'income';

  const handleTabChange = (newTab: string) => {
    setSearchParams({ type: newTab });
    setAmount('');
    setNote('');
    setAmountError('');
    setCategoryError('');
    setIsEditMode(false);
    setEditEntryId(null);
  };

  const today = todayLocal();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fundingType, setFundingType] = useState<FundingEntry['type']>('salary_injection');

  const [isEditMode, setIsEditMode] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);

  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [serverConflict, setServerConflict] = useState<{ amount: number; date: string } | null>(
    null
  );

  const [period, setPeriod] = useState<PeriodType>('week');
  const [customRange, setCustomRange] = useState({ from: today, to: today });
  const [showCustomRangeSheet, setShowCustomRangeSheet] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<EntryItem | null>(null);

  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const createFunding = useCreateFunding();
  const updateIncome = useUpdateIncome();
  const updateExpense = useUpdateExpense();
  const updateFunding = useUpdateFunding();

  const { data: categories = [] } = useExpenseCategories();

  const isOnline = useOnlineStatus();
  const { run: runGuarded, busy: isSubmitting, justSaved, markSaved } = useSubmitGuard();
  const showSaved = useSaveFeedbackStore((s) => s.showSaved);
  const showFailed = useSaveFeedbackStore((s) => s.showFailed);

  // Unsaved typed fields survive a reload (per tab; edits have their own key).
  const draftKey =
    isEditMode && editEntryId ? `entries:${activeTab}:edit:${editEntryId}` : `entries:${activeTab}`;
  useFormDraft(
    draftKey,
    { amount, note, categoryId: activeTab === 'expense' ? categoryId : '' },
    (draft) => {
      if (draft.amount) setAmount(draft.amount);
      if (draft.note) setNote(draft.note);
      if (draft.categoryId) setCategoryId(draft.categoryId);
    }
  );

  // Calculate date range for recent entries
  const { fromDate, toDate } = useMemo(() => {
    switch (period) {
      case 'today':
        return { fromDate: today, toDate: today };
      case 'week':
        return { fromDate: startOfWeek(today), toDate: endOfWeek(today) };
      case 'month':
        return { fromDate: startOfMonth(today), toDate: endOfMonth(today) };
      case 'custom':
        return { fromDate: customRange.from, toDate: customRange.to };
    }
  }, [period, today, customRange]);

  const {
    data: historyData = [],
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useEntryHistory(activeTab, fromDate, toDate);

  // Duplicate detection from cached data
  const cachedConflict = useMemo(() => {
    if (activeTab === 'income') {
      const existing = (historyData as IncomeEntry[]).find(
        (item) => item.date === date && (!isEditMode || item.id !== editEntryId)
      );
      if (existing) {
        return {
          id: existing.id,
          amount: existing.amount,
          date: existing.date,
          note: existing.note,
        };
      }
    } else if (activeTab === 'expense' && categoryId) {
      const existing = (historyData as ExpenseWithCategory[]).find(
        (item) =>
          item.date === date &&
          item.categoryId === categoryId &&
          (!isEditMode || item.id !== editEntryId)
      );
      if (existing) {
        return {
          id: existing.id,
          amount: existing.amount,
          date: existing.date,
          note: existing.note,
        };
      }
    }
    return null;
  }, [activeTab, historyData, date, categoryId, isEditMode, editEntryId]);

  const activeConflict =
    cachedConflict ||
    (serverConflict
      ? { id: '', amount: serverConflict.amount, date: serverConflict.date, note: null }
      : null);

  const activeCategories = useMemo(() => categories.filter((cat) => cat.isActive), [categories]);
  const businessCategories = useMemo(
    () => activeCategories.filter((cat) => cat.group === 'business'),
    [activeCategories]
  );
  const personalCategories = useMemo(
    () => activeCategories.filter((cat) => cat.group === 'personal'),
    [activeCategories]
  );

  const isSaving =
    createIncome.isPending ||
    createExpense.isPending ||
    createFunding.isPending ||
    updateIncome.isPending ||
    updateExpense.isPending ||
    updateFunding.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Offline, nothing can be saved: never pretend it was.
    if (!isOnline) return;
    void runGuarded(submitEntry);
  };

  const submitEntry = async () => {
    setAmountError('');
    setCategoryError('');
    setServerConflict(null);

    const parsedAmount = parseFloat(amount);
    if (amount === '' || isNaN(parsedAmount)) {
      setAmountError(t('entries.errorAmountRequired', 'Enter an amount'));
      return;
    }

    if (!/^\d{1,8}(\.\d{1,2})?$/.test(amount)) {
      setAmountError(t('entries.errorAmountRequired', 'Enter an amount'));
      return;
    }

    if (activeTab === 'funding' && parsedAmount <= 0) {
      setAmountError(t('entries.errorAmountPositive', 'Amount must be greater than 0'));
      return;
    }

    if ((activeTab === 'income' || activeTab === 'expense') && parsedAmount < 0) {
      setAmountError(t('entries.errorAmountRequired', 'Enter an amount'));
      return;
    }

    if (!date) {
      return;
    }
    if (isFutureDate(date)) {
      setAmountError(t('entries.errorFutureDate', 'Date cannot be in the future'));
      return;
    }

    if (activeTab === 'expense' && !categoryId) {
      setCategoryError(t('entries.errorCategoryRequired', 'Please select a category'));
      return;
    }

    try {
      if (isEditMode && editEntryId) {
        if (activeTab === 'income') {
          await updateIncome.mutateAsync({
            id: editEntryId,
            payload: { amount: parsedAmount, note: note || undefined },
          });
        } else if (activeTab === 'expense') {
          await updateExpense.mutateAsync({
            id: editEntryId,
            payload: { amount: parsedAmount, note: note || undefined },
          });
        } else {
          await updateFunding.mutateAsync({
            id: editEntryId,
            payload: { amount: parsedAmount, note: note || undefined },
          });
        }
        showSaved({ kind: activeTab, date, amount: parsedAmount, recordId: editEntryId });
      } else {
        let created: { id: string } | undefined;
        if (activeTab === 'income') {
          created = await createIncome.mutateAsync({
            date,
            amount: parsedAmount,
            note: note || undefined,
          });
        } else if (activeTab === 'expense') {
          created = await createExpense.mutateAsync({
            date,
            categoryId,
            amount: parsedAmount,
            note: note || undefined,
          });
        } else {
          created = await createFunding.mutateAsync({
            date,
            type: fundingType,
            amount: parsedAmount,
            note: note || undefined,
          });
        }
        showSaved({ kind: activeTab, date, amount: parsedAmount, recordId: created?.id });
      }
      markSaved();
      clearDraft(draftKey);

      // Reset form on success (keep date and tab)
      setAmount('');
      setNote('');
      setIsEditMode(false);
      setEditEntryId(null);
      setServerConflict(null);
    } catch (err: unknown) {
      const errorResponse = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response;
      if (errorResponse?.status === 409) {
        setServerConflict({
          amount: parsedAmount,
          date,
        });
      } else {
        showFailed({ kind: activeTab, message: t(toUserError(err).messageKey) });
      }
    }
  };

  const handleSwitchToEdit = () => {
    if (activeConflict) {
      setIsEditMode(true);
      if (activeConflict.id) {
        setEditEntryId(activeConflict.id);
      }
      setAmount(String(activeConflict.amount));
      if (activeConflict.note) {
        setNote(activeConflict.note);
      }
      setServerConflict(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={t('pages.entries', 'Entries')} />

      <div className="max-w-md mx-auto px-4 py-3 space-y-4">
        <SegmentedControl
          name="entry-type"
          value={activeTab}
          onChange={handleTabChange}
          options={[
            { value: 'income', label: t('entries.tabIncome', 'Income') },
            { value: 'expense', label: t('entries.tabExpense', 'Expense') },
            { value: 'funding', label: t('entries.tabFunding', 'Funding') },
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-3">
          <AmountInput
            id="entry-amount"
            value={amount}
            onChange={(val) => {
              setAmount(val);
              setAmountError('');
            }}
            label={t('common.amount', 'Amount')}
            helperText={
              activeTab === 'income'
                ? t(
                    'entries.incomeAmountHelper',
                    'Total cash you received today: sales and customer payments together.'
                  )
                : undefined
            }
            error={amountError}
          />

          <div className="bg-card border border-border/40 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span id="entry-date-label" className="block text-xs text-muted-foreground">
                  {t('entries.dateLabel', 'Date')}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {date === today ? t('common.today', 'Today') : formatDate(date)}
                </span>
              </div>
            </div>
            <DateSelect
              id="entry-date"
              value={date}
              max={today}
              onChange={(ymd) => {
                setDate(ymd);
                setServerConflict(null);
              }}
            />
          </div>

          {activeTab === 'expense' && (
            <div className="bg-card border border-border/40 rounded-xl p-3.5 space-y-2.5">
              <label className="block text-xs font-semibold text-muted-foreground">
                {t('entries.categoryLabel', 'Category')}
              </label>

              {businessCategories.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    {t('entries.businessGroup', 'Business')}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Business categories"
                    className="flex flex-wrap gap-2"
                  >
                    {businessCategories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setCategoryError('');
                            setServerConflict(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {categoryLabel(cat.name, t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {personalCategories.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    {t('entries.personalGroup', 'Personal / Family')}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Personal categories"
                    className="flex flex-wrap gap-2"
                  >
                    {personalCategories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setCategoryError('');
                            setServerConflict(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {categoryLabel(cat.name, t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {categoryError && (
                <p role="alert" className="text-xs font-medium text-destructive mt-1">
                  {categoryError}
                </p>
              )}
            </div>
          )}

          {activeTab === 'funding' && (
            <div className="bg-card border border-border/40 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">
                {t('entries.fundingTypeLabel', 'Funding Type')}
              </label>
              <div role="radiogroup" aria-label="Funding types" className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'salary_injection', label: t('entries.salaryIn', 'Salary in') },
                    { value: 'borrowed_in', label: t('entries.borrowedIn', 'Borrowed in') },
                    {
                      value: 'borrowed_repaid',
                      label: t('entries.borrowedRepaid', 'Borrowed repaid'),
                    },
                  ] as const
                ).map((ft) => {
                  const isSelected = fundingType === ft.value;
                  return (
                    <button
                      key={ft.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFundingType(ft.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-card border border-border/40 rounded-xl p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <input
              id="entry-note"
              type="text"
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('entries.notePlaceholder', 'Add a note (optional)')}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {activeConflict && !isEditMode && (
            <div
              role="status"
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-400"
            >
              <span>
                {t('entries.duplicateRecorded', {
                  date:
                    activeConflict.date === today
                      ? t('common.today', 'Today')
                      : activeConflict.date,
                  currency: 'ETB',
                  amount: activeConflict.amount,
                  defaultValue: `Already recorded for ${activeConflict.date}: ETB ${activeConflict.amount}.`,
                })}
              </span>
              <button
                type="button"
                onClick={handleSwitchToEdit}
                className="shrink-0 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors"
              >
                {t('entries.editIt', 'Edit it')}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || isSubmitting || !isOnline}
            aria-describedby={!isOnline ? 'entry-offline-notice' : undefined}
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {justSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>
              {isSaving || isSubmitting
                ? t('common.loading', 'Loading...')
                : isEditMode
                  ? t('entries.updateEntry', 'Update Entry')
                  : t('entries.saveEntry', 'Save Entry')}
            </span>
          </button>
          {!isOnline && <OfflineSaveNotice id="entry-offline-notice" />}
        </form>

        <section className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {t('entries.recentEntries', 'Recent Entries')}
            </h2>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPeriodMenu((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1.5 rounded-lg border border-border transition-colors"
                aria-expanded={showPeriodMenu}
                aria-haspopup="true"
                aria-label={t('entries.filterPeriod', 'Filter period')}
              >
                <span>
                  {period === 'today'
                    ? t('entries.periodToday', 'Today')
                    : period === 'week'
                      ? t('entries.periodThisWeek', 'This Week')
                      : period === 'month'
                        ? t('entries.periodThisMonth', 'This Month')
                        : t('entries.periodCustom', 'Custom range')}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showPeriodMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden"
                >
                  {(
                    [
                      { key: 'today', label: t('entries.periodToday', 'Today') },
                      { key: 'week', label: t('entries.periodThisWeek', 'This Week') },
                      { key: 'month', label: t('entries.periodThisMonth', 'This Month') },
                      { key: 'custom', label: t('entries.periodCustom', 'Custom range') },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowPeriodMenu(false);
                        if (opt.key === 'custom') {
                          setShowCustomRangeSheet(true);
                        } else {
                          setPeriod(opt.key);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-muted ${
                        period === opt.key ? 'font-semibold text-primary' : 'text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : isHistoryError ? (
            <ErrorState
              message={t(toUserError(historyError).messageKey)}
              onRetry={() => refetchHistory()}
            />
          ) : historyData.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8" />}
              title={t('entries.noEntries', 'No entries yet. Add your first one above.')}
            />
          ) : (
            <div className="space-y-2">
              {historyData.map((entry) => {
                const item: EntryItem =
                  activeTab === 'income'
                    ? { entryType: 'income', ...(entry as IncomeEntry) }
                    : activeTab === 'expense'
                      ? { entryType: 'expense', ...(entry as ExpenseWithCategory) }
                      : { entryType: 'funding', ...(entry as FundingEntry) };

                return (
                  <EntryListCard
                    key={entry.id}
                    entry={item}
                    onClick={() => setSelectedEntry(item)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <EditEntrySheet
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />

      <CustomRangeSheet
        open={showCustomRangeSheet}
        onOpenChange={setShowCustomRangeSheet}
        initialFrom={customRange.from}
        initialTo={customRange.to}
        onApply={(from, to) => {
          setCustomRange({ from, to });
          setPeriod('custom');
        }}
      />
    </div>
  );
}
