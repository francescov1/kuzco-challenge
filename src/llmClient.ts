import { TEST_ERROR_PROMPT } from './constants';
import { LlmRequest, LlmResponse } from './types';

export const processRequests = async (requests: LlmRequest[]): Promise<LlmResponse[]> => {
  return Promise.all(requests.map(processRequest));
};

const processRequest = async (request: LlmRequest): Promise<LlmResponse> => {
  try {
    // TODO: Do we need to make this more robust? is this an ok assyumtpion? depends on api validation
    const userMessage = request.messages[request.messages.length - 1];

    // Check for test error condition
    if (userMessage.content === TEST_ERROR_PROMPT) {
      throw new Error('This is a test error');
    }

    // Create assistant response
    const assistantMessage = {
      role: 'assistant' as const,
      content: `response to ${userMessage.content}`
    };

    return {
      model: request.model,
      messages: [...request.messages, assistantMessage],
      status: 'success' as const
    };
  } catch (error) {
    return {
      model: request.model,
      messages: request.messages,
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};