import { TEST_ERROR_PROMPT } from './constants';
import { CompletedLlmRequests, LlmRequestType } from '../../types';

const processRequest = (request: LlmRequestType): CompletedLlmRequests => {
  try {
    // NOTE: I'm assuming the last message in the array is the user message.
    // Since this is just a dummy function I assume this is fine.
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
      status: 'success' as const,
      error: null
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

export const processRequests = async (
  llmRequests: LlmRequestType[]
): Promise<CompletedLlmRequests[]> => Promise.all(llmRequests.map(processRequest));
