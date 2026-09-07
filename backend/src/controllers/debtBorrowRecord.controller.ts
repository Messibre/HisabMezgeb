import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  createBorrowRecord,
  updateBorrowRecord,
  softDeleteBorrowRecord,
} from '../services/debtBorrowRecord.service.js';

export const createBorrowRecordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id: customerId } = req.params;
  const { date, amount, itemsDescription, note } = req.body;

  const record = await createBorrowRecord(
    accountId,
    customerId as string,
    new Date(date),
    amount,
    itemsDescription,
    note,
  );

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Borrow record added', record));
});

export const updateBorrowRecordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;
  const { amount, itemsDescription, note } = req.body;

  const record = await updateBorrowRecord(accountId, id as string, {
    amount,
    itemsDescription,
    note,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Borrow record updated', record));
});

export const deleteBorrowRecordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { id } = req.params;

  await softDeleteBorrowRecord(accountId, id as string);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Borrow record deleted', null));
});
