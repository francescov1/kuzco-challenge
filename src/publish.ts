import { connect } from 'nats';
import { jobToWorkerSubject, encodeJson } from './utils';
import { NATS_SERVER_URL } from './constants';
import { LlmRequest } from './types';
import { llmRequestExamples } from './fixtures';
import { SHARD_SIZE } from './constants';

async function publishMessages() {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const batchId = `batch_${Date.now()}`; // Generate unique batch ID

  const llmRequestsByShard = llmRequestExamples.reduce(
    (shards: Record<string, LlmRequest[]>, request: LlmRequest, index) => {
      const shardId = `shard_${Math.floor(index / SHARD_SIZE)}`;
      if (!shards[shardId]) {
        shards[shardId] = [];
      }
      shards[shardId].push(request);
      return shards;
    },
    {}
  );

  for (const [shardId, shardLlmRequests] of Object.entries(llmRequestsByShard)) {
    const message = { requests: shardLlmRequests };
    const subject = jobToWorkerSubject({ batchId, shardId });

    await jetstreamClient.publish(subject, encodeJson(message), {
      msgID: `${batchId}_${shardId}`
    });
    console.log(`Published to ${subject}`);
  }

  await connection.close();
}

publishMessages().catch((err) => {
  console.error('Error publishing messages:', err);
});
