import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const listIncome = async (accountId: string, from: Date, to: Date) => {
  throw new Error('not implemented');
};

export const createIncome = async (
  accountId: string,
  date: Date,
  amount: number,
  note?: string,
) => {
  throw new Error('not implemented');
};

export const updateIncome = async (
  accountId: string,
  incomeId: string,
  data: {
    amount?: number;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const softDeleteIncome = async (accountId: string, incomeId: string) => {
  throw new Error('not implemented');
};
