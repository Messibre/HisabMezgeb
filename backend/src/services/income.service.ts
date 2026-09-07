import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type SafeIncome = {
  id: string;
  accountId: string;
  date: Date;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toSafeIncome(raw: {
  id: string;
  accountId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeIncome {
  return {
    id: raw.id,
    accountId: raw.accountId,
    date: raw.date,
    amount: raw.amount.toNumber(),
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const listIncome = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<SafeIncome[]> => {
  const entries = await prisma.dailyIncome.findMany({
    where: {
      accountId,
      date: {
        gte: from,
        lte: to,
      },
      deletedAt: null,
    },
    orderBy: { date: 'desc' },
  });

  return entries.map(toSafeIncome);
};

export const createIncome = async (
  accountId: string,
  date: Date,
  amount: number,
  note?: string,
): Promise<SafeIncome> => {
  const existing = await prisma.dailyIncome.findFirst({
    where: {
      accountId,
      date,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Income already recorded for this date — update it instead',
    );
  }

  // ✅ Only include note if provided – matches test expectation
  const data: {
    accountId: string;
    date: Date;
    amount: Prisma.Decimal;
    note?: string | null;
  } = {
    accountId,
    date,
    amount: new Prisma.Decimal(amount),
  };

  if (note !== undefined) {
    data.note = note;
  }

  const entry = await prisma.dailyIncome.create({ data });

  return toSafeIncome(entry);
};

export const updateIncome = async (
  accountId: string,
  incomeId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<SafeIncome> => {
  const existing = await prisma.dailyIncome.findFirst({
    where: {
      id: incomeId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Income entry not found');
  }

  const updateData: { amount?: Prisma.Decimal; note?: string | null } = {};
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    return toSafeIncome(existing);
  }

  const updated = await prisma.dailyIncome.update({
    where: { id: incomeId },
    data: updateData,
  });

  return toSafeIncome(updated);
};

export const softDeleteIncome = async (accountId: string, incomeId: string): Promise<void> => {
  const existing = await prisma.dailyIncome.findFirst({
    where: {
      id: incomeId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Income entry not found');
  }

  await prisma.dailyIncome.update({
    where: { id: incomeId },
    data: { deletedAt: new Date() },
  });
};
