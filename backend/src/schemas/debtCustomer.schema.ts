import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

export const createDebtCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Customer name is required').max(100),
    note: z.string().optional(),
  }),
});

export const updateDebtCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    note: z.string().optional(),
  }),
});

export const listDebtCustomersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export const getDebtCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format'),
  }),
});

export type CreateDebtCustomerInput = z.infer<typeof createDebtCustomerSchema>['body'];
export type UpdateDebtCustomerInput = z.infer<typeof updateDebtCustomerSchema>['body'];
export type ListDebtCustomersQuery = z.infer<typeof listDebtCustomersSchema>['query'];
