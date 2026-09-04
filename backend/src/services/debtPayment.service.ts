import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const createPayment = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  note?: string,
) => {
  throw new Error('not implemented');
};

export const updatePayment = async (
  accountId: string,
  paymentId: string,
  data: {
    amount?: number;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const softDeletePayment = async (accountId: string, paymentId: string) => {
  throw new Error('not implemented');
};
