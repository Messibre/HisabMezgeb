import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type ReportSummary = {
  totalIncome: number;
  totalBusinessExpenses: number;
  totalPersonalDraws: number;
  totalFundingIn: number;
  totalFundingOut: number;
  totalOwedByCustomers: number;
};

export const buildSummary = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<ReportSummary> => {
  throw new Error('not implemented');
};

export const buildDebtsPeriodReport = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<{
  totalNewlyBorrowed: number;
  totalRepaidInPeriod: number;
}> => {
  throw new Error('not implemented');
};

export const buildExpenseBreakdown = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<
  {
    categoryId: string;
    categoryName: string;
    group: string;
    total: number;
  }[]
> => {
  throw new Error('not implemented');
};

export const generateCsvExport = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<string> => {
  throw new Error('not implemented');
};
