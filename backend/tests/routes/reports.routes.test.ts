import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import reportsRoutes from '../../src/routes/reports.routes.js';
import * as reportsController from '../../src/controllers/reports.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/reports.controller.js', () => ({
  getSummaryHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Report summary fetched',
      data: {
        totalIncome: 10000,
        totalBusinessExpenses: 4000,
        totalPersonalDraws: 2000,
        totalFundingIn: 5000,
        totalFundingOut: 1000,
        totalOwedByCustomers: 3500,
      },
    }),
  ),
  getDebtsPeriodHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Debt period report fetched',
      data: { totalNewlyBorrowed: 3000, totalRepaidInPeriod: 1200 },
    }),
  ),
  getExpenseBreakdownHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Expense breakdown fetched',
      data: [],
    }),
  ),
  exportReportHandler: vi.fn((req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    res.status(200).send('csv,data');
  }),
}));

vi.mock('../../src/middlewares/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => {
    req.accountId = 'acc-123';
    next();
  }),
}));

vi.mock('../../src/middlewares/validate.middleware.js', () => ({
  default: () => (req: any, res: any, next: any) => next(),
}));

describe('Reports Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/reports', reportsRoutes);
    vi.clearAllMocks();
  });

  it('GET /reports/summary should call getSummaryHandler and return 200', async () => {
    const response = await request(app)
      .get('/reports/summary?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Report summary fetched',
    });
    expect(reportsController.getSummaryHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('GET /reports/debts-period should call getDebtsPeriodHandler and return 200', async () => {
    const response = await request(app)
      .get('/reports/debts-period?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Debt period report fetched',
    });
    expect(reportsController.getDebtsPeriodHandler).toHaveBeenCalled();
  });

  it('GET /reports/expenses-breakdown should call getExpenseBreakdownHandler and return 200', async () => {
    const response = await request(app)
      .get('/reports/expenses-breakdown?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Expense breakdown fetched',
    });
    expect(reportsController.getExpenseBreakdownHandler).toHaveBeenCalled();
  });

  it('GET /reports/export should call exportReportHandler and return CSV', async () => {
    const response = await request(app)
      .get('/reports/export?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.text).toBe('csv,data');
    expect(reportsController.exportReportHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown reports route', async () => {
    await request(app)
      .get('/reports/unknown?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(404);
  });
});
