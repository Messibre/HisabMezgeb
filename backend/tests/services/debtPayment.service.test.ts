import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/db.js';
import {
  createPayment,
  updatePayment,
  softDeletePayment,
} from '../../src/services/debtPayment.service.js';
import * as debtCustomerService from '../../src/services/debtCustomer.service.js';
import ApiError from '../../src/utils/ApiError.js';

const Decimal = Prisma.Decimal;

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
    debtPayment: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    debtCustomer: {
      findUnique: vi.fn(),
    },
    dailyIncome: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/debtCustomer.service.js', () => ({
  calculateCustomerBalance: vi.fn(),
}));

const mockPaymentCreate = prisma.debtPayment.create as unknown as Mock<
  typeof prisma.debtPayment.create
>;
const mockPaymentUpdate = prisma.debtPayment.update as unknown as Mock<
  typeof prisma.debtPayment.update
>;
const mockPaymentFindFirst = prisma.debtPayment.findFirst as unknown as Mock<
  typeof prisma.debtPayment.findFirst
>;
const mockCustomerFindUnique = prisma.debtCustomer.findUnique as unknown as Mock<
  typeof prisma.debtCustomer.findUnique
>;
const mockIncomeCreate = prisma.dailyIncome.create as unknown as Mock<
  typeof prisma.dailyIncome.create
>;
const mockCalculateBalance = debtCustomerService.calculateCustomerBalance as unknown as Mock<
  typeof debtCustomerService.calculateCustomerBalance
>;

