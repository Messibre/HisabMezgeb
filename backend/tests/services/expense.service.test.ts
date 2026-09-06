import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  listExpenses,
  createExpense,
  updateExpense,
  softDeleteExpense,
  ExpenseWithCategory,
  ExpenseResponse,
} from '../../src/services/expense.service.js';
import ApiError from '../../src/utils/ApiError.js';

const Decimal = Prisma.Decimal;

type MockExpense = {
  id: string;
  accountId: string;
  categoryId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    name: string;
  };
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

// ── Mock Prisma ──
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    dailyExpense: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    expenseCategory: {
      findUnique: vi.fn(),
    },
  },
}));

// ── Explicitly typed mocks ──
const mockFindMany = prisma.dailyExpense.findMany as unknown as Mock<
  typeof prisma.dailyExpense.findMany
>;
const mockFindFirst = prisma.dailyExpense.findFirst as unknown as Mock<
  typeof prisma.dailyExpense.findFirst
>;
const mockCreate = prisma.dailyExpense.create as unknown as Mock<typeof prisma.dailyExpense.create>;
const mockUpdate = prisma.dailyExpense.update as unknown as Mock<typeof prisma.dailyExpense.update>;
const mockCategoryFindUnique = prisma.expenseCategory.findUnique as unknown as Mock<
  typeof prisma.expenseCategory.findUnique
>;

