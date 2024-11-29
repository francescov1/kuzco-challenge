interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

// TODO: Probably wanna move these to a common type

// TODO: Better name
export interface LlmRequestType {
  model: string;
  messages: Message[];
}

export interface CompletedLlmRequests extends LlmRequestType {
  status: 'success' | 'error';
  error: string | null;
}
