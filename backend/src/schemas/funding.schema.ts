import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

const fundingTypeEnum = z.enum(['salary_injection', 'borrowed_in', 'borrowed_repaid']);

export const createFundingSchema = z.object({
  body: z.object({
    date: dateSchema,
    type: fundingTypeEnum,
    amount: amountSchema,
    note: z.string().optional(),
  }),
});

export const updateFundingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid funding ID format'),
  }),
  body: z.object({
    amount: amountSchema.optional(),
    note: z.string().optional(),
  }),
});

export const listFundingSchema = z.object({
  query: z.object({
    from: dateSchema,
    to: dateSchema,
  }),
});

export type CreateFundingInput = z.infer<typeof createFundingSchema>['body'];
export type UpdateFundingInput = z.infer<typeof updateFundingSchema>['body'];
export type ListFundingQuery = z.infer<typeof listFundingSchema>['query'];
