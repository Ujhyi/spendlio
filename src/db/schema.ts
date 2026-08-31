import { pgTable, serial, integer, timestamp, text, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  emailVerified: integer('email_verified').notNull().default(0), 
  googleId: text('google_id').unique(),    
  disabled: integer('disabled').notNull().default(0),
  disabledAt: timestamp('disabled_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  merchant: text('merchant').notNull(),
  shop: text('shop'),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('EUR'),
  category: text('category').notNull(),
  source: text('source').notNull().default('manual'),
  clientId: integer('client_id').notNull().references(() => users.clientId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.clientId, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  period: text('period').notNull().default('month'), // 'week' | 'month'
  limitAmount: doublePrecision('limit_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  clientId: integer('client_id').notNull().references(() => users.clientId, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accountSettings = pgTable('account_settings', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().unique().references(() => users.clientId, { onDelete: 'cascade' }),
  baseCurrency: text('base_currency').notNull().default('EUR'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});