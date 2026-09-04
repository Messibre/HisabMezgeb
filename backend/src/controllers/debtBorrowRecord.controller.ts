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
  throw new Error('not implemented');
});

export const updateBorrowRecordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const deleteBorrowRecordHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});
