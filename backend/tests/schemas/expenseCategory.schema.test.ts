import { describe, it, expect } from 'vitest';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../../src/schemas/expenseCategory.schema.js';

describe('ExpenseCategory Schema', () => {
  describe('createCategorySchema', () => {
    it('should validate a valid business category payload', () => {
      const result = createCategorySchema.safeParse({
        body: {
          name: 'Cost of Goods',
          group: 'business',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.name).toBe('Cost of Goods');
      expect(result.data?.body.group).toBe('business');
    });

    it('should validate a valid personal category payload', () => {
      const result = createCategorySchema.safeParse({
        body: {
          name: 'Home Necessities',
          group: 'personal',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.group).toBe('personal');
    });

    it('should reject missing name', () => {
      const result = createCategorySchema.safeParse({
        body: {
          group: 'business',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = createCategorySchema.safeParse({
        body: {
          name: '',
          group: 'business',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Category name is required');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = createCategorySchema.safeParse({
        body: {
          name: longName,
          group: 'business',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('100');
    });

    it('should reject invalid group (not business/personal)', () => {
      const result = createCategorySchema.safeParse({
        body: {
          name: 'Some Category',
          group: 'invalid',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid option: expected one of "business"|"personal"',
      );
    });

    it('should reject missing group', () => {
      const result = createCategorySchema.safeParse({
        body: {
          name: 'Some Category',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCategorySchema', () => {
    it('should validate a valid update payload (name only)', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          name: 'Updated Name',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate a valid update payload (isActive only)', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          isActive: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating both name and isActive', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          name: 'New Name',
          isActive: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { name: 'New Name' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid category ID format');
    });

    it('should reject name longer than 100 characters in update', () => {
      const longName = 'a'.repeat(101);
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { name: longName },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('100');
    });

    it('should reject isActive as non-boolean', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { isActive: 'true' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected boolean, received string',
      );
    });
  });
});
