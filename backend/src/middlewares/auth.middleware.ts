import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'No token provided');
    }

    const payload = verifyAccessToken(token) as { accountId: string };

    req.accountId = payload.accountId;
    next();
  } catch (error) {
    next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

export default authMiddleware;
