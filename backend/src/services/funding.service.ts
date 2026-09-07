import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type FundingType = 'salary_injection' | 'borrowed_in' | 'borrowed_repaid';

export type FundingEntry = {
  id: string;
  accountId: string;
  type: FundingType;
  amount: number;
  date: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helper with explicit Prisma raw type ──
type PrismaFundingEntry = {
  id: string;
  accountId: string;
  type: string; // Prisma returns string
  amount: Prisma.Decimal;
  date: Date;
  note: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toFundingEntry(raw: PrismaFundingEntry): FundingEntry {
  return {
    id: raw.id,
    accountId: raw.accountId,
    type: raw.type as FundingType, // safe cast
    amount: raw.amount.toNumber(),
    date: raw.date,
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── Service Functions ──

export const listFunding = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<FundingEntry[]> => {
  const entries = await prisma.fundingEntry.findMany({
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

  return entries.map(toFundingEntry);
};

export const createFunding = async (
  accountId: string,
  date: Date,
  type: FundingType,
  amount: number,
  note?: string,
): Promise<FundingEntry> => {
  const data: {
    accountId: string;
    date: Date;
    type: FundingType;
    amount: Prisma.Decimal;
    note?: string | null;
  } = {
    accountId,
    date,
    type,
    amount: new Prisma.Decimal(amount),
  };

  if (note !== undefined) {
    data.note = note;
  }

  const entry = await prisma.fundingEntry.create({ data });
  return toFundingEntry(entry);
};

export const updateFunding = async (
  accountId: string,
  fundingId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<FundingEntry> => {
  const existing = await prisma.fundingEntry.findFirst({
    where: {
      id: fundingId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Funding entry not found');
  }

  const updateData: { amount?: Prisma.Decimal; note?: string | null } = {};
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    return toFundingEntry(existing);
  }

  const updated = await prisma.fundingEntry.update({
    where: { id: fundingId },
    data: updateData,
  });

  return toFundingEntry(updated);
};

export const softDeleteFunding = async (accountId: string, fundingId: string): Promise<void> => {
  const existing = await prisma.fundingEntry.findFirst({
    where: {
      id: fundingId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Funding entry not found');
  }

  await prisma.fundingEntry.update({
    where: { id: fundingId },
    data: { deletedAt: new Date() },
  });
};

export const calculateOutstanding = async (accountId: string): Promise<number> => {
  const borrowedIn = await prisma.fundingEntry.aggregate({
    where: {
      accountId,
      type: 'borrowed_in',
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const borrowedRepaid = await prisma.fundingEntry.aggregate({
    where: {
      accountId,
      type: 'borrowed_repaid',
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const inAmount = borrowedIn._sum.amount?.toNumber() ?? 0;
  const outAmount = borrowedRepaid._sum.amount?.toNumber() ?? 0;

  return Math.max(0, inAmount - outAmount);
};
