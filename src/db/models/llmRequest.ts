import {
  serial,
  text,
  timestamp,
  index,
  jsonb,
  pgEnum,
  pgTable,
  integer
} from 'drizzle-orm/pg-core';
import { Batch } from './batch';

export const STATUS = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
};

export const statusEnum = pgEnum('status', [STATUS.SUCCESS, STATUS.ERROR]);

export const LlmRequest = pgTable(
  'llm_requests',
  {
    id: serial('id').primaryKey(),
    batchId: integer('batch_id')
      .references(() => Batch.id)
      .notNull(),
    shardId: text('shard_id').notNull(),
    messages: jsonb('messages')
      .$type<Array<{ content: string; role: 'system' | 'user' | 'assistant' }>>()
      .notNull(),
    model: text('model').notNull(),
    status: statusEnum('status').notNull(),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [index('batch_id_idx').on(table.batchId)]
);

export type LlmRequest = typeof LlmRequest.$inferSelect;
export type NewLlmRequest = typeof LlmRequest.$inferInsert;
