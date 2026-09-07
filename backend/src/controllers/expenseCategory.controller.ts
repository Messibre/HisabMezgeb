import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  listCategories,
  createCategory,
  updateCategory,
} from '../services/expenseCategory.service.js';

export const listCategoriesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const categories = await listCategories(accountId);
  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Categories fetched', categories));
});

export const createCategoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { name, group } = req.body;
  const category = await createCategory(accountId, { name, group });
  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Category created', category));
});

export const updateCategoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { name, isActive } = req.body;

  // ✅ Cast id to string
  const category = await updateCategory(accountId, id as string, { name, isActive });

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Category updated', category));
});
