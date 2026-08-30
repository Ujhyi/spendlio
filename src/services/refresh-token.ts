import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { refreshTokens, users } from '../db/schema';

const REFRESH_TOKEN_DAYS = 30;

export function generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
}

export async function createRefreshToken(clientId: number) {
    const token = generateRefreshTokenString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
    await db.insert(refreshTokens).values({ token, clientId, expiresAt });
    return token;
}

export async function validateRefreshToken(token: string) {
    const [found] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    if (!found || found.expiresAt < new Date()) { return null; }
    const [user] = await db.select().from(users).where(eq(users.clientId, found.clientId));
    if (!user || user.disabled === 1) { return null; }
    return user;
}

export async function revokeRefreshToken(token: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export async function rotateRefreshToken(oldToken: string, clientId: number) {
    await revokeRefreshToken(oldToken);
    return createRefreshToken(clientId);
}