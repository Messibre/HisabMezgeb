import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listCustomersHandler,
  createCustomerHandler,
  getCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
} from '../../src/controllers/debtCustomer.controller.js';
import * as debtCustomerService from '../../src/services/debtCustomer.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/debtCustomer.service.js', () => ({
  listCustomersWithBalance: vi.fn(),
  createCustomer: vi.fn(),
  getCustomerWithHistory: vi.fn(),
  updateCustomer: vi.fn(),
  softDeleteCustomer: vi.fn(),
}));

describe.skip('DebtCustomer Controller', () => {
  let req: Partial<Request> & { accountId?: string; query?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockCustomer = {
    id: 'cust-123',
    name: 'John Doe',
    note: 'Phone: 0911223344',
    balance: 700,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomerDetail = {
    id: 'cust-123',
    name: 'John Doe',
    note: 'Phone: 0911223344',
    balance: 700,
    history: [
      {
        id: 'borrow-1',
        kind: 'borrow' as const,
        date: new Date('2026-06-01'),
        amount: 1000,
        itemsDescription: 'Items purchased',
      },
      {
        id: 'payment-1',
        kind: 'payment' as const,
        date: new Date('2026-06-10'),
        amount: 300,
        itemsDescription: null,
      },
    ],
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

  describe('listCustomersHandler', () => {
    it('should return list of customers with 200', async () => {
      (debtCustomerService.listCustomersWithBalance as Mock).mockResolvedValue([mockCustomer]);

      await listCustomersHandler(req as Request, res as Response, next);

      expect(debtCustomerService.listCustomersWithBalance).toHaveBeenCalledWith(
        'acc-123',
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Debt customers fetched',
          data: [mockCustomer],
        }),
      );
    });

    it('should pass search query to service', async () => {
      req.query = { search: 'John' };
      (debtCustomerService.listCustomersWithBalance as Mock).mockResolvedValue([mockCustomer]);

      await listCustomersHandler(req as Request, res as Response, next);

      expect(debtCustomerService.listCustomersWithBalance).toHaveBeenCalledWith('acc-123', 'John');
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (debtCustomerService.listCustomersWithBalance as Mock).mockRejectedValue(error);

      await listCustomersHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createCustomerHandler', () => {
    it('should create customer and return 201', async () => {
      req.body = { name: 'John Doe', note: 'Phone: 0911223344' };
      (debtCustomerService.createCustomer as Mock).mockResolvedValue(mockCustomer);

      await createCustomerHandler(req as Request, res as Response, next);

      expect(debtCustomerService.createCustomer).toHaveBeenCalledWith('acc-123', {
        name: 'John Doe',
        note: 'Phone: 0911223344',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Debt customer created',
          data: mockCustomer,
        }),
      );
    });

    it('should create customer without note', async () => {
      req.body = { name: 'Jane Smith' };
      (debtCustomerService.createCustomer as Mock).mockResolvedValue({
        ...mockCustomer,
        note: null,
      });

      await createCustomerHandler(req as Request, res as Response, next);

      expect(debtCustomerService.createCustomer).toHaveBeenCalledWith('acc-123', {
        name: 'Jane Smith',
        note: undefined,
      });
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (debtCustomerService.createCustomer as Mock).mockRejectedValue(error);
      req.body = { name: 'John Doe' };

      await createCustomerHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCustomerHandler', () => {
    it('should return customer detail with 200', async () => {
      req.params = { id: 'cust-123' };
      (debtCustomerService.getCustomerWithHistory as Mock).mockResolvedValue(mockCustomerDetail);

      await getCustomerHandler(req as Request, res as Response, next);

      expect(debtCustomerService.getCustomerWithHistory).toHaveBeenCalledWith(
        'acc-123',
        'cust-123',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Debt customer fetched',
          data: mockCustomerDetail,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Debt customer not found');
      (debtCustomerService.getCustomerWithHistory as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-123' };

      await getCustomerHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCustomerHandler', () => {
    it('should update customer and return 200', async () => {
      req.params = { id: 'cust-123' };
      req.body = { name: 'Updated Name', note: 'Updated note' };
      (debtCustomerService.updateCustomer as Mock).mockResolvedValue({
        ...mockCustomer,
        name: 'Updated Name',
        note: 'Updated note',
      });

      await updateCustomerHandler(req as Request, res as Response, next);

      expect(debtCustomerService.updateCustomer).toHaveBeenCalledWith('acc-123', 'cust-123', {
        name: 'Updated Name',
        note: 'Updated note',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Debt customer updated',
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Debt customer not found');
      (debtCustomerService.updateCustomer as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-123' };
      req.body = { name: 'New Name' };

      await updateCustomerHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCustomerHandler', () => {
    it('should soft-delete customer and return 200', async () => {
      req.params = { id: 'cust-123' };
      (debtCustomerService.softDeleteCustomer as Mock).mockResolvedValue(undefined);

      await deleteCustomerHandler(req as Request, res as Response, next);

      expect(debtCustomerService.softDeleteCustomer).toHaveBeenCalledWith('acc-123', 'cust-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Debt customer deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Debt customer not found');
      (debtCustomerService.softDeleteCustomer as Mock).mockRejectedValue(error);
      req.params = { id: 'cust-123' };

      await deleteCustomerHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
