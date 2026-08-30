import { db } from '../../services/db';
import { transactions } from '../../db/schema';
//import { categorizeText } from '../../services/anthropic';
import { categorizeText, categorizeReceiptImage } from '../../services/gemini';
import { internalError, badRequest } from '../../shared/http-error';

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

export async function categorizeAndSave(userId: number, text: string) {
    let parsed;
    try {
        parsed = await categorizeText(text);
    } catch {
        throw internalError("Categorized failed, try again.");
    }

    const inserted = await db.insert(transactions).values(
        parsed.map((p) => ({
            date: new Date(p.date),
            merchant: p.merchant,
            amount: p.amount,
            category: p.category,
            source: 'ai_text' as const,
            userId,
        }))
    ).returning();

    return inserted.map(serializeTransaction);
}

export async function categorizeReceiptAndSave(userId: number, base64Image: string, mimeType: string) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        throw badRequest('Nepodporovaný formát obrázka. Použi JPEG, PNG alebo WebP.');
    }

    let parsed;
    try {
        parsed = await categorizeReceiptImage(base64Image, mimeType);
    } catch {
        throw internalError('Spracovanie účtenky zlyhalo, skús to znova.');
    }

    const inserted = await db.insert(transactions).values(
        parsed.map((p) => ({
            date: new Date(p.date), merchant: p.merchant, amount: p.amount,
            category: p.category, source: 'ai_receipt' as const, userId,
        }))
    ).returning();

    return inserted.map(serializeTransaction);
}