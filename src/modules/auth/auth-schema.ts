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

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;