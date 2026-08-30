import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  transactionSchema, createTransactionBodySchema,
  transactionParamsSchema, deleteResponseSchema,
} from '../transaction/transaction-schema';
import { listTransactions, createTransaction, deleteTransaction } from '../transaction/transaction-service';

export async function transactionRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/v1/transactions', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['transactions'],
      security: [{ bearerAuth: [] }],
      response: { 200: z.array(transactionSchema) },
    },
  }, async (request) => {
    return listTransactions(request.user.userId);
  });

  server.post('/v1/transactions', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['transactions'],
      security: [{ bearerAuth: [] }],
      body: createTransactionBodySchema,
      response: { 201: transactionSchema },
    },
  }, async (request, reply) => {
    const created = await createTransaction(request.user.userId, request.body);
    return reply.status(201).send(created);
  });

  server.delete('/v1/transactions/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['transactions'],
      security: [{ bearerAuth: [] }],
      params: transactionParamsSchema,
      response: { 200: deleteResponseSchema },
    },
  }, async (request) => {
    return deleteTransaction(request.user.userId, request.params.id);
  });
}