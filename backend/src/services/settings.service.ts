import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export interface AppSettings {
  id: string;
  accountId: string;
  language: 'en' | 'am' | 'ti';
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const getSettings = async (accountId: string): Promise<AppSettings> => {
  throw new Error('not implemented');
};

export const updateSettings = async (
  accountId: string,
  data: {
    language?: 'en' | 'am' | 'ti';
    notificationsEnabled?: boolean;
  },
): Promise<AppSettings> => {
  throw new Error('not implemented');
};
