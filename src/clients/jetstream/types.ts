import { CompletedLlmRequests } from '../../types';
import { LlmRequestType } from '../../types';

export interface SubjectIdentifiers {
  batchId: number;
  shardId: string;
}

export interface WorkerMessageData {
  llmRequests: LlmRequestType[];
}

export interface ResultsMessageData {
  completedLlmRequests: CompletedLlmRequests[];
}
