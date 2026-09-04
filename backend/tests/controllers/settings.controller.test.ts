import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  getSettingsHandler,
  updateSettingsHandler,
} from '../../src/controllers/settings.controller.js';
import * as settingsService from '../../src/services/settings.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/settings.service.js', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

describe.skip('Settings Controller', () => {
  let req: Partial<Request> & { accountId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      accountId: 'acc-123',
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('getSettingsHandler', () => {
    const mockSettings = {
      id: 'settings-1',
      accountId: 'acc-123',
      language: 'en',
      notificationsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return settings with 200', async () => {
      (settingsService.getSettings as Mock).mockResolvedValue(mockSettings);

      await getSettingsHandler(req as Request, res as Response, next);

      expect(settingsService.getSettings).toHaveBeenCalledWith('acc-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Settings fetched',
          data: mockSettings,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new ApiError(404, 'Settings not found');
      (settingsService.getSettings as Mock).mockRejectedValue(error);

      await getSettingsHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSettingsHandler', () => {
    const mockSettings = {
      id: 'settings-1',
      accountId: 'acc-123',
      language: 'am',
      notificationsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update settings and return 200', async () => {
      req.body = { language: 'am', notificationsEnabled: false };
      (settingsService.updateSettings as Mock).mockResolvedValue(mockSettings);

      await updateSettingsHandler(req as Request, res as Response, next);

      expect(settingsService.updateSettings).toHaveBeenCalledWith('acc-123', {
        language: 'am',
        notificationsEnabled: false,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          message: 'Settings updated',
          data: mockSettings,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new ApiError(404, 'Settings not found');
      (settingsService.updateSettings as Mock).mockRejectedValue(error);
      req.body = { language: 'am' };

      await updateSettingsHandler(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle empty update payload (no-op)', async () => {
      req.body = {};
      (settingsService.updateSettings as Mock).mockResolvedValue(mockSettings);

      await updateSettingsHandler(req as Request, res as Response, next);

      expect(settingsService.updateSettings).toHaveBeenCalledWith('acc-123', {});
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
