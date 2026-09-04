import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

const amountSchema = z
  .number()
  .min(0, 'Amount must be 0 or greater')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const createExpenseSchema = z.object({
  body: z.object({
    date: dateSchema,
    categoryId: z.string().uuid('Invalid category ID format'),
    amount: amountSchema,
    note: z.string().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense ID format'),
  }),
  body: z.object({
    amount: amountSchema.optional(),
    note: z.string().optional(),
  }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    from: dateSchema,
    to: dateSchema,
    categoryId: z.string().uuid('Invalid category ID format').optional(),
  }),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>['body'];
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>['body'];
export type ListExpensesQuery = z.infer<typeof listExpensesSchema>['query'];
