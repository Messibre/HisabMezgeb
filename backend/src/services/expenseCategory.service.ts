import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type ExpenseCategory = {
  id: string;
  accountId: string;
  name: string;
  group: 'business' | 'personal';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const listCategories = async (accountId: string): Promise<ExpenseCategory[]> => {
  throw new Error('not implemented');
};

export const createCategory = async (
  accountId: string,
  data: {
    name: string;
    group: 'business' | 'personal';
  },
): Promise<ExpenseCategory> => {
  throw new Error('not implemented');
};

export const updateCategory = async (
  accountId: string,
  categoryId: string,
  data: {
    name?: string;
    isActive?: boolean;
  },
): Promise<ExpenseCategory> => {
  throw new Error('not implemented');
};
