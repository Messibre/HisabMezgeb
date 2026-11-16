import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntriesPage from '@/pages/entries/EntriesPage';
import SaveConfirmation from '@/components/common/SaveConfirmation';
import { useSaveFeedbackStore } from '@/store/saveFeedback.store';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { useFormDraft, clearAllDrafts, DRAFT_PREFIX } from '@/hooks/useFormDraft';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

function renderEntries() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/entries']}>
        <Routes>
          <Route path="/entries" element={<EntriesPage />} />
        </Routes>
      </MemoryRouter>
      <SaveConfirmation />
    </QueryClientProvider>
  );
}

const setOnline = (value: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });

describe('honest saving', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useSaveFeedbackStore.setState({ current: null, highlightId: null });
    mockApi.get.mockResolvedValue({ data: [] });
  });

  afterEach(() => setOnline(true));

  it('offline: Save is disabled, says why, and no success message ever appears', async () => {
    setOnline(false);
    renderEntries();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '500' } });
    const save = screen.getByRole('button', { name: /save entry/i });

    expect(save).toBeDisabled();
    expect(screen.getByText('No internet. This cannot be saved yet.')).toBeInTheDocument();

    fireEvent.submit(save.closest('form')!);
    await new Promise((r) => setTimeout(r, 20));

    expect(mockApi.post).not.toHaveBeenCalled();
    expect(screen.queryByTestId('save-confirmation')).not.toBeInTheDocument();
  });

  it('a successful save shows a large confirmation that repeats what was saved', async () => {
    setOnline(true);
    mockApi.post.mockResolvedValue({ data: { id: 'inc-1', date: '2026-11-14', amount: 13230 } });
    renderEntries();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '13230' } });
    fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

    const banner = await screen.findByTestId('save-confirmation');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner.textContent).toContain('Income saved');
    expect(banner.textContent).toContain('13,230');
  });

  it('a double tap sends only one request', async () => {
    setOnline(true);
    let resolve: (v: unknown) => void = () => {};
    mockApi.post.mockImplementation(() => new Promise((r) => (resolve = r)));
    renderEntries();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    const form = screen.getByRole('button', { name: /save entry/i }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    await act(async () => resolve({ data: { id: 'inc-2' } }));
    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });

  it('a failed save uses the alert role and stays until dismissed', () => {
    render(<SaveConfirmation />);
    act(() => useSaveFeedbackStore.getState().showFailed({ kind: 'payment', message: 'Server problem' }));
    const banner = screen.getByTestId('save-confirmation');
    expect(banner).toHaveAttribute('role', 'alert');
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByTestId('save-confirmation')).not.toBeInTheDocument();
  });

  it('the success confirmation hides itself after 4 seconds', () => {
    vi.useFakeTimers();
    try {
      render(<SaveConfirmation />);
      act(() => useSaveFeedbackStore.getState().showSaved({ kind: 'income', amount: 10 }));
      expect(screen.getByTestId('save-confirmation')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(4000));
      expect(screen.queryByTestId('save-confirmation')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useSubmitGuard', () => {
  it('ignores calls while one is running', async () => {
    const { result } = renderHook(() => useSubmitGuard());
    let finish: () => void = () => {};
    const fn = vi.fn(() => new Promise<void>((r) => (finish = r)));

    let first: Promise<unknown>;
    act(() => {
      first = result.current.run(fn);
      void result.current.run(fn);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
    await act(async () => {
      void result.current.run(fn);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('form drafts', () => {
  beforeEach(() => sessionStorage.clear());

  it('survives a reload and is restored into the form', () => {
    const { rerender, unmount } = renderHook(
      ({ amount }) => useFormDraft('entries:income', { amount, note: '' }, () => {}),
      { initialProps: { amount: '' } }
    );
    rerender({ amount: '750' });
    unmount();
    expect(sessionStorage.getItem(`${DRAFT_PREFIX}entries:income`)).toContain('750');

    const restore = vi.fn();
    renderHook(() => useFormDraft('entries:income', { amount: '', note: '' }, restore));
    expect(restore).toHaveBeenCalledWith({ amount: '750', note: '' });
  });

  it('is cleared on logout', () => {
    sessionStorage.setItem(`${DRAFT_PREFIX}borrow:c1`, '{"amount":"5"}');
    sessionStorage.setItem('unrelated', 'keep');
    clearAllDrafts();
    expect(sessionStorage.getItem(`${DRAFT_PREFIX}borrow:c1`)).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep');
  });

  it('is cleared after a successful save', async () => {
    setOnline(true);
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.post.mockResolvedValue({ data: { id: 'inc-3' } });
    renderEntries();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '321' } });
    await waitFor(() => expect(sessionStorage.getItem(`${DRAFT_PREFIX}entries:income`)).toContain('321'));

    fireEvent.click(screen.getByRole('button', { name: /save entry/i }));
    await screen.findByTestId('save-confirmation');
    expect(sessionStorage.getItem(`${DRAFT_PREFIX}entries:income`)).toBeNull();
  });
});
