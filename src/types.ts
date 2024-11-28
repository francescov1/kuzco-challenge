// TODO: Rename
export interface Job {
  batchId: string;
  shardId: string;
}

export interface LlmRequest {
  id: string;
  prompt: string;
}

export interface LlmResponse {
  id: string;
  prompt: string;
  response: string;
}

export interface WorkerMessage {
  requests: LlmRequest[];
}

export interface ResultsMessage {
  responses: LlmResponse[];
}
