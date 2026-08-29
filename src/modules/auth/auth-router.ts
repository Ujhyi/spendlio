import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  registerBodySchema, registerResponseSchema,
  verifyEmailBodySchema, verifyEmailResponseSchema,
  resendVerificationBodySchema, resendVerificationResponseSchema,
  loginBodySchema, loginResponseSchema,
  changePasswordBodySchema, changePasswordResponseSchema,
  disableAccountResponseSchema,
} from './auth-schema';
import { registerUser, verifyEmail, resendVerificationCode, validateLogin, changePassword, disableAccount } from './auth-service';

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

  server.post('/auth/verify-email', {
    schema: {
      tags: ['auth'],
      body: verifyEmailBodySchema,
      response: { 200: verifyEmailResponseSchema },
    },
  }, async (request) => {
    const { email, code } = request.body;
    return verifyEmail(email, code);
  });

  server.post('/auth/resend-verification', {
    schema: {
      tags: ['auth'],
      body: resendVerificationBodySchema,
      response: { 200: resendVerificationResponseSchema },
    },
  }, async (request) => {
    const { email } = request.body;
    return resendVerificationCode(email);
  });

  server.post('/auth/change-password', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: changePasswordBodySchema,
      response: { 200: changePasswordResponseSchema },
    },
  }, async (request) => {
    const { oldPassword, newPassword } = request.body;
    return changePassword(request.user.userId, oldPassword, newPassword);
  });

  server.post('/auth/disable-account', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: { 200: disableAccountResponseSchema },
    },
  }, async (request) => {
    return disableAccount(request.user.userId);
  });

}