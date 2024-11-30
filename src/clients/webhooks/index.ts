import { BatchRecord } from '../../db/models';

export const sendCompletionWebhook = async (batch: BatchRecord) => {
  if (!batch.completionWebhookUrl) {
    return;
  }

  await fetch(batch.completionWebhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      id: batch.id,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
      totalShardsCount: batch.totalShardsCount,
      completedShardsCount: batch.completedShardsCount
    })
  });

  console.log('Sent completion webhook');
};
