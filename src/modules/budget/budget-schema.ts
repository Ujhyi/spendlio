import { z } from 'zod';

export const periodEnum = z.enum(['week', 'month']);

export const budgetCategoryEnum = z.enum([
  'Potraviny', 'Reštaurácie', 'Doprava', 'Bývanie',
  'Zábava', 'Zdravie', 'Nákupy', 'Účty', 'Iné',
]);

export const budgetSchema = z.object({
  id: z.number(),
  category: z.string(),
  period: z.string(),
  limitAmount: z.number(),
  spent: z.number(),
  baseCurrency: z.string(),
  percentage: z.number(),
});

export const upsertBudgetBodySchema = z.object({
  category: budgetCategoryEnum,
  period: periodEnum,
  limitAmount: z.number().positive(),
});

export const deleteBudgetParamsSchema = z.object({
  category: z.string(),
});

export const deleteBudgetResponseSchema = z.object({
  deleted: z.boolean(),
});