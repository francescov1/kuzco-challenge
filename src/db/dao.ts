import { eq, sql } from 'drizzle-orm';

import { CompletedLlmRequests } from '../types';
import { dbClient } from './client';
import { Batch } from './models/batch';
import { LlmRequest, STATUS } from './models/llmRequest';

export const createBatch = async ({ totalShards }: { totalShards: number }): Promise<Batch> => {
  const [batch] = await dbClient.db.insert(Batch).values({ totalShards }).returning();
  return batch;
};

export const getBatchById = async (id: number): Promise<Batch> => {
  const batchResults = await dbClient.db.select().from(Batch).where(eq(Batch.id, id)).limit(1);

  if (batchResults.length === 0) {
    throw new Error(`Batch with id ${id} not found`);
  }

  return batchResults[0];
};

export const getLlmRequestsByBatchId = async (batchId: number): Promise<LlmRequest[]> => {
  const llmRequests = await dbClient.db
    .select()
    .from(LlmRequest)
    .where(eq(LlmRequest.batchId, batchId));

  return llmRequests;
};

export const saveCompletedLlmRequests = async ({
  batchId,
  shardId,
  completedLlmRequests
}: {
  batchId: number;
  shardId: string;
  completedLlmRequests: CompletedLlmRequests[];
}): Promise<Batch> => {
  const requestInserts = completedLlmRequests.map((response) => ({
    batchId,
    shardId,
    messages: response.messages,
    model: response.model,
    status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
    error: response.error || null
  }));

  // We can assume this will be set below, since the following transaction will either set it successfully or throw an error.
  let updatedBatch!: Batch;

  // Run a transaction to save the llm requests and update the batch
  await dbClient.db.transaction(async (tx) => {
    // Insert all new requests
    await tx.insert(LlmRequest).values(requestInserts);

    // Update the batch with new completed number of shards and completion time if this is the last shard
    const results = await tx
      .update(Batch)
      .set({
        completedShards: sql`completed_shards + 1`,
        completedAt: sql`CASE WHEN completed_shards + 1 = total_shards THEN NOW() ELSE completed_at END`
      })
      .where(eq(Batch.id, batchId))
      .returning();

    [updatedBatch] = results;
  });

  console.log(
    `Saved ${requestInserts.length} completed llm requests and updated batch ${updatedBatch.id}`
  );

  return updatedBatch;
};
