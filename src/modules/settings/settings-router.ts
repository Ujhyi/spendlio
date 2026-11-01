import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { settingsResponseSchema, updateSettingsBodySchema } from './settings-schema';
import { getSettings, updateSettings } from './settings-service';
import '../../plugins/auth-plugin';

export async function settingsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get('/v1/settings', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['settings'],
      security: [{ bearerAuth: [] }],
      response: { 200: settingsResponseSchema },
    },
  }, async (request) => {
    return getSettings(request.user.clientId);
  });

  server.patch('/v1/settings', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['settings'],
      security: [{ bearerAuth: [] }],
      body: updateSettingsBodySchema,
      response: { 200: settingsResponseSchema },
    },
  }, async (request) => {
    return updateSettings(request.user.clientId, request.body.baseCurrency);
  });
}