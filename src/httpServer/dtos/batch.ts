import { Batch } from '../../db/models';
import { CompletedLlmRequests } from '../validators/createBatch';

export interface BatchDto {
  id: number;
  totalShards: number;
  completedShards: number;
  createdAt: Date;
  completionWebhookUrl: string | null;
  completedAt: Date | null;
  status: 'completed' | 'pending';
}

export const toBatchDto = (batch: Batch): BatchDto => {
  return {
    id: batch.id,
    totalShards: batch.totalShards,
    completedShards: batch.completedShards,
    createdAt: batch.createdAt,
    completionWebhookUrl: batch.completionWebhookUrl,
    completedAt: batch.completedAt,
    status: batch.completedAt ? 'completed' : 'pending'
  };
};
