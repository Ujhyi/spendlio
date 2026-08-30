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
import { refreshBodySchema, refreshResponseSchema, logoutBodySchema, logoutResponseSchema, } from './auth-schema';
import { createRefreshToken, validateRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../../services/refresh-token';
import { unauthorizedResponseSchema } from '../../shared/error-schema';
import { googleLoginBodySchema } from './auth-schema';
import { loginWithGoogle } from './auth-service';


export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post('/v1/auth/register', {
    schema: {
      tags: ['authentication'],
      body: registerBodySchema,
      response: { 201: registerResponseSchema },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;
    const user = await registerUser(email, password);
    return reply.status(201).send(user);
  });

  server.post('/v1/auth/login', {
    schema: {
      tags: ['authentication'],
      body: loginBodySchema,
      response: { 200: loginResponseSchema },
    },
  }, async (request) => {
    const { email, password } = request.body;
    const user = await validateLogin(email, password);
    const token = app.jwt.sign({ userId: user.id, clientId: user.clientId, email: user.email }, { expiresIn: '15m' });
    const refreshToken = await createRefreshToken(user.clientId);
    return { token, refreshToken };
  });

  server.post('/v1/auth/verify-email', {
    schema: {
      tags: ['authentication'],
      body: verifyEmailBodySchema,
      response: { 200: verifyEmailResponseSchema },
    },
  }, async (request) => {
    const { email, code } = request.body;
    return verifyEmail(email, code);
  });

  server.post('/v1/auth/resend-verification', {
    schema: {
      tags: ['authentication'],
      body: resendVerificationBodySchema,
      response: { 200: resendVerificationResponseSchema },
    },
  }, async (request) => {
    const { email } = request.body;
    return resendVerificationCode(email);
  });

  server.post('/v1/auth/change-password', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['authentication'],
      security: [{ bearerAuth: [] }],
      body: changePasswordBodySchema,
      response: { 200: changePasswordResponseSchema },
    },
  }, async (request) => {
    const { oldPassword, newPassword } = request.body;
    return changePassword(request.user.userId, oldPassword, newPassword);
  });

  server.post('/v1/auth/disable-account', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['authentication'],
      security: [{ bearerAuth: [] }],
      response: { 200: disableAccountResponseSchema },
    },
  }, async (request) => {
    return disableAccount(request.user.userId);
  });

  server.post('/v1/auth/refresh-token', {
    schema: {
      tags: ['authentication'],
      body: refreshBodySchema,
      response: {
        200: refreshResponseSchema,
        401: unauthorizedResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body;
    const user = await validateRefreshToken(refreshToken);

    if (!user) {
      return reply.status(401).send({ statusCode: 401, error: 'UNAUTHORIZED', message: 'Refresh token is invalid.' });
    }

    const newAccessToken = app.jwt.sign({ userId: user.id, clientId: user.clientId, email: user.email }, { expiresIn: '15m' });
    const newRefreshToken = await rotateRefreshToken(refreshToken, user.clientId);

    return { token: newAccessToken, refreshToken: newRefreshToken };
  });

  server.post('/v1/auth/logout', {
    schema: {
      tags: ['authentication'],
      body: logoutBodySchema,
      response: { 200: logoutResponseSchema },
    },
  }, async (request) => {
    const { refreshToken } = request.body;
    await revokeRefreshToken(refreshToken);
    return { loggedOut: true as const };
  });


  server.post('/v1/auth/google', {
    schema: {
      tags: ['authentication'],
      body: googleLoginBodySchema,
      response: { 200: loginResponseSchema },
    },
  }, async (request) => {
    const { credential } = request.body;
    const user = await loginWithGoogle(credential);

    const token = app.jwt.sign({ userId: user.id, clientId: user.clientId, email: user.email }, { expiresIn: '15m' });
    const refreshToken = await createRefreshToken(user.clientId);

    return { token, refreshToken };
  });


}