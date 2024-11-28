import { connect } from 'nats';
import { jobToWorkerSubject, encodeJson } from './utils';
import { NATS_SERVER_URL } from './constants';

type LlmRequest = {};
const SHARD_SIZE = 3;
const llmRequests: LlmRequest[] = Array.from({ length: 10 }, () => ({}));

async function publishMessages() {
  const connection = await connect({ servers: NATS_SERVER_URL }); // Connect to NATS server
  const jetstreamClient = connection.jetstream();

  const batchId = 'batch_1'; // TODO: Generate a random batch id based on request

  const llmRequestsByShard = llmRequests.reduce(
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

    await jetstreamClient.publish(subject, encodeJson(message));
    console.log(`Published to ${subject}`);
  }

  await connection.close();
}

publishMessages().catch((err) => {
  console.error('Error publishing messages:', err);
});
