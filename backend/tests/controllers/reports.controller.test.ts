import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  getSummaryHandler,
  getDebtsPeriodHandler,
  getExpenseBreakdownHandler,
  exportReportHandler,
} from '../../src/controllers/reports.controller.js';
import * as reportsService from '../../src/services/reports.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/reports.service.js', () => ({
  buildSummary: vi.fn(),
  buildDebtsPeriodReport: vi.fn(),
  buildExpenseBreakdown: vi.fn(),
  generateCsvExport: vi.fn(),
}));

describe('Reports Controller', () => {
  let req: Partial<Request> & { accountId?: string; query?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockSummary = {
    totalIncome: 10000,
    totalBusinessExpenses: 4000,
    totalPersonalDraws: 2000,
    totalFundingIn: 5000,
    totalFundingOut: 1000,
    totalOwedByCustomers: 3500,
  };

  const mockDebtsPeriod = {
    totalNewlyBorrowed: 3000,
    totalRepaidInPeriod: 1200,
  };

  const mockBreakdown = [
    { categoryId: 'cat-1', categoryName: 'Cost of Goods', group: 'business', total: 1000 },
    { categoryId: 'cat-2', categoryName: 'Equb', group: 'business', total: 500 },
  ];

  const mockCsv =
    'Period,Income,Business Expenses,Personal Draws,Funding In,Funding Out,Total Owed\n2026-01-01 to 2026-12-31,10000,4000,2000,5000,1000,3500';

  beforeEach(() => {
    req = {
      accountId: 'acc-123',
      query: {
        from: '2026-01-01',
        to: '2026-12-31',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('getSummaryHandler', () => {
    it('should return summary with 200', async () => {
      (reportsService.buildSummary as Mock).mockResolvedValue(mockSummary);

      await getSummaryHandler(req as Request, res as Response, next);

      expect(reportsService.buildSummary).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Report summary fetched',
          data: mockSummary,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (reportsService.buildSummary as Mock).mockRejectedValue(error);

      await getSummaryHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getDebtsPeriodHandler', () => {
    it('should return debts period report with 200', async () => {
      (reportsService.buildDebtsPeriodReport as Mock).mockResolvedValue(mockDebtsPeriod);

      await getDebtsPeriodHandler(req as Request, res as Response, next);

      expect(reportsService.buildDebtsPeriodReport).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Debt period report fetched',
          data: mockDebtsPeriod,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (reportsService.buildDebtsPeriodReport as Mock).mockRejectedValue(error);

      await getDebtsPeriodHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getExpenseBreakdownHandler', () => {
    it('should return expense breakdown with 200', async () => {
      (reportsService.buildExpenseBreakdown as Mock).mockResolvedValue(mockBreakdown);

      await getExpenseBreakdownHandler(req as Request, res as Response, next);

      expect(reportsService.buildExpenseBreakdown).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Expense breakdown fetched',
          data: mockBreakdown,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (reportsService.buildExpenseBreakdown as Mock).mockRejectedValue(error);

      await getExpenseBreakdownHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('exportReportHandler', () => {
    it('should return CSV file with correct headers and 200', async () => {
      (reportsService.generateCsvExport as Mock).mockResolvedValue(mockCsv);

      await exportReportHandler(req as Request, res as Response, next);

      expect(reportsService.generateCsvExport).toHaveBeenCalledWith(
        'acc-123',
        expect.any(Date),
        expect.any(Date),
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=report-2026-01-01-to-2026-12-31.csv',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockCsv);
    });

    it('should pass errors to next', async () => {
      const error = new Error('CSV generation error');
      (reportsService.generateCsvExport as Mock).mockRejectedValue(error);

      await exportReportHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
