import { Request } from 'express';

export interface AuthRequest extends Request {
  // Hisab Mezgeb has one shared Account per shop, no roles/permissions —
  // the only thing auth needs to carry is which account is making the request.
  accountId?: string;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}