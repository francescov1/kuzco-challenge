import { connect } from 'nats';
import { jobToWorkerSubject, encodeJson } from './utils';
import { NATS_SERVER_URL } from './constants';
import { llmRequestExamples } from './fixtures';
import { SHARD_SIZE } from './constants';
import { dbClient } from './db';
import { Batch } from './db/models/batch';
import { LlmRequestValidated } from './httpServer/validators/createBatch';

export const publishMessages = async (llmRequests: LlmRequestValidated[]): Promise<Batch> => {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const llmRequestsByShard = llmRequests.reduce(
    (shards: Record<string, LlmRequestValidated[]>, request: LlmRequestValidated, index) => {
      const shardId = `shard_${Math.floor(index / SHARD_SIZE)}`;
      if (!shards[shardId]) {
        shards[shardId] = [];
      }
      shards[shardId].push(request);
      return shards;
    },
    {}
  );

  const totalShards = Object.keys(llmRequestsByShard).length;

  // TODO: Create a dao,
  // TODO: Create a client for nats
  const [newBatch] = await dbClient.db
    .insert(Batch)
    .values({
      totalShards,
      completionWebhookUrl: 'http://localhost:8081'
    })
    .returning();

  for (const [shardId, shardLlmRequests] of Object.entries(llmRequestsByShard)) {
    const message = { requests: shardLlmRequests };
    const subject = jobToWorkerSubject({ batchId: newBatch.id, shardId });

    await jetstreamClient.publish(subject, encodeJson(message), {
      msgID: `worker_${newBatch.id}_${shardId}`
    });
    console.log(`Published to ${subject}`);
  }

  await connection.close();
  return newBatch;
};

publishMessages(llmRequestExamples).catch((err) => {
  console.error('Error publishing messages:', err);
});
