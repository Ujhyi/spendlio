import { z } from 'zod';

export const categoryEnum = z.enum([
  'Potraviny', 'Reštaurácie', 'Doprava', 'Bývanie',
  'Zábava', 'Zdravie', 'Nákupy', 'Účty', 'Iné',
]);

export const transactionSchema = z.object({
  id: z.number(),
  date: z.coerce.string(),
  merchant: z.string(),
  shop: z.string().nullable(),
  amount: z.number(),
  category: z.string(),
  source: z.string(),
});

export const createTransactionBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dátum musí byť vo formáte YYYY-MM-DD'),
  merchant: z.string(),
  shop: z.string().optional(),
  amount: z.number().positive(),
  category: categoryEnum,
});

export const updateTransactionBodySchema = z.object({
  date: z.string().optional(),
  merchant: z.string().optional(),
  shop: z.string().optional(),
  amount: z.number().positive().optional(),
  category: categoryEnum.optional(),
})

export const transactionParamsSchema = z.object({
  id: z.coerce.number(),
});

export const deleteResponseSchema = z.object({
  deleted: z.boolean(),
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
export type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;