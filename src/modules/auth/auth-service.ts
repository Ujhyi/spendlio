import { eq, and } from 'drizzle-orm';
import { db } from '../../services/db';
import { users, verification_tokens } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../services/password';
import { badRequest, unauthorized, notFound } from '../../shared/http-error';
import { generateUniqueClientId, generateUniqueVerificationCode, verificationExpiresAt } from '../../services/id-generator';
import { success } from 'zod';
import { sendVerificationEmail } from '../../services/email';
import { verifyGoogleToken } from '../../services/google-oauth';


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
    if (!user || !user.passwordHash) { throw unauthorized('Incorrect credentials.'); }
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) { throw unauthorized('Incorrect credentials.'); }
    if (user.disabled === 1) { throw unauthorized('Account is in disabled state.'); }
    if (user.emailVerified === 0) { throw unauthorized('Email is not verified, check your email address.'); }
    return user;
}

// feature/changePassword 
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.passwordHash) { throw notFound('User not found or login by Google OAUTH.'); }
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) { throw unauthorized('Staré heslo nie je správne.'); }
    const newPasswordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));
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

export async function loginWithGoogle(credential: string): Promise<typeof users.$inferSelect> {
    const googlePayload = await verifyGoogleToken(credential);

    if (!googlePayload.emailVerified) {
        throw unauthorized('Google účet nemá overený email.');
    }

    const [existing] = await db.select().from(users).where(eq(users.email, googlePayload.email));

    if (existing) {
        if (existing.disabled === 1) {
            throw unauthorized('Tento účet je deaktivovaný.');
        }

        if (!existing.googleId) {
            const [updated] = await db.update(users)
                .set({ googleId: googlePayload.googleId, emailVerified: 1 })
                .where(eq(users.id, existing.id))
                .returning();

            if (!updated) {
                throw notFound('Nepodarilo sa aktualizovať používateľa.');
            }
            return updated;
        }

        return existing;
    }

    const clientId = await generateUniqueClientId();
    const [created] = await db.insert(users).values({
        email: googlePayload.email,
        passwordHash: null,
        googleId: googlePayload.googleId,
        emailVerified: 1,
        clientId,
    }).returning();

    if (!created) {
        throw notFound('Nepodarilo sa vytvoriť používateľa.');
    }

    return created;
}