import { AckPolicy, connect, DeliverPolicy } from 'nats';
import { jobToResultsSubject, subjectToJob, encodeJson } from './utils';
import { LlmRequest, LlmResponse, ResultsMessage, WorkerMessage } from './types';
import {
  NATS_SERVER_URL,
  RESULTS_CONSUMER_NAME,
  RESULTS_STREAM_NAME,
  WORKER_CONSUMER_NAME,
  WORKER_STREAM_NAME
} from './constants';
import { db } from './db';
import { requests } from './db/schema';

// TODOs in order:
// - Fix request and result types to reflect the actual data
// - Get db working
// - get http server working
// - Clever use of subjects
// - add webhook handling
// - Graceful shutdown

// Deduplication:
// Exactly one (ackAck): https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
// msgId header: https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#message-deduplication

async function setupStreams() {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamManager = await connection.jetstreamManager();

  // Add a stream for the queue
  try {
    await jetstreamManager.streams.add({
      name: WORKER_STREAM_NAME,
      subjects: ['worker.batches.*.shards.*']
    });

    await jetstreamManager.consumers.add(WORKER_STREAM_NAME, {
      durable_name: WORKER_CONSUMER_NAME,
      deliver_policy: DeliverPolicy.New,
      ack_policy: AckPolicy.Explicit
    });

    console.log("Stream 'WORKER_QUEUE' created.");

    await jetstreamManager.streams.add({
      name: RESULTS_STREAM_NAME,
      subjects: ['results.batches.*.shards.*']
    });

    await jetstreamManager.consumers.add(RESULTS_STREAM_NAME, {
      durable_name: RESULTS_CONSUMER_NAME,
      deliver_policy: DeliverPolicy.New,
      ack_policy: AckPolicy.Explicit
    });

    console.log("Stream 'RESULTS_QUEUE' created.");
  } catch (err: any) {
    console.log('Stream creation failed:', err.message);
  } finally {
    await connection.close();
  }
}

const processRequests = async (requests: LlmRequest[]): Promise<LlmResponse[]> => {
  return requests.map((request) => ({ ...request, response: 'success' }));
};

async function startWorker(workerId: string) {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const consumer = await jetstreamClient.consumers.get(WORKER_STREAM_NAME, WORKER_CONSUMER_NAME);
  const messages = await consumer.consume();
  console.log(`Worker ${workerId} is listening...`);

  for await (const message of messages) {
    const { batchId, shardId } = subjectToJob(message.subject);
    const data: WorkerMessage = message.json();
    console.log(`Worker ${workerId} processing ${message.subject}`);

    const responses = await processRequests(data.requests);
    const resultData: ResultsMessage = { responses };
    await jetstreamClient.publish(
      jobToResultsSubject({ batchId, shardId }),
      encodeJson(resultData)
    );

    // TODO: test time out of this, if it times out, the message will be redelivered
    await message.ackAck();
  }

  await connection.close();
}

async function startResultsWorker() {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const consumer = await jetstreamClient.consumers.get(RESULTS_STREAM_NAME, RESULTS_CONSUMER_NAME);
  const messages = await consumer.consume();

  console.log(`Results worker is listening...`);

  for await (const message of messages) {
    const { batchId, shardId } = subjectToJob(message.subject);
    const data: ResultsMessage = message.json();

    // Insert each request/response pair separately
    const requestInserts = data.responses.map((response) => ({
      batchId,
      shardId,
      prompt: response.prompt,
      response: response.response,
      model: response.model,
      status: response.error ? 'error' : 'success',
      error: response.error || null,
      tokens: {
        prompt_tokens: response.promptTokens,
        completion_tokens: response.completionTokens,
        total_tokens: response.totalTokens
      },
      latencyMs: response.latencyMs
    }));

    // Use a transaction for atomic batch insert
    await db.transaction(async (tx) => {
      await tx.insert(requests).values(requestInserts);
    });

    await message.ackAck();
  }

  await connection.close();
}

async function main() {
  await setupStreams();
  ['4', '5'].forEach((id) => startWorker(id));
  startResultsWorker();
}

main().catch((err) => {
  console.error('Error starting workers:', err);
});
