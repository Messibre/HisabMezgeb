import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  createPayment,
  updatePayment,
  softDeletePayment,
} from '../services/debtPayment.service.js';

export const createPaymentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id: customerId } = req.params;
  const { date, amount, note } = req.body;

  const result = await createPayment(accountId, customerId as string, new Date(date), amount, note);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Payment recorded', result));
});

export const updatePaymentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { amount, note } = req.body;

  const payment = await updatePayment(accountId, id as string, { amount, note });

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Payment updated', payment));
});

export const deletePaymentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeletePayment(accountId, id as string);

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Payment deleted', null));
});
