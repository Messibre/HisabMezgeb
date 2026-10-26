import { z } from 'zod';

export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '');

  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  if (normalized.startsWith('0')) {
    normalized = '+251' + normalized.slice(1);
  }

  if (normalized.startsWith('251') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  if (!normalized.startsWith('+') || normalized.length < 12) {
    throw new Error('Invalid phone number format');
  }

  return normalized;
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  if (!/^[+\d\s()-]+$/.test(phone)) return false;
  try {
    normalizePhone(phone);
    return true;
  } catch {
    return false;
  }
}

export const createPhoneSchema = (errorMessage: string = 'Enter a valid phone number') =>
  z
    .string()
    .min(1, errorMessage)
    .refine((val) => isValidPhone(val), {
      message: errorMessage,
    });
