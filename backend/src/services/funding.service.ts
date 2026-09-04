import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const listFunding = async (accountId: string, from: Date, to: Date) => {
  throw new Error('not implemented');
};

export const createFunding = async (
  accountId: string,
  date: Date,
  type: 'salary_injection' | 'borrowed_in' | 'borrowed_repaid',
  amount: number,
  note?: string,
) => {
  throw new Error('not implemented');
};

export const updateFunding = async (
  accountId: string,
  fundingId: string,
  data: {
    amount?: number;
    note?: string;
  },
) => {
  throw new Error('not implemented');
};

export const softDeleteFunding = async (accountId: string, fundingId: string) => {
  throw new Error('not implemented');
};

export const calculateOutstanding = async (accountId: string) => {
  throw new Error('not implemented');
};
