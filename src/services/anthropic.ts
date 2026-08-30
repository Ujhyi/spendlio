import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { categoryEnum } from '../modules/transaction/transaction-schema'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const promptTemplae = fs.readFileSync(
    path.join(__dirname, '../prompts/prompt.md'),
    'utf-8'
);

interface ParsedTransaction {
    date: string;
    merchant: string;
    amount: number;
    category: string;
}

function buildPrompt(rawText: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return promptTemplae
        .replace("${CATEGORIES.join(', ')}", categoryEnum.options.join(', '))
        .replace('${today}', today)
        .replace('${rawText}', rawText);
}

export async function categorizeText(rawText: string): Promise<ParsedTransaction[]> {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: buildPrompt(rawText) }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);

    return JSON.parse(match ? match[0] : clean);
}