import { describe, it, expect } from 'vitest';
import { createPaymentSchema, updatePaymentSchema } from '../../src/schemas/debtPayment.schema.js';

describe('DebtPayment Schema', () => {
  describe('createPaymentSchema', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate a valid payment payload with all fields', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 500.5,
          note: 'Partial payment',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.date).toBeInstanceOf(Date);
      expect(result.data?.body.amount).toBe(500.5);
      expect(result.data?.body.note).toBe('Partial payment');
    });

    it('should validate without optional note', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 500,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should reject amount <= 0 (must be positive)', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 0,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject negative amount', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: -100,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 500.555,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at most 2 decimal places');
    });

    it('should reject invalid customer ID format', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: {
          date: '2026-06-01',
          amount: 500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid customer ID format');
    });

    it('should reject invalid date format', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: 'not-a-date',
          amount: 500,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });

    it('should reject missing date', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          amount: 500,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const result = createPaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePaymentSchema', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate updating amount only', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          amount: 300,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating note only', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          note: 'Updated payment note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating both amount and note', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: validUUID },
        body: {
          amount: 300,
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: validUUID },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { amount: 300 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid payment ID format');
    });

    it('should reject amount <= 0 in update', () => {
      const result = updatePaymentSchema.safeParse({
        params: { id: validUUID },
        body: { amount: 0 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });
  });
});
