import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { badRequestResponseSchema, unauthorizedResponseSchema, notFoundResponseSchema, internalErrorResponseSchema, } from '../shared/error-schema';

const STANDARD_ERRORS = {
  400: badRequestResponseSchema,
  401: unauthorizedResponseSchema,
  404: notFoundResponseSchema,
  500: internalErrorResponseSchema,
};

export default fp(async function globalErrorResponses(app: FastifyInstance) {
  app.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.schema) return;

    const existingResponse = routeOptions.schema.response as Record<string, unknown> | undefined;

    routeOptions.schema.response = {
      ...STANDARD_ERRORS,
      ...existingResponse,
    };
  });
});