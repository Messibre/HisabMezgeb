import { describe, it, expect } from 'vitest';
import {
  createDebtCustomerSchema,
  updateDebtCustomerSchema,
  listDebtCustomersSchema,
  getDebtCustomerSchema,
} from '../../src/schemas/debtCustomer.schema.js';

describe('DebtCustomer Schema', () => {
  describe('createDebtCustomerSchema', () => {
    it('should validate a valid customer payload with note', () => {
      const result = createDebtCustomerSchema.safeParse({
        body: {
          name: 'John Doe',
          note: 'Phone: 0911223344',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.name).toBe('John Doe');
      expect(result.data?.body.note).toBe('Phone: 0911223344');
    });

    it('should validate without optional note', () => {
      const result = createDebtCustomerSchema.safeParse({
        body: {
          name: 'Jane Smith',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.note).toBeUndefined();
    });

    it('should reject empty name', () => {
      const result = createDebtCustomerSchema.safeParse({
        body: {
          name: '',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Customer name is required');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = createDebtCustomerSchema.safeParse({
        body: {
          name: longName,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('100');
    });

    it('should reject missing name', () => {
      const result = createDebtCustomerSchema.safeParse({
        body: {
          note: 'Some note',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateDebtCustomerSchema', () => {
    it('should validate updating name only', () => {
      const result = updateDebtCustomerSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          name: 'Updated Name',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating note only', () => {
      const result = updateDebtCustomerSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          note: 'Updated note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating both name and note', () => {
      const result = updateDebtCustomerSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          name: 'New Name',
          note: 'New note',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty body (no updates)', () => {
      const result = updateDebtCustomerSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in params', () => {
      const result = updateDebtCustomerSchema.safeParse({
        params: { id: 'not-a-uuid' },
        body: { name: 'New Name' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid customer ID format');
    });
  });

  describe('listDebtCustomersSchema', () => {
    it('should validate without search parameter', () => {
      const result = listDebtCustomersSchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });

    it('should validate with search parameter', () => {
      const result = listDebtCustomersSchema.safeParse({
        query: { search: 'John' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject search if not a string', () => {
      const result = listDebtCustomersSchema.safeParse({
        query: { search: 123 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getDebtCustomerSchema', () => {
    it('should validate valid UUID in params', () => {
      const result = getDebtCustomerSchema.safeParse({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = getDebtCustomerSchema.safeParse({
        params: { id: 'not-a-uuid' },
      });
      expect(result.success).toBe(false);
    });
  });
});
