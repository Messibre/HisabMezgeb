import { describe, it, expect } from 'vitest';
import {
  createIncomeSchema,
  updateIncomeSchema,
  listIncomeSchema,
} from '../../src/schemas/income.schema.js';

describe('Income Schema', () => {
  describe('createIncomeSchema', () => {
    it('should validate a valid create payload with YYYY-MM-DD format', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 1500.5,
          note: 'Daily sales',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.date).toBeInstanceOf(Date);
      expect(result.data?.body.amount).toBe(1500.5);
      expect(result.data?.body.note).toBe('Daily sales');
    });

    // z.coerce.date() will accept many formats – we test that it works
    it('should accept other date formats that JavaScript Date can parse', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '06/01/2026',
          amount: 1500,
        },
      });
    });

    it('should reject an impossible calendar date ', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-02-35',
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });

    it('should reject a string that is not a date at all', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: 'not-adate',
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });

    it('should validate without optional note', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 1500.5,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should allow amount of 0 (no income day)', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 0,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: -100,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('0 or greater');
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 1500.555,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at most 2 decimal places');
    });

    it('should reject missing date', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          amount: 1500,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const result = createIncomeSchema.safeParse({
        body: {
          date: '2026-06-01',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateIncomeSchema', () => {
    it('should validate a valid update payload', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          amount: 2000,
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only amount', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          amount: 2000,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only note', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { amount: 2000 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid income ID format');
    });

    it('should reject negative amount in update', () => {
      const result = updateIncomeSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { amount: -100 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listIncomeSchema', () => {
    it('should validate valid date range with YYYY-MM-DD format', () => {
      const result = listIncomeSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.query.from).toBeInstanceOf(Date);
      expect(result.data?.query.to).toBeInstanceOf(Date);
    });

    it('should reject missing from date', () => {
      const result = listIncomeSchema.safeParse({
        query: {
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing to date', () => {
      const result = listIncomeSchema.safeParse({
        query: {
          from: '2026-01-01',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject a non-date string for from', () => {
      const result = listIncomeSchema.safeParse({
        query: {
          from: 'not-a-date',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
