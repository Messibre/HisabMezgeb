import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import debtCustomerRoutes from '../../src/routes/debtCustomer.routes.js';
import * as debtCustomerController from '../../src/controllers/debtCustomer.controller.js';
import * as debtBorrowRecordController from '../../src/controllers/debtBorrowRecord.controller.js';
import * as debtPaymentController from '../../src/controllers/debtPayment.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/debtCustomer.controller.js', () => ({
  listCustomersHandler: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Debt customers fetched', data: [] }),
  ),
  createCustomerHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Debt customer created',
      data: { id: 'cust-123' },
    }),
  ),
  getCustomerHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Debt customer fetched',
      data: { id: 'cust-123' },
    }),
  ),
  updateCustomerHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Debt customer updated',
      data: { id: 'cust-123' },
    }),
  ),
  deleteCustomerHandler: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Debt customer deleted', data: null }),
  ),
}));

vi.mock('../../src/controllers/debtBorrowRecord.controller.js', () => ({
  createBorrowRecordHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Borrow record added',
      data: { id: 'borrow-123' },
    }),
  ),
}));

vi.mock('../../src/controllers/debtPayment.controller.js', () => ({
  createPaymentHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Payment recorded',
      data: { payment: { id: 'payment-123' }, newBalance: 500 },
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

describe('DebtCustomer Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/debt-customers', debtCustomerRoutes);
    vi.clearAllMocks();
  });

  it('GET /debt-customers should call listCustomersHandler and return 200', async () => {
    const response = await request(app)
      .get('/debt-customers')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Debt customers fetched',
    });
    expect(debtCustomerController.listCustomersHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('GET /debt-customers with search query should call listCustomersHandler', async () => {
    await request(app)
      .get('/debt-customers?search=John')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(debtCustomerController.listCustomersHandler).toHaveBeenCalled();
  });

  it('POST /debt-customers should call createCustomerHandler and return 201', async () => {
    const response = await request(app)
      .post('/debt-customers')
      .send({ name: 'John Doe', note: 'Phone: 0911223344' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Debt customer created',
    });
    expect(debtCustomerController.createCustomerHandler).toHaveBeenCalled();
  });

  it('GET /debt-customers/:id should call getCustomerHandler and return 200', async () => {
    await request(app)
      .get('/debt-customers/cust-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(debtCustomerController.getCustomerHandler).toHaveBeenCalled();
  });

  it('PATCH /debt-customers/:id should call updateCustomerHandler and return 200', async () => {
    await request(app)
      .patch('/debt-customers/cust-123')
      .send({ name: 'Updated Name' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(debtCustomerController.updateCustomerHandler).toHaveBeenCalled();
  });

  it('DELETE /debt-customers/:id should call deleteCustomerHandler and return 200', async () => {
    await request(app)
      .delete('/debt-customers/cust-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(debtCustomerController.deleteCustomerHandler).toHaveBeenCalled();
  });

  // ── Nested Routes ──

  it('POST /debt-customers/:id/borrow-records should call createBorrowRecordHandler and return 201', async () => {
    const response = await request(app)
      .post('/debt-customers/cust-123/borrow-records')
      .send({ date: '2026-06-01', amount: 1000, itemsDescription: 'Items purchased' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Borrow record added',
    });
    expect(debtBorrowRecordController.createBorrowRecordHandler).toHaveBeenCalled();
  });

  it('POST /debt-customers/:id/payments should call createPaymentHandler and return 201', async () => {
    const response = await request(app)
      .post('/debt-customers/cust-123/payments')
      .send({ date: '2026-06-01', amount: 500 })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Payment recorded',
    });
    expect(debtPaymentController.createPaymentHandler).toHaveBeenCalled();
  });

  // ── 404 test ──
  it('should return 404 for unknown debt-customer route (path not matching any route)', async () => {
    // Use a path that does not match any defined route.
    await request(app)
      .get('/debt-customers/unknown/extra')
      .set('Cookie', ['access_token=valid'])
      .expect(404);
  });
});
