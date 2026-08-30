import { eq, and } from 'drizzle-orm';
import { db } from '../../services/db';
import { transactions } from '../../db/schema';
import { notFound } from '../../shared/http-error';
import type { CreateTransactionBody } from '../transaction/transaction-schema';

function serializeTransaction(t: typeof transactions.$inferSelect) {
  return {
    id: t.id,
    date: t.date.toISOString(),
    merchant: t.merchant,
    amount: t.amount,
    category: t.category,
    source: t.source,
  };
}

export async function listTransactions(userId: number) {
  const rows = await db.select().from(transactions).where(eq(transactions.userId, userId));
  return rows.map(serializeTransaction);
}

export async function createTransaction(userId: number, data: CreateTransactionBody) {
  const [created] = await db.insert(transactions).values({
    date: new Date(data.date),
    merchant: data.merchant,
    amount: data.amount,
    category: data.category,
    source: 'manual',
    userId,
  }).returning();
  return serializeTransaction(created);
}

export async function deleteTransaction(userId: number, id: number) {
  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  if (!existing) {
    throw notFound('Transakcia nebola nájdená.');
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  return { deleted: true };
}