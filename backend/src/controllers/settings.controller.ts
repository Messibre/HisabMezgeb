import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { getSettings, updateSettings } from '../services/settings.service.js';

export const getSettingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});

export const updateSettingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  throw new Error('not implemented');
});
