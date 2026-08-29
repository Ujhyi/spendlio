import { eq, and } from 'drizzle-orm';
import { db } from '../../services/db';
import { users, verification_tokens } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../services/password';
import { badRequest, unauthorized, notFound } from '../../shared/http-error';
import { generateUniqueClientId, generateUniqueVerificationCode, verificationExpiresAt } from '../../services/id-generator';
import { success } from 'zod';
import { sendVerificationEmail } from '../../services/email';

const DAYS_UNTIL_DELETION = 10;


// feature/registration
export async function registerUser(email: string, password: string) {
    const alreadyExists = await db.select().from(users).where(eq(users.email, email));
    if (alreadyExists.length > 0) {
        throw badRequest("Users with this email already exists.")
    }

    const clientId = await generateUniqueClientId();
    const passwordHash = await hashPassword(password);
    const [created] = await db.insert(users).values({ email, passwordHash, clientId }).returning();
    const code = await createVerificationCode(created.clientId);
    await sendVerificationEmail(email, code);

    return { id: created.id, clientId: created.clientId, email: created.email };
}

// feature/create-register-verification-code
async function createVerificationCode(clientId: number) {
    const code = await generateUniqueVerificationCode();
    await db.insert(verification_tokens).values({ clientId, code, purpose: 'email_verification', isUsed: 0, expiresAt: verificationExpiresAt(), });
    return code;
}

// feature/register-verification
export async function verifyEmail(email: string, code: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) { throw notFound('User not found.'); }
    if (user.emailVerified === 1) { throw badRequest('User already verified.'); }

    const [token] = await db.select().from(verification_tokens)
        .where(and(
            eq(verification_tokens.clientId, user.clientId),
            eq(verification_tokens.code, code),
            eq(verification_tokens.purpose, 'email_verification'),
            eq(verification_tokens.isUsed, 0),
        ));

    if (!token) { throw badRequest('Incorrect or used verification code.'); }
    if (token.expiresAt < new Date()) { throw badRequest('Your code has already expired, resend for new one.'); }

    await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, user.id));
    await db.delete(verification_tokens).where(eq(verification_tokens.id, token.id));

    return { verified: true as const };
}

// feature/resend-register-verification-code
export async function resendVerificationCode(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) { throw notFound('User not found.'); }

    if (user.emailVerified === 1) { throw badRequest('User already verified.'); }

    await db.delete(verification_tokens)
        .where(and(eq(verification_tokens.clientId, user.clientId), eq(verification_tokens.purpose, 'email_verification')));

    const code = await createVerificationCode(user.clientId);
    await sendVerificationEmail(email, code);

    return { sent: true as const };
}

// feature/login
export async function validateLogin(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    const doesNotExists = await db.select().from(users).where(eq(users.email, email))

    if (doesNotExists.length == 0) { throw badRequest("Users with this email does not exist.") }
    if (user.emailVerified === 0) { throw unauthorized("Your account has not been verified yet. Please verify first.") }
    if (!user || !(await verifyPassword(password, user.passwordHash))) { throw unauthorized("Incorect credentials.") }
    
    return user;
}

// feature/changePassword 
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) { throw notFound('Používateľ nebol nájdený.'); }

    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) { throw unauthorized("Incorrect password. "); }

    const newPasswordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId))

    return { success: true };
}

// feature/disable account
export async function disableAccount(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) { throw notFound("User not found.") }

    await db.update(users)
        .set({ disabled: 1, disabledAt: new Date() })
        .where(eq(users.id, userId));

    return {
        disabled: true as const,
        message: "Your account has been deactivated. If you do not log in within ${DAYS_UNTIL_DELETION} days, it will be permanently deleted."
    }
}