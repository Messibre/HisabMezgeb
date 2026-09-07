import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { getSettings, updateSettings } from '../../src/services/settings.service.js';
import ApiError from '../../src/utils/ApiError.js';

// ── Mock Prisma ──
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    appSettings: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// ── Type definitions ──
type MockAppSettings = {
  id: string;
  accountId: string;
  language: string;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helper to get typed mocks ──
const mockFindUnique = vi.mocked(prisma.appSettings.findUnique);
const mockUpdate = vi.mocked(prisma.appSettings.update);

describe('Settings Service', () => {
  const accountId = 'acc-123';

  const mockExistingSettings: MockAppSettings = {
    id: 'settings-1',
    accountId,
    language: 'en',
    notificationsEnabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockUpdatedSettings: MockAppSettings = {
    ...mockExistingSettings,
    language: 'am',
    notificationsEnabled: false,
    updatedAt: new Date('2026-01-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return settings for the given account', async () => {
      mockFindUnique.mockResolvedValue(mockExistingSettings);

      const result = await getSettings(accountId);

      expect(mockFindUnique).toHaveBeenCalledTimes(1);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(result).toEqual(mockExistingSettings);
    });

    it('should throw 404 if settings not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(getSettings(accountId)).rejects.toThrow(ApiError);
      await expect(getSettings(accountId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Settings not found',
      });
    });

    it('should propagate database errors', async () => {
      const dbError = new Error('DB connection lost');
      mockFindUnique.mockRejectedValue(dbError);

      await expect(getSettings(accountId)).rejects.toThrow(dbError);
    });
  });

  describe('updateSettings', () => {
    it('should update both language and notifications', async () => {
      mockFindUnique.mockResolvedValue(mockExistingSettings);
      mockUpdate.mockResolvedValue(mockUpdatedSettings);

      const result = await updateSettings(accountId, {
        language: 'am',
        notificationsEnabled: false,
      });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { accountId },
        data: {
          language: 'am',
          notificationsEnabled: false,
        },
      });
      expect(result).toEqual(mockUpdatedSettings);
      expect(result.language).toBe('am');
      expect(result.notificationsEnabled).toBe(false);
    });

    it('should update only language', async () => {
      mockFindUnique.mockResolvedValue(mockExistingSettings);
      mockUpdate.mockResolvedValue({
        ...mockExistingSettings,
        language: 'ti',
      });

      const result = await updateSettings(accountId, { language: 'ti' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { accountId },
        data: { language: 'ti' },
      });
      expect(result.language).toBe('ti');
      expect(result.notificationsEnabled).toBe(mockExistingSettings.notificationsEnabled);
    });

    it('should update only notificationsEnabled', async () => {
      mockFindUnique.mockResolvedValue(mockExistingSettings);
      mockUpdate.mockResolvedValue({
        ...mockExistingSettings,
        notificationsEnabled: false,
      });

      const result = await updateSettings(accountId, { notificationsEnabled: false });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { accountId },
        data: { notificationsEnabled: false },
      });
      expect(result.notificationsEnabled).toBe(false);
      expect(result.language).toBe(mockExistingSettings.language);
    });

    it('should throw 404 if settings not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(updateSettings(accountId, { language: 'am' })).rejects.toThrow(ApiError);
      await expect(updateSettings(accountId, { language: 'am' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Settings not found',
      });
    });

    it('should return existing settings without updating when no fields are provided', async () => {
      mockFindUnique.mockResolvedValue(mockExistingSettings);

      const result = await updateSettings(accountId, {});

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(result).toEqual(mockExistingSettings);
    });

    it('should propagate database errors from findUnique', async () => {
      const dbError = new Error('DB connection lost');
      mockFindUnique.mockRejectedValue(dbError);

      await expect(updateSettings(accountId, { language: 'am' })).rejects.toThrow(dbError);
    });

    it('should propagate database errors from update', async () => {
      const dbError = new Error('Update failed');
      mockFindUnique.mockResolvedValue(mockExistingSettings);
      mockUpdate.mockRejectedValue(dbError);

      await expect(updateSettings(accountId, { language: 'am' })).rejects.toThrow(dbError);
    });
  });
});
