import { eq } from 'drizzle-orm';
import { db } from '../../services/db';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../services/password';
import { badRequest, unauthorized, notFound } from '../../shared/http-error';
import { success } from 'zod';

const DAYS_UNTIL_DELETION = 10;


// feature/registration
export async function registerUser (email: string, password: string) {
    const alreadyExists = await db.select().from(users).where(eq(users.email, email));
    if (alreadyExists.length > 0) {
        throw badRequest ("Users with this email already exists.")
    }

    const passwordHash = await hashPassword (password);
    const [created] = await db.insert(users).values({ email, passwordHash }).returning();

    return { id: created.id, email: created.email };
}

// feature/login
export async function validateLogin (email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    const doesNotExists = await db.select().from(users).where(eq(users.email, email))

    if (doesNotExists.length == 0) {
        throw badRequest ("Users with this email does not exist.")
    }

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw unauthorized ("Incorect credentials.")
    }
    return user;
}

// feature/changePassword 
export async function changePassword (userId: string, oldPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) { throw notFound('Používateľ nebol nájdený.'); }
  
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) { throw unauthorized ("Incorrect password. "); }

    const newPasswordHash = await hashPassword (newPassword);
    await db.update(users).set({passwordHash: newPasswordHash}).where(eq(users.id, userId))

    return { success: true };
}

// feature/disable account
export async function disableAccount(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) { throw notFound ("User not found.")}

    await db.update(users)
        .set({ disabled: 1, disabledAt: new Date() })
        .where(eq(users.id, userId));
    
    return {
        disabled: true as const,
        message: "Your account has been deactivated. If you do not log in within ${DAYS_UNTIL_DELETION} days, it will be permanently deleted."
    }
}