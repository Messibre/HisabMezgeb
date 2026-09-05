import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import incomeRoutes from '../../src/routes/income.routes.js';
import * as incomeController from '../../src/controllers/income.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/income.controller.js', () => ({
  listIncomeHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Income entries fetched',
      data: [],
    }),
  ),
  createIncomeHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Income recorded',
      data: { id: 'inc-123', date: '2026-06-01', amount: 1500, note: null },
    }),
  ),
  updateIncomeHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Income updated',
      data: { id: 'inc-123', date: '2026-06-01', amount: 2000, note: 'Updated' },
    }),
  ),
  deleteIncomeHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Income entry deleted',
      data: null,
    }),
  ),
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

describe('Income Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/income', incomeRoutes);
    vi.clearAllMocks();
  });

  it('GET /income should call listIncomeHandler and return 200', async () => {
    const response = await request(app)
      .get('/income?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Income entries fetched',
    });
    expect(incomeController.listIncomeHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('POST /income should call createIncomeHandler and return 201', async () => {
    const response = await request(app)
      .post('/income')
      .send({ date: '2026-06-01', amount: 1500.5, note: 'Daily sales' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Income recorded',
    });
    expect(incomeController.createIncomeHandler).toHaveBeenCalled();
  });

  it('PATCH /income/:id should call updateIncomeHandler and return 200', async () => {
    const response = await request(app)
      .patch('/income/inc-123')
      .send({ amount: 2000, note: 'Updated' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Income updated',
    });
    expect(incomeController.updateIncomeHandler).toHaveBeenCalled();
  });

  it('DELETE /income/:id should call deleteIncomeHandler and return 200', async () => {
    const response = await request(app)
      .delete('/income/inc-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Income entry deleted',
      data: null,
    });
    expect(incomeController.deleteIncomeHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown income route', async () => {
    await request(app).get('/income/unknown').set('Cookie', ['access_token=valid']).expect(404);
  });
});
