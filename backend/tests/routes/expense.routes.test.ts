import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import expenseRoutes from '../../src/routes/expense.routes.js';
import * as expenseController from '../../src/controllers/expense.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/expense.controller.js', () => ({
  listExpensesHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Expenses fetched',
      data: [],
    }),
  ),
  createExpenseHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Expense recorded',
      data: { id: 'exp-123', categoryId: 'cat-456', date: '2026-06-01', amount: 1500, note: null },
    }),
  ),
  updateExpenseHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Expense updated',
      data: {
        id: 'exp-123',
        categoryId: 'cat-456',
        date: '2026-06-01',
        amount: 2000,
        note: 'Updated',
      },
    }),
  ),
  deleteExpenseHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Expense entry deleted',
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

describe('Expense Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/expenses', expenseRoutes);
    vi.clearAllMocks();
  });

  it('GET /expenses should call listExpensesHandler and return 200', async () => {
    const response = await request(app)
      .get('/expenses?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Expenses fetched',
    });
    expect(expenseController.listExpensesHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('GET /expenses should accept categoryId filter', async () => {
    await request(app)
      .get('/expenses?from=2026-01-01&to=2026-12-31&categoryId=cat-456')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(expenseController.listExpensesHandler).toHaveBeenCalled();
  });

  it('POST /expenses should call createExpenseHandler and return 201', async () => {
    const response = await request(app)
      .post('/expenses')
      .send({ date: '2026-06-01', categoryId: 'cat-456', amount: 1500.5, note: 'Daily expense' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Expense recorded',
    });
    expect(expenseController.createExpenseHandler).toHaveBeenCalled();
  });

  it('PATCH /expenses/:id should call updateExpenseHandler and return 200', async () => {
    const response = await request(app)
      .patch('/expenses/exp-123')
      .send({ amount: 2000, note: 'Updated' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Expense updated',
    });
    expect(expenseController.updateExpenseHandler).toHaveBeenCalled();
  });

  it('DELETE /expenses/:id should call deleteExpenseHandler and return 200', async () => {
    const response = await request(app)
      .delete('/expenses/exp-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Expense entry deleted',
      data: null,
    });
    expect(expenseController.deleteExpenseHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown expense route', async () => {
    await request(app).get('/expenses/unknown').set('Cookie', ['access_token=valid']).expect(404);
  });
});
