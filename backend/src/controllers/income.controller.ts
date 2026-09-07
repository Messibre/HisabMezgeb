import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  listIncome,
  createIncome,
  updateIncome,
  softDeleteIncome,
} from '../services/income.service.js';

export const listIncomeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const entries = await listIncome(accountId, new Date(from), new Date(to));

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Income entries fetched', entries));
});

export const createIncomeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { date, amount, note } = req.body;

  const entry = await createIncome(accountId, new Date(date), amount, note);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Income recorded', entry));
});

export const updateIncomeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { amount, note } = req.body;

  // ✅ Cast id to string – it's a single value in our route
  const entry = await updateIncome(accountId, id as string, { amount, note });

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Income updated', entry));
});

export const deleteIncomeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeleteIncome(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Income entry deleted', null));
});
