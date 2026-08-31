import { eq } from 'drizzle-orm';
import { db } from '../../services/db';
import { accountSettings } from '../../db/schema';

export async function getSettings(clientId: number) {
  const [existing] = await db.select().from(accountSettings).where(eq(accountSettings.clientId, clientId));

  if (existing) {
    return { baseCurrency: existing.baseCurrency };
  }

  // ak zatiaľ neexistuje riadok nastavení, vytvor default (EUR)
  const [created] = await db.insert(accountSettings).values({ clientId }).returning();
  return { baseCurrency: created.baseCurrency };
}

export async function updateSettings(clientId: number, baseCurrency: string) {
  const [existing] = await db.select().from(accountSettings).where(eq(accountSettings.clientId, clientId));

  if (existing) {
    const [updated] = await db.update(accountSettings)
      .set({ baseCurrency, updatedAt: new Date() })
      .where(eq(accountSettings.clientId, clientId))
      .returning();
    return { baseCurrency: updated.baseCurrency };
  }

  const [created] = await db.insert(accountSettings).values({ clientId, baseCurrency }).returning();
  return { baseCurrency: created.baseCurrency };
}

export async function getUserBaseCurrency(clientId: number): Promise<string> {
  const settings = await getSettings(clientId);
  return settings.baseCurrency;
}