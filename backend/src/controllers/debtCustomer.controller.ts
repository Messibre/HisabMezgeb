import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  listCustomersWithBalance,
  createCustomer,
  getCustomerWithHistory,
  updateCustomer,
  softDeleteCustomer,
} from '../services/debtCustomer.service.js';

export const listCustomersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { search } = req.query as { search?: string };

  const customers = await listCustomersWithBalance(accountId, search);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Debt customers fetched', customers));
});

export const createCustomerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { name, note } = req.body;

  const customer = await createCustomer(accountId, { name, note });

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Debt customer created', customer));
});

export const getCustomerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  const customer = await getCustomerWithHistory(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Debt customer fetched', customer));
});

export const updateCustomerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { name, note } = req.body;

  const customer = await updateCustomer(accountId, id as string, { name, note });

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Debt customer updated', customer));
});

export const deleteCustomerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeleteCustomer(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Debt customer deleted', null));
});
