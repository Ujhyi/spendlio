import cron from 'node-cron';
import { and, eq, lt } from 'drizzle-orm';
import { db } from './db';
import { users } from '../db/schema';

const DAYS_UNTIL_DELETION = 10;

export async function deleteExpiredDisabledAccounts() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_UNTIL_DELETION);

  const deleted = await db.delete(users)
    .where(and(eq(users.disabled, 1), lt(users.disabledAt, cutoffDate)))
    .returning({ id: users.id, email: users.email });

  if (deleted.length > 0) {
    console.log(`[account-cleanup] Zmazaných ${deleted.length} účtov po uplynutí ${DAYS_UNTIL_DELETION} dní.`);
  }

  return deleted;
}

export function startAccountCleanupJob() {
  cron.schedule('0 3 * * *', () => {
    deleteExpiredDisabledAccounts().catch((err) => {
      console.error('[account-cleanup] Chyba pri mazaní účtov:', err);
    });
  });

  console.log('[account-cleanup] - The scheduled task to delete disabled accounts is active.');
}