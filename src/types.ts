interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

export interface LlmRequest {
  model: string;
  messages: Message[];
}

export interface LlmResponse extends LlmRequest {
  status: 'success' | 'error';
  error: string | null;
}
