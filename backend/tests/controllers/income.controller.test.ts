import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listIncomeHandler,
  createIncomeHandler,
  updateIncomeHandler,
  deleteIncomeHandler,
} from '../../src/controllers/income.controller.js';
import * as incomeService from '../../src/services/income.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/income.service.js', () => ({
  listIncome: vi.fn(),
  createIncome: vi.fn(),
  updateIncome: vi.fn(),
  softDeleteIncome: vi.fn(),
}));

describe('Income Controller', () => {
  let req: Partial<Request> & { accountId?: string; query?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockIncome = {
    id: 'inc-123',
    accountId: 'acc-123',
    date: new Date('2026-06-01'),
    amount: 1500.5,
    note: 'Daily sales',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    req = {
      accountId: 'acc-123',
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('listIncomeHandler', () => {
    it('should return list of income entries with 200', async () => {
      req.query = { from: '2026-01-01', to: '2026-12-31' };
      (incomeService.listIncome as Mock).mockResolvedValue([mockIncome]);

      await listIncomeHandler(req as Request, res as Response, next);

      expect(incomeService.listIncome).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Income entries fetched',
          data: [mockIncome],
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (incomeService.listIncome as Mock).mockRejectedValue(error);
      req.query = { from: '2026-01-01', to: '2026-12-31' };

      await listIncomeHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createIncomeHandler', () => {
    it('should create income and return 201', async () => {
      req.body = {
        date: '2026-06-01',
        amount: 1500.5,
        note: 'Daily sales',
      };
      (incomeService.createIncome as Mock).mockResolvedValue(mockIncome);

      await createIncomeHandler(req as Request, res as Response, next);

      expect(incomeService.createIncome).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        1500.5,
        'Daily sales',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Income recorded',
          data: mockIncome,
        }),
      );
    });

    it('should create income without note', async () => {
      req.body = {
        date: '2026-06-01',
        amount: 1500.5,
      };
      (incomeService.createIncome as Mock).mockResolvedValue(mockIncome);

      await createIncomeHandler(req as Request, res as Response, next);

      expect(incomeService.createIncome).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        1500.5,
        undefined,
      );
    });

    it('should pass 409 conflict error to next', async () => {
      const error = new ApiError(409, 'Income already recorded for this date');
      (incomeService.createIncome as Mock).mockRejectedValue(error);
      req.body = { date: '2026-06-01', amount: 1500.5 };

      await createIncomeHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateIncomeHandler', () => {
    it('should update income and return 200', async () => {
      req.params = { id: 'inc-123' };
      req.body = { amount: 2000, note: 'Updated' };
      (incomeService.updateIncome as Mock).mockResolvedValue({
        ...mockIncome,
        amount: 2000,
        note: 'Updated',
      });

      await updateIncomeHandler(req as Request, res as Response, next);

      expect(incomeService.updateIncome).toHaveBeenCalledWith('acc-123', 'inc-123', {
        amount: 2000,
        note: 'Updated',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Income updated',
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Income entry not found');
      (incomeService.updateIncome as Mock).mockRejectedValue(error);
      req.params = { id: 'inc-123' };
      req.body = { amount: 2000 };

      await updateIncomeHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteIncomeHandler', () => {
    it('should soft-delete income and return 200', async () => {
      req.params = { id: 'inc-123' };
      (incomeService.softDeleteIncome as Mock).mockResolvedValue(undefined);

      await deleteIncomeHandler(req as Request, res as Response, next);

      expect(incomeService.softDeleteIncome).toHaveBeenCalledWith('acc-123', 'inc-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Income entry deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Income entry not found');
      (incomeService.softDeleteIncome as Mock).mockRejectedValue(error);
      req.params = { id: 'inc-123' };

      await deleteIncomeHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
