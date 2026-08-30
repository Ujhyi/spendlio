import { z } from 'zod';
import { refreshTokens } from '../../db/schema';

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerResponseSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  email: z.string(),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
});

export const changePasswordBodySchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
});

export const disableAccountResponseSchema = z.object({
  disabled: z.literal(true),
  message: z.string(),
});

export const verifyEmailBodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const verifyEmailResponseSchema = z.object({
  verified: z.literal(true),
});

export const resendVerificationBodySchema = z.object({
  email: z.string().email(),
});

export const resendVerificationResponseSchema = z.object({
  sent: z.literal(true),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string(),
});

export const refreshResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string(),
});

export const logoutResponseSchema = z.object({
  loggedOut: z.literal(true),
});


export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;