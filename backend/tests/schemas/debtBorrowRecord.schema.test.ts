import { describe, it, expect } from 'vitest';
import {
  createBorrowRecordSchema,
  updateBorrowRecordSchema,
} from '../../src/schemas/debtBorrowRecord.schema.js';

describe('DebtBorrowRecord Schema', () => {
  describe('createBorrowRecordSchema', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate a valid borrow record payload with all fields', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 1000.5,
          itemsDescription: 'Items purchased from the shop',
          note: 'Customer took on credit',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.date).toBeInstanceOf(Date);
      expect(result.data?.body.amount).toBe(1000.5);
      expect(result.data?.body.itemsDescription).toBe('Items purchased from the shop');
      expect(result.data?.body.note).toBe('Customer took on credit');
    });

    it('should validate without optional note', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 1000,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should reject amount <= 0 (must be positive)', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 0,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject negative amount', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: -100,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 1000.555,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at most 2 decimal places');
    });

    it('should reject empty itemsDescription', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 1000,
          itemsDescription: '',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Items description is required');
    });

    it('should reject missing itemsDescription', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: '2026-06-01',
          amount: 1000,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid customer ID format', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: {
          date: '2026-06-01',
          amount: 1000,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid customer ID format');
    });

    it('should reject invalid date format', () => {
      const result = createBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          date: 'not-a-date',
          amount: 1000,
          itemsDescription: 'Items purchased',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });
  });

  describe('updateBorrowRecordSchema', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate updating amount only', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          amount: 1500,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating itemsDescription only', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          itemsDescription: 'Updated items description',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating note only', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating all fields', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {
          amount: 1500,
          itemsDescription: 'Updated items',
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { amount: 1500 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid borrow record ID format');
    });

    it('should reject amount <= 0 in update', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: { amount: 0 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('greater than 0');
    });

    it('should reject empty itemsDescription in update', () => {
      const result = updateBorrowRecordSchema.safeParse({
        params: { id: validUUID },
        body: { itemsDescription: '' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Too small: expected string to have >=1 characters',
      );
    });
  });
});
