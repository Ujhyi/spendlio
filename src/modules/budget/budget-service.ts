import { eq, and, gte, lt } from 'drizzle-orm';
import { db } from '../../services/db';
import { budgets, transactions } from '../../db/schema';
import { getUserBaseCurrency } from '../settings/settings-service';
import { convertAmount, type Currency } from '../../services/exchange-rate';
import { getWeekRange, getMonthRange } from '../../services/date-range';
import { notFound } from '../../shared/http-error';

export async function listBudgetsWithProgress(clientId: number) {
  const baseCurrency = await getUserBaseCurrency(clientId);
  const rows = await db.select().from(budgets).where(eq(budgets.clientId, clientId));

  return Promise.all(rows.map(async (b) => {
    const { start, end } = b.period === 'week' ? getWeekRange() : getMonthRange();

    const txs = await db.select().from(transactions).where(
      and(
        eq(transactions.clientId, clientId),
        eq(transactions.category, b.category),
        gte(transactions.date, start),
        lt(transactions.date, end),
      )
    );

    let spent = 0;
    for (const t of txs) {
      spent += await convertAmount(t.amount, t.currency as Currency, baseCurrency as Currency);
    }
    spent = Math.round(spent * 100) / 100;

    return {
      id: b.id,
      category: b.category,
      period: b.period,
      limitAmount: b.limitAmount,
      spent,
      baseCurrency,
      percentage: b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0,
    };
  }));
}

export async function upsertBudget(clientId: number, category: string, period: string, limitAmount: number) {
  const [existing] = await db.select().from(budgets)
    .where(and(eq(budgets.clientId, clientId), eq(budgets.category, category)));

  if (existing) {
    await db.update(budgets)
      .set({ period, limitAmount, updatedAt: new Date() })
      .where(eq(budgets.id, existing.id));
  } else {
    await db.insert(budgets).values({ clientId, category, period, limitAmount });
  }

  const all = await listBudgetsWithProgress(clientId);
  return all.find((b) => b.category === category)!;
}

export async function deleteBudget(clientId: number, category: string) {
  const [existing] = await db.select().from(budgets)
    .where(and(eq(budgets.clientId, clientId), eq(budgets.category, category)));

  if (!existing) {
    throw notFound('Rozpočet nebol nájdený.');
  }

  await db.delete(budgets).where(eq(budgets.id, existing.id));
  return { deleted: true };
}