import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from '@/pages/reports/ReportsPage';
import CategoryBreakdownList from '@/components/common/CategoryBreakdownList';

const mockUseReportSummary = vi.fn();
const mockUseDebtsPeriodReport = vi.fn();
const mockUseExpenseBreakdown = vi.fn();
const mockExportMutateAsync = vi.fn();

vi.mock('@/hooks/useReportSummary', () => ({
  useReportSummary: (from: string, to: string) => mockUseReportSummary(from, to),
}));

vi.mock('@/hooks/useDebtsPeriodReport', () => ({
  useDebtsPeriodReport: (from: string, to: string) => mockUseDebtsPeriodReport(from, to),
}));

vi.mock('@/hooks/useExpenseBreakdown', () => ({
  useExpenseBreakdown: (from: string, to: string) => mockUseExpenseBreakdown(from, to),
}));

vi.mock('@/hooks/useExportReport', () => ({
  useExportReport: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: false,
  }),
}));

function renderReportsPage() {
  return render(
    <MemoryRouter initialEntries={['/reports']}>
      <ReportsPage />
    </MemoryRouter>
  );
}

describe('Reports Feature & Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseReportSummary.mockReturnValue({
      data: {
        totalIncome: 45000,
        totalBusinessExpenses: 12000,
        totalPersonalDraws: 4000,
        totalFundingIn: 5000,
        totalFundingOut: 2000,
        totalOwedByCustomers: 8500,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDebtsPeriodReport.mockReturnValue({
      data: {
        totalNewlyBorrowed: 6000,
        totalRepaidInPeriod: 3500,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseExpenseBreakdown.mockReturnValue({
      data: [
        {
          categoryId: 'cat-1',
          categoryName: 'Stock Purchase',
          group: 'business',
          total: 8000,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'House Rent',
          group: 'personal',
          total: 4000,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockExportMutateAsync.mockResolvedValue(new Blob(['mock,csv'], { type: 'text/csv' }));
  });

  describe('CategoryBreakdownList component', () => {
    it('renders category rows with progress bars and badges', () => {
      render(
        <CategoryBreakdownList
          items={[
            { categoryId: '1', categoryName: 'Sugar Stock', group: 'business', total: 6000 },
            { categoryId: '2', categoryName: 'Home Electricity', group: 'personal', total: 4000 },
          ]}
          totalExpenses={10000}
        />
      );

      expect(screen.getByText('Sugar Stock')).toBeInTheDocument();
      expect(screen.getByText('6,000')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();

      expect(screen.getByText('Home Electricity')).toBeInTheDocument();
      expect(screen.getByText('4,000')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('shows empty fallback if no items or all totals are zero', () => {
      render(<CategoryBreakdownList items={[]} />);
      expect(screen.getByText(/no expenses recorded/i)).toBeInTheDocument();
    });
  });

  describe('ReportsPage layout and data presentation', () => {
    it('renders the reports header and period picker options', () => {
      renderReportsPage();
      expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
    });

    it('displays summary overview cards with formatted amounts', () => {
      renderReportsPage();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('45,000')).toBeInTheDocument();

      expect(screen.getByText('Business Expenses')).toBeInTheDocument();
      expect(screen.getByText('12,000')).toBeInTheDocument();

      expect(screen.getByText('Personal / Family Draws')).toBeInTheDocument();
      expect(screen.getAllByText('4,000').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Total Owed by Customers')).toBeInTheDocument();
      expect(screen.getByText('8,500')).toBeInTheDocument();
    });

    it('displays debt activity for the period', () => {
      renderReportsPage();
      expect(screen.getByText('Debt Activity (This Period)')).toBeInTheDocument();
      expect(screen.getByText('Newly Borrowed')).toBeInTheDocument();
      expect(screen.getByText('6,000')).toBeInTheDocument();
      expect(screen.getByText('Repaid')).toBeInTheDocument();
      expect(screen.getByText('3,500')).toBeInTheDocument();
    });

    it('shows loading skeleton when query is in flight', () => {
      mockUseReportSummary.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      });

      renderReportsPage();
      expect(screen.getByTestId('reports-skeleton')).toBeInTheDocument();
    });

    it('shows error state when query fails and allows retry', () => {
      const refetchFn = vi.fn();
      mockUseReportSummary.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        refetch: refetchFn,
      });

      renderReportsPage();
      const retryBtn = screen.getByRole('button', { name: /try again/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(refetchFn).toHaveBeenCalled();
    });

    it('triggers CSV download when Export CSV button is clicked', async () => {
      // Mock window.URL methods
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      renderReportsPage();
      const exportBtn = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockExportMutateAsync).toHaveBeenCalled();
      });
      expect(createObjectURLMock).toHaveBeenCalled();
    });

    it('supports switching to custom period and selecting dates', () => {
      renderReportsPage();
      const customBtn = screen.getByRole('button', { name: 'Custom' });
      fireEvent.click(customBtn);

      const fromInput = screen.getByLabelText(/^from$/i);
      const toInput = screen.getByLabelText(/^to$/i);
      expect(fromInput).toBeInTheDocument();
      expect(toInput).toBeInTheDocument();

      fireEvent.change(fromInput, { target: { value: '2026-10-01' } });
      fireEvent.change(toInput, { target: { value: '2026-10-15' } });
      expect((fromInput as HTMLInputElement).value).toBe('2026-10-01');
      expect((toInput as HTMLInputElement).value).toBe('2026-10-15');
    });
  });
});
