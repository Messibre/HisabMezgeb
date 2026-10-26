import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '@/pages/home/HomePage';
import * as dateUtils from '@/lib/date';

const mockUseAuthStore = vi.fn();
const mockUseTodayIncome = vi.fn();
const mockUseReportSummary = vi.fn();

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('@/hooks/useTodayIncome', () => ({
  useTodayIncome: () => mockUseTodayIncome(),
}));

vi.mock('@/hooks/useReportSummary', () => ({
  useReportSummary: (from: string, to: string) => mockUseReportSummary(from, to),
}));

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HomePage />
    </MemoryRouter>
  );
}

describe('M10 Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      account: { id: '1', phoneNumber: '+251911223344', shopName: 'Abebe Kiosk' },
    });
    mockUseTodayIncome.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseReportSummary.mockReturnValue({
      data: {
        totalIncome: 12500,
        totalBusinessExpenses: 3400,
        totalPersonalDraws: 1000,
        totalFundingIn: 0,
        totalFundingOut: 0,
        totalOwedByCustomers: 4800,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders greeting with shopName when shopName is provided', () => {
    mockUseAuthStore.mockReturnValue({
      account: { id: '1', phoneNumber: '+251911223344', shopName: 'Abebe Kiosk' },
    });
    renderHomePage();
    expect(screen.getByText(/Selam, Abebe Kiosk/i)).toBeInTheDocument();
  });

  it('renders greeting without name when shopName is null or empty', () => {
    mockUseAuthStore.mockReturnValue({
      account: { id: '1', phoneNumber: '+251911223344', shopName: null },
    });
    renderHomePage();
    expect(screen.getByText(/^Selam$/i)).toBeInTheDocument();
  });

  it('renders not-entered income card with add button when today income is null', () => {
    mockUseTodayIncome.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderHomePage();
    expect(screen.getByText(/today's income is not entered yet/i)).toBeInTheDocument();
    const addBtn = screen.getByRole('link', { name: /\+ add today's income/i });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveAttribute('href', '/entries?type=income');
  });

  it('renders entered income card with formatted amount and edit button', () => {
    mockUseTodayIncome.mockReturnValue({
      data: { id: 'inc-1', date: '2026-10-26', amount: 3500, note: null },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderHomePage();
    expect(screen.getByText(/today's income/i)).toBeInTheDocument();
    expect(screen.getByText('3,500')).toBeInTheDocument();
    const editBtn = screen.getByRole('link', { name: /edit/i });
    expect(editBtn).toBeInTheDocument();
    expect(editBtn.getAttribute('href')).toContain('/entries?type=income');
  });

  it('renders skeleton when today income is loading', () => {
    mockUseTodayIncome.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { container } = renderHomePage();
    expect(container.querySelector('[data-testid="today-income-skeleton"]')).toBeInTheDocument();
  });

  it('renders error state with retry when today income query fails', () => {
    const refetch = vi.fn();
    mockUseTodayIncome.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch,
    });
    renderHomePage();
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders week snapshot stat cards with formatted values and correct week dates', () => {
    renderHomePage();
    const today = dateUtils.todayLocal();
    const startWeek = dateUtils.startOfWeek(today);

    expect(mockUseReportSummary).toHaveBeenCalledWith(startWeek, today);
    expect(screen.getByText("This Week's Income")).toBeInTheDocument();
    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('Shop Expenses')).toBeInTheDocument();
    expect(screen.getByText('3,400')).toBeInTheDocument();
    expect(screen.getByText('Customer Debts')).toBeInTheDocument();
    expect(screen.getByText('4,800')).toBeInTheDocument();
  });
});
