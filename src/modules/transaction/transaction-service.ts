import { eq, and } from 'drizzle-orm';
import { db } from '../../services/db';
import { transactions } from '../../db/schema';
import { notFound } from '../../shared/http-error';
import type { CreateTransactionBody, UpdateTransactionBody } from '../transaction/transaction-schema';

function serializeTransaction(t: typeof transactions.$inferSelect) {
  return {
    id: t.id,
    date: t.date.toISOString(),
    merchant: t.merchant,
    shop: t.shop,
    amount: t.amount,
    category: t.category,
    source: t.source,
  };
}

export async function listTransactions(clientId: number) {
  const rows = await db.select().from(transactions).where(eq(transactions.clientId, clientId));
  return rows.map(serializeTransaction);
}

export async function createTransaction(clientId: number, data: CreateTransactionBody) {
  const [created] = await db.insert(transactions).values({
    date: new Date(data.date),
    merchant: data.merchant,
    shop: data.shop ?? null,
    amount: data.amount,
    category: data.category,
    source: 'manual',
    clientId,
  }).returning();
  return serializeTransaction(created);
}

export async function updateTransaction(clientId: number, id: number, data: UpdateTransactionBody) {
  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.clientId, clientId)));

  if (!existing) {
    throw notFound('Transakcia nebola nájdená.');
  }

  const [updated] = await db.update(transactions)
    .set({
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.merchant !== undefined ? { merchant: data.merchant } : {}),
      ...(data.shop !== undefined ? { shop: data.shop } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
    })
    .where(eq(transactions.id, id))
    .returning();

  return serializeTransaction(updated);
}

export async function deleteTransaction(clientId: number, id: number) {
  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.clientId, clientId)));

  if (!existing) {
    throw notFound('Transaction not found.');
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  return { deleted: true };
}