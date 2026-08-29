import { pgTable, uuid, timestamp, text, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  disabled: integer('disabled').notNull().default(0), // 0 = aktívny, 1 = disablovaný
  disabledAt: timestamp('disabled_at'), // kedy bol disablovaný - potrebné na výpočet 10 dní
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date').notNull(),
  merchant: text('merchant').notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  source: text('source').notNull().default('manual'),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});