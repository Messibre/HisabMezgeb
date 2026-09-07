import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listExpensesHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
} from '../../src/controllers/expense.controller.js';
import * as expenseService from '../../src/services/expense.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/expense.service.js', () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  softDeleteExpense: vi.fn(),
}));

describe('Expense Controller', () => {
  let req: Partial<Request> & { accountId?: string; query?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockExpense = {
    id: 'exp-123',
    accountId: 'acc-123',
    categoryId: 'cat-456',
    categoryName: 'Cost of Goods',
    date: new Date('2026-06-01'),
    amount: 1500.5,
    note: 'Daily expense',
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

  describe('listExpensesHandler', () => {
    it('should return list of expenses with 200', async () => {
      req.query = { from: '2026-01-01', to: '2026-12-31' };
      (expenseService.listExpenses as Mock).mockResolvedValue([mockExpense]);

      await listExpensesHandler(req as Request, res as Response, next);

      expect(expenseService.listExpenses).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Expenses fetched',
          data: [mockExpense],
        }),
      );
    });

    it('should pass categoryId filter to service when provided', async () => {
      req.query = { from: '2026-01-01', to: '2026-12-31', categoryId: 'cat-456' };
      (expenseService.listExpenses as Mock).mockResolvedValue([mockExpense]);

      await listExpensesHandler(req as Request, res as Response, next);

      expect(expenseService.listExpenses).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
        'cat-456',
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (expenseService.listExpenses as Mock).mockRejectedValue(error);
      req.query = { from: '2026-01-01', to: '2026-12-31' };

      await listExpensesHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createExpenseHandler', () => {
    it('should create expense and return 201', async () => {
      req.body = {
        date: '2026-06-01',
        categoryId: 'cat-456',
        amount: 1500.5,
        note: 'Daily expense',
      };
      (expenseService.createExpense as Mock).mockResolvedValue(mockExpense);

      await createExpenseHandler(req as Request, res as Response, next);

      expect(expenseService.createExpense).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        'cat-456',
        1500.5,
        'Daily expense',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Expense recorded',
          data: mockExpense,
        }),
      );
    });

    it('should create expense without note', async () => {
      req.body = {
        date: '2026-06-01',
        categoryId: 'cat-456',
        amount: 1500.5,
      };
      (expenseService.createExpense as Mock).mockResolvedValue(mockExpense);

      await createExpenseHandler(req as Request, res as Response, next);

      expect(expenseService.createExpense).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        'cat-456',
        1500.5,
        undefined,
      );
    });

    it('should pass 404 category error to next', async () => {
      const error = new ApiError(404, 'Category not found');
      (expenseService.createExpense as Mock).mockRejectedValue(error);
      req.body = { date: '2026-06-01', categoryId: 'cat-456', amount: 1500 };

      await createExpenseHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should pass 409 duplicate error to next', async () => {
      const error = new ApiError(409, 'Expense already recorded for this category and date');
      (expenseService.createExpense as Mock).mockRejectedValue(error);
      req.body = { date: '2026-06-01', categoryId: 'cat-456', amount: 1500 };

      await createExpenseHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateExpenseHandler', () => {
    it('should update expense and return 200', async () => {
      req.params = { id: 'exp-123' };
      req.body = { amount: 2000, note: 'Updated' };
      (expenseService.updateExpense as Mock).mockResolvedValue({
        ...mockExpense,
        amount: 2000,
        note: 'Updated',
      });

      await updateExpenseHandler(req as Request, res as Response, next);

      expect(expenseService.updateExpense).toHaveBeenCalledWith('acc-123', 'exp-123', {
        amount: 2000,
        note: 'Updated',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Expense updated',
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Expense entry not found');
      (expenseService.updateExpense as Mock).mockRejectedValue(error);
      req.params = { id: 'exp-123' };
      req.body = { amount: 2000 };

      await updateExpenseHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteExpenseHandler', () => {
    it('should soft-delete expense and return 200', async () => {
      req.params = { id: 'exp-123' };
      (expenseService.softDeleteExpense as Mock).mockResolvedValue(undefined);

      await deleteExpenseHandler(req as Request, res as Response, next);

      expect(expenseService.softDeleteExpense).toHaveBeenCalledWith('acc-123', 'exp-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Expense entry deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Expense entry not found');
      (expenseService.softDeleteExpense as Mock).mockRejectedValue(error);
      req.params = { id: 'exp-123' };

      await deleteExpenseHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
