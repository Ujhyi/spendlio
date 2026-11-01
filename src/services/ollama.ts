import fs from 'fs';
import path from 'path';
import { categoryEnum } from '../modules/transaction/transaction-schema';

interface ParsedTransaction {
    date: string;
    merchant: string;
    shop?: string;
    amount: number;
    category: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

const textPromptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/categorize_text_prompt_ollama.md'), 'utf-8');
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
  const match = clean.match(/[\[{][\s\S]*[\]}]/);
  const raw = match ? match[0] : clean;
  const result = JSON.parse(raw);
  
  // ak Gemma vrátila jeden objekt namiesto poľa, zabal ho do poľa
  if (!Array.isArray(result)) {
    return [result];
  }
  return result;
}

export async function categorizeText(rawText: string): Promise<ParsedTransaction[]> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildTextPrompt(rawText),
      stream: false,
      format: 'json',
    }),
  });

  const data = await response.json();
  console.log('DEBUG Gemma raw:', data.response);
  const result = parseJsonArray(data.response ?? '');
  console.log('DEBUG parsed result:', JSON.stringify(result, null, 2));
  return result;
}

export async function categorizeReceiptImage(base64Image: string, mimeType: string): Promise<ParsedTransaction[]> {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: buildReceiptPrompt(),
            images: [base64Image],
            stream: false,
        }),
    });

    const data = await response.json();
    return parseJsonArray(data.response ?? '');
}