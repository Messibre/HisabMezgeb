import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

export type ExpenseWithCategory = {
  id: string;
  accountId: string;
  categoryId: string;
  categoryName: string;
  date: Date;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseResponse = {
  id: string;
  accountId: string;
  categoryId: string;
  date: Date;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toExpenseWithCategory(raw: {
  id: string;
  accountId: string;
  categoryId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string };
}): ExpenseWithCategory {
  return {
    id: raw.id,
    accountId: raw.accountId,
    categoryId: raw.categoryId,
    categoryName: raw.category.name,
    date: raw.date,
    amount: raw.amount.toNumber(),
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function toExpenseResponse(raw: {
  id: string;
  accountId: string;
  categoryId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ExpenseResponse {
  return {
    id: raw.id,
    accountId: raw.accountId,
    categoryId: raw.categoryId,
    date: raw.date,
    amount: raw.amount.toNumber(),
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const listExpenses = async (
  accountId: string,
  from: Date,
  to: Date,
  categoryId?: string,
): Promise<ExpenseWithCategory[]> => {
  const where: any = {
    accountId,
    date: {
      gte: from,
      lte: to,
    },
    deletedAt: null,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const entries = await prisma.dailyExpense.findMany({
    where,
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  return entries.map(toExpenseWithCategory);
};

export const createExpense = async (
  accountId: string,
  date: Date,
  categoryId: string,
  amount: number,
  note?: string,
): Promise<ExpenseResponse> => {
  const category = await prisma.expenseCategory.findUnique({
    where: { id: categoryId, accountId },
  });

  if (!category) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Category not found', [], ERROR_CODES.CATEGORY_NOT_FOUND);
  }

  const existing = await prisma.dailyExpense.findFirst({
    where: {
      accountId,
      date,
      categoryId,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Expense already recorded for this category and date — update it instead',
      [],
      ERROR_CODES.DUPLICATE_EXPENSE_ENTRY,
    );
  }

  // The unique key (accountId, date, categoryId) also covers soft-deleted rows,
  // so a deleted entry for the same day and category is revived.
  const deleted = await prisma.dailyExpense.findFirst({
    where: { accountId, date, categoryId, deletedAt: { not: null } },
  });

  if (deleted) {
    const revived = await prisma.dailyExpense.update({
      where: { id: deleted.id },
      data: { deletedAt: null, amount: new Prisma.Decimal(amount), note: note ?? null },
    });
    return toExpenseResponse(revived);
  }

  const data: {
    accountId: string;
    date: Date;
    categoryId: string;
    amount: Prisma.Decimal;
    note?: string | null;
  } = {
    accountId,
    date,
    categoryId,
    amount: new Prisma.Decimal(amount),
  };

  if (note !== undefined) {
    data.note = note;
  }

  const entry = await prisma.dailyExpense.create({ data });
  return toExpenseResponse(entry);
};

export const updateExpense = async (
  accountId: string,
  expenseId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<ExpenseResponse> => {
  if (data.amount !== undefined && data.amount < 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Amount must be 0 or greater', [], ERROR_CODES.VALIDATION_FAILED);
  }
  const existing = await prisma.dailyExpense.findFirst({
    where: {
      id: expenseId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Expense entry not found', [], ERROR_CODES.RECORD_NOT_FOUND);
  }

  const updateData: { amount?: Prisma.Decimal; note?: string | null } = {};
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    return toExpenseResponse(existing);
  }

  const updated = await prisma.dailyExpense.update({
    where: { id: expenseId },
    data: updateData,
  });

  return toExpenseResponse(updated);
};

export const softDeleteExpense = async (accountId: string, expenseId: string): Promise<void> => {
  const existing = await prisma.dailyExpense.findFirst({
    where: {
      id: expenseId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Expense entry not found', [], ERROR_CODES.RECORD_NOT_FOUND);
  }

  await prisma.dailyExpense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });
};
