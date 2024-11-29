import { CompletedLlmRequests, LlmRequestType } from '../llm/types';

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
