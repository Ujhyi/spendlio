import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from '../db/schema';

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
    throw new Error ("Unable to generate unique clientId after few attempts");
}