import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { calculateCustomerBalance } from './debtCustomer.service.js';

export type ReportSummary = {
  totalIncome: number;
  totalBusinessExpenses: number;
  totalPersonalDraws: number;
  totalFundingIn: number;
  totalFundingOut: number;
  totalOwedByCustomers: number;
};

type DebtPeriodReport = {
  totalNewlyBorrowed: number;
  totalRepaidInPeriod: number;
};

type ExpenseBreakdownItem = {
  categoryId: string;
  categoryName: string;
  group: string;
  total: number;
};

// ── Build Summary ──

export const buildSummary = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<ReportSummary> => {
  const inPeriod = { accountId, date: { gte: from, lte: to }, deletedAt: null };
  // Owed is the current balance (ignores the date range) of customers that still exist,
  // so it matches the Debts list.
  const ownedByLiveCustomer = { accountId, deletedAt: null, customer: { deletedAt: null } };

  // Independent sums run in parallel instead of one after another.
  const [incomeAgg, businessAgg, personalAgg, fundingInAgg, fundingOutAgg, allBorrows, allPayments] =
    await Promise.all([
      prisma.dailyIncome.aggregate({ where: inPeriod, _sum: { amount: true } }),
      prisma.dailyExpense.aggregate({
        where: { ...inPeriod, category: { group: 'business' } },
        _sum: { amount: true },
      }),
      prisma.dailyExpense.aggregate({
        where: { ...inPeriod, category: { group: 'personal' } },
        _sum: { amount: true },
      }),
      prisma.fundingEntry.aggregate({
        where: { ...inPeriod, type: { in: ['salary_injection', 'borrowed_in'] } },
        _sum: { amount: true },
      }),
      prisma.fundingEntry.aggregate({
        where: { ...inPeriod, type: 'borrowed_repaid' },
        _sum: { amount: true },
      }),
      prisma.debtBorrowRecord.aggregate({ where: ownedByLiveCustomer, _sum: { amount: true } }),
      prisma.debtPayment.aggregate({ where: ownedByLiveCustomer, _sum: { amount: true } }),
    ]);

  const totalIncome = incomeAgg._sum.amount?.toNumber() ?? 0;
  const totalBusinessExpenses = businessAgg._sum.amount?.toNumber() ?? 0;
  const totalPersonalDraws = personalAgg._sum.amount?.toNumber() ?? 0;
  const totalFundingIn = fundingInAgg._sum.amount?.toNumber() ?? 0;
  const totalFundingOut = fundingOutAgg._sum.amount?.toNumber() ?? 0;
  const owed = new Prisma.Decimal(allBorrows._sum.amount ?? 0).minus(allPayments._sum.amount ?? 0);
  const totalOwedByCustomers = owed.isNegative() ? 0 : owed.toNumber();

  return {
    totalIncome,
    totalBusinessExpenses,
    totalPersonalDraws,
    totalFundingIn,
    totalFundingOut,
    totalOwedByCustomers,
  };
};

// ── Build Debt Period Report ──

export const buildDebtsPeriodReport = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<DebtPeriodReport> => {
  // Newly borrowed in period
  const borrowAgg = await prisma.debtBorrowRecord.aggregate({
    where: {
      accountId,
      date: { gte: from, lte: to },
      deletedAt: null,
    },
    _sum: { amount: true },
  });
  const totalNewlyBorrowed = borrowAgg._sum.amount?.toNumber() ?? 0;

  // Repaid in period (payments)
  const paymentAgg = await prisma.debtPayment.aggregate({
    where: {
      accountId,
      date: { gte: from, lte: to },
      deletedAt: null,
    },
    _sum: { amount: true },
  });
  const totalRepaidInPeriod = paymentAgg._sum.amount?.toNumber() ?? 0;

  return { totalNewlyBorrowed, totalRepaidInPeriod };
};

// ── Build Expense Breakdown ──

export const buildExpenseBreakdown = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<ExpenseBreakdownItem[]> => {
  // Get all active categories for this account
  const categories = await prisma.expenseCategory.findMany({
    where: {
      accountId,
      isActive: true,
    },
  });

  // Group expenses by category for the given period
  const groupResults = await prisma.dailyExpense.groupBy({
    by: ['categoryId'],
    where: {
      accountId,
      date: { gte: from, lte: to },
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  // Build a map of categoryId -> total
  const totalsMap = new Map<string, number>();
  for (const item of groupResults) {
    const amount = item._sum.amount?.toNumber() ?? 0;
    totalsMap.set(item.categoryId, amount);
  }

  // Assemble breakdown, preserving categories with zero total
  const breakdown: ExpenseBreakdownItem[] = [];
  for (const cat of categories) {
    breakdown.push({
      categoryId: cat.id,
      categoryName: cat.name,
      group: cat.group,
      total: totalsMap.get(cat.id) ?? 0,
    });
  }

  return breakdown;
};

// ── Generate CSV Export ──

export const generateCsvExport = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<string> => {
  // Gather all data
  const summary = await buildSummary(accountId, from, to);
  const debts = await buildDebtsPeriodReport(accountId, from, to);
  const breakdown = await buildExpenseBreakdown(accountId, from, to);

  const lines: string[] = [];

  // Header
  lines.push(
    'Period,Income,Business Expenses,Personal/Family Draws,Funding In,Funding Out,Total Owed by Customers',
  );

  // Summary line
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];
  lines.push(
    `${fromStr} to ${toStr},${summary.totalIncome},${summary.totalBusinessExpenses},${summary.totalPersonalDraws},${summary.totalFundingIn},${summary.totalFundingOut},${summary.totalOwedByCustomers}`,
  );

  // Blank line
  lines.push('');

  // Debts period section
  lines.push('Debts Period Report');
  lines.push(`Newly Borrowed,${debts.totalNewlyBorrowed}`);
  lines.push(`Repaid,${debts.totalRepaidInPeriod}`);
  lines.push('');

  // Expense breakdown section
  lines.push('Expense Breakdown by Category');
  lines.push('Category,Group,Total');
  for (const item of breakdown) {
    lines.push(`${item.categoryName},${item.group},${item.total}`);
  }

  return lines.join('\n');
};
