import { eq, and } from 'drizzle-orm';
import { db } from '../../services/db';
import { transactions } from '../../db/schema';
import { notFound } from '../../shared/http-error';
import { convertAmount, type Currency } from '../../services/exchange-rate';
import { getUserBaseCurrency } from '../settings/settings-service';
import type { CreateTransactionBody, UpdateTransactionBody } from './transaction-schema';

async function toResponse(t: typeof transactions.$inferSelect, baseCurrency: string) {
  const amountInBaseCurrency = await convertAmount(t.amount, t.currency as Currency, baseCurrency as Currency);
  return {
    id: t.id,
    date: t.date.toISOString(),
    merchant: t.merchant,
    shop: t.shop,
    amount: t.amount,
    currency: t.currency,
    amountInBaseCurrency,
    baseCurrency,
    category: t.category,
    source: t.source,
  };
}

export async function listTransactions(clientId: number) {
  const baseCurrency = await getUserBaseCurrency(clientId);
  const rows = await db.select().from(transactions).where(eq(transactions.clientId, clientId));
  return Promise.all(rows.map((r) => toResponse(r, baseCurrency)));
}

export async function createTransaction(clientId: number, data: CreateTransactionBody) {
  const baseCurrency = await getUserBaseCurrency(clientId);

  const [created] = await db.insert(transactions).values({
    date: new Date(data.date),
    merchant: data.merchant,
    shop: data.shop ?? null,
    amount: data.amount,
    currency: baseCurrency, // <- nová transakcia je vždy v aktuálnej mene používateľa
    category: data.category,
    source: 'manual',
    clientId,
  }).returning();

  return toResponse(created, baseCurrency);
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
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
    })
    .where(eq(transactions.id, id))
    .returning();

  const baseCurrency = await getUserBaseCurrency(clientId);
  return toResponse(updated, baseCurrency);
}

export async function deleteTransaction(clientId: number, id: number) {
  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.clientId, clientId)));

  if (!existing) {
    throw notFound('Transakcia nebola nájdená.');
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  return { deleted: true };
}