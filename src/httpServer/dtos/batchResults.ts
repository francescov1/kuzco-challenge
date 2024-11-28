import { LlmRequest } from '../../db/models';

export const toBatchResultsFileString = (llmRequests: LlmRequest[]): string => {
  return llmRequests
    .map((llmRequest) =>
      JSON.stringify({
        messages: llmRequest.messages,
        model: llmRequest.model,
        status: llmRequest.status,
        error: llmRequest.error
      })
    )
    .join('\n');
};
