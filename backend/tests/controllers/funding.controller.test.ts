import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listFundingHandler,
  createFundingHandler,
  updateFundingHandler,
  deleteFundingHandler,
  getOutstandingHandler,
} from '../../src/controllers/funding.controller.js';
import * as fundingService from '../../src/services/funding.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/funding.service.js', () => ({
  listFunding: vi.fn(),
  createFunding: vi.fn(),
  updateFunding: vi.fn(),
  softDeleteFunding: vi.fn(),
  calculateOutstanding: vi.fn(),
}));

describe('Funding Controller', () => {
  let req: Partial<Request> & { accountId?: string; query?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockFunding = {
    id: 'fun-123',
    accountId: 'acc-123',
    type: 'salary_injection' as const,
    date: new Date('2026-06-01'),
    amount: 5000,
    note: 'Monthly salary',
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

  describe('listFundingHandler', () => {
    it('should return list of funding entries with 200', async () => {
      req.query = { from: '2026-01-01', to: '2026-12-31' };
      (fundingService.listFunding as Mock).mockResolvedValue([mockFunding]);

      await listFundingHandler(req as Request, res as Response, next);

      expect(fundingService.listFunding).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Funding entries fetched',
          data: [mockFunding],
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (fundingService.listFunding as Mock).mockRejectedValue(error);
      req.query = { from: '2026-01-01', to: '2026-12-31' };

      await listFundingHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createFundingHandler', () => {
    it('should create funding and return 201', async () => {
      req.body = {
        date: '2026-06-01',
        type: 'salary_injection',
        amount: 5000,
        note: 'Monthly salary',
      };
      (fundingService.createFunding as Mock).mockResolvedValue(mockFunding);

      await createFundingHandler(req as Request, res as Response, next);

      expect(fundingService.createFunding).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        'salary_injection',
        5000,
        'Monthly salary',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Funding entry recorded',
          data: mockFunding,
        }),
      );
    });

    it('should create funding without note', async () => {
      req.body = {
        date: '2026-06-01',
        type: 'salary_injection',
        amount: 5000,
      };
      (fundingService.createFunding as Mock).mockResolvedValue(mockFunding);

      await createFundingHandler(req as Request, res as Response, next);

      expect(fundingService.createFunding).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        'salary_injection',
        5000,
        undefined,
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (fundingService.createFunding as Mock).mockRejectedValue(error);
      req.body = { date: '2026-06-01', type: 'salary_injection', amount: 5000 };

      await createFundingHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateFundingHandler', () => {
    it('should update funding and return 200', async () => {
      req.params = { id: 'fun-123' };
      req.body = { amount: 6000, note: 'Updated' };
      (fundingService.updateFunding as Mock).mockResolvedValue({
        ...mockFunding,
        amount: 6000,
        note: 'Updated',
      });

      await updateFundingHandler(req as Request, res as Response, next);

      expect(fundingService.updateFunding).toHaveBeenCalledWith('acc-123', 'fun-123', {
        amount: 6000,
        note: 'Updated',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Funding entry updated',
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Funding entry not found');
      (fundingService.updateFunding as Mock).mockRejectedValue(error);
      req.params = { id: 'fun-123' };
      req.body = { amount: 6000 };

      await updateFundingHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteFundingHandler', () => {
    it('should soft-delete funding and return 200', async () => {
      req.params = { id: 'fun-123' };
      (fundingService.softDeleteFunding as Mock).mockResolvedValue(undefined);

      await deleteFundingHandler(req as Request, res as Response, next);

      expect(fundingService.softDeleteFunding).toHaveBeenCalledWith('acc-123', 'fun-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Funding entry deleted',
          data: null,
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Funding entry not found');
      (fundingService.softDeleteFunding as Mock).mockRejectedValue(error);
      req.params = { id: 'fun-123' };

      await deleteFundingHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOutstandingHandler', () => {
    it('should return outstanding amount with 200', async () => {
      (fundingService.calculateOutstanding as Mock).mockResolvedValue(7000);

      await getOutstandingHandler(req as Request, res as Response, next);

      expect(fundingService.calculateOutstanding).toHaveBeenCalledWith('acc-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Outstanding borrowed capital fetched',
          data: { outstandingAmount: 7000 },
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (fundingService.calculateOutstanding as Mock).mockRejectedValue(error);

      await getOutstandingHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
