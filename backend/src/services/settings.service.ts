import { prisma } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

export type AppSettings = {
  id: string;
  accountId: string;
  language: 'en' | 'am' | 'ti';
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const getSettings = async (accountId: string): Promise<AppSettings> => {
  const settings = await prisma.appSettings.findUnique({
    where: { accountId },
  });

  if (!settings) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Settings not found');
  }
  return settings as AppSettings;
};

export const updateSettings = async (
  accountId: string,
  data: {
    language?: 'en' | 'am' | 'ti';
    notificationsEnabled?: boolean;
  },
): Promise<AppSettings> => {
  const existing = await prisma.appSettings.findUnique({
    where: { accountId },
  });

  if (!existing) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Settings not found');
  }

  if (data.language === undefined && data.notificationsEnabled === undefined) {
    return existing as AppSettings;
  }

  const updateData: { language?: 'en' | 'am' | 'ti'; notificationsEnabled?: boolean } = {};
  if (data.language !== undefined) {
    updateData.language = data.language;
  }
  if (data.notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = data.notificationsEnabled;
  }

  const updated = await prisma.appSettings.update({
    where: { accountId },
    data: updateData,
  });

  return updated as AppSettings;
};
