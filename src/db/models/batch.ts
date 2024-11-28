import { serial, timestamp, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const Batch = pgTable('batches', {
  id: serial('id').primaryKey(),
  totalShards: integer('total_shards').notNull(),
  completedShards: integer('completed_shards').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completionWebhookUrl: text('completion_webhook_url'),
  completedAt: timestamp('completed_at')
});

export type Batch = typeof Batch.$inferSelect;
export type NewBatch = typeof Batch.$inferInsert;
