import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  buildSummary,
  buildDebtsPeriodReport,
  buildExpenseBreakdown,
  generateCsvExport,
} from '../services/reports.service.js';

export const getSummaryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const getDebtsPeriodHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const getExpenseBreakdownHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const exportReportHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});
