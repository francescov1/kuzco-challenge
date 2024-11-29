import * as llmClient from '../clients/llm';
import { dao } from '../db';
import { Jetstream } from '../clients/jetstream';
import { sendCompletionWebhook } from '../clients/webhook';

const jetstreamClient = new Jetstream();

// TODOs in order:
// - Think about more clever use of subjects
// - move all to docker repo
// - setup easy startup scripts, everything init easily.
// - documentation
// - unit tests
// - think about validation llm requests cryptography

// Opportunities:
// - more robust handling for entire batch failure
// - retry individual llm calls (ie in processRequest)
// - Graceful shutdown
// - use file storage when uploading jsonl
// - proper logger (eg winston)

// Deduplication:
// Exactly one (ackAck): https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
// msgId header: https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#message-deduplication

async function runWorkerConsumer(): Promise<void> {
  await jetstreamClient.consumeWorkerMessages(async (data, subjectIdentifiers) => {
    const completedLlmRequests = await llmClient.processRequests(data.llmRequests);
    await jetstreamClient.publishResultsMessage(subjectIdentifiers, { completedLlmRequests });
  });
}

async function runResultsConsumer(): Promise<void> {
  await jetstreamClient.consumeResultsMessages(async (data, { batchId, shardId }) => {
    const { completedLlmRequests } = data;

    const updatedBatch = await dao.saveCompletedLlmRequests(completedLlmRequests, {
      batchId,
      shardId
    });

    if (updatedBatch.completedAt) {
      console.log(`Batch ${batchId} completed at ${updatedBatch.completedAt.toDateString()}`);

      await sendCompletionWebhook(updatedBatch);
    }
  });
}

async function main() {
  await jetstreamClient.connect();
  await jetstreamClient.initializeStreams();

  new Array(10).fill(0).forEach(runWorkerConsumer);
  runResultsConsumer().catch(console.error);
}

main().catch(console.error);
