import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  createBorrowRecordHandler,
  updateBorrowRecordHandler,
  deleteBorrowRecordHandler,
} from '../../src/controllers/debtBorrowRecord.controller.js';
import * as debtBorrowRecordService from '../../src/services/debtBorrowRecord.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/debtBorrowRecord.service.js', () => ({
  createBorrowRecord: vi.fn(),
  updateBorrowRecord: vi.fn(),
  softDeleteBorrowRecord: vi.fn(),
}));

describe.skip('DebtBorrowRecord Controller', () => {
  let req: Partial<Request> & { accountId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockBorrowRecord = {
    id: 'borrow-123',
    customerId: 'cust-456',
    date: new Date('2026-06-01'),
    amount: 1000,
    itemsDescription: 'Items purchased',
    note: 'First borrow',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  describe('createBorrowRecordHandler', () => {
    it('should create borrow record and return 201', async () => {
      req.params = { id: 'cust-456' };
      req.body = {
        date: '2026-06-01',
        amount: 1000,
        itemsDescription: 'Items purchased',
        note: 'First borrow',
      };
      (debtBorrowRecordService.createBorrowRecord as Mock).mockResolvedValue(mockBorrowRecord);

      await createBorrowRecordHandler(req as Request, res as Response, next);

      expect(debtBorrowRecordService.createBorrowRecord).toHaveBeenCalledWith(
        'acc-123',
        'cust-456',
        expect.any(Date),
        1000,
        'Items purchased',
        'First borrow',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Borrow record added',
          data: mockBorrowRecord,
        }),
      );
    });

    it('should create borrow record without note', async () => {
      req.params = { id: 'cust-456' };
      req.body = {
        date: '2026-06-01',
        amount: 1000,
        itemsDescription: 'Items purchased',
      };
      (debtBorrowRecordService.createBorrowRecord as Mock).mockResolvedValue(mockBorrowRecord);

      await createBorrowRecordHandler(req as Request, res as Response, next);

      expect(debtBorrowRecordService.createBorrowRecord).toHaveBeenCalledWith(
        'acc-123',
        'cust-456',
        expect.any(Date),
        1000,
        'Items purchased',
        undefined,
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Debt customer not found');
      (debtBorrowRecordService.createBorrowRecord as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-456' };
      req.body = { date: '2026-06-01', amount: 1000, itemsDescription: 'Items' };

      await createBorrowRecordHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBorrowRecordHandler', () => {
    it('should update borrow record and return 200', async () => {
      req.params = { id: 'borrow-123' };
      req.body = { amount: 1500, itemsDescription: 'Updated items', note: 'Updated note' };
      (debtBorrowRecordService.updateBorrowRecord as Mock).mockResolvedValue({
        ...mockBorrowRecord,
        amount: 1500,
        itemsDescription: 'Updated items',
        note: 'Updated note',
      });

      await updateBorrowRecordHandler(req as Request, res as Response, next);

      expect(debtBorrowRecordService.updateBorrowRecord).toHaveBeenCalledWith(
        'acc-123',
        'borrow-123',
        {
          amount: 1500,
          itemsDescription: 'Updated items',
          note: 'Updated note',
        },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Borrow record updated',
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Borrow record not found');
      (debtBorrowRecordService.updateBorrowRecord as Mock).mockRejectedValue(error);
      req.params = { id: 'borrow-123' };
      req.body = { amount: 1500 };

      await updateBorrowRecordHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBorrowRecordHandler', () => {
    it('should soft-delete borrow record and return 200', async () => {
      req.params = { id: 'borrow-123' };
      (debtBorrowRecordService.softDeleteBorrowRecord as Mock).mockResolvedValue(undefined);

      await deleteBorrowRecordHandler(req as Request, res as Response, next);

      expect(debtBorrowRecordService.softDeleteBorrowRecord).toHaveBeenCalledWith(
        'acc-123',
        'borrow-123',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Borrow record deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Borrow record not found');
      (debtBorrowRecordService.softDeleteBorrowRecord as Mock).mockRejectedValue(error);
      req.params = { id: 'borrow-123' };

      await deleteBorrowRecordHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
