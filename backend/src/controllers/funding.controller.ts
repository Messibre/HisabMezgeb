import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  listFunding,
  createFunding,
  updateFunding,
  softDeleteFunding,
  calculateOutstanding,
} from '../services/funding.service.js';

export const listFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const entries = await listFunding(accountId, new Date(from), new Date(to));

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Funding entries fetched', entries));
});

export const createFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { date, type, amount, note } = req.body;

  const entry = await createFunding(accountId, new Date(date), type, amount, note);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Funding entry recorded', entry));
});

export const updateFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { amount, note } = req.body;

  const entry = await updateFunding(accountId, id as string, { amount, note });

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Funding entry updated', entry));
});

export const deleteFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeleteFunding(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Funding entry deleted', null));
});

export const getOutstandingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const outstandingAmount = await calculateOutstanding(accountId);

  res.status(HTTP_STATUS.OK).json(
    new SuccessResponse(HTTP_STATUS.OK, 'Outstanding borrowed capital fetched', {
      outstandingAmount,
    }),
  );
});
