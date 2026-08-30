import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  transactionSchema, createTransactionBodySchema,
  transactionParamsSchema, deleteResponseSchema,
  updateTransactionBodySchema,
} from '../transaction/transaction-schema';
import { listTransactions, createTransaction, deleteTransaction, updateTransaction } from '../transaction/transaction-service';

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
    return listTransactions(request.user.clientId);
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
    const created = await createTransaction(request.user.clientId, request.body);
    return reply.status(201).send(created);
  });

  server.patch('/v1/transactions/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['transactions'], security: [{ bearerAuth: [] }],
      params: transactionParamsSchema, body: updateTransactionBodySchema,
      response: { 200: transactionSchema },
    },
  }, async (request) => updateTransaction(request.user.clientId, request.params.id, request.body));

  server.delete('/v1/transactions/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['transactions'],
      security: [{ bearerAuth: [] }],
      params: transactionParamsSchema,
      response: { 200: deleteResponseSchema },
    },
  }, async (request) => {
    return deleteTransaction(request.user.clientId, request.params.id);
  });
}