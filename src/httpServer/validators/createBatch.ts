import { z } from 'zod';

const messageValidator = z.object({
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant'])
});

export const llmRequestValidator = z.object({
  model: z.string(),
  messages: z.array(messageValidator)
});

// TODO: better name
export type LlmRequestValidated = z.infer<typeof llmRequestValidator>;

export const parseJsonlBatchFile = (buffer: Buffer): LlmRequestValidated[] => {
  const fileContent = buffer.toString('utf-8');
  return fileContent
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = JSON.parse(line);
      return llmRequestValidator.parse(parsed);
    });
};

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
