import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  buildSummary,
  buildDebtsPeriodReport,
  buildExpenseBreakdown,
  generateCsvExport,
  ReportSummary,
} from '../../src/services/reports.service.js';
import * as debtCustomerService from '../../src/services/debtCustomer.service.js';

const Decimal = Prisma.Decimal;

// ── Helper types for mocks ──

type AggregateResult = {
  _sum: { amount: Prisma.Decimal | null };
  _count: { amount: number };
  _avg: { amount: Prisma.Decimal | null };
  _min: { amount: Prisma.Decimal | null };
  _max: { amount: Prisma.Decimal | null };
};

type GroupByMockResult = {
  categoryId: string;
  _sum: { amount: Prisma.Decimal | null };
};

type MockCategory = {
  id: string;
  accountId: string;
  name: string;
  group: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helper: Build full aggregate result ──

function createAggregateResult(sumAmount: number | null): AggregateResult {
  const decimal = sumAmount !== null ? new Decimal(sumAmount) : null;
  return {
    _sum: { amount: decimal },
    _count: { amount: sumAmount !== null ? 1 : 0 },
    _avg: { amount: decimal },
    _min: { amount: decimal },
    _max: { amount: decimal },
  };
}

// ── Mock Prisma ──

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    dailyIncome: { aggregate: vi.fn() },
    dailyExpense: { aggregate: vi.fn(), groupBy: vi.fn() },
    fundingEntry: { aggregate: vi.fn() },
    debtBorrowRecord: { aggregate: vi.fn() },
    debtPayment: { aggregate: vi.fn() },
    expenseCategory: { findMany: vi.fn() },
  },
}));

vi.mock('../../src/services/debtCustomer.service.js', () => ({
  calculateCustomerBalance: vi.fn(),
}));

// ── Helper: Extract the return type of groupBy ──
type GroupByReturn = Awaited<ReturnType<typeof prisma.dailyExpense.groupBy>>;

// ── Explicitly typed mocks ──

const mockIncomeAggregate = prisma.dailyIncome.aggregate as unknown as Mock<
  typeof prisma.dailyIncome.aggregate
>;
const mockExpenseAggregate = prisma.dailyExpense.aggregate as unknown as Mock<
  typeof prisma.dailyExpense.aggregate
>;
const mockExpenseGroupBy = prisma.dailyExpense.groupBy as unknown as Mock<
  typeof prisma.dailyExpense.groupBy
>;
const mockFundingAggregate = prisma.fundingEntry.aggregate as unknown as Mock<
  typeof prisma.fundingEntry.aggregate
>;
const mockBorrowAggregate = prisma.debtBorrowRecord.aggregate as unknown as Mock<
  typeof prisma.debtBorrowRecord.aggregate
>;
const mockPaymentAggregate = prisma.debtPayment.aggregate as unknown as Mock<
  typeof prisma.debtPayment.aggregate
>;
const mockExpenseCategoryFindMany = prisma.expenseCategory.findMany as unknown as Mock<
  typeof prisma.expenseCategory.findMany
>;
const mockCalculateBalance = debtCustomerService.calculateCustomerBalance as unknown as Mock<
  typeof debtCustomerService.calculateCustomerBalance
>;

