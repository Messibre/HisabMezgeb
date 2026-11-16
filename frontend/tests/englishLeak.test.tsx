import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '@/lib/i18n';
import api from '@/lib/axios';
import HomePage from '@/pages/home/HomePage';
import EntriesPage from '@/pages/entries/EntriesPage';
import DebtsListPage from '@/pages/debts/DebtsListPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import { useAuthStore } from '@/store/auth.store';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockGet = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;

// Amharic fixture data, including the seeded categories that are stored in English.
const fixtures = (url: string): unknown => {
  if (url.startsWith('/expense-categories'))
    return [
      { id: 'c1', name: 'Cost of Goods', group: 'business', isActive: true },
      { id: 'c2', name: 'Equb', group: 'business', isActive: true },
      { id: 'c3', name: 'Home Necessities', group: 'personal', isActive: true },
      { id: 'c4', name: 'Debt payment', group: 'personal', isActive: true },
    ];
  if (url.startsWith('/reports/summary'))
    return {
      totalIncome: 13230,
      totalBusinessExpenses: 2700,
      totalPersonalDraws: 1107,
      totalFundingIn: 22120,
      totalFundingOut: 0,
      totalOwedByCustomers: 20522,
    };
  if (url.startsWith('/reports/debts')) return { totalNewlyBorrowed: 2000, totalRepaidInPeriod: 500 };
  if (url.startsWith('/reports/expense'))
    return [
      { categoryId: 'c1', categoryName: 'Cost of Goods', group: 'business', total: 2700 },
      { categoryId: 'c4', categoryName: 'Debt payment', group: 'personal', total: 987 },
    ];
  if (url.startsWith('/debt-customers')) return [{ id: 'd1', name: 'ሰሚራ', note: null, balance: 7310 }];
  if (url.startsWith('/funding'))
    return [{ id: 'f1', date: '2026-11-10', type: 'borrowed_in', amount: 500, note: null }];
  if (url.startsWith('/expenses'))
    return [{ id: 'e1', date: '2026-11-13', categoryId: 'c1', categoryName: 'Cost of Goods', amount: 2500, note: null }];
  return [];
};

// Latin tokens allowed on screen: file formats and technical examples.
const ALLOWED = new Set(['PDF', 'CSV', 'Word', 'docx', 'XX']);

const latinWords = (text: string) =>
  (text.match(/[A-Za-z]{2,}/g) ?? []).filter((w) => !ALLOWED.has(w));

function renderPage(path: string, element: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path.split('?')[0]} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const pages: [string, string, React.ReactElement][] = [
  ['Home', '/home', <HomePage />],
  ['Entries (expense)', '/entries?type=expense', <EntriesPage />],
  ['Entries (funding)', '/entries?type=funding', <EntriesPage />],
  ['Debts', '/debts', <DebtsListPage />],
  ['Reports', '/reports', <ReportsPage />],
  ['Settings', '/settings', <SettingsPage />],
];

describe.each(['am', 'ti'])('no English on screen in %s', (lang) => {
  beforeEach(async () => {
    await i18n.changeLanguage(lang);
    mockGet.mockImplementation((url: string) => Promise.resolve({ data: fixtures(url) }));
    useAuthStore.setState({
      account: { id: 'a1', phoneNumber: '0911000000', shopName: 'አበበ ሱቅ', createdAt: '' },
      status: 'authenticated',
    });
  });

  it.each(pages)('%s', async (_name, path, element) => {
    const { container } = renderPage(path, element);
    await waitFor(() => expect(screen.queryByTestId(/skeleton/i)).toBeNull());
    await waitFor(() => expect(mockGet).toHaveBeenCalled(), { timeout: 2000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 50));

    // The language switcher lists each language in its own script, English included.
    container.querySelectorAll('[lang]').forEach((n) => n.remove());
    const text = (container.textContent ?? '').replace(/English/g, '');
    expect(latinWords(text)).toEqual([]);
    // Guard against a vacuous pass: fixture data reached the screen.
    if (path.startsWith('/entries?type=expense')) expect(text).toMatch(/ዕቁብ|ዕቑብ/);
    if (path === '/reports') expect(text).toContain('20,522');
    if (path === '/debts') expect(text).toContain('ሰሚራ');
  });
});
