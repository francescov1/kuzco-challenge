import { LlmResponseRecord, BatchRecord } from '../dao/models';

export interface BatchDto {
  id: number;
  totalShardsCount: number;
  completedShardsCount: number;
  totalLlmRequestsCount: number;
  createdAt: Date;
  completionWebhookUrl: string | null;
  completedAt: Date | null;
  status: 'completed' | 'pending';
}

export const toBatchDto = (batch: BatchRecord): BatchDto => ({
  id: batch.id,
  totalShardsCount: batch.totalShardsCount,
  completedShardsCount: batch.completedShardsCount,
  totalLlmRequestsCount: batch.totalLlmRequestsCount,
  createdAt: batch.createdAt,
  completionWebhookUrl: batch.completionWebhookUrl,
  completedAt: batch.completedAt,
  status: batch.completedAt ? 'completed' : 'pending'
});

export const toBatchResultsJsonlString = (llmResponseRecords: LlmResponseRecord[]): string =>
  llmResponseRecords
    .map((llmResponseRecord) =>
      JSON.stringify({
        messages: llmResponseRecord.messages,
        model: llmResponseRecord.model,
        shardId: llmResponseRecord.shardId,
        status: llmResponseRecord.status,
        error: llmResponseRecord.error
      })
    )
    .join('\n');
