import { z } from 'zod';

export const categoryEnum = z.enum([
  'Potraviny', 'Reštaurácie', 'Doprava', 'Bývanie',
  'Zábava', 'Zdravie', 'Nákupy', 'Účty', 'Iné',
]);

export const currencyEnum = z.enum(['EUR', 'CZK', 'USD', 'GBP', 'PLN']);

export const transactionSchema = z.object({
  id: z.number(),
  date: z.coerce.string(),
  merchant: z.string(),
  shop: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  amountInBaseCurrency: z.number(),
  baseCurrency: z.string(),
  category: z.string(),
  source: z.string(),
});

export const createTransactionBodySchema = z.object({
  date: z.string(),
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
  currency: currencyEnum.optional(),
  category: categoryEnum.optional(),
});

export const transactionParamsSchema = z.object({
  id: z.coerce.number(),
});

export const deleteResponseSchema = z.object({
  deleted: z.boolean(),
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
export type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;