describe('DebtPayment Service', () => {
  const accountId = 'acc-123';
  const customerId = 'cust-456';
  const paymentId = 'payment-789';
  const mockDate = new Date('2026-06-01');

  const mockPayment: MockPayment = {
    id: paymentId,
    customerId,
    accountId,
    amount: new Decimal(500),
    date: mockDate,
    note: 'Payment received',
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

  describe('createPayment', () => {
    it('should create a payment successfully when amount <= balance', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCalculateBalance.mockResolvedValue(1000);
      mockPaymentCreate.mockResolvedValue(mockPayment);

      const result = await createPayment(accountId, customerId, mockDate, 500, 'Payment received');

      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: {
          id: customerId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockCalculateBalance).toHaveBeenCalledWith(customerId);
      expect(mockPaymentCreate).toHaveBeenCalledWith({
        data: {
          customerId,
          accountId,
          date: mockDate,
          amount: new Decimal(500),
          note: 'Payment received',
        },
      });
      expect(result.payment).toEqual({
        id: paymentId,
        customerId,
        date: mockDate,
        amount: 500,
        note: 'Payment received',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result.newBalance).toBe(500); // 1000 - 500
    });

    it('should allow payment exactly equal to balance', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCalculateBalance.mockResolvedValue(500);
      mockPaymentCreate.mockResolvedValue(mockPayment);

      const result = await createPayment(accountId, customerId, mockDate, 500);

      expect(result.newBalance).toBe(0);
    });

    it('should create payment without note', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCalculateBalance.mockResolvedValue(1000);
      mockPaymentCreate.mockResolvedValue({ ...mockPayment, note: null });

      const result = await createPayment(accountId, customerId, mockDate, 500);

      expect(mockPaymentCreate).toHaveBeenCalledWith({
        data: {
          customerId,
          accountId,
          date: mockDate,
          amount: new Decimal(500),
          note: undefined,
        },
      });
      expect(result.payment.note).toBeNull();
    });

    it('should throw 400 if payment amount exceeds current balance', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCalculateBalance.mockResolvedValue(300);

      await expect(createPayment(accountId, customerId, mockDate, 500)).rejects.toThrow(ApiError);
      await expect(createPayment(accountId, customerId, mockDate, 500)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Payment cannot exceed the amount owed',
      });
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });

    it('should throw 404 if customer not found', async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      await expect(createPayment(accountId, customerId, mockDate, 500)).rejects.toThrow(ApiError);
      await expect(createPayment(accountId, customerId, mockDate, 500)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Debt customer not found',
      });
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });

    // ── FR-23 Guarantee: Payment never touches income ──
    it('should NEVER create or touch any income entry (FR-23)', async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomer);
      mockCalculateBalance.mockResolvedValue(1000);
      mockPaymentCreate.mockResolvedValue(mockPayment);
      mockIncomeCreate.mockResolvedValue({} as any); // Will assert it's NOT called

      await createPayment(accountId, customerId, mockDate, 500);

      // CRITICAL: Assert that income.create was NEVER called
      expect(mockIncomeCreate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockCustomerFindUnique.mockRejectedValue(dbError);

      await expect(createPayment(accountId, customerId, mockDate, 500)).rejects.toThrow(dbError);
    });
  });

  describe('updatePayment', () => {
    it('should update amount and note successfully', async () => {
      mockPaymentFindFirst.mockResolvedValue(mockPayment);
      // Balance check before update: customer has enough balance
      mockCalculateBalance.mockResolvedValue(1000);
      mockPaymentUpdate.mockResolvedValue({
        ...mockPayment,
        amount: new Decimal(300),
        note: 'Updated note',
      });

      const result = await updatePayment(accountId, paymentId, {
        amount: 300,
        note: 'Updated note',
      });

      expect(mockPaymentFindFirst).toHaveBeenCalledWith({
        where: {
          id: paymentId,
          accountId,
          deletedAt: null,
        },
      });
      // Balance is checked BEFORE updating the payment
      expect(mockCalculateBalance).toHaveBeenCalledWith(customerId);
      expect(mockPaymentUpdate).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          amount: new Decimal(300),
          note: 'Updated note',
        },
      });
      expect(result.amount).toBe(300);
      expect(result.note).toBe('Updated note');
    });

    it('should update only note', async () => {
      mockPaymentFindFirst.mockResolvedValue(mockPayment);
      mockCalculateBalance.mockResolvedValue(1000);
      mockPaymentUpdate.mockResolvedValue({ ...mockPayment, note: 'Updated note' });

      const result = await updatePayment(accountId, paymentId, {
        note: 'Updated note',
      });

      expect(mockPaymentUpdate).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: { note: 'Updated note' },
      });
      expect(result.note).toBe('Updated note');
      expect(result.amount).toBe(500);
    });

    it('should throw 400 if updated amount exceeds current balance', async () => {
      mockPaymentFindFirst.mockResolvedValue(mockPayment);

      mockCalculateBalance.mockResolvedValue(0);
      const mockPaymentUpdated = { ...mockPayment, amount: new Decimal(300) };
      mockPaymentFindFirst.mockResolvedValue(mockPaymentUpdated);
      mockCalculateBalance.mockResolvedValue(0);

      const mockPaymentForTest = { ...mockPayment, amount: new Decimal(300) };
      mockPaymentFindFirst.mockResolvedValue(mockPaymentForTest);
      mockCalculateBalance.mockResolvedValue(0); // Balance after existing 300 payment

      // Try to update to 500
      await expect(updatePayment(accountId, paymentId, { amount: 500 })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Payment cannot exceed the amount owed',
      });
      expect(mockPaymentUpdate).not.toHaveBeenCalled();
    });

    it('should throw 404 if payment not found', async () => {
      mockPaymentFindFirst.mockResolvedValue(null);

      await expect(updatePayment(accountId, paymentId, { amount: 300 })).rejects.toThrow(ApiError);
      await expect(updatePayment(accountId, paymentId, { amount: 300 })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Payment not found',
      });
      expect(mockPaymentUpdate).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB error');
      mockPaymentFindFirst.mockRejectedValue(dbError);

      await expect(updatePayment(accountId, paymentId, { amount: 300 })).rejects.toThrow(dbError);
    });
  });

  describe('softDeletePayment', () => {
    it('should soft-delete payment successfully', async () => {
      mockPaymentFindFirst.mockResolvedValue(mockPayment);
      mockPaymentUpdate.mockResolvedValue({ ...mockPayment, deletedAt: new Date() });

      await softDeletePayment(accountId, paymentId);

      expect(mockPaymentFindFirst).toHaveBeenCalledWith({
        where: {
          id: paymentId,
          accountId,
          deletedAt: null,
        },
      });
      expect(mockPaymentUpdate).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 404 if payment not found or already deleted', async () => {
      mockPaymentFindFirst.mockResolvedValue(null);

      await expect(softDeletePayment(accountId, paymentId)).rejects.toThrow(ApiError);
      await expect(softDeletePayment(accountId, paymentId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Payment not found',
      });
      expect(mockPaymentUpdate).not.toHaveBeenCalled();
    });
  });
});
