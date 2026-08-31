import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import '../../plugins/auth-plugin';
import {
  budgetSchema, upsertBudgetBodySchema,
  deleteBudgetParamsSchema, deleteBudgetResponseSchema,
} from './budget-schema';
import { listBudgetsWithProgress, upsertBudget, deleteBudget } from './budget-service';

export async function budgetRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/v1/budgets', {
    onRequest: [app.authenticate],
    schema: { tags: ['budgets'], security: [{ bearerAuth: [] }], response: { 200: z.array(budgetSchema) } },
  }, async (request) => listBudgetsWithProgress(request.user.clientId));

  server.post('/v1/budgets', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['budgets'], security: [{ bearerAuth: [] }],
      body: upsertBudgetBodySchema, response: { 200: budgetSchema },
    },
  }, async (request) => {
    const { category, period, limitAmount } = request.body;
    return upsertBudget(request.user.clientId, category, period, limitAmount);
  });

  server.delete('/v1/budgets/:category', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['budgets'], security: [{ bearerAuth: [] }],
      params: deleteBudgetParamsSchema, response: { 200: deleteBudgetResponseSchema },
    },
  }, async (request) => deleteBudget(request.user.clientId, request.params.category));
}