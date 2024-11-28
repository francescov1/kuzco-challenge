import { serial, text, timestamp, index, jsonb, pgEnum, pgTable } from 'drizzle-orm/pg-core';
import { STATUS } from '../constants';

export const messageRoleEnum = pgEnum('message_role', ['system', 'user', 'assistant']);
export const statusEnum = pgEnum('status', [STATUS.SUCCESS, STATUS.ERROR]);

export const requests = pgTable(
  'requests',
  {
    id: serial('id').primaryKey(),
    batchId: text('batch_id').notNull(),
    shardId: text('shard_id').notNull(),
    messages: jsonb('messages')
      .$type<Array<{ content: string; role: (typeof messageRoleEnum.enumValues)[number] }>>()
      .notNull(),
    model: text('model').notNull(),
    status: statusEnum('status').notNull(),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [index('batch_id_idx').on(table.batchId)]
);

export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
