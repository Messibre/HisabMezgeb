import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type FundingType = 'salary_injection' | 'borrowed_in' | 'borrowed_repaid';

export type FundingEntry = {
  id: string;
  accountId: string;
  type: FundingType;
  amount: number;
  date: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const listFunding = async (
  accountId: string,
  from: Date,
  to: Date,
): Promise<FundingEntry[]> => {
  throw new Error('not implemented');
};

export const createFunding = async (
  accountId: string,
  date: Date,
  type: FundingType,
  amount: number,
  note?: string,
): Promise<FundingEntry> => {
  throw new Error('not implemented');
};

export const updateFunding = async (
  accountId: string,
  fundingId: string,
  data: {
    amount?: number;
    note?: string;
  },
): Promise<FundingEntry> => {
  throw new Error('not implemented');
};

export const softDeleteFunding = async (accountId: string, fundingId: string): Promise<void> => {
  throw new Error('not implemented');
};

export const calculateOutstanding = async (accountId: string): Promise<number> => {
  throw new Error('not implemented');
};
