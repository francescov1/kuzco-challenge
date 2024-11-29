import { LlmRequest } from '../../db/models';

// TODO: Better name
export const toBatchResultsFileString = (llmRequests: LlmRequest[]): string =>
  llmRequests
    .map((llmRequest) =>
      JSON.stringify({
        messages: llmRequest.messages,
        model: llmRequest.model,
        status: llmRequest.status,
        error: llmRequest.error
      })
    )
    .join('\n');
