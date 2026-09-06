import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import debtPaymentRoutes from '../../src/routes/debtPayment.routes.js';
import * as debtPaymentController from '../../src/controllers/debtPayment.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/debtPayment.controller.js', () => ({
  updatePaymentHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Payment updated',
      data: { id: 'payment-123' },
    }),
  ),
  deletePaymentHandler: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Payment deleted', data: null }),
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

describe('DebtPayment Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/debt-payments', debtPaymentRoutes);
    vi.clearAllMocks();
  });

  it('PATCH /debt-payments/:id should call updatePaymentHandler and return 200', async () => {
    const response = await request(app)
      .patch('/debt-payments/payment-123')
      .send({ amount: 300, note: 'Updated note' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Payment updated',
    });
    expect(debtPaymentController.updatePaymentHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('DELETE /debt-payments/:id should call deletePaymentHandler and return 200', async () => {
    const response = await request(app)
      .delete('/debt-payments/payment-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Payment deleted',
      data: null,
    });
    expect(debtPaymentController.deletePaymentHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown debt-payment route', async () => {
    await request(app)
      .get('/debt-payments/unknown')
      .set('Cookie', ['access_token=valid'])
      .expect(404);
  });
});
