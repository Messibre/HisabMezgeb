import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import crypto from 'crypto';

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): object => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as object;
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyRefreshToken = (token: string): object => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as object;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
