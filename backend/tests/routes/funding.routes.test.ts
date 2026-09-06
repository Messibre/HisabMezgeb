import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import fundingRoutes from '../../src/routes/funding.routes.js';
import * as fundingController from '../../src/controllers/funding.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/funding.controller.js', () => ({
  listFundingHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Funding entries fetched',
      data: [],
    }),
  ),
  createFundingHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Funding entry recorded',
      data: {
        id: 'fun-123',
        type: 'salary_injection',
        date: '2026-06-01',
        amount: 5000,
        note: null,
      },
    }),
  ),
  updateFundingHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Funding entry updated',
      data: {
        id: 'fun-123',
        type: 'salary_injection',
        date: '2026-06-01',
        amount: 6000,
        note: 'Updated',
      },
    }),
  ),
  deleteFundingHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Funding entry deleted',
      data: null,
    }),
  ),
  getOutstandingHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Outstanding borrowed capital fetched',
      data: { outstandingAmount: 7000 },
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

describe('Funding Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/funding', fundingRoutes);
    vi.clearAllMocks();
  });

  it('GET /funding should call listFundingHandler and return 200', async () => {
    const response = await request(app)
      .get('/funding?from=2026-01-01&to=2026-12-31')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Funding entries fetched',
    });
    expect(fundingController.listFundingHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('POST /funding should call createFundingHandler and return 201', async () => {
    const response = await request(app)
      .post('/funding')
      .send({ date: '2026-06-01', type: 'salary_injection', amount: 5000, note: 'Monthly salary' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Funding entry recorded',
    });
    expect(fundingController.createFundingHandler).toHaveBeenCalled();
  });

  it('PATCH /funding/:id should call updateFundingHandler and return 200', async () => {
    const response = await request(app)
      .patch('/funding/fun-123')
      .send({ amount: 6000, note: 'Updated' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Funding entry updated',
    });
    expect(fundingController.updateFundingHandler).toHaveBeenCalled();
  });

  it('DELETE /funding/:id should call deleteFundingHandler and return 200', async () => {
    const response = await request(app)
      .delete('/funding/fun-123')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Funding entry deleted',
      data: null,
    });
    expect(fundingController.deleteFundingHandler).toHaveBeenCalled();
  });

  it('GET /funding/outstanding should call getOutstandingHandler and return 200', async () => {
    const response = await request(app)
      .get('/funding/outstanding')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Outstanding borrowed capital fetched',
      data: { outstandingAmount: 7000 },
    });
    expect(fundingController.getOutstandingHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should return 404 for unknown funding route', async () => {
    await request(app).get('/funding/unknown').set('Cookie', ['access_token=valid']).expect(404);
  });
});
