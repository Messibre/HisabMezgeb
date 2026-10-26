import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DebtCustomerDetailPage from '@/pages/debts/DebtCustomerDetailPage';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function renderLedgerPage(customerId = 'cust-123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/debts/${customerId}`]}>
        <Routes>
          <Route path="/debts" element={<div data-testid="debts-list-page">Debts List</div>} />
          <Route path="/debts/:customerId" element={<DebtCustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DebtCustomerDetailPage (Ledger)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/debt-customers/cust-123') {
        return Promise.resolve({
          data: {
            id: 'cust-123',
            name: 'Abebe Kebede',
            note: 'Phone: 0911223344',
            balance: 1500,
            history: [
              {
                id: 'pay-1',
                kind: 'payment',
                date: '2026-10-26',
                amount: 500,
                itemsDescription: null,
                note: 'Cash payment',
              },
              {
                id: 'bor-1',
                kind: 'borrow',
                date: '2026-10-25',
                amount: 2000,
                itemsDescription: '2 bags of flour, 1 oil',
                note: null,
              },
            ],
          },
        });
      }
      return Promise.reject({ response: { status: 404 } });
    });
  });

  it('shows balance directly from the server API value', async () => {
    renderLedgerPage('cust-123');

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    });

    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('renders history items with explicit text labels Borrowed and Paid', async () => {
    renderLedgerPage('cust-123');

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    });

    expect(screen.getByText('Borrowed')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('2 bags of flour, 1 oil')).toBeInTheDocument();
  });

  it('full amount toggle fills current balance and edits switch to part of it', async () => {
    renderLedgerPage('cust-123');

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    });

    const addPaymentBtn = screen.getByRole('button', { name: /Add Payment/i });
    fireEvent.click(addPaymentBtn);

    expect(screen.getByRole('heading', { name: /Add Payment/i })).toBeInTheDocument();

    // Click "Full amount"
    const fullOption = screen.getByRole('tab', { name: /Full amount/i });
    fireEvent.click(fullOption);

    const amountInput = screen.getByLabelText(/^Amount/i);
    expect(amountInput).toHaveValue('1500');

    // Editing amount changes segmented control to "Part of it"
    fireEvent.change(amountInput, { target: { value: '800' } });
    const partOption = screen.getByRole('tab', { name: /Part of it/i });
    expect(partOption).toHaveAttribute('aria-selected', 'true');
  });

  it('client blocks payment amount greater than current balance', async () => {
    renderLedgerPage('cust-123');

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    });

    const addPaymentBtn = screen.getByRole('button', { name: /Add Payment/i });
    fireEvent.click(addPaymentBtn);

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '2500' } });

    const saveBtn = screen.getByRole('button', { name: /Save Payment/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cannot be more than what is owed/i)).toBeInTheDocument();
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  it('disables Add Payment button when balance is 0', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        id: 'cust-settled',
        name: 'Dawit Settled',
        note: null,
        balance: 0,
        history: [],
      },
    });

    renderLedgerPage('cust-settled');

    await waitFor(() => {
      expect(screen.getByText('Dawit Settled')).toBeInTheDocument();
    });

    expect(screen.getByText(/All paid/i)).toBeInTheDocument();
    const addPaymentBtn = screen.getByRole('button', { name: /Add Payment/i });
    expect(addPaymentBtn).toBeDisabled();
  });

  it('renders 404 state when customer is not found with button back to /debts', async () => {
    mockApi.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    renderLedgerPage('cust-non-existent');

    await waitFor(() => {
      expect(screen.getByText(/Customer not found/i)).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Back to Debts/i });
    fireEvent.click(backBtn);

    expect(screen.getByTestId('debts-list-page')).toBeInTheDocument();
  });

  it('saving a payment NEVER calls any income endpoint', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        payment: { id: 'p-1', customerId: 'cust-123', date: '2026-10-26', amount: 500, note: null },
        newBalance: 1000,
      },
    });

    renderLedgerPage('cust-123');

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Payment/i }));

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    const saveBtn = screen.getByRole('button', { name: /Save Payment/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/debt-customers/cust-123/payments',
        expect.objectContaining({ amount: 500 })
      );
    });

    // Assert it NEVER called /income
    const calls = mockApi.post.mock.calls;
    const incomeCalls = calls.filter(([url]) => url.startsWith('/income'));
    expect(incomeCalls).toHaveLength(0);
  });
});
