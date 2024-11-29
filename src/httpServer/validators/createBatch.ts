import { z } from 'zod';

const messageValidator = z.object({
  content: z.string(),
  role: z.enum(['system', 'user', 'assistant'])
});

const llmRequestValidator = z.object({
  model: z.string(),
  messages: z.array(messageValidator)
});

// TODO: Better name
export const parseJsonlBatchFile = (buffer: Buffer): z.infer<typeof llmRequestValidator>[] => {
  const fileContent = buffer.toString('utf-8');
  return fileContent
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      return llmRequestValidator.parse(parsed);
    });
};
