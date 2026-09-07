import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  createBorrowRecord,
  updateBorrowRecord,
  softDeleteBorrowRecord,
} from '../../src/services/debtBorrowRecord.service.js';
import * as debtCustomerService from '../../src/services/debtCustomer.service.js';
import ApiError from '../../src/utils/ApiError.js';

const Decimal = Prisma.Decimal;

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

// ── Mock Prisma ──
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    debtBorrowRecord: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    debtCustomer: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/debtCustomer.service.js', () => ({
  calculateCustomerBalance: vi.fn(),
}));

const mockBorrowCreate = prisma.debtBorrowRecord.create as unknown as Mock<
  typeof prisma.debtBorrowRecord.create
>;
const mockBorrowUpdate = prisma.debtBorrowRecord.update as unknown as Mock<
  typeof prisma.debtBorrowRecord.update
>;
const mockBorrowFindFirst = prisma.debtBorrowRecord.findFirst as unknown as Mock<
  typeof prisma.debtBorrowRecord.findFirst
>;
const mockCustomerFindUnique = prisma.debtCustomer.findUnique as unknown as Mock<
  typeof prisma.debtCustomer.findUnique
>;
const mockCalculateBalance = debtCustomerService.calculateCustomerBalance as unknown as Mock<
  typeof debtCustomerService.calculateCustomerBalance
>;

describe('DebtBorrowRecord Service', () => {
  const accountId = 'acc-123';
  const customerId = 'cust-456';
  const recordId = 'borrow-789';
  const mockDate = new Date('2026-06-01');

  const mockBorrow: MockBorrow = {
    id: recordId,
    customerId,
    accountId,
    itemsDescription: 'Items purchased',
    amount: new Decimal(1000),
    date: mockDate,
    note: 'First borrow',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer = {
    id: customerId,
    accountId,
    name: 'John Doe',
    note: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBorrowRecord', () => {
    it('should create a borrow record successfully', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockBorrowCreate.mockResolvedValue(mockBorrow);

      const result = await createBorrowRecord(
        accountId,
        customerId,
        mockDate,
        1000,
        'Items purchased',
        'First borrow',
      );

      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: {
          id: customerId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockBorrowCreate).toHaveBeenCalledWith({
        data: {
          customerId,
          accountId,
          date: mockDate,
          amount: new Decimal(1000),
          itemsDescription: 'Items purchased',
          note: 'First borrow',
        },
      });
      expect(result).toEqual({
        id: recordId,
        customerId,
        date: mockDate,
        amount: 1000,
        itemsDescription: 'Items purchased',
        note: 'First borrow',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create borrow record without note', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockBorrowCreate.mockResolvedValue({ ...mockBorrow, note: null });

      const result = await createBorrowRecord(
        accountId,
        customerId,
        mockDate,
        1000,
        'Items purchased',
      );

      expect(mockBorrowCreate).toHaveBeenCalledWith({
        data: {
          customerId,
          accountId,
          date: mockDate,
          amount: new Decimal(1000),
          itemsDescription: 'Items purchased',
          note: undefined,
        },
      });
      expect(result.note).toBeNull();
    });

    it('should throw 404 if customer not found', async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      await expect(
        createBorrowRecord(accountId, customerId, mockDate, 1000, 'Items'),
      ).rejects.toThrow(ApiError);
      await expect(
        createBorrowRecord(accountId, customerId, mockDate, 1000, 'Items'),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Debt customer not found',
      });
      expect(mockBorrowCreate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerFindUnique.mockRejectedValue(dbError);

      await expect(
        createBorrowRecord(accountId, customerId, mockDate, 1000, 'Items'),
      ).rejects.toThrow(dbError);
    });
  });

  describe('updateBorrowRecord', () => {
    it('should update amount and itemsDescription successfully', async () => {
      mockBorrowFindFirst.mockResolvedValue(mockBorrow);
      mockBorrowUpdate.mockResolvedValue({
        ...mockBorrow,
        amount: new Decimal(1500),
        itemsDescription: 'Updated items',
      });

      const result = await updateBorrowRecord(accountId, recordId, {
        amount: 1500,
        itemsDescription: 'Updated items',
      });

      expect(mockBorrowFindFirst).toHaveBeenCalledWith({
        where: {
          id: recordId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockBorrowUpdate).toHaveBeenCalledWith({
        where: { id: recordId },
        data: {
          amount: new Decimal(1500),
          itemsDescription: 'Updated items',
        },
      });
      expect(result.amount).toBe(1500);
      expect(result.itemsDescription).toBe('Updated items');
    });

    it('should update only note', async () => {
      mockBorrowFindFirst.mockResolvedValue(mockBorrow);
      mockBorrowUpdate.mockResolvedValue({ ...mockBorrow, note: 'Updated note' });

      const result = await updateBorrowRecord(accountId, recordId, {
        note: 'Updated note',
      });

      expect(mockBorrowUpdate).toHaveBeenCalledWith({
        where: { id: recordId },
        data: { note: 'Updated note' },
      });
      expect(result.note).toBe('Updated note');
    });

    it('should throw 404 if borrow record not found', async () => {
      mockBorrowFindFirst.mockResolvedValue(null);

      await expect(updateBorrowRecord(accountId, recordId, { amount: 1500 })).rejects.toThrow(
        ApiError,
      );
      await expect(updateBorrowRecord(accountId, recordId, { amount: 1500 })).rejects.toMatchObject(
        {
          statusCode: 404,
          message: 'Borrow record not found',
        },
      );
      expect(mockBorrowUpdate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockBorrowFindFirst.mockRejectedValue(dbError);

      await expect(updateBorrowRecord(accountId, recordId, { amount: 1500 })).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('softDeleteBorrowRecord', () => {
    it('should soft-delete borrow record successfully', async () => {
      mockBorrowFindFirst.mockResolvedValue(mockBorrow);
      mockBorrowUpdate.mockResolvedValue({ ...mockBorrow, deletedAt: new Date() });

      await softDeleteBorrowRecord(accountId, recordId);

      expect(mockBorrowFindFirst).toHaveBeenCalledWith({
        where: {
          id: recordId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockBorrowUpdate).toHaveBeenCalledWith({
        where: { id: recordId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 404 if borrow record not found or already deleted', async () => {
      mockBorrowFindFirst.mockResolvedValue(null);

      await expect(softDeleteBorrowRecord(accountId, recordId)).rejects.toThrow(ApiError);
      await expect(softDeleteBorrowRecord(accountId, recordId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Borrow record not found',
      });
      expect(mockBorrowUpdate).not.toHaveBeenCalled();
    });
  });
});
