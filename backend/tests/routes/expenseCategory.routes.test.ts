import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import expenseCategoryRoutes from '../../src/routes/expenseCategory.routes.js';
import * as categoryController from '../../src/controllers/expenseCategory.controller.js';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

vi.mock('../../src/controllers/expenseCategory.controller.js', () => ({
  listCategoriesHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Categories fetched',
      data: [],
    }),
  ),
  createCategoryHandler: vi.fn((req, res) =>
    res.status(201).json({
      statusCode: 201,
      success: true,
      message: 'Category created',
      data: { id: 'cat-123', name: 'Cost of Goods', group: 'business', isActive: true },
    }),
  ),
  updateCategoryHandler: vi.fn((req, res) =>
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Category updated',
      data: { id: 'cat-123', name: 'Updated Name', group: 'business', isActive: false },
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

describe('ExpenseCategory Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/expense-categories', expenseCategoryRoutes);
    vi.clearAllMocks();
  });

  it('GET /expense-categories should call listCategoriesHandler and return 200', async () => {
    const response = await request(app)
      .get('/expense-categories')
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Categories fetched',
    });
    expect(categoryController.listCategoriesHandler).toHaveBeenCalled();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('POST /expense-categories should call createCategoryHandler and return 201', async () => {
    const response = await request(app)
      .post('/expense-categories')
      .send({ name: 'Cost of Goods', group: 'business' })
      .set('Cookie', ['access_token=valid'])
      .expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: 'Category created',
    });
    expect(categoryController.createCategoryHandler).toHaveBeenCalled();
  });

  it('PATCH /expense-categories/:id should call updateCategoryHandler and return 200', async () => {
    const response = await request(app)
      .patch('/expense-categories/cat-123')
      .send({ name: 'Updated Name', isActive: false })
      .set('Cookie', ['access_token=valid'])
      .expect(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: 'Category updated',
    });
    expect(categoryController.updateCategoryHandler).toHaveBeenCalled();
  });

  it('should return 404 for unknown expense-category route', async () => {
    await request(app)
      .get('/expense-categories/unknown')
      .set('Cookie', ['access_token=valid'])
      .expect(404);
  });
});
