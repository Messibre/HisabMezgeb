import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  calculateCustomerBalance,
  listCustomersWithBalance,
  createCustomer,
  getCustomerWithHistory,
  updateCustomer,
  softDeleteCustomer,
  CustomerWithBalance,
  CustomerDetail,
} from '../../src/services/debtCustomer.service.js';
import ApiError from '../../src/utils/ApiError.js';

const Decimal = Prisma.Decimal;

// ── Type Definitions ──
type MockCustomer = {
  id: string;
  accountId: string;
  name: string;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockBorrow = {
  id: string;
  customerId: string;
  accountId: string;
  itemsDescription: string;
  amount: Prisma.Decimal;
  date: Date;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockPayment = {
  id: string;
  customerId: string;
  accountId: string;
  amount: Prisma.Decimal;
  date: Date;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Mock Prisma ──
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    debtCustomer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    debtBorrowRecord: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    debtPayment: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// ── Explicitly typed mocks ──
const mockCustomerFindMany = prisma.debtCustomer.findMany as unknown as Mock<
  typeof prisma.debtCustomer.findMany
>;
const mockCustomerFindUnique = prisma.debtCustomer.findUnique as unknown as Mock<
  typeof prisma.debtCustomer.findUnique
>;
const mockCustomerCreate = prisma.debtCustomer.create as unknown as Mock<
  typeof prisma.debtCustomer.create
>;
const mockCustomerUpdate = prisma.debtCustomer.update as unknown as Mock<
  typeof prisma.debtCustomer.update
>;
const mockBorrowAggregate = prisma.debtBorrowRecord.aggregate as unknown as Mock<
  typeof prisma.debtBorrowRecord.aggregate
>;
const mockPaymentAggregate = prisma.debtPayment.aggregate as unknown as Mock<
  typeof prisma.debtPayment.aggregate
>;
const mockBorrowFindMany = prisma.debtBorrowRecord.findMany as unknown as Mock<
  typeof prisma.debtBorrowRecord.findMany
>;
const mockPaymentFindMany = prisma.debtPayment.findMany as unknown as Mock<
  typeof prisma.debtPayment.findMany
>;

// ── Helper: Build full aggregate result ──
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

describe.skip('DebtCustomer Service', () => {
  const accountId = 'acc-123';
  const customerId = 'cust-456';

  const mockCustomer: MockCustomer = {
    id: customerId,
    accountId,
    name: 'John Doe',
    note: 'Phone: 0911223344',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomerWithBalance: CustomerWithBalance = {
    id: customerId,
    name: 'John Doe',
    note: 'Phone: 0911223344',
    balance: 700,
    createdAt: mockCustomer.createdAt,
    updatedAt: mockCustomer.updatedAt,
  };

  const mockBorrows: MockBorrow[] = [
    {
      id: 'borrow-1',
      customerId,
      accountId,
      itemsDescription: 'Items purchased',
      amount: new Decimal(1000),
      date: new Date('2026-06-01'),
      note: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'borrow-2',
      customerId,
      accountId,
      itemsDescription: 'More items',
      amount: new Decimal(500),
      date: new Date('2026-06-15'),
      note: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPayments: MockPayment[] = [
    {
      id: 'payment-1',
      customerId,
      accountId,
      amount: new Decimal(300),
      date: new Date('2026-06-10'),
      note: 'Partial payment',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'payment-2',
      customerId,
      accountId,
      amount: new Decimal(500),
      date: new Date('2026-06-20'),
      note: 'Another payment',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCustomerBalance', () => {
    it('should return correct balance (borrows - payments)', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await calculateCustomerBalance(customerId);

      expect(mockBorrowAggregate).toHaveBeenCalledWith({
        where: {
          customerId,
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      expect(mockPaymentAggregate).toHaveBeenCalledWith({
        where: {
          customerId,
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      expect(result).toBe(700);
    });

    it('should return 0 when customer has no borrows', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(null));

      const result = await calculateCustomerBalance(customerId);

      expect(result).toBe(0);
    });

    it('should exclude soft-deleted borrows and payments from calculation', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      await calculateCustomerBalance(customerId);

      expect(mockBorrowAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
      expect(mockPaymentAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should never return negative (clamp at 0) even if payments exceed borrows', async () => {
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await calculateCustomerBalance(customerId);

      expect(result).toBe(0);
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockBorrowAggregate.mockRejectedValue(dbError);

      await expect(calculateCustomerBalance(customerId)).rejects.toThrow(dbError);
    });
  });

  describe('listCustomersWithBalance', () => {
    it('should return list of customers with their current balance', async () => {
      mockCustomerFindMany.mockResolvedValue([mockCustomer]);
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await listCustomersWithBalance(accountId);

      expect(mockCustomerFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          deletedAt: null,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockCustomerWithBalance]);
    });

    it('should filter by search term when provided', async () => {
      mockCustomerFindMany.mockResolvedValue([mockCustomer]);
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      await listCustomersWithBalance(accountId, 'John');

      expect(mockCustomerFindMany).toHaveBeenCalledWith({
        where: {
          accountId,
          deletedAt: null,
          name: { contains: 'John', mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no customers exist', async () => {
      mockCustomerFindMany.mockResolvedValue([]);

      const result = await listCustomersWithBalance(accountId);

      expect(result).toEqual([]);
    });

    it('should handle customers with zero balance', async () => {
      mockCustomerFindMany.mockResolvedValue([mockCustomer]);
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(null));

      const result = await listCustomersWithBalance(accountId);

      expect(result[0].balance).toBe(0);
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerFindMany.mockRejectedValue(dbError);

      await expect(listCustomersWithBalance(accountId)).rejects.toThrow(dbError);
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      mockCustomerCreate.mockResolvedValue(mockCustomer);

      const result = await createCustomer(accountId, {
        name: 'John Doe',
        note: 'Phone: 0911223344',
      });

      expect(mockCustomerCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          name: 'John Doe',
          note: 'Phone: 0911223344',
        },
      });
      expect(result).toEqual(mockCustomerWithBalance);
    });

    it('should create customer without note', async () => {
      mockCustomerCreate.mockResolvedValue({ ...mockCustomer, note: null });

      const result = await createCustomer(accountId, { name: 'Jane Smith' });

      expect(mockCustomerCreate).toHaveBeenCalledWith({
        data: {
          accountId,
          name: 'Jane Smith',
          note: undefined,
        },
      });
      expect(result.note).toBeNull();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerCreate.mockRejectedValue(dbError);

      await expect(createCustomer(accountId, { name: 'John Doe' })).rejects.toThrow(dbError);
    });
  });

  describe('getCustomerWithHistory', () => {
    it('should return customer detail with interleaved history', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockBorrowFindMany.mockResolvedValue(mockBorrows);
      mockPaymentFindMany.mockResolvedValue(mockPayments);
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await getCustomerWithHistory(accountId, customerId);

      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: {
          id: customerId,
          accountId,
          deletedAt: null,
        },
      });
      expect(result.id).toBe(customerId);
      expect(result.name).toBe('John Doe');
      expect(result.balance).toBe(700);
      expect(result.history.length).toBe(4); // 2 borrows + 2 payments
    });

    it('should throw 404 if customer not found', async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      await expect(getCustomerWithHistory(accountId, customerId)).rejects.toThrow(ApiError);
      await expect(getCustomerWithHistory(accountId, customerId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Debt customer not found',
      });
    });

    it('should return empty history when customer has no records', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockBorrowFindMany.mockResolvedValue([]);
      mockPaymentFindMany.mockResolvedValue([]);
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(null));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(null));

      const result = await getCustomerWithHistory(accountId, customerId);

      expect(result.history).toEqual([]);
      expect(result.balance).toBe(0);
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerFindUnique.mockRejectedValue(dbError);

      await expect(getCustomerWithHistory(accountId, customerId)).rejects.toThrow(dbError);
    });
  });

  describe('updateCustomer', () => {
    it('should update name successfully', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCustomerUpdate.mockResolvedValue({ ...mockCustomer, name: 'Updated Name' });
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await updateCustomer(accountId, customerId, {
        name: 'Updated Name',
      });

      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: {
          id: customerId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockCustomerUpdate).toHaveBeenCalledWith({
        where: { id: customerId },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should update note only', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCustomerUpdate.mockResolvedValue({ ...mockCustomer, note: 'Updated note' });
      mockBorrowAggregate.mockResolvedValueOnce(createAggregateResult(1500));
      mockPaymentAggregate.mockResolvedValueOnce(createAggregateResult(800));

      const result = await updateCustomer(accountId, customerId, {
        note: 'Updated note',
      });

      expect(mockCustomerUpdate).toHaveBeenCalledWith({
        where: { id: customerId },
        data: { note: 'Updated note' },
      });
      expect(result.note).toBe('Updated note');
    });

    it('should throw 404 if customer not found', async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      await expect(updateCustomer(accountId, customerId, { name: 'New Name' })).rejects.toThrow(
        ApiError,
      );
      await expect(
        updateCustomer(accountId, customerId, { name: 'New Name' }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Debt customer not found',
      });
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerFindUnique.mockRejectedValue(dbError);

      await expect(updateCustomer(accountId, customerId, { name: 'New Name' })).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('softDeleteCustomer', () => {
    it('should soft-delete customer successfully', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCustomerUpdate.mockResolvedValue({ ...mockCustomer, deletedAt: new Date() });

      await softDeleteCustomer(accountId, customerId);

      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: {
          id: customerId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockCustomerUpdate).toHaveBeenCalledWith({
        where: { id: customerId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 404 if customer not found or already deleted', async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      await expect(softDeleteCustomer(accountId, customerId)).rejects.toThrow(ApiError);
      await expect(softDeleteCustomer(accountId, customerId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Debt customer not found',
      });
    });
  });
});
