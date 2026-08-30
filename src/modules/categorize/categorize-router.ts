import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { categorizeBodySchema, categorizeResponseSchema } from './categorize-schema';
import { categorizeAndSave } from './categorize-service';

export async function categorizeRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    server.post('/v1/categorize', {
        onRequest: [app.authenticate],
        schema: {
            tags: ['categorize'],
            security: [{ bearerAuth: [] }],
            body: categorizeBodySchema,
            response: { 200: categorizeResponseSchema },
        },
    }, async (request) => {
        return categorizeAndSave(request.user.userId, request.body.text);
    });
}