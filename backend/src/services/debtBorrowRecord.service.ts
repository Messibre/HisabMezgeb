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

export const createBorrowRecord = async (
  accountId: string,
  customerId: string,
  date: Date,
  amount: number,
  itemsDescription: string,
  note?: string,
): Promise<BorrowRecord> => {
  throw new Error('not implemented');
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
  throw new Error('not implemented');
};

export const softDeleteBorrowRecord = async (
  accountId: string,
  recordId: string,
): Promise<void> => {
  throw new Error('not implemented');
};
