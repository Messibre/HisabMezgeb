import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type CustomerWithBalance = {
  id: string;
  name: string;
  note: string | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerHistoryItem = {
  id: string;
  kind: 'borrow' | 'payment';
  date: Date;
  amount: number;
  itemsDescription: string | null;
};

export type CustomerDetail = {
  id: string;
  name: string;
  note: string | null;
  balance: number;
  history: CustomerHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
};

// ── Shared Balance Helper ──

export const calculateCustomerBalance = async (customerId: string): Promise<number> => {
  const borrows = await prisma.debtBorrowRecord.aggregate({
    where: {
      customerId,
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const payments = await prisma.debtPayment.aggregate({
    where: {
      customerId,
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const totalBorrowed = borrows._sum.amount?.toNumber() ?? 0;
  const totalPaid = payments._sum.amount?.toNumber() ?? 0;

  // Clamp at 0 – should never be negative, but defensive
  return Math.max(0, totalBorrowed - totalPaid);
};

// ── Service Functions ──

export const listCustomersWithBalance = async (
  accountId: string,
  search?: string,
): Promise<CustomerWithBalance[]> => {
  const where: any = {
    accountId,
    deletedAt: null,
  };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const customers = await prisma.debtCustomer.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // Compute balance for each customer
  const results: CustomerWithBalance[] = [];
  for (const customer of customers) {
    const balance = await calculateCustomerBalance(customer.id);
    results.push({
      id: customer.id,
      name: customer.name,
      note: customer.note,
      balance,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });
  }

  return results;
};

export const createCustomer = async (
  accountId: string,
  data: {
    name: string;
    note?: string;
  },
): Promise<CustomerWithBalance> => {
  // Build data object conditionally
  const createData: {
    accountId: string;
    name: string;
    note?: string | null;
  } = {
    accountId,
    name: data.name,
  };

  if (data.note !== undefined) {
    createData.note = data.note;
  }

  const customer = await prisma.debtCustomer.create({
    data: createData,
  });

  return {
    id: customer.id,
    name: customer.name,
    note: customer.note,
    balance: 0,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

export const getCustomerWithHistory = async (
  accountId: string,
  customerId: string,
): Promise<CustomerDetail> => {
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

  // Fetch borrows and payments separately
  const borrows = await prisma.debtBorrowRecord.findMany({
    where: {
      customerId,
      deletedAt: null,
    },
    orderBy: { date: 'asc' },
  });

  const payments = await prisma.debtPayment.findMany({
    where: {
      customerId,
      deletedAt: null,
    },
    orderBy: { date: 'asc' },
  });

  // Interleave history by date
  const history: CustomerHistoryItem[] = [];

  let i = 0,
    j = 0;
  while (i < borrows.length || j < payments.length) {
    const borrow = borrows[i];
    const payment = payments[j];
    if (!borrow || (payment && payment.date < borrow.date)) {
      history.push({
        id: payment.id,
        kind: 'payment',
        date: payment.date,
        amount: payment.amount.toNumber(),
        itemsDescription: null,
      });
      j++;
    } else {
      history.push({
        id: borrow.id,
        kind: 'borrow',
        date: borrow.date,
        amount: borrow.amount.toNumber(),
        itemsDescription: borrow.itemsDescription,
      });
      i++;
    }
  }

  const balance = await calculateCustomerBalance(customerId);

  return {
    id: customer.id,
    name: customer.name,
    note: customer.note,
    balance,
    history,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

export const updateCustomer = async (
  accountId: string,
  customerId: string,
  data: {
    name?: string;
    note?: string;
  },
): Promise<CustomerWithBalance> => {
  const existing = await prisma.debtCustomer.findUnique({
    where: {
      id: customerId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Debt customer not found');
  }

  const updateData: { name?: string; note?: string | null } = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.note !== undefined) {
    updateData.note = data.note;
  }

  if (Object.keys(updateData).length === 0) {
    // No changes, but still need to return with balance
    const balance = await calculateCustomerBalance(customerId);
    return {
      id: existing.id,
      name: existing.name,
      note: existing.note,
      balance,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const updated = await prisma.debtCustomer.update({
    where: { id: customerId },
    data: updateData,
  });

  const balance = await calculateCustomerBalance(customerId);

  return {
    id: updated.id,
    name: updated.name,
    note: updated.note,
    balance,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
};

export const softDeleteCustomer = async (accountId: string, customerId: string): Promise<void> => {
  const existing = await prisma.debtCustomer.findUnique({
    where: {
      id: customerId,
      accountId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Debt customer not found');
  }

  await prisma.debtCustomer.update({
    where: { id: customerId },
    data: { deletedAt: new Date() },
  });
};
