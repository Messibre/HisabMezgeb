import { prisma } from '../config/db.js';
import { SAFE_ACCOUNT_SELECT, SafeAccount } from '../types/index.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getSettings = async (accountId: string) => {
  throw new Error('not implemented');
};

export const updateSettings = async (
  accountId: string,
  data: {
    language?: 'en' | 'am' | 'ti';
    notificationsEnabled?: boolean;
  },
) => {
  throw new Error('not implemented');
};
