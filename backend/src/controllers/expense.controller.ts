import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  listExpenses,
  createExpense,
  updateExpense,
  softDeleteExpense,
} from '../services/expense.service.js';

export const listExpensesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const createExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const updateExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const deleteExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});