describe.skip('Expense Service', () => {
  const accountId = 'acc-123';
  const expenseId = 'exp-456';
  const categoryId = 'cat-789';
  const mockDate = new Date('2026-06-01');

  // ── Full category mock (all fields required by Prisma type) ──
  const mockCategory: MockCategory = {
    id: categoryId,
    accountId,
    name: 'Cost of Goods',
    group: 'business',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExpenseWithCategory: ExpenseWithCategory = {
    id: expenseId,
    accountId,
    categoryId,
    categoryName: 'Cost of Goods',
    date: mockDate,
    amount: 1500.5,
    note: 'Daily expense',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExpenseResponse: ExpenseResponse = {
    id: expenseId,
    accountId,
    categoryId,
    date: mockDate,
    amount: 1500.5,
    note: 'Daily expense',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaExpense: MockExpense = {
    id: expenseId,
    accountId,
    categoryId,
    date: mockDate,
    amount: new Decimal(1500.5),
    note: 'Daily expense',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { name: 'Cost of Goods' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listExpenses', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-12-31');

    it('should return list of expenses within date range', async () => {
      mockFindMany.mockResolvedValue([mockPrismaExpense]);

      const result = await listExpenses(accountId, from, to);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          date: { gte: from, lte: to },
          deletedAt: null,
        },
        include: { category: { select: { name: true } } },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual([mockExpenseWithCategory]);
    });

    it('should filter by categoryId when provided', async () => {
      mockFindMany.mockResolvedValue([mockPrismaExpense]);

      await listExpenses(accountId, from, to, categoryId);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId,
          }),
        }),
      );
    });

    it('should return empty array when no entries found', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await listExpenses(accountId, from, to);

      expect(result).toEqual([]);
    });

    it('should exclude soft-deleted entries', async () => {
      mockFindMany.mockResolvedValue([]);

      await listExpenses(accountId, from, to);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockFindMany.mockRejectedValue(dbError);

      await expect(listExpenses(accountId, from, to)).rejects.toThrow(dbError);
    });
  });

  describe('createExpense', () => {
    it('should create expense successfully', async () => {
      mockCategoryFindUnique.mockResolvedValue(mockCategory); // returns full category object
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockPrismaExpense);

      const result = await createExpense(accountId, mockDate, categoryId, 1500.5, 'Daily expense');

      expect(mockCategoryFindUnique).toHaveBeenCalledWith({
        where: { id: categoryId, accountId },
      });
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          accountId,
          date: mockDate,
          categoryId,
          deletedAt: null,
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          categoryId,
          amount: new Decimal(1500.5),
          note: 'Daily expense',
        },
      });
      expect(result).toEqual(mockExpenseResponse);
    });

    it('should create expense with no note', async () => {
      mockCategoryFindUnique.mockResolvedValue(mockCategory);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...mockPrismaExpense, note: null });

      const result = await createExpense(accountId, mockDate, categoryId, 1500.5);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          categoryId,
          amount: new Decimal(1500.5),
          note: undefined,
        },
      });
      expect(result.note).toBeNull();
    });

    it('should allow amount of 0', async () => {
      mockCategoryFindUnique.mockResolvedValue(mockCategory);
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...mockPrismaExpense, amount: new Decimal(0) });

      const result = await createExpense(accountId, mockDate, categoryId, 0);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          categoryId,
          amount: new Decimal(0),
          note: undefined,
        },
      });
      expect(result.amount).toBe(0);
    });

    it('should throw 404 if category not found', async () => {
      mockCategoryFindUnique.mockResolvedValue(null);

      await expect(createExpense(accountId, mockDate, categoryId, 1500.5)).rejects.toThrow(
        ApiError,
      );
      await expect(createExpense(accountId, mockDate, categoryId, 1500.5)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Category not found',
      });
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should throw 409 if expense already exists for this date and category', async () => {
      mockCategoryFindUnique.mockResolvedValue(mockCategory);
      mockFindFirst.mockResolvedValue(mockPrismaExpense);

      await expect(createExpense(accountId, mockDate, categoryId, 1500.5)).rejects.toThrow(
        ApiError,
      );
      await expect(createExpense(accountId, mockDate, categoryId, 1500.5)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Expense already recorded for this category and date — update it instead',
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should allow creation after soft-deleted entry exists', async () => {
      mockCategoryFindUnique.mockResolvedValue(mockCategory);
      mockFindFirst.mockResolvedValue(null); // active entry not found
      mockCreate.mockResolvedValue(mockPrismaExpense);

      await createExpense(accountId, mockDate, categoryId, 1500.5);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          accountId,
          date: mockDate,
          categoryId,
          deletedAt: null,
        },
      });
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCategoryFindUnique.mockRejectedValue(dbError);

      await expect(createExpense(accountId, mockDate, categoryId, 1500.5)).rejects.toThrow(dbError);
    });
  });

  describe('updateExpense', () => {
    it('should update amount and note successfully', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaExpense);
      mockUpdate.mockResolvedValue({
        ...mockPrismaExpense,
        amount: new Decimal(2000),
        note: 'Updated note',
      });

      const result = await updateExpense(accountId, expenseId, {
        amount: 2000,
        note: 'Updated note',
      });

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: expenseId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: {
          amount: new Decimal(2000),
          note: 'Updated note',
        },
      });
      expect(result.amount).toBe(2000);
      expect(result.note).toBe('Updated note');
    });

    it('should update only amount', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaExpense);
      mockUpdate.mockResolvedValue({ ...mockPrismaExpense, amount: new Decimal(2000) });

      const result = await updateExpense(accountId, expenseId, { amount: 2000 });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: {
          amount: new Decimal(2000),
          note: undefined,
        },
      });
      expect(result.amount).toBe(2000);
      expect(result.note).toBe(mockExpenseResponse.note);
    });

    it('should update only note', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaExpense);
      mockUpdate.mockResolvedValue({ ...mockPrismaExpense, note: 'Only note updated' });

      const result = await updateExpense(accountId, expenseId, { note: 'Only note updated' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: {
          amount: undefined,
          note: 'Only note updated',
        },
      });
      expect(result.note).toBe('Only note updated');
      expect(result.amount).toBe(mockExpenseResponse.amount);
    });

    it('should throw 404 if expense entry not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(updateExpense(accountId, expenseId, { amount: 2000 })).rejects.toThrow(ApiError);
      await expect(updateExpense(accountId, expenseId, { amount: 2000 })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Expense entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject negative amount in update (service-level check)', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaExpense);

      await expect(updateExpense(accountId, expenseId, { amount: -100 })).rejects.toThrow(ApiError);
      await expect(updateExpense(accountId, expenseId, { amount: -100 })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Amount must be 0 or greater',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteExpense', () => {
    it('should soft-delete expense successfully', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaExpense);
      mockUpdate.mockResolvedValue({ ...mockPrismaExpense, deletedAt: new Date() });

      await softDeleteExpense(accountId, expenseId);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: expenseId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 404 if expense entry not found or already deleted', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(softDeleteExpense(accountId, expenseId)).rejects.toThrow(ApiError);
      await expect(softDeleteExpense(accountId, expenseId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Expense entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
