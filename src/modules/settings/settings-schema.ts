import { z } from 'zod';

export const currencyEnum = z.enum(['EUR', 'CZK', 'USD', 'GBP', 'PLN']);

export const settingsResponseSchema = z.object({
  baseCurrency: z.string(),
});

export const updateSettingsBodySchema = z.object({
  baseCurrency: currencyEnum,
});