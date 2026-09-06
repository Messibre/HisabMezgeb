import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type PaymentRecord = {
  id: string;
  customerId: string;
  date: Date;
  amount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const createPayment = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  note?: string,
): Promise<{ payment: PaymentRecord; newBalance: number }> => {
  throw new Error('not implemented');
};

export const updatePayment = async (
  accountId: string,
  paymentId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<PaymentRecord> => {
  throw new Error('not implemented');
};

export const softDeletePayment = async (accountId: string, paymentId: string): Promise<void> => {
  throw new Error('not implemented');
};
