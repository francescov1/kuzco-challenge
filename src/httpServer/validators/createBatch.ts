import { z } from 'zod';

const messageValidator = z.object({
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant'])
});

const llmRequestValidator = z.object({
  model: z.string(),
  messages: z.array(messageValidator)
});

export const createBatchValidator = z.object({
  // TODO: name to diffrentiate from db schema
  llmRequests: z.array(llmRequestValidator)
});

// TODO: better name
export type LlmRequestValidated = z.infer<typeof llmRequestValidator>;

// TODO: Move
interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}
export interface CompletedLlmRequests {
  model: string;
  messages: Message[];
  status: 'success' | 'error';
  error: string | null;
}
