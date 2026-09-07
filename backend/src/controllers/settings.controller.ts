import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { getSettings, updateSettings } from '../services/settings.service.js';

export const getSettingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const settings = await getSettings(accountId);
  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Settings fetched', settings));
});

export const updateSettingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { language, notificationsEnabled } = req.body;
  const settings = await updateSettings(accountId, { language, notificationsEnabled });
  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Settings updated', settings));
});
