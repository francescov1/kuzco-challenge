import { serial, timestamp, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const BatchRecord = pgTable('batches', {
  id: serial('id').primaryKey(),
  totalShardsCount: integer('total_shards_count').notNull(),
  completedShardsCount: integer('completed_shards_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completionWebhookUrl: text('completion_webhook_url'),
  completedAt: timestamp('completed_at')
});

export type BatchRecord = typeof BatchRecord.$inferSelect;
export type NewBatchRecord = typeof BatchRecord.$inferInsert;
