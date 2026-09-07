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
  const accountId = req.accountId!;
  const { from, to, categoryId } = req.query as { from: string; to: string; categoryId?: string };

  // ✅ Cast categoryId to string if provided
  const entries = await listExpenses(
    accountId,
    new Date(from),
    new Date(to),
    categoryId as string | undefined,
  );

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Expenses fetched', entries));
});

export const createExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { date, categoryId, amount, note } = req.body;

  const entry = await createExpense(accountId, new Date(date), categoryId, amount, note);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Expense recorded', entry));
});

export const updateExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { amount, note } = req.body;

  // ✅ Cast id to string
  const entry = await updateExpense(accountId, id as string, { amount, note });

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Expense updated', entry));
});

export const deleteExpenseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeleteExpense(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Expense entry deleted', null));
});
