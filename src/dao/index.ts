import { eq, sql } from 'drizzle-orm';
import { LlmResponse } from '../types';
import { dbClient } from '../clients';
import { LlmResponseRecord, BatchRecord, STATUS } from './models';

export const createBatch = async ({
  totalShardsCount,
  totalLlmRequestsCount
}: {
  totalShardsCount: number;
  totalLlmRequestsCount: number;
}): Promise<BatchRecord> => {
  const [batch] = await dbClient.db
    .insert(BatchRecord)
    .values({ totalShardsCount, totalLlmRequestsCount })
    .returning();
  return batch;
};

export const getBatchById = async (id: number): Promise<BatchRecord> => {
  const batchResults = await dbClient.db
    .select()
    .from(BatchRecord)
    .where(eq(BatchRecord.id, id))
    .limit(1);

  if (batchResults.length === 0) {
    throw new Error(`BatchRecord with id ${id} not found`);
  }

  return batchResults[0];
};

export const getLlmResponsesByBatchId = async (batchId: number): Promise<LlmResponseRecord[]> => {
  const llmResponseRecords = await dbClient.db
    .select()
    .from(LlmResponseRecord)
    .where(eq(LlmResponseRecord.batchId, batchId));

  return llmResponseRecords;
};

export const saveLlmResponses = async ({
  batchId,
  shardId,
  llmResponses
}: {
  batchId: number;
  shardId: string;
  llmResponses: LlmResponse[];
}): Promise<BatchRecord> => {
  const llmResponseInserts = llmResponses.map((response) => ({
    batchId,
    shardId,
    messages: response.messages,
    model: response.model,
    status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
    error: response.error || null
  }));

  // We can assume this will be set below, since the following transaction will either set it successfully or throw an error.
  let updatedBatch!: BatchRecord;

  // Run a transaction to save the llm requests and update the batch
  await dbClient.db.transaction(async (tx) => {
    // Insert all new requests
    await tx.insert(LlmResponseRecord).values(llmResponseInserts);

    // Update the batch with new completed number of shards and completion time if this is the last shard
    const results = await tx
      .update(BatchRecord)
      .set({
        completedShardsCount: sql`completed_shards_count + 1`,
        completedAt: sql`CASE WHEN completed_shards_count + 1 = total_shards_count THEN NOW() ELSE completed_at END`
      })
      .where(eq(BatchRecord.id, batchId))
      .returning();

    [updatedBatch] = results;
  });

  console.log(
    `Saved ${llmResponseInserts.length} completed llm requests and updated batch ${updatedBatch.id}`
  );

  return updatedBatch;
};
