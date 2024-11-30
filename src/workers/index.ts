import { dao } from '../db';
import { NatsClient, webhooksClient, llmClient } from '../clients';

const natsClient = new NatsClient();

async function runWorkerConsumer(): Promise<void> {
  await natsClient.consumeWorkerMessages(async (data, subjectIdentifiers) => {
    const completedLlmRequests = await llmClient.processRequests(data.llmRequests);
    await natsClient.publishResultsMessage(subjectIdentifiers, { completedLlmRequests });
  });
}

async function runResultsConsumer(): Promise<void> {
  await natsClient.consumeResultsMessages(async (data, { batchId, shardId }) => {
    const { completedLlmRequests } = data;

    const updatedBatch = await dao.saveCompletedLlmRequests({
      batchId,
      shardId,
      completedLlmRequests
    });

    if (updatedBatch.completedAt) {
      console.log(`Batch ${batchId} completed at ${updatedBatch.completedAt.toDateString()}`);

      await webhooksClient.sendCompletionWebhook(updatedBatch);
    }
  });
}

async function main() {
  await natsClient.connect();
  await natsClient.initializeStreams();

  new Array(10).fill(0).forEach(runWorkerConsumer);
  runResultsConsumer().catch(console.error);
}

main().catch(console.error);
