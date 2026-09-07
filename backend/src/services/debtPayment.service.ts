import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { calculateCustomerBalance } from './debtCustomer.service.js';

export type PaymentRecord = {
  id: string;
  customerId: string;
  date: Date;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helpers ──

function toPaymentRecord(raw: {
  id: string;
  customerId: string;
  date: Date;
  amount: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentRecord {
  return {
    id: raw.id,
    customerId: raw.customerId,
    date: raw.date,
    amount: raw.amount.toNumber(),
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── Service Functions ──

export const createPayment = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  note?: string,
): Promise<{ payment: PaymentRecord; newBalance: number }> => {
  // 1. Verify customer exists
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

  // 2. Check current balance (must be >= amount)
  const currentBalance = await calculateCustomerBalance(customerId);
  if (amount > currentBalance) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment cannot exceed the amount owed');
  }

  // 3. Create payment (never touches income – FR-23)
  const data: {
    customerId: string;
    accountId: string;
    date: Date;
    amount: Prisma.Decimal;
    note?: string | null;
  } = {
    customerId,
    accountId,
    date,
    amount: new Prisma.Decimal(amount),
  };

  if (note !== undefined) {
    data.note = note;
  }

  const payment = await prisma.debtPayment.create({ data });

  // 4. Recalculate new balance
  const newBalance = currentBalance - amount;

  return {
    payment: toPaymentRecord(payment),
    newBalance,
  };
};

export const updatePayment = async (
  accountId: string,
  paymentId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<PaymentRecord> => {
  // 1. Find existing payment
  const existing = await prisma.debtPayment.findFirst({
    where: {
      id: paymentId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found');
  }

  // 2. If amount is being updated, ensure it doesn't exceed current balance
  //    The current balance is computed based on ALL records excluding this payment.
  //    For simplicity, we recompute the customer's balance then subtract the old payment.
  const customerId = existing.customerId;
  const currentBalance = await calculateCustomerBalance(customerId);
  // Add back the old payment amount (since it's being removed)
  const balanceWithoutThisPayment = currentBalance + existing.amount.toNumber();

  const newAmount = data.amount !== undefined ? data.amount : existing.amount.toNumber();
  if (newAmount > balanceWithoutThisPayment) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment cannot exceed the amount owed');
  }

  // 3. Build update data
  const updateData: {
    amount?: Prisma.Decimal;
    note?: string | null;
  } = {};
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    return toPaymentRecord(existing);
  }

  const updated = await prisma.debtPayment.update({
    where: { id: paymentId },
    data: updateData,
  });

  return toPaymentRecord(updated);
};

export const softDeletePayment = async (accountId: string, paymentId: string): Promise<void> => {
  const existing = await prisma.debtPayment.findFirst({
    where: {
      id: paymentId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found');
  }

  await prisma.debtPayment.update({
    where: { id: paymentId },
    data: { deletedAt: new Date() },
  });
};
