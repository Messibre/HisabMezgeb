import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  listIncome,
  createIncome,
  updateIncome,
  softDeleteIncome,
  SafeIncome,
} from '../../src/services/income.service.js';
import ApiError from '../../src/utils/ApiError.js';

// Decimal class from Prisma
const Decimal = Prisma.Decimal;

type RawIncome = {
  id: string;
  accountId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ServiceIncome = SafeIncome;

// ── Mock Prisma ──
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    dailyIncome: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockFindMany = prisma.dailyIncome.findMany as unknown as Mock<
  typeof prisma.dailyIncome.findMany
>;
const mockFindFirst = prisma.dailyIncome.findFirst as unknown as Mock<
  typeof prisma.dailyIncome.findFirst
>;
const mockCreate = prisma.dailyIncome.create as unknown as Mock<typeof prisma.dailyIncome.create>;
const mockUpdate = prisma.dailyIncome.update as unknown as Mock<typeof prisma.dailyIncome.update>;

describe.skip('Income Service', () => {
  const accountId = 'acc-123';
  const incomeId = 'inc-456';
  const mockDate = new Date('2026-06-01');

  // Raw Prisma object with Decimal amount
  const rawIncome: RawIncome = {
    id: incomeId,
    accountId,
    date: mockDate,
    amount: new Decimal(1500.5),
    note: 'Daily sales',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // What the service should return (amount as number)
  const serviceIncome: ServiceIncome = {
    id: incomeId,
    accountId,
    date: mockDate,
    amount: 1500.5,
    note: 'Daily sales',
    createdAt: rawIncome.createdAt,
    updatedAt: rawIncome.updatedAt,
  };

  const rawDeletedIncome: RawIncome = {
    ...rawIncome,
    deletedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listIncome', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-12-31');

    it('should return list of income entries within date range', async () => {
      mockFindMany.mockResolvedValue([rawIncome]);

      const result = await listIncome(accountId, from, to);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          date: {
            gte: from,
            lte: to,
          },
          deletedAt: null,
        },
        orderBy: { date: 'desc' },
      });
      // The service converts Decimal to number, so we expect serviceIncome
      expect(result).toEqual([serviceIncome]);
    });

    it('should return empty array when no entries found', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await listIncome(accountId, from, to);

      expect(result).toEqual([]);
    });

    it('should exclude soft-deleted entries from results', async () => {
      mockFindMany.mockResolvedValue([]);

      await listIncome(accountId, from, to);

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

      await expect(listIncome(accountId, from, to)).rejects.toThrow(dbError);
    });
  });

  describe('createIncome', () => {
    it('should create income entry successfully', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(rawIncome);

      const result = await createIncome(accountId, mockDate, 1500.5, 'Daily sales');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          accountId,
          date: mockDate,
          deletedAt: null,
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          amount: new Decimal(1500.5),
          note: 'Daily sales',
        },
      });
      expect(result).toEqual(serviceIncome);
    });

    it('should create income with no note', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...rawIncome, note: null });

      const result = await createIncome(accountId, mockDate, 1500.5);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          amount: new Decimal(1500.5),
          note: undefined,
        },
      });
      expect(result.note).toBeNull();
    });

    it('should allow amount of 0', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...rawIncome, amount: new Decimal(0) });

      const result = await createIncome(accountId, mockDate, 0);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          amount: new Decimal(0),
          note: undefined,
        },
      });
      expect(result.amount).toBe(0);
    });

    it('should throw 409 if income already exists for this date', async () => {
      mockFindFirst.mockResolvedValue(rawIncome);

      await expect(createIncome(accountId, mockDate, 1500.5)).rejects.toThrow(ApiError);
      await expect(createIncome(accountId, mockDate, 1500.5)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Income already recorded for this date — update it instead',
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should allow creation after soft-deleted entry exists', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue(rawIncome);

      await createIncome(accountId, mockDate, 1500.5);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          accountId,
          date: mockDate,
          deletedAt: null,
        },
      });
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockFindFirst.mockRejectedValue(dbError);

      await expect(createIncome(accountId, mockDate, 1500.5)).rejects.toThrow(dbError);
    });
  });

  describe('updateIncome', () => {
    it('should update amount and note successfully', async () => {
      mockFindFirst.mockResolvedValue(rawIncome);
      const updatedRaw = { ...rawIncome, amount: new Decimal(2000), note: 'Updated note' };
      mockUpdate.mockResolvedValue(updatedRaw);

      const result = await updateIncome(accountId, incomeId, {
        amount: 2000,
        note: 'Updated note',
      });

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: incomeId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: incomeId },
        data: {
          amount: new Decimal(2000),
          note: 'Updated note',
        },
      });
      expect(result.amount).toBe(2000);
      expect(result.note).toBe('Updated note');
    });

    it('should update only amount', async () => {
      mockFindFirst.mockResolvedValue(rawIncome);
      mockUpdate.mockResolvedValue({ ...rawIncome, amount: new Decimal(2000) });

      const result = await updateIncome(accountId, incomeId, { amount: 2000 });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: incomeId },
        data: {
          amount: new Decimal(2000),
          note: undefined,
        },
      });
      expect(result.amount).toBe(2000);
      expect(result.note).toBe(rawIncome.note);
    });

    it('should update only note', async () => {
      mockFindFirst.mockResolvedValue(rawIncome);
      mockUpdate.mockResolvedValue({ ...rawIncome, note: 'Only note updated' });

      const result = await updateIncome(accountId, incomeId, { note: 'Only note updated' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: incomeId },
        data: {
          amount: undefined,
          note: 'Only note updated',
        },
      });
      expect(result.note).toBe('Only note updated');
      expect(result.amount).toBe(rawIncome.amount.toNumber());
    });

    it('should throw 404 if income entry not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(updateIncome(accountId, incomeId, { amount: 2000 })).rejects.toThrow(ApiError);
      await expect(updateIncome(accountId, incomeId, { amount: 2000 })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Income entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteIncome', () => {
    it('should soft-delete income entry successfully', async () => {
      mockFindFirst.mockResolvedValue(rawIncome);
      mockUpdate.mockResolvedValue(rawDeletedIncome);

      await softDeleteIncome(accountId, incomeId);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: incomeId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: incomeId },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should throw 404 if income entry not found or already deleted', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(softDeleteIncome(accountId, incomeId)).rejects.toThrow(ApiError);
      await expect(softDeleteIncome(accountId, incomeId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Income entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
