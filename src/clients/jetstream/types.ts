import { CompletedLlmRequests, LlmRequestType } from '../../clients/llm/types';

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
