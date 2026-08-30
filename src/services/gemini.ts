import fs from 'fs';
import path from 'path';
import { categoryEnum } from '../modules/transaction/transaction-schema';

interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

const promptTemplate = fs.readFileSync(
  path.join(__dirname, '../prompts/prompt.md'),
  'utf-8'
);

function buildPrompt(rawText: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return promptTemplate
    .replace("${CATEGORIES.join(', ')}", categoryEnum.options.join(', '))
    .replace('${today}', today)
    .replace('${rawText}', rawText);
}

export async function categorizeText(rawText: string): Promise<ParsedTransaction[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(rawText) }] }],
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const clean = text.replace(/```json|```/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);

  return JSON.parse(match ? match[0] : clean);
}