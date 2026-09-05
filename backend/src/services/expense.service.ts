import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

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

export const listExpenses = async (
  accountId: string,
  from: Date,
  to: Date,
  categoryId?: string,
): Promise<ExpenseWithCategory[]> => {
  throw new Error('not implemented');
};

export const createExpense = async (
  accountId: string,
  date: Date,
  categoryId: string,
  amount: number,
  note?: string,
): Promise<ExpenseResponse> => {
  throw new Error('not implemented');
};

export const updateExpense = async (
  accountId: string,
  expenseId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<ExpenseResponse> => {
  throw new Error('not implemented');
};

export const softDeleteExpense = async (accountId: string, expenseId: string): Promise<void> => {
  throw new Error('not implemented');
};
