import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { SuccessResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  registerAccount,
  loginAccount,
  refreshAccessToken,
  logoutAccount,
  changePassword as changePasswordService,
} from '../services/auth.service.js';

const getCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
} => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1',
});

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const options = getCookieOptions();
  res.cookie('access_token', accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...options,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

const clearAuthCookies = (res: Response) => {
  const options = getCookieOptions();
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, password, shopName } = req.body;

  const { account, accessToken, refreshToken } = await registerAccount(
    phoneNumber,
    password,
    shopName,
  );

  setAuthCookies(res, accessToken, refreshToken);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new SuccessResponse(HTTP_STATUS.CREATED, 'Account registered', account));
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, password } = req.body;

  const { account, accessToken, refreshToken } = await loginAccount(phoneNumber, password);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Logged in', account));
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'No refresh token provided');
  }

  const { account, accessToken } = await refreshAccessToken(refreshToken);

  const options = getCookieOptions();
  res.cookie('access_token', accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Access token refreshed', account));
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    try {
      await logoutAccount(refreshToken);
    } catch {
      // ignore
    }
  }

  clearAuthCookies(res);

  res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Logged out successfully', null));
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = req.accountId!;
  const { currentPassword, newPassword } = req.body;

  await changePasswordService(accountId, currentPassword, newPassword);

  clearAuthCookies(res);

  res.status(HTTP_STATUS.OK).json(new SuccessResponse(HTTP_STATUS.OK, 'Password updated', null));
});
