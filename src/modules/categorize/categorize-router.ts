import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { categorizeBodySchema, categorizeResponseSchema } from './categorize-schema';
import { categorizeAndSave, categorizeReceiptAndSave } from './categorize-service';
import { badRequest } from '../../shared/http-error';

export async function categorizeRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post('/categorize', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['categorize'], security: [{ bearerAuth: [] }],
      body: categorizeBodySchema, response: { 200: categorizeResponseSchema },
    },
  }, async (request) => categorizeAndSave(request.user.clientId, request.body.text));

  app.post('/categorize-receipt', {
    onRequest: [app.authenticate],
    schema: { tags: ['categorize'], security: [{ bearerAuth: [] }] },
  }, async (request, reply) => {
    const file = await (request as any).file();
    if (!file) {
      throw badRequest('Nebol nahraný žiadny súbor.');
    }
    const buffer = await file.toBuffer();
    const base64Image = buffer.toString('base64');
    const result = await categorizeReceiptAndSave(request.user.clientId, base64Image, file.mimetype);
    return reply.status(201).send(result);
  });
}