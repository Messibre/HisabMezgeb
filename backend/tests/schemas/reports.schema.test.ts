import { describe, it, expect } from 'vitest';
import { reportPeriodSchema } from '../../src/schemas/reports.schema.js';

describe('Reports Schema', () => {
  describe('reportPeriodSchema', () => {
    it('should validate valid date range (from before to)', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.query.from).toBeInstanceOf(Date);
      expect(result.data?.query.to).toBeInstanceOf(Date);
    });

    it('should validate when from equals to', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: '2026-06-01',
          to: '2026-06-01',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject from date after to date', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: '2026-12-31',
          to: '2026-01-01',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'from date must be before or equal to to date',
      );
    });

    it('should reject missing from date', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing to date', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: '2026-01-01',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid from date format', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: 'not-a-date',
          to: '2026-12-31',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected date, received Date',
      );
    });

    it('should reject invalid to date format', () => {
      const result = reportPeriodSchema.safeParse({
        query: {
          from: '2026-01-01',
          to: 'not-a-date',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
