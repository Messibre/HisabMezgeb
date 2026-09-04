import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const listCategories = async (accountId: string) => {
  throw new Error('not implemented');
};

export const createCategory = async (
  accountId: string,
  data: {
    name: string;
    group: 'business' | 'personal';
  },
) => {
  throw new Error('not implemented');
};

export const updateCategory = async (
  accountId: string,
  categoryId: string,
  data: {
    name?: string;
    isActive?: boolean;
  },
) => {
  throw new Error('not implemented');
};
