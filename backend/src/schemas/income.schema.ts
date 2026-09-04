import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

const amountSchema = z
  .number()
  .min(0, 'Amount must be 0 or greater')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const createIncomeSchema = z.object({
  body: z.object({
    date: dateSchema,
    amount: amountSchema,
    note: z.string().optional(),
  }),
});

export const updateIncomeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid income ID format'),
  }),
  body: z.object({
    amount: amountSchema.optional(),
    note: z.string().optional(),
  }),
});

export const listIncomeSchema = z.object({
  query: z.object({
    from: dateSchema,
    to: dateSchema,
  }),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>['body'];
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>['body'];
export type ListIncomeQuery = z.infer<typeof listIncomeSchema>['query'];
