import { z } from 'zod';

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
});

export const changePasswordBodySchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
});


export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;