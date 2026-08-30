import { z } from 'zod';

export const categoryEnum = z.enum([
  'Potraviny', 'Reštaurácie', 'Doprava', 'Bývanie',
  'Zábava', 'Zdravie', 'Nákupy', 'Účty', 'Iné',
]);

export const transactionSchema = z.object({
  id: z.number(),
  date: z.coerce.string(),
  merchant: z.string(),
  amount: z.number(),
  category: z.string(),
  source: z.string(),
});

export const createTransactionBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dátum musí byť vo formáte YYYY-MM-DD'),
  merchant: z.string(),
  amount: z.number().positive(),
  category: categoryEnum,
});

export const transactionParamsSchema = z.object({
  id: z.coerce.number(),
});

export const deleteResponseSchema = z.object({
  deleted: z.boolean(),
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;