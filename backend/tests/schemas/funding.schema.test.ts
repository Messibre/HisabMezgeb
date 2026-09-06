import { describe, it, expect } from 'vitest';
import {
  createFundingSchema,
  updateFundingSchema,
  listFundingSchema,
} from '../../src/schemas/funding.schema.js';

describe('Funding Schema', () => {
  describe('createFundingSchema', () => {
    it('should validate a valid salary_injection payload', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'salary_injection',
          amount: 5000,
          note: 'Monthly salary',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.date).toBeInstanceOf(Date);
      expect(result.data?.body.type).toBe('salary_injection');
      expect(result.data?.body.amount).toBe(5000);
      expect(result.data?.body.note).toBe('Monthly salary');
    });

    it('should validate a valid borrowed_in payload', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'borrowed_in',
          amount: 10000,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.type).toBe('borrowed_in');
    });

    it('should validate a valid borrowed_repaid payload', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'borrowed_repaid',
          amount: 2000,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.type).toBe('borrowed_repaid');
    });

    it('should validate without optional note', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'salary_injection',
          amount: 5000,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should reject amount <= 0 (must be positive)', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'salary_injection',
          amount: 0,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject negative amount', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'salary_injection',
          amount: -100,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'salary_injection',
          amount: 5000.555,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at most 2 decimal places');
    });

    it('should reject invalid type (not in enum)', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          type: 'invalid_type',
          amount: 5000,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid option: expected one of "salary_injection"|"borrowed_in"|"borrowed_repaid"',
      );
    });

    it('should reject missing type', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: '2026-06-01',
          amount: 5000,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = createFundingSchema.safeParse({
        body: {
          date: 'notadate',
          type: 'salary_injection',
          amount: 5000,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });
  });

  describe('updateFundingSchema', () => {
    it('should validate a valid update payload', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          amount: 6000,
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only amount', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { amount: 6000 },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with only note', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { note: 'Updated note' },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { amount: 6000 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid funding ID format');
    });

    it('should reject amount <= 0 in update', () => {
      const result = updateFundingSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { amount: 0 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });
  });

  describe('listFundingSchema', () => {
    it('should validate valid date range', () => {
      const result = listFundingSchema.safeParse({
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
      const result = listFundingSchema.safeParse({
        query: { to: '2026-12-31' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing to date', () => {
      const result = listFundingSchema.safeParse({
        query: { from: '2026-01-01' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid from date', () => {
      const result = listFundingSchema.safeParse({
        query: {
          from: 'not-a-date',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
