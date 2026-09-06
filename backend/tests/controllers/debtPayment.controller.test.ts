import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  createPaymentHandler,
  updatePaymentHandler,
  deletePaymentHandler,
} from '../../src/controllers/debtPayment.controller.js';
import * as debtPaymentService from '../../src/services/debtPayment.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/debtPayment.service.js', () => ({
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  softDeletePayment: vi.fn(),
}));

describe.skip('DebtPayment Controller', () => {
  let req: Partial<Request> & { accountId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockPayment = {
    id: 'payment-123',
    customerId: 'cust-456',
    date: new Date('2026-06-01'),
    amount: 500,
    note: 'Payment received',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentResult = {
    payment: mockPayment,
    newBalance: 500,
  };

  beforeEach(() => {
    req = {
      accountId: 'acc-123',
      body: {},
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('createPaymentHandler', () => {
    it('should create payment and return 201 with new balance', async () => {
      req.params = { id: 'cust-456' };
      req.body = {
        date: '2026-06-01',
        amount: 500,
        note: 'Payment received',
      };
      (debtPaymentService.createPayment as Mock).mockResolvedValue(mockPaymentResult);

      await createPaymentHandler(req as Request, res as Response, next);

      expect(debtPaymentService.createPayment).toHaveBeenCalledWith(
        'acc-123',
        'cust-456',
        expect.any(Date),
        500,
        'Payment received',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Payment recorded',
          data: mockPaymentResult,
        }),
      );
    });

    it('should create payment without note', async () => {
      req.params = { id: 'cust-456' };
      req.body = {
        date: '2026-06-01',
        amount: 500,
      };
      (debtPaymentService.createPayment as Mock).mockResolvedValue(mockPaymentResult);

      await createPaymentHandler(req as Request, res as Response, next);

      expect(debtPaymentService.createPayment).toHaveBeenCalledWith(
        'acc-123',
        'cust-456',
        expect.any(Date),
        500,
        undefined,
      );
    });

    it('should pass 400 overpayment error to next', async () => {
      const error = new ApiError(400, 'Payment cannot exceed the amount owed');
      (debtPaymentService.createPayment as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-456' };
      req.body = { date: '2026-06-01', amount: 500 };

      await createPaymentHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should pass 404 customer not found error to next', async () => {
      const error = new ApiError(404, 'Debt customer not found');
      (debtPaymentService.createPayment as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-456' };
      req.body = { date: '2026-06-01', amount: 500 };

      await createPaymentHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePaymentHandler', () => {
    it('should update payment and return 200', async () => {
      req.params = { id: 'payment-123' };
      req.body = { amount: 300, note: 'Updated note' };
      (debtPaymentService.updatePayment as Mock).mockResolvedValue({
        ...mockPayment,
        amount: 300,
        note: 'Updated note',
      });

      await updatePaymentHandler(req as Request, res as Response, next);

      expect(debtPaymentService.updatePayment).toHaveBeenCalledWith('acc-123', 'payment-123', {
        amount: 300,
        note: 'Updated note',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Payment updated',
        }),
      );
    });

    it('should pass 400 overpayment error to next', async () => {
      const error = new ApiError(400, 'Payment cannot exceed the amount owed');
      (debtPaymentService.updatePayment as Mock).mockRejectedValue(error);
      req.params = { id: 'payment-123' };
      req.body = { amount: 300 };

      await updatePaymentHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should pass 404 payment not found error to next', async () => {
      const error = new ApiError(404, 'Payment not found');
      (debtPaymentService.updatePayment as Mock).mockRejectedValue(error);
      req.params = { id: 'payment-123' };
      req.body = { amount: 300 };

      await updatePaymentHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePaymentHandler', () => {
    it('should soft-delete payment and return 200', async () => {
      req.params = { id: 'payment-123' };
      (debtPaymentService.softDeletePayment as Mock).mockResolvedValue(undefined);

      await deletePaymentHandler(req as Request, res as Response, next);

      expect(debtPaymentService.softDeletePayment).toHaveBeenCalledWith('acc-123', 'payment-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Payment deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Payment not found');
      (debtPaymentService.softDeletePayment as Mock).mockRejectedValue(error);
      req.params = { id: 'payment-123' };

      await deletePaymentHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
