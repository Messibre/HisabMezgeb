import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  listFunding,
  createFunding,
  updateFunding,
  softDeleteFunding,
  calculateOutstanding,
  FundingEntry,
  FundingType,
} from '../../src/services/funding.service.js';
import ApiError from '../../src/utils/ApiError.js';

const Decimal = Prisma.Decimal;

type MockFunding = {
  id: string;
  accountId: string;
  type: FundingType;
  amount: Prisma.Decimal;
  date: Date;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helper: Build a full aggregate result ──
type AggregateResult = {
  _sum: { amount: Prisma.Decimal | null };
  _count: { amount: number };
  _avg: { amount: Prisma.Decimal | null };
  _min: { amount: Prisma.Decimal | null };
  _max: { amount: Prisma.Decimal | null };
};

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
    fundingEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

// ── Explicitly typed mocks ──
const mockFindMany = prisma.fundingEntry.findMany as unknown as Mock<
  typeof prisma.fundingEntry.findMany
>;
const mockFindFirst = prisma.fundingEntry.findFirst as unknown as Mock<
  typeof prisma.fundingEntry.findFirst
>;
const mockCreate = prisma.fundingEntry.create as unknown as Mock<typeof prisma.fundingEntry.create>;
const mockUpdate = prisma.fundingEntry.update as unknown as Mock<typeof prisma.fundingEntry.update>;
const mockAggregate = prisma.fundingEntry.aggregate as unknown as Mock<
  typeof prisma.fundingEntry.aggregate
>;

describe('Funding Service', () => {
  const accountId = 'acc-123';
  const fundingId = 'fun-456';
  const mockDate = new Date('2026-06-01');

  const mockFundingEntry: FundingEntry = {
    id: fundingId,
    accountId,
    type: 'salary_injection',
    amount: 5000,
    date: mockDate,
    note: 'Monthly salary',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaFunding: MockFunding = {
    id: fundingId,
    accountId,
    type: 'salary_injection',
    amount: new Decimal(5000),
    date: mockDate,
    note: 'Monthly salary',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listFunding', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-12-31');

    it('should return list of funding entries within date range', async () => {
      mockFindMany.mockResolvedValue([mockPrismaFunding]);

      const result = await listFunding(accountId, from, to);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          date: { gte: from, lte: to },
          deletedAt: null,
        },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual([mockFundingEntry]);
    });

    it('should return empty array when no entries found', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await listFunding(accountId, from, to);

      expect(result).toEqual([]);
    });

    it('should exclude soft-deleted entries', async () => {
      mockFindMany.mockResolvedValue([]);

      await listFunding(accountId, from, to);

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

      await expect(listFunding(accountId, from, to)).rejects.toThrow(dbError);
    });
  });

  describe('createFunding', () => {
    it('should create salary_injection successfully', async () => {
      mockCreate.mockResolvedValue(mockPrismaFunding);

      const result = await createFunding(
        accountId,
        mockDate,
        'salary_injection',
        5000,
        'Monthly salary',
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          type: 'salary_injection',
          amount: new Decimal(5000),
          note: 'Monthly salary',
        },
      });
      expect(result).toEqual(mockFundingEntry);
    });

    it('should create borrowed_in successfully', async () => {
      const mockBorrowedIn: MockFunding = {
        ...mockPrismaFunding,
        type: 'borrowed_in',
        amount: new Decimal(10000),
        note: null,
      };
      mockCreate.mockResolvedValue(mockBorrowedIn);

      const result = await createFunding(accountId, mockDate, 'borrowed_in', 10000);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          date: mockDate,
          type: 'borrowed_in',
          amount: new Decimal(10000),
          note: undefined,
        },
      });
      expect(result.type).toBe('borrowed_in');
      expect(result.amount).toBe(10000);
      expect(result.note).toBeNull();
    });

    it('should create borrowed_repaid successfully', async () => {
      const mockRepaid: MockFunding = {
        ...mockPrismaFunding,
        type: 'borrowed_repaid',
        amount: new Decimal(2000),
      };
      mockCreate.mockResolvedValue(mockRepaid);

      const result = await createFunding(accountId, mockDate, 'borrowed_repaid', 2000);

      expect(result.type).toBe('borrowed_repaid');
      expect(result.amount).toBe(2000);
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCreate.mockRejectedValue(dbError);

      await expect(createFunding(accountId, mockDate, 'salary_injection', 5000)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('updateFunding', () => {
    it('should update amount and note successfully', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaFunding);
      mockUpdate.mockResolvedValue({
        ...mockPrismaFunding,
        amount: new Decimal(6000),
        note: 'Updated note',
      });

      const result = await updateFunding(accountId, fundingId, {
        amount: 6000,
        note: 'Updated note',
      });

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: fundingId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: fundingId },
        data: {
          amount: new Decimal(6000),
          note: 'Updated note',
        },
      });
      expect(result.amount).toBe(6000);
      expect(result.note).toBe('Updated note');
    });

    it('should update only amount', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaFunding);
      mockUpdate.mockResolvedValue({ ...mockPrismaFunding, amount: new Decimal(6000) });

      const result = await updateFunding(accountId, fundingId, { amount: 6000 });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: fundingId },
        data: {
          amount: new Decimal(6000),
          note: undefined,
        },
      });
      expect(result.amount).toBe(6000);
      expect(result.note).toBe(mockFundingEntry.note);
    });

    it('should update only note', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaFunding);
      mockUpdate.mockResolvedValue({ ...mockPrismaFunding, note: 'Only note updated' });

      const result = await updateFunding(accountId, fundingId, { note: 'Only note updated' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: fundingId },
        data: {
          amount: undefined,
          note: 'Only note updated',
        },
      });
      expect(result.note).toBe('Only note updated');
      expect(result.amount).toBe(mockFundingEntry.amount);
    });

    it('should throw 404 if funding entry not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(updateFunding(accountId, fundingId, { amount: 6000 })).rejects.toThrow(ApiError);
      await expect(updateFunding(accountId, fundingId, { amount: 6000 })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Funding entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteFunding', () => {
    it('should soft-delete funding entry successfully', async () => {
      mockFindFirst.mockResolvedValue(mockPrismaFunding);
      mockUpdate.mockResolvedValue({ ...mockPrismaFunding, deletedAt: new Date() });

      await softDeleteFunding(accountId, fundingId);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: fundingId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: fundingId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 404 if funding entry not found or already deleted', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(softDeleteFunding(accountId, fundingId)).rejects.toThrow(ApiError);
      await expect(softDeleteFunding(accountId, fundingId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Funding entry not found',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('calculateOutstanding', () => {
    it('should return correct outstanding amount (borrowed_in - borrowed_repaid)', async () => {
      // Use the helper to create full aggregate objects
      mockAggregate
        .mockResolvedValueOnce(createAggregateResult(10000)) // borrowed_in
        .mockResolvedValueOnce(createAggregateResult(3000)); // borrowed_repaid

      const result = await calculateOutstanding(accountId);

      expect(mockAggregate).toHaveBeenCalledTimes(2);
      expect(mockAggregate).toHaveBeenNthCalledWith(1, {
        where: {
          accountId,
          type: 'borrowed_in',
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      expect(mockAggregate).toHaveBeenNthCalledWith(2, {
        where: {
          accountId,
          type: 'borrowed_repaid',
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      expect(result).toBe(7000);
    });

    it('should return 0 when no borrowed_in entries exist', async () => {
      mockAggregate
        .mockResolvedValueOnce(createAggregateResult(null))
        .mockResolvedValueOnce(createAggregateResult(null));

      const result = await calculateOutstanding(accountId);

      expect(result).toBe(0);
    });

    it('should return 0 when borrowed_in equals borrowed_repaid', async () => {
      mockAggregate
        .mockResolvedValueOnce(createAggregateResult(5000))
        .mockResolvedValueOnce(createAggregateResult(5000));

      const result = await calculateOutstanding(accountId);

      expect(result).toBe(0);
    });

    it('should never return negative (clamp at 0)', async () => {
      mockAggregate
        .mockResolvedValueOnce(createAggregateResult(3000))
        .mockResolvedValueOnce(createAggregateResult(5000));

      const result = await calculateOutstanding(accountId);

      expect(result).toBe(0); // clamped to 0
    });

    it('should exclude soft-deleted entries from calculation', async () => {
      mockAggregate
        .mockResolvedValueOnce(createAggregateResult(10000))
        .mockResolvedValueOnce(createAggregateResult(3000));

      await calculateOutstanding(accountId);

      expect(mockAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockAggregate.mockRejectedValue(dbError);

      await expect(calculateOutstanding(accountId)).rejects.toThrow(dbError);
    });
  });
});
