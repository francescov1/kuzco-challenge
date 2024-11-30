import { LlmResponseRecord, BatchRecord } from '../db/models';

export interface BatchDto {
  id: number;
  totalShards: number;
  completedShards: number;
  createdAt: Date;
  completionWebhookUrl: string | null;
  completedAt: Date | null;
  status: 'completed' | 'pending';
}

export const toBatchDto = (batch: BatchRecord): BatchDto => ({
  id: batch.id,
  totalShards: batch.totalShards,
  completedShards: batch.completedShards,
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
        status: llmResponseRecord.status,
        error: llmResponseRecord.error
      })
    )
    .join('\n');
