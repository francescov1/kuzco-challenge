import { STATUS } from './constants';
import { dbClient } from './db/client';
import { LlmRequest } from './db/models';
import * as llmClient from './clients/llm';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { Batch } from './db/models/batch';
import { Jetstream } from './clients/jetstream';

const jetstreamClient = new Jetstream();

// TODOs in order:
// - daos
// - move all to docker repo
// - setup easy startup scripts, everything init easily.
// - unit tests
// - Clever use of subjects
// - think about validation llm requests Cryptography

// Docs
// - For webhook testing, `npx http-echo-server 8081 --headers`

// Opportunities:
// - more robust handling for entire batch failure
// - retry individual llm calls (ie in processRequest)
// - Graceful shutdown
// - use file storage when uploading jsonl

// Deduplication:
// Exactly one (ackAck): https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
// msgId header: https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#message-deduplication

async function startWorkerConsumer() {
  await jetstreamClient.consumeWorkerMessages(async (data, subjectIdentifiers) => {
    const completedLlmRequests = await llmClient.processRequests(data.llmRequests);
    await jetstreamClient.publishResultsMessage(subjectIdentifiers, { completedLlmRequests });
  });
}

async function startResultsConsumer() {
  await jetstreamClient.consumeResultsMessages(async (data, { batchId, shardId }) => {
    const requestInserts = data.completedLlmRequests.map((response) => ({
      batchId,
      shardId,
      messages: response.messages,
      model: response.model,
      status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
      error: response.error || null
    }));

    // We can assume this will be set, since the following transaction will either set it successfully or throw an error.
    let updatedBatch!: Batch;
    await dbClient.db.transaction(async (tx) => {
      await tx.insert(LlmRequest).values(requestInserts);

      const results = await tx
        .update(Batch)
        .set({
          completedShards: sql`completed_shards + 1`,
          completedAt: sql`CASE WHEN completed_shards + 1 = total_shards THEN NOW() ELSE completed_at END`
        })
        .where(eq(Batch.id, batchId))
        .returning();

      updatedBatch = results[0];
    });

    console.log(`Inserted ${requestInserts.length} requests into db`);

    if (updatedBatch.completedAt) {
      console.log(`Batch ${batchId} completed at ${updatedBatch.completedAt}`);

      // Send webhook if completionWebhookUrl is set
      if (updatedBatch.completionWebhookUrl) {
        await fetch(updatedBatch.completionWebhookUrl, {
          method: 'POST',
          body: JSON.stringify({
            id: updatedBatch.id,
            createdAt: updatedBatch.createdAt,
            completedAt: updatedBatch.completedAt,
            totalShards: updatedBatch.totalShards,
            completedShards: updatedBatch.completedShards
          })
        });

        console.log('Sent completion webhook');
      }
    }
  });
}

async function main() {
  await jetstreamClient.connect();
  await jetstreamClient.initializeStreams();

  new Array(10).fill(0).forEach(() => startWorkerConsumer());
  startResultsConsumer();
}

main().catch((err) => {
  console.error('Error starting workers:', err);
});
