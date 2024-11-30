import { BatchRecord } from '../../dao/models';

export const sendCompletionWebhook = async (batch: BatchRecord) => {
  if (!batch.completionWebhookUrl) {
    return;
  }

  await fetch(batch.completionWebhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      id: batch.id,
      totalShardsCount: batch.totalShardsCount,
      completedShardsCount: batch.completedShardsCount,
      totalLlmRequestsCount: batch.totalLlmRequestsCount,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt
    })
  });

  console.log('Sent completion webhook');
};
