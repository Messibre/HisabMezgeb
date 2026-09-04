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
  throw new Error('not implemented');
});

export const createFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const updateFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const deleteFundingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const getOutstandingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});
