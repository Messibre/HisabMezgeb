import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const createBorrowRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format'),
  }),
  body: z.object({
    date: dateSchema,
    amount: amountSchema,
    itemsDescription: z.string().min(1, 'Items description is required'),
    note: z.string().optional(),
  }),
});

export const updateBorrowRecordSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid borrow record ID format'),
  }),
  body: z.object({
    amount: amountSchema.optional(),
    itemsDescription: z.string().min(1).optional(),
    note: z.string().optional(),
  }),
});

export type CreateBorrowRecordInput = z.infer<typeof createBorrowRecordSchema>['body'];
export type UpdateBorrowRecordInput = z.infer<typeof updateBorrowRecordSchema>['body'];
