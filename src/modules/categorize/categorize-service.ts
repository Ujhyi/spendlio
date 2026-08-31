import { db } from '../../services/db';
import { transactions } from '../../db/schema';
import { internalError, badRequest } from '../../shared/http-error';
import { convertAmount, type Currency } from '../../services/exchange-rate';
import { getUserBaseCurrency } from '../settings/settings-service';

// import { categorizeText, categorizeReceiptImage } from '../../services/gemini';
import { categorizeText, categorizeReceiptImage } from '../../services/ollama';

function serializeTransaction(t: typeof transactions.$inferSelect, baseCurrency: string) {
  return {
    id: t.id, date: t.date.toISOString(), merchant: t.merchant, shop: t.shop,
    amount: t.amount, currency: t.currency, amountInBaseCurrency: t.amount, baseCurrency,
    category: t.category, source: t.source,
  };
}

function safeParseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
}

export async function categorizeAndSave(clientId: number, text: string) {
  const baseCurrency = await getUserBaseCurrency(clientId);

  let parsed;
  try {
    parsed = await categorizeText(text);
  } catch (err) {
    console.error('DEBUG categorizeText error:', err);
    throw internalError('Kategorizácia zlyhala, skús to znova.');
  }

  const rows = parsed.map((p: any) => ({
    date: safeParseDate(p.date),
    merchant: p.merchant,
    shop: p.shop || null,
    amount: p.amount,
    currency: baseCurrency, // <- AI kategorizované transakcie sú tiež v aktuálnej mene používateľa
    category: p.category,
    source: 'ai_text' as const,
    clientId,
  }));

  const inserted = await db.insert(transactions).values(rows).returning();
  return inserted.map((t) => serializeTransaction(t, baseCurrency));
}

export async function categorizeReceiptAndSave(clientId: number, base64Image: string, mimeType: string) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw badRequest('Nepodporovaný formát obrázka. Použi JPEG, PNG alebo WebP.');
  }

  const baseCurrency = await getUserBaseCurrency(clientId);

  let parsed;
  try {
    parsed = await categorizeReceiptImage(base64Image, mimeType);
  } catch {
    throw internalError('Spracovanie účtenky zlyhalo, skús to znova.');
  }

  const rows = parsed.map((p: any) => ({
    date: safeParseDate(p.date),
    merchant: p.merchant,
    shop: p.shop ?? null,
    amount: p.amount,
    currency: baseCurrency,
    category: p.category,
    source: 'ai_receipt' as const,
    clientId,
  }));

  const inserted = await db.insert(transactions).values(rows).returning();
  return inserted.map((t) => serializeTransaction(t, baseCurrency));
}