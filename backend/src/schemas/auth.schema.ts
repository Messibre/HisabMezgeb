import { z } from 'zod';

const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\+\d\s\-\(\)]+$/, 'Invalid phone number format');

export const registerSchema = z.object({
  body: z.object({
    phoneNumber: phoneSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    shopName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phoneNumber: phoneSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({}).strict(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
