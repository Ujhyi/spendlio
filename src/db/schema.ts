import { pgTable, serial, integer, timestamp, text, doublePrecision, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),                     // auto-increment integer: 1, 2, 3...
  clientId: integer('client_id').notNull().unique(),  // generované unikátne 6-miestne číslo
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  disabled: integer('disabled').notNull().default(0), // 0 = aktívny, 1 = disablovaný
  disabledAt: timestamp('disabled_at'),               // kedy bol disablovaný, na výpočet 10 dní
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),        // transakcie ostávajú na uuid
  date: timestamp('date').notNull(),
  merchant: text('merchant').notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  source: text('source').notNull().default('manual'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});