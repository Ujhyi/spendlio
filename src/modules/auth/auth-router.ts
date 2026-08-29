import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  registerBodySchema, registerResponseSchema,
  loginBodySchema, loginResponseSchema,
} from './auth-schema';
import { registerUser, validateLogin } from './auth-service';

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post('/auth/register', {
    schema: {
      tags: ['auth'],
      body: registerBodySchema,
      response: { 201: registerResponseSchema },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;
    const user = await registerUser(email, password);
    return reply.status(201).send(user);
  });

  server.post('/auth/login', {
    schema: {
      tags: ['auth'],
      body: loginBodySchema,
      response: { 200: loginResponseSchema },
    },
  }, async (request) => {
    const { email, password } = request.body;
    const user = await validateLogin(email, password);
    const token = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '7d' });
    return { token };
  });
}