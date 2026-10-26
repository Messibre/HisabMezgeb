import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DebtsListPage from '@/pages/debts/DebtsListPage';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

function renderDebtsListPage(initialEntries = ['/debts']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/debts" element={<DebtsListPage />} />
          <Route path="/debts/:customerId" element={<div data-testid="customer-detail-page">Customer Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DebtsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/reports/summary')) {
        return Promise.resolve({
          data: {
            totalIncome: 10000,
            totalBusinessExpenses: 2000,
            totalPersonalDraws: 500,
            totalFundingIn: 0,
            totalFundingOut: 0,
            totalOwedByCustomers: 4850,
          },
        });
      }
      if (url.startsWith('/debt-customers')) {
        return Promise.resolve({
          data: [
            { id: 'c1', name: 'Sara', note: 'Shop 4', balance: 850 },
            { id: 'c2', name: 'አበበ', note: null, balance: 1200 },
            { id: 'c3', name: 'Dawit', note: null, balance: 0 },
            { id: 'c4', name: 'Bethel', note: null, balance: 600 },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders total owed from report summary, not changing on search', async () => {
    renderDebtsListPage(['/debts']);

    await waitFor(() => {
      expect(screen.getByText('4,850')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search customer by name/i);
    fireEvent.change(searchInput, { target: { value: 'Sara' } });

    // Total owed remains 4,850
    expect(screen.getByText('4,850')).toBeInTheDocument();
  });

  it('sorts customers by highest balance first, with settled at bottom', async () => {
    renderDebtsListPage(['/debts']);

    await waitFor(() => {
      expect(screen.getByText('አበበ')).toBeInTheDocument();
    });

    const customerNames = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    // Order: አበበ (1200), Sara (850), Bethel (600), Dawit (0 - settled at bottom)
    expect(customerNames).toEqual(['አበበ', 'Sara', 'Bethel', 'Dawit']);
    expect(screen.getByText(/Settled/i)).toBeInTheDocument();
  });

  it('extracts Ge’ez avatar initial for አበበ and Latin initial for Sara', async () => {
    renderDebtsListPage(['/debts']);

    await waitFor(() => {
      expect(screen.getByText('አበበ')).toBeInTheDocument();
    });

    // Avatar for አበበ should be "አ"
    expect(screen.getByText('አ')).toBeInTheDocument();
    // Avatar for Sara should be "S"
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('debounces search input and requests search query', async () => {
    renderDebtsListPage(['/debts']);

    const searchInput = screen.getByPlaceholderText(/Search customer by name/i);
    fireEvent.change(searchInput, { target: { value: 'Sara' } });

    await waitFor(
      () => {
        expect(mockApi.get).toHaveBeenCalledWith('/debt-customers?search=Sara');
      },
      { timeout: 1000 }
    );
  });

  it('shows search-empty state with add shortcut button', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/reports/summary')) {
        return Promise.resolve({
          data: { totalOwedByCustomers: 4850 },
        });
      }
      if (url.includes('search=Unknown')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderDebtsListPage(['/debts?q=Unknown']);

    await waitFor(() => {
      expect(screen.getByText(/No customer found for “Unknown”/i)).toBeInTheDocument();
    });

    const addShortcutBtn = screen.getByRole('button', { name: /Add “Unknown”/i });
    expect(addShortcutBtn).toBeInTheDocument();

    // Clicking add shortcut opens New Customer sheet with name pre-filled
    fireEvent.click(addShortcutBtn);
    expect(screen.getByLabelText(/Customer Name/i)).toHaveValue('Unknown');
  });

  it('FAB opens new customer bottom sheet and saves customer', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'new-cust-1', name: 'Kassahun', note: 'Phone: 0911000000', balance: 0 },
    });

    renderDebtsListPage(['/debts']);

    const fab = screen.getByLabelText(/Add customer/i);
    fireEvent.click(fab);

    expect(screen.getByRole('heading', { name: /New Customer/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Customer Name/i);
    fireEvent.change(nameInput, { target: { value: 'Kassahun' } });

    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: 'Phone: 0911000000' } });

    const saveBtn = screen.getByRole('button', { name: /Save Customer/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/debt-customers', {
        name: 'Kassahun',
        note: 'Phone: 0911000000',
      });
      expect(screen.getByTestId('customer-detail-page')).toBeInTheDocument();
    });
  });
});
