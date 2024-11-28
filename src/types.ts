export interface Job {
  batchId: number;
  shardId: string;
}

export interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

export interface LlmRequest {
  model: string;
  messages: Message[];
}

export interface LlmResponse {
  model: string;
  messages: Message[];
  status: 'success' | 'error';
  error?: string;
}

export interface WorkerMessage {
  requests: LlmRequest[];
}

export interface ResultsMessage {
  responses: LlmResponse[];
}
