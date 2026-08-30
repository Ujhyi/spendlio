import fs from 'fs';
import path from 'path';
import { categoryEnum } from '../modules/transaction/transaction-schema';

interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

const textPromptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/categorize_text_prompt.md'), 'utf-8');
const receiptPromptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/categorize_receipt_prompt.md'), 'utf-8');

function buildTextPrompt(rawText: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return textPromptTemplate
    .replace("${CATEGORIES.join(', ')}", categoryEnum.options.join(', '))
    .replace('${today}', today)
    .replace('${rawText}', rawText);
}

function buildReceiptPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return receiptPromptTemplate
    .replace('{{CATEGORIES}}', categoryEnum.options.join(', '))
    .replace('{{TODAY}}', today);
}

function parseJsonArray(text: string) {
  const clean = text.replace(/```json|```/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);
  return JSON.parse(match ? match[0] : clean);
}

export async function categorizeText(rawText: string): Promise<ParsedTransaction[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildTextPrompt(rawText) }] }] }),
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseJsonArray(text);
}

export async function categorizeReceiptImage(base64Image: string, mimeType: string): Promise<ParsedTransaction[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildReceiptPrompt() },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        }],
      }),
    }
  );

  const data = await response.json();

  // DOČASNÉ DEBUG LOGOVANIE - uvidíš presne, čo Gemini vrátilo
  console.log('=== GEMINI RAW RESPONSE ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== END GEMINI RAW RESPONSE ===');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  console.log('=== EXTRACTED TEXT ===');
  console.log(text);
  console.log('=== END EXTRACTED TEXT ===');

  return parseJsonArray(text);
}