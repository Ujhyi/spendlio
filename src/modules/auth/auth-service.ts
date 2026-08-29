import { eq } from 'drizzle-orm';
import { db } from '../../services/db';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../services/password';
import { badRequest, unauthorized, notFound } from '../../shared/http-error';
import { success } from 'zod';

export async function registerUser (email: string, password: string) {
    const alreadyExists = await db.select().from(users).where(eq(users.email, email));
    if (alreadyExists.length > 0) {
        throw badRequest ("Users with this email already exists.")
    }

    const passwordHash = await hashPassword (password);
    const [created] = await db.insert(users).values({ email, passwordHash }).returning();

    return { id: created.id, email: created.email };
}

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

export async function changePassword (userId: string, oldPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) { throw notFound('Používateľ nebol nájdený.'); }
  
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) { throw unauthorized ("Incorrect password. "); }

    const newPasswordHash = await hashPassword (newPassword);
    await db.update(users).set({passwordHash: newPasswordHash}).where(eq(users.id, userId))

    return { success: true };
}