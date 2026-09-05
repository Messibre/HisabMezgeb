import { describe, it, expect } from 'vitest';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
} from '../../src/schemas/expense.schema.js';

describe('Expense Schema', () => {
  describe('createExpenseSchema', () => {
    it('should validate a valid create payload', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 1500.5,
          note: 'Daily expense',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.date).toBeInstanceOf(Date);
      expect(result.data?.body.amount).toBe(1500.5);
      expect(result.data?.body.note).toBe('Daily expense');
      expect(result.data?.body.categoryId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should validate without optional note', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 1500.5,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should allow amount of 0 (zero expense day)', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 0,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: -100,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('0 or greater');
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 1500.555,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at most 2 decimal places');
    });

    it('should reject invalid UUID for categoryId', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          categoryId: 'not-a-uuid',
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid category ID format');
    });

    it('should reject missing categoryId', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: 'not-a-date',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });
  });

  describe('updateExpenseSchema', () => {
    it('should validate a valid update payload', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          amount: 2000,
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only amount', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { amount: 2000 },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only note', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { note: 'Updated note' },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { amount: 2000 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid expense ID format');
    });

    it('should reject negative amount in update', () => {
      const result = updateExpenseSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { amount: -100 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listExpensesSchema', () => {
    it('should validate valid date range without categoryId', () => {
      const result = listExpensesSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.query.from).toBeInstanceOf(Date);
      expect(result.data?.query.to).toBeInstanceOf(Date);
    });

    it('should validate valid date range with categoryId', () => {
      const result = listExpensesSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: '2026-12-31',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid categoryId format when provided', () => {
      const result = listExpensesSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: '2026-12-31',
          categoryId: 'not-a-uuid',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid category ID format');
    });

    it('should reject missing from date', () => {
      const result = listExpensesSchema.safeParse({
        query: { to: '2026-12-31' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing to date', () => {
      const result = listExpensesSchema.safeParse({
        query: { from: '2026-01-01' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid from date', () => {
      const result = listExpensesSchema.safeParse({
        query: {
          from: 'not-a-date',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
