import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import debtBorrowRecordRoutes from '../../src/routes/debtBorrowRecord.routes.js';
import * as debtBorrowRecordController from '../../src/controllers/debtBorrowRecord.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/debtBorrowRecord.controller.js', () => ({
  updateBorrowRecordHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Borrow record updated',
      data: { id: 'borrow-123' },
    }),
  ),
  deleteBorrowRecordHandler: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Borrow record deleted', data: null }),
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

describe('DebtBorrowRecord Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/debt-borrow-records', debtBorrowRecordRoutes);
    vi.clearAllMocks();
  });

  it('PATCH /debt-borrow-records/:id should call updateBorrowRecordHandler and return 200', async () => {
    const response = await request(app)
      .patch('/debt-borrow-records/borrow-123')
      .send({ amount: 1500, itemsDescription: 'Updated items' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Borrow record updated',
    });
    expect(debtBorrowRecordController.updateBorrowRecordHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('DELETE /debt-borrow-records/:id should call deleteBorrowRecordHandler and return 200', async () => {
    const response = await request(app)
      .delete('/debt-borrow-records/borrow-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Borrow record deleted',
      data: null,
    });
    expect(debtBorrowRecordController.deleteBorrowRecordHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown debt-borrow-record route', async () => {
    await request(app)
      .get('/debt-borrow-records/unknown')
      .set('Cookie', ['access_token=valid'])
      .expect(404);
  });
});
