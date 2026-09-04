import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from '../../src/controllers/expenseCategory.controller.js';
import * as categoryService from '../../src/services/expenseCategory.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/expenseCategory.service.js', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

describe.skip('ExpenseCategory Controller', () => {
  let req: Partial<Request> & { accountId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  const mockCategory = {
    id: 'cat-123',
    accountId: 'acc-123',
    name: 'Cost of Goods',
    group: 'business' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    req = {
      accountId: 'acc-123',
      body: {},
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('listCategoriesHandler', () => {
    it('should return list of categories with 200', async () => {
      (categoryService.listCategories as Mock).mockResolvedValue([mockCategory]);

      await listCategoriesHandler(req as Request, res as Response, next);

      expect(categoryService.listCategories).toHaveBeenCalledWith('acc-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Categories fetched',
          data: [mockCategory],
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new Error('DB error');
      (categoryService.listCategories as Mock).mockRejectedValue(error);

      await listCategoriesHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createCategoryHandler', () => {
    it('should create category and return 201', async () => {
      req.body = { name: 'Cost of Goods', group: 'business' };
      (categoryService.createCategory as Mock).mockResolvedValue(mockCategory);

      await createCategoryHandler(req as Request, res as Response, next);

      expect(categoryService.createCategory).toHaveBeenCalledWith('acc-123', {
        name: 'Cost of Goods',
        group: 'business',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Category created',
          data: mockCategory,
        }),
      );
    });

    it('should pass 409 conflict error to next', async () => {
      const error = new ApiError(409, 'This category already exists');
      (categoryService.createCategory as Mock).mockRejectedValue(error);
      req.body = { name: 'Cost of Goods', group: 'business' };

      await createCategoryHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategoryHandler', () => {
    it('should update category and return 200', async () => {
      req.params = { id: 'cat-123' };
      req.body = { name: 'Updated Name', isActive: false };
      (categoryService.updateCategory as Mock).mockResolvedValue({
        ...mockCategory,
        name: 'Updated Name',
        isActive: false,
      });

      await updateCategoryHandler(req as Request, res as Response, next);

      expect(categoryService.updateCategory).toHaveBeenCalledWith('acc-123', 'cat-123', {
        name: 'Updated Name',
        isActive: false,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Category updated',
          data: expect.objectContaining({
            name: 'Updated Name',
            isActive: false,
          }),
        }),
      );
    });

    it('should pass 404 error to next', async () => {
      const error = new ApiError(404, 'Category not found');
      (categoryService.updateCategory as Mock).mockRejectedValue(error);
      req.params = { id: 'cat-123' };
      req.body = { name: 'New Name' };

      await updateCategoryHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
