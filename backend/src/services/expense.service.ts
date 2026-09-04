import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const listExpenses = async (
  accountId: string,
  from: Date,
  to: Date,
  categoryId?: string,
) => {
  throw new Error('not implemented');
};

export const createExpense = async (
  accountId: string,
  date: Date,
  categoryId: string,
  amount: number,
  note?: string,
) => {
  throw new Error('not implemented');
};

export const updateExpense = async (
  accountId: string,
  expenseId: string,
  data: {
    amount?: number;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const softDeleteExpense = async (accountId: string, expenseId: string) => {
  throw new Error('not implemented');
};
