import { z } from 'zod';

export const badRequestResponseSchema = z.object({
    statusCode: z.literal(400),
    error: z.literal("BAD_REQUEST"),
    message: z.string(),
});

export const unauthorizedResponseSchema = z.object({
    statusCode: z.literal(401),
    error: z.literal("UNAUTHORIZED"),
    message: z.string(),
});

export const notFoundResponseSchema = z.object({
    statusCode: z.literal(404),
    error: z.literal("NOT_FOUND"),
    message: z.string(),
});

export const internalErrorResponseSchema = z.object({
    statusCode: z.literal(500),
    error: z.literal("INTERNAL_SERVER_ERROR"),
    message: z.string(),
});