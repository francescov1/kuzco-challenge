import { AckPolicy, connect, DeliverPolicy } from 'nats';
import { jobToResultsSubject, subjectToJob, encodeJson } from './utils';
import { ResultsMessage, WorkerMessage } from './types';
import {
  NATS_SERVER_URL,
  RESULTS_CONSUMER_NAME,
  RESULTS_STREAM_NAME,
  WORKER_CONSUMER_NAME,
  WORKER_STREAM_NAME,
  STATUS,
  WORKER_TIMEOUT_SECONDS,
  WORKER_MAX_DELIVERIES,
  RESULTS_TIMEOUT_SECONDS,
  RESULTS_MAX_DELIVERIES
} from './constants';
import { initDb, closeDb, getDb } from './db';
import { Request } from './db/models/request';
import * as llmClient from './llmClient';

// TODOs in order:
// - finish completion stuff, add webhook
// - get http server working
// - move all to docker repo
// - setup easy startup scripts, everything init easily.
// - Clever use of subjects
// - Graceful shutdown
// - think about validation llm requests Cryptography

// Opportunities:
// - more robust handling for entire batch failure
// - retry individual llm calls (ie in processRequest)

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
      ack_policy: AckPolicy.Explicit,
      ack_wait: WORKER_TIMEOUT_SECONDS * 1000 * 1000 * 1000,
      max_deliver: WORKER_MAX_DELIVERIES
    });

    console.log("Stream 'WORKER_QUEUE' created.");

    await jetstreamManager.streams.add({
      name: RESULTS_STREAM_NAME,
      subjects: ['results.batches.*.shards.*']
    });

    await jetstreamManager.consumers.add(RESULTS_STREAM_NAME, {
      durable_name: RESULTS_CONSUMER_NAME,
      deliver_policy: DeliverPolicy.New,
      ack_policy: AckPolicy.Explicit,
      ack_wait: RESULTS_TIMEOUT_SECONDS * 1000 * 1000 * 1000,
      max_deliver: RESULTS_MAX_DELIVERIES
    });

    console.log("Stream 'RESULTS_QUEUE' created.");
  } catch (err: any) {
    console.log('Stream creation failed:', err.message);
  } finally {
    await connection.close();
  }
}

async function startWorker(workerId: string) {
  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const consumer = await jetstreamClient.consumers.get(WORKER_STREAM_NAME, WORKER_CONSUMER_NAME);
  const messages = await consumer.consume();
  console.log(`Worker ${workerId} is listening...`);

  for await (const message of messages) {
    try {
      const { batchId, shardId } = subjectToJob(message.subject);
      const data: WorkerMessage = message.json();
      console.log(`Worker ${workerId} processing ${message.subject}`);

      const responses = await llmClient.processRequests(data.requests);
      const resultData: ResultsMessage = { responses };
      await jetstreamClient.publish(
        jobToResultsSubject({ batchId, shardId }),
        encodeJson(resultData)
      );

      // TODO: test time out of this, if it times out, the message will be redelivered
      await message.ackAck();
    } catch (err) {
      console.error(`Worker ${workerId} error: ${err}`);
      await message.nak();
    }
  }

  await connection.close();
}

async function startResultsWorker() {
  await initDb();

  const connection = await connect({ servers: NATS_SERVER_URL });
  const jetstreamClient = connection.jetstream();

  const consumer = await jetstreamClient.consumers.get(RESULTS_STREAM_NAME, RESULTS_CONSUMER_NAME);
  const messages = await consumer.consume();

  console.log(`Results worker is listening...`);

  for await (const message of messages) {
    const { batchId, shardId } = subjectToJob(message.subject);
    const data: ResultsMessage = message.json();

    const requestInserts = data.responses.map((response) => ({
      batchId,
      shardId,
      messages: response.messages,
      model: response.model,
      status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
      error: response.error || null
    }));

    await getDb().transaction(async (tx) => {
      await tx.insert(Request).values(requestInserts);
    });

    console.log(`Inserted ${requestInserts.length} requests into db`);

    await message.ackAck();
  }

  await connection.close();
  await closeDb();
}

async function main() {
  await setupStreams();
  ['4', '5'].forEach((id) => startWorker(id));
  startResultsWorker();
}

main().catch((err) => {
  console.error('Error starting workers:', err);
});
