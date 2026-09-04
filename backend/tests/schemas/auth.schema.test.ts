import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../../src/schemas/auth.schema.js';

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a valid registration payload', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
          password: 'securePass123',
          shopName: 'My Shop',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept registration without shopName', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.body.shopName).toBeUndefined();
    });

    it('should reject phone number shorter than 10 digits', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: '123',
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at least 10 digits');
    });

    it('should reject phone number with invalid characters', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: 'abc1234567',
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid phone number format');
    });

    it('should accept phone number with spaces and punctuation (normalized later)', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: '+251 91 122 3344',
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
          password: '1234567',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at least 8 characters');
    });

    it('should reject missing phoneNumber', () => {
      const result = registerSchema.safeParse({
        body: {
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate a valid login payload', () => {
      const result = loginSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing phoneNumber', () => {
      const result = loginSchema.safeParse({
        body: {
          password: 'securePass123',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        body: {
          phoneNumber: '+251911223344',
          password: '',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Password is required');
    });
  });

  describe('refreshTokenSchema', () => {
    it('should accept an empty body (refresh token is read from cookie)', () => {
      const result = refreshTokenSchema.safeParse({ body: {} });
      expect(result.success).toBe(true);
    });

    it('should reject extra fields in body', () => {
      const result = refreshTokenSchema.safeParse({
        body: { extra: 'field' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate a valid password change payload', () => {
      const result = changePasswordSchema.safeParse({
        body: {
          currentPassword: 'oldPass123',
          newPassword: 'newPass456',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing currentPassword', () => {
      const result = changePasswordSchema.safeParse({
        body: {
          newPassword: 'newPass456',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing newPassword', () => {
      const result = changePasswordSchema.safeParse({
        body: {
          currentPassword: 'oldPass123',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty currentPassword', () => {
      const result = changePasswordSchema.safeParse({
        body: {
          currentPassword: '',
          newPassword: 'newPass456',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Current password is required');
    });

    it('should reject newPassword shorter than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        body: {
          currentPassword: 'oldPass123',
          newPassword: '1234567',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('at least 8 characters');
    });
  });
});
