import { z } from 'zod';
import { transactionSchema } from '../transaction/transaction-schema';

export const categorizeBodySchema = z.object({
    text: z.string().min(1, "Array <TEXT> must be filled."),
})

export const categorizeResponseSchema = z.array(transactionSchema);