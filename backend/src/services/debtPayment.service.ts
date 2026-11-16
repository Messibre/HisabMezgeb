import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
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

const lockCustomer = async (tx: Prisma.TransactionClient, customerId: string): Promise<void> => {
  await tx.$queryRaw`SELECT id FROM "hisab"."debt_customers" WHERE id = ${customerId} FOR UPDATE`;
};

// ── Service Functions ──

export const createPayment = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  note?: string,
): Promise<{ payment: PaymentRecord; newBalance: number }> => {
  // The balance check and the insert run in one transaction with the customer row
  // locked, so two overlapping payments can never overpay the balance.
  return prisma.$transaction(async (tx) => {
    const customer = await tx.debtCustomer.findUnique({
      where: {
        id: customerId,
        accountId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Debt customer not found', [], ERROR_CODES.CUSTOMER_NOT_FOUND);
    }

    await lockCustomer(tx, customerId);

    const currentBalance = await calculateCustomerBalance(customerId, tx);
    if (new Prisma.Decimal(amount).greaterThan(currentBalance)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment cannot exceed the amount owed', [], ERROR_CODES.PAYMENT_EXCEEDS_BALANCE);
    }

    // Never touches income – FR-23
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

    const payment = await tx.debtPayment.create({ data });

    return {
      payment: toPaymentRecord(payment),
      newBalance: new Prisma.Decimal(currentBalance).minus(amount).toNumber(),
    };
  });
};

export const updatePayment = async (
  accountId: string,
  paymentId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<PaymentRecord> => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.debtPayment.findFirst({
      where: {
        id: paymentId,
        accountId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found', [], ERROR_CODES.RECORD_NOT_FOUND);
    }

    // The new amount may use the current balance plus this payment's old amount.
    const customerId = existing.customerId;
    await lockCustomer(tx, customerId);
    const currentBalance = await calculateCustomerBalance(customerId, tx);
    const balanceWithoutThisPayment = new Prisma.Decimal(currentBalance).plus(existing.amount);

    const newAmount = data.amount !== undefined ? new Prisma.Decimal(data.amount) : existing.amount;
    if (newAmount.greaterThan(balanceWithoutThisPayment)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment cannot exceed the amount owed', [], ERROR_CODES.PAYMENT_EXCEEDS_BALANCE);
    }

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

    const updated = await tx.debtPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    return toPaymentRecord(updated);
  });
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
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found', [], ERROR_CODES.RECORD_NOT_FOUND);
  }

  await prisma.debtPayment.update({
    where: { id: paymentId },
    data: { deletedAt: new Date() },
  });
};
