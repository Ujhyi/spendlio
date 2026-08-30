import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import authPlugin from './plugins/auth-plugin';
import globalErrorResponse from './plugins/global-error-response';
import { HttpError } from './shared/http-error';
import { authRoutes } from './modules/auth/auth-router';
import type { FastifyError } from 'fastify';
import { transactionRoutes } from './modules/transaction/transaction-router';

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

async function main() {
  await app.register(cors);

  await app.register(swagger, {
    openapi: {
      info: { title: 'Spendlio API', version: '0.1.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(authPlugin);
  await app.register(globalErrorResponse);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof HttpError) {
        return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.errorLabel,
        message: error.message,
        });
  }

    if (error.validation) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.message });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) request.log.error(error);

    return reply.status(statusCode).send({
        statusCode,
        error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : (error.name || 'Error'),
        message: statusCode === 500 ? 'Unexpected error.' : error.message,
    });
    });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(transactionRoutes);


  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
}

main();