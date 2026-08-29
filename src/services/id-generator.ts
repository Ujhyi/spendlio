import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, verification_tokens } from '../db/schema';

const MIN = 100000;
const MAX = 999999;
const MAX_ATTEMPTS = 20;

function randomSixDigit(): number {
    return Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
}

export async function generateUniqueClientId(): Promise<number> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = randomSixDigit();
        const existing = await db.select().from(users).where(eq(users.clientId, candidate))
        if (existing.length === 0) { return candidate; }
    }
    throw new Error ("Unable to generate unique clientId after few attempts.");
}

export async function generateUniqueVerificationCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = randomSixDigit().toString();
        const existing = await db.select().from(verification_tokens).where(eq(verification_tokens.code, candidate));
        if (existing.length === 0) {
            return candidate;
        }
    }
    throw new Error('Unable to generate unique verification code after few attempts.');
}

export function verificationExpiresAt(): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);
    return expires;
}