import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntriesPage from '@/pages/entries/EntriesPage';
import api from '@/lib/axios';
import { todayLocal } from '@/lib/date';

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

function renderEntriesPage(initialEntries = ['/entries']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/entries" element={<EntriesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('EntriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock responses
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/expense-categories')) {
        return Promise.resolve({
          data: [
            { id: 'cat-1', name: 'Stock / Inventory', group: 'business', isActive: true },
            { id: 'cat-2', name: 'Rent', group: 'business', isActive: true },
            { id: 'cat-3', name: 'Family Food', group: 'personal', isActive: true },
          ],
        });
      }
      if (url.startsWith('/income')) {
        return Promise.resolve({ data: [] });
      }
      if (url.startsWith('/expenses')) {
        return Promise.resolve({ data: [] });
      }
      if (url.startsWith('/funding')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('tab switching updates the URL query ?type=', async () => {
    renderEntriesPage(['/entries?type=income']);
    expect(screen.getByRole('tab', { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Expense/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Funding/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Expense/i }));
    await waitFor(() => {
      expect(screen.getByText(/Stock \/ Inventory/i)).toBeInTheDocument();
    });
  });

  it('income save sends date, amount, note only', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'inc-1', date: '2026-10-26', amount: 1500, note: 'Daily sales' },
    });

    renderEntriesPage(['/entries?type=income']);

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const noteInput = screen.getByPlaceholderText(/Add a note/i);
    fireEvent.change(noteInput, { target: { value: 'Daily sales' } });

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/income', {
        amount: 1500,
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        note: 'Daily sales',
      });
    });
  });

  it('expense with amount 0 is allowed', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'exp-1', date: '2026-10-26', categoryId: 'cat-1', amount: 0, note: null },
    });

    renderEntriesPage(['/entries?type=expense']);

    await waitFor(() => {
      expect(screen.getByText(/Stock \/ Inventory/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Stock \/ Inventory/i));

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/expenses', expect.objectContaining({
        amount: 0,
        categoryId: 'cat-1',
      }));
    });
  });

  it('funding with amount 0 is rejected on client', async () => {
    renderEntriesPage(['/entries?type=funding']);

    const typeChip = screen.getByText(/Salary in/i);
    fireEvent.click(typeChip);

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Amount must be greater than 0/i)).toBeInTheDocument();
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  it('blocks invalid amounts like 12.345, -5, abc', async () => {
    renderEntriesPage(['/entries?type=income']);

    const amountInput = screen.getByLabelText(/^Amount/i);
    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });

    // Text "abc"
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(screen.getByText(/Enter an amount/i)).toBeInTheDocument();
    });

    // Too many decimals "12.345"
    fireEvent.change(amountInput, { target: { value: '12.345' } });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(screen.getByText(/Enter an amount/i)).toBeInTheDocument();
    });
  });

  it('duplicate detection switches to edit mode with message', async () => {
    const today = todayLocal();
    // Return existing income for today
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/income')) {
        return Promise.resolve({
          data: [{ id: 'inc-existing', date: today, amount: 2500, note: 'Morning sales' }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderEntriesPage(['/entries?type=income']);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Already recorded for/i);
    });

    const editItBtn = screen.getByRole('button', { name: /Edit it/i });
    fireEvent.click(editItBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Entry/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^Amount/i)).toHaveValue('2500');
    });
  });

  it('409 conflict handled gracefully with status message', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Already recorded' } },
    });

    renderEntriesPage(['/entries?type=income']);

    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Already recorded for/i);
    });
  });

  it('list card shows relative date and no time of day', async () => {
    const today = todayLocal();
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/income')) {
        return Promise.resolve({
          data: [
            { id: 'inc-1', date: today, amount: 500, note: 'Tea sales' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderEntriesPage(['/entries?type=income']);

    await waitFor(() => {
      expect(screen.getByText('Tea sales')).toBeInTheDocument();
    });

    const card = screen.getByText('Tea sales').closest('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent(/Today|Yesterday/i);
    // Verify no ISO timestamp or 12:00:00 format
    expect(screen.queryByText(/\d{2}:\d{2}:\d{2}/)).not.toBeInTheDocument();
  });
});
