import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../src/routes/auth.routes.js';
import * as authController from '../../src/controllers/auth.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';
import { HTTP_STATUS } from '../../src/constants/index.js';

vi.mock('../../src/controllers/auth.controller.js', () => ({
  register: vi.fn((req, res) =>
    res
      .status(201)
      .json({ statusCode: 201, success: true, message: 'Registered', data: { id: '123' } }),
  ),
  login: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Logged in', data: { id: '123' } }),
  ),
  refresh: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Refreshed', data: { id: '123' } }),
  ),
  logout: vi.fn((req, res) =>
    res.status(200).json({ statusCode: 200, success: true, message: 'Logged out', data: null }),
  ),
  changePassword: vi.fn((req, res) =>
    res
      .status(200)
      .json({ statusCode: 200, success: true, message: 'Password updated', data: null }),
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

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/auth', authRoutes);
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call register controller and return 201', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ phoneNumber: '0911223344', password: 'pass123', shopName: 'Shop' })
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        success: true,
        message: 'Registered',
      });
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should call login controller and return 200', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ phoneNumber: '0911223344', password: 'pass123' })
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        success: true,
        message: 'Logged in',
      });
      expect(authController.login).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call refresh controller and return 200', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=valid'])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        success: true,
        message: 'Refreshed',
      });
      expect(authController.refresh).toHaveBeenCalled();
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logout controller and return 200', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', ['refresh_token=valid'])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        success: true,
        message: 'Logged out',
      });
      expect(authController.logout).toHaveBeenCalled();
      // authMiddleware is called because route is protected
      expect(authMiddleware).toHaveBeenCalled();
    });
  });

  describe('PATCH /auth/password', () => {
    it('should call changePassword controller and return 200', async () => {
      const response = await request(app)
        .patch('/auth/password')
        .send({ currentPassword: 'old', newPassword: 'new' })
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        success: true,
        message: 'Password updated',
      });
      expect(authController.changePassword).toHaveBeenCalled();
    });
  });

  describe('Route not found', () => {
    it('should return 404 for unknown auth routes', async () => {
      await request(app).post('/auth/unknown').expect(404);
    });
  });
});
