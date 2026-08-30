import { pgTable, serial, integer, timestamp, text, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: integer('email_verified').notNull().default(0), // 0 = neoverený, 1 = overený
  disabled: integer('disabled').notNull().default(0),
  disabledAt: timestamp('disabled_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  merchant: text('merchant').notNull(),
  shop: text('shop'),   // <- pridaj tento riadok
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  source: text('source').notNull().default('manual'),
  clientId: integer('client_id').notNull().references(() => users.clientId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const verification_tokens = pgTable('verification_tokens', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.clientId, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  purpose: text('purpose').notNull().default('email_verification'),
  isUsed: integer('is_used').notNull().default(0), // 0 = nepoužitý, 1 = použitý
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});