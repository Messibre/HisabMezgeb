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
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const summary = await buildSummary(accountId, new Date(from), new Date(to));

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Report summary fetched', summary));
});

export const getDebtsPeriodHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const report = await buildDebtsPeriodReport(accountId, new Date(from), new Date(to));

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Debt period report fetched', report));
});

export const getExpenseBreakdownHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const breakdown = await buildExpenseBreakdown(accountId, new Date(from), new Date(to));

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Expense breakdown fetched', breakdown));
});

export const exportReportHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { from, to } = req.query as { from: string; to: string };

  const csv = await generateCsvExport(accountId, new Date(from), new Date(to));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=report-${from}-to-${to}.csv`);
  res.status(HTTP_STATUS.OK).send(csv);
});