describe('Reports Service', () => {
  const accountId = 'acc-123';
  const from = new Date('2026-01-01');
  const to = new Date('2026-12-31');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildSummary', () => {
    it('should build summary totals correctly (FR-28, FR-29)', async () => {
      mockIncomeAggregate.mockResolvedValueOnce(createAggregateResult(10000));
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(4000));
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(2000));
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(5000));
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(1000));
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(5000)); // total borrows
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(1500)); // total payments
      mockCalculateBalance.mockResolvedValue(3500);

      const result = await buildSummary(accountId, from, to);

      expect(result).toEqual({
        totalIncome: 10000,
        totalBusinessExpenses: 4000,
        totalPersonalDraws: 2000,
        totalFundingIn: 5000,
        totalFundingOut: 1000,
        totalOwedByCustomers: 3500, // 5000 - 1500 = 3500
      });
    });

    it('should handle null sums (no data) gracefully', async () => {
      mockIncomeAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockCalculateBalance.mockResolvedValue(0);

      const result = await buildSummary(accountId, from, to);

      expect(result).toEqual({
        totalIncome: 0,
        totalBusinessExpenses: 0,
        totalPersonalDraws: 0,
        totalFundingIn: 0,
        totalFundingOut: 0,
        totalOwedByCustomers: 0,
      });
    });
  });

  describe('buildDebtsPeriodReport', () => {
    it('should return total newly borrowed and total repaid in the period', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(3000));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(1200));

      const result = await buildDebtsPeriodReport(accountId, from, to);

      expect(result).toEqual({
        totalNewlyBorrowed: 3000,
        totalRepaidInPeriod: 1200,
      });

      expect(mockBorrowAggregate).toHaveBeenCalledWith({
        where: {
          accountId,
          date: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { amount: true },
      });

      expect(mockPaymentAggregate).toHaveBeenCalledWith({
        where: {
          accountId,
          date: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { amount: true },
      });
    });

    it('should handle null sums (no data)', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(null));

      const result = await buildDebtsPeriodReport(accountId, from, to);

      expect(result.totalNewlyBorrowed).toBe(0);
      expect(result.totalRepaidInPeriod).toBe(0);
    });
  });

  describe('buildExpenseBreakdown', () => {
    it('should return expense totals grouped by category with group', async () => {
      const now = new Date();
      const mockCategories: MockCategory[] = [
        {
          id: 'cat-1',
          accountId,
          name: 'Cost of Goods',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cat-2',
          accountId,
          name: 'Equb',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cat-3',
          accountId,
          name: 'Home Necessities',
          group: 'personal',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      mockExpenseCategoryFindMany.mockResolvedValue(mockCategories);

      const mockGroupByResults: GroupByMockResult[] = [
        { categoryId: 'cat-1', _sum: { amount: new Decimal(1000) } },
        { categoryId: 'cat-2', _sum: { amount: new Decimal(500) } },
        { categoryId: 'cat-3', _sum: { amount: new Decimal(200) } },
      ];
      // Cast via unknown to the actual return type
      mockExpenseGroupBy.mockResolvedValue(mockGroupByResults as unknown as GroupByReturn);

      const result = await buildExpenseBreakdown(accountId, from, to);

      expect(mockExpenseCategoryFindMany).toHaveBeenCalledWith({
        where: { accountId, isActive: true },
      });
      expect(mockExpenseGroupBy).toHaveBeenCalledWith({
        by: ['categoryId'],
        where: {
          accountId,
          date: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      expect(result).toEqual([
        { categoryId: 'cat-1', categoryName: 'Cost of Goods', group: 'business', total: 1000 },
        { categoryId: 'cat-2', categoryName: 'Equb', group: 'business', total: 500 },
        { categoryId: 'cat-3', categoryName: 'Home Necessities', group: 'personal', total: 200 },
      ]);
    });

    it('should return empty array when no categories exist', async () => {
      mockExpenseCategoryFindMany.mockResolvedValue([]);
      mockExpenseGroupBy.mockResolvedValue([]);

      const result = await buildExpenseBreakdown(accountId, from, to);

      expect(result).toEqual([]);
    });

    it('should include categories with zero total', async () => {
      const now = new Date();
      const mockCategories: MockCategory[] = [
        {
          id: 'cat-1',
          accountId,
          name: 'Cost of Goods',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cat-2',
          accountId,
          name: 'Equb',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      mockExpenseCategoryFindMany.mockResolvedValue(mockCategories);

      const mockGroupByResults: GroupByMockResult[] = [
        { categoryId: 'cat-1', _sum: { amount: new Decimal(1000) } },
      ];
      mockExpenseGroupBy.mockResolvedValue(mockGroupByResults as unknown as GroupByReturn);

      const result = await buildExpenseBreakdown(accountId, from, to);

      expect(result).toEqual([
        { categoryId: 'cat-1', categoryName: 'Cost of Goods', group: 'business', total: 1000 },
        { categoryId: 'cat-2', categoryName: 'Equb', group: 'business', total: 0 },
      ]);
    });
  });

  describe('generateCsvExport', () => {
    it('should return CSV string with report data', async () => {
      // ── Mock Prisma aggregates for buildSummary ──
      mockIncomeAggregate.mockResolvedValueOnce(createAggregateResult(10000));
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(4000)); // business
      mockExpenseAggregate.mockResolvedValueOnce(createAggregateResult(2000)); // personal
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(5000)); // in
      mockFundingAggregate.mockResolvedValueOnce(createAggregateResult(1000)); // out

      // ── Mocks for buildSummary: total borrows and payments (all-time) ──
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(5000));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(1500));

      // ── Mocks for buildDebtsPeriodReport (period-specific) ──
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(3000));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(1200));

      // ── Mock categories and groupBy for buildExpenseBreakdown ──
      const now = new Date();
      const mockCategories = [
        {
          id: 'cat-1',
          accountId,
          name: 'Cost of Goods',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cat-2',
          accountId,
          name: 'Equb',
          group: 'business',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cat-3',
          accountId,
          name: 'Home Necessities',
          group: 'personal',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      mockExpenseCategoryFindMany.mockResolvedValue(mockCategories);
      mockExpenseGroupBy.mockResolvedValue([
        { categoryId: 'cat-1', _sum: { amount: new Decimal(1000) } },
        { categoryId: 'cat-2', _sum: { amount: new Decimal(500) } },
        { categoryId: 'cat-3', _sum: { amount: new Decimal(200) } },
      ] as any); // safe cast for test

      const csv = await generateCsvExport(accountId, from, to);

      // ── Assertions ──
      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');

      // Check summary data
      expect(csv).toContain('Income');
      expect(csv).toContain('10000');
      expect(csv).toContain('Business Expenses');
      expect(csv).toContain('4000');
      expect(csv).toContain('Personal/Family Draws');
      expect(csv).toContain('2000');
      expect(csv).toContain('Funding In');
      expect(csv).toContain('5000');
      expect(csv).toContain('Funding Out');
      expect(csv).toContain('1000');
      expect(csv).toContain('Total Owed by Customers');
      // total owed = 5000 - 1500 = 3500
      expect(csv).toContain('3500');

      // Check debts period section
      expect(csv).toContain('Newly Borrowed');
      expect(csv).toContain('3000');
      expect(csv).toContain('1200');

      // Check breakdown section
      expect(csv).toContain('Cost of Goods');
      expect(csv).toContain('Equb');
      expect(csv).toContain('Home Necessities');
      expect(csv).toContain('1000');
      expect(csv).toContain('500');
      expect(csv).toContain('200');
    });
  });
});
