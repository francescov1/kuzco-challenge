import { LlmResponse, LlmRequest } from '../../types';

export interface SubjectIdentifiers {
  batchId: number;
  shardId: string;
}

export interface WorkerMessageData {
  llmRequests: LlmRequest[];
}

export interface ResultsMessageData {
  llmResponses: LlmResponse[];
}
