import { z } from 'zod';

const groupEnum = z.enum(['business', 'personal']);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    group: groupEnum,
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
