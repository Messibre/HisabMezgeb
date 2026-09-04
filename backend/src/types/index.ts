import { Request } from 'express';
import { Prisma } from '@prisma/client';

export interface AuthRequest extends Request {
  accountId?: string;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const SAFE_ACCOUNT_SELECT = {
  id: true,
  phoneNumber: true,
  shopName: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeAccount = Prisma.AccountGetPayload<{
  select: typeof SAFE_ACCOUNT_SELECT;
}>;

export type DateRange = {
  from: Date;
  to: Date;
};

export type SoftDeletable = {
  deletedAt: Date | null;
};

export type MonetaryAmount = number;

export type ApiResponse<T = any> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  statusCode: number;
  success: false;
  message: string;
  errors: string[];
};
