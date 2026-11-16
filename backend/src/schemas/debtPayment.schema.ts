import { z } from 'zod';
import { MAX_AMOUNT, MAX_NOTE_LENGTH } from '../constants/index.js';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .max(MAX_AMOUNT, 'Amount is too large')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const createPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format'),
  }),
  body: z.object({
    date: dateSchema,
    amount: amountSchema,
    note: z.string().max(MAX_NOTE_LENGTH).optional(),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID format'),
  }),
  body: z.object({
    amount: amountSchema.optional(),
    note: z.string().max(MAX_NOTE_LENGTH).optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>['body'];
