import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import settingsRoutes from '../../src/routes/settings.routes.js';
import * as settingsController from '../../src/controllers/settings.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/settings.controller.js', () => ({
  getSettingsHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Settings fetched',
      data: { language: 'en' },
    }),
  ),
  updateSettingsHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Settings updated',
      data: { language: 'am' },
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

describe('Settings Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/settings', settingsRoutes);
    vi.clearAllMocks();
  });

  it('GET /settings should call getSettingsHandler and return 200', async () => {
    const response = await request(app)
      .get('/settings')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Settings fetched',
    });
    expect(settingsController.getSettingsHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('PATCH /settings should call updateSettingsHandler and return 200', async () => {
    const response = await request(app)
      .patch('/settings')
      .send({ language: 'am' })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Settings updated',
    });
    expect(settingsController.updateSettingsHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should return 404 for unknown settings route', async () => {
    await request(app).get('/settings/unknown').set('Cookie', ['access_token=valid']).expect(404);
  });
});
