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
import { exportReport } from '../services/export/export.service.js';
import { ExportFormat, SupportedLang } from '../services/export/documentModel.js';

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
  const { from, to, format, lang } = req.query as {
    from: string;
    to: string;
    format?: ExportFormat;
    lang?: SupportedLang;
  };

  if (format === 'csv' || !format) {
    const csv = await generateCsvExport(accountId, new Date(from), new Date(to));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${from}-to-${to}.csv`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(HTTP_STATUS.OK).send(csv);
    return;
  }

  const result = await exportReport(
    accountId,
    new Date(from),
    new Date(to),
    format,
    lang ?? 'en',
  );

  res.setHeader('Content-Type', result.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.filename}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.OK).send(result.buffer);
});
