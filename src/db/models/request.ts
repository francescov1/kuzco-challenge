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
import { STATUS } from '../../constants';
import { Batch } from './batch';

export const statusEnum = pgEnum('status', [STATUS.SUCCESS, STATUS.ERROR]);

export const Request = pgTable(
  'requests',
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

export type Request = typeof Request.$inferSelect;
export type NewRequest = typeof Request.$inferInsert;
