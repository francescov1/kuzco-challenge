import { pgTable, serial, text, timestamp, jsonb, varchar, integer } from 'drizzle-orm/pg-core';

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  batchId: text('batch_id').notNull(),
  shardId: text('shard_id').notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'error'
  error: text('error'),
  tokens: jsonb('token_usage').notNull(), // { prompt_tokens, completion_tokens, total_tokens }
  latencyMs: integer('latency_ms').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
