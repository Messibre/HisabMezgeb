import { describe, it, expect } from 'vitest';
import { updateSettingsSchema } from '../../src/schemas/settings.schema.js';

describe('Settings Schema', () => {
  describe('updateSettingsSchema', () => {
    it('should validate a valid update payload (both fields)', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          language: 'am',
          notificationsEnabled: false,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.language).toBe('am');
      expect(result.data?.body.notificationsEnabled).toBe(false);
    });

    it('should validate a payload with only language', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          language: 'ti',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.language).toBe('ti');
      expect(result.data?.body.notificationsEnabled).toBeUndefined();
    });

    it('should validate a payload with only notificationsEnabled', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          notificationsEnabled: true,
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.notificationsEnabled).toBe(true);
      expect(result.data?.body.language).toBeUndefined();
    });

    it('should validate an empty body (no updates)', () => {
      const result = updateSettingsSchema.safeParse({
        body: {},
      });
      expect(result.success).toBe(true);
      expect(result.data?.body).toEqual({});
    });

    it('should reject invalid language (not en/am/ti)', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          language: 'fr',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('option: expected one of "en"|"am"|"ti"');
    });

    it('should reject notificationsEnabled if it is not a boolean', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          notificationsEnabled: 'true',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        'Invalid input: expected boolean, received string',
      );
    });

    it('should reject extra fields in body', () => {
      const result = updateSettingsSchema.safeParse({
        body: {
          language: 'en',
          notificationsEnabled: 'true',
          extraField: 'something',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
