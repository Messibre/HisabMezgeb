import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type BorrowRecord = {
  id: string;
  customerId: string;
  date: Date;
  amount: number;
  itemsDescription: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helper ──

function toBorrowRecord(raw: {
  id: string;
  customerId: string;
  date: Date;
  amount: Prisma.Decimal;
  itemsDescription: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BorrowRecord {
  return {
    id: raw.id,
    customerId: raw.customerId,
    date: raw.date,
    amount: raw.amount.toNumber(),
    itemsDescription: raw.itemsDescription,
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── Service Functions ──

export const createBorrowRecord = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  itemsDescription: string,
  note?: string,
): Promise<BorrowRecord> => {
  // Verify customer exists and belongs to account
  const customer = await prisma.debtCustomer.findUnique({
    where: {
      id: customerId,
      accountId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Debt customer not found');
  }

  const data: {
    customerId: string;
    accountId: string;
    date: Date;
    amount: Prisma.Decimal;
    itemsDescription: string;
    note?: string | null;
  } = {
    customerId,
    accountId,
    date,
    amount: new Prisma.Decimal(amount),
    itemsDescription,
  };

  if (note !== undefined) {
    data.note = note;
  }

  const record = await prisma.debtBorrowRecord.create({ data });
  return toBorrowRecord(record);
};

export const updateBorrowRecord = async (
  accountId: string,
  recordId: string,
  data: {
    amount?: number;
    itemsDescription?: string;
    note?: string;
  },
): Promise<BorrowRecord> => {
  const existing = await prisma.debtBorrowRecord.findFirst({
    where: {
      id: recordId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Borrow record not found');
  }

  const updateData: {
    amount?: Prisma.Decimal;
    itemsDescription?: string;
    note?: string | null;
  } = {};
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.itemsDescription !== undefined) {
    updateData.itemsDescription = data.itemsDescription;
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    return toBorrowRecord(existing);
  }

  const updated = await prisma.debtBorrowRecord.update({
    where: { id: recordId },
    data: updateData,
  });

  return toBorrowRecord(updated);
};

export const softDeleteBorrowRecord = async (
  accountId: string,
  recordId: string,
): Promise<void> => {
  const existing = await prisma.debtBorrowRecord.findFirst({
    where: {
      id: recordId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Borrow record not found');
  }

  await prisma.debtBorrowRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });
};
