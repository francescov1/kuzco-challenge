import { LlmRequestType } from './types';
import { TEST_ERROR_PROMPT } from './constants';

// Example requests
export const llmRequestExamples: LlmRequestType[] = [
  {
    model: 'mistralai/mistral-nemo-12b-instruct/fp-8',
    messages: [
      {
        content: 'You are a helpful AI assistant',
        role: 'system'
      },
      {
        content: 'What is the capital of France?',
        role: 'user'
      }
    ]
  },
  {
    model: 'mistralai/mistral-nemo-12b-instruct/fp-8',
    messages: [
      {
        content: 'You are a helpful AI assistant',
        role: 'system'
      },
      {
        content: 'Explain quantum computing in simple terms',
        role: 'user'
      }
    ]
  },
  {
    model: 'mistralai/mistral-nemo-12b-instruct/fp-8',
    messages: [
      {
        content: 'You are a coding assistant',
        role: 'system'
      },
      {
        content: 'Write a hello world program in Python',
        role: 'user'
      }
    ]
  },
  {
    model: 'mistralai/mistral-nemo-12b-instruct/fp-8',
    messages: [
      {
        content: 'You are a coding assistant',
        role: 'system'
      },
      {
        content: TEST_ERROR_PROMPT,
        role: 'user'
      }
    ]
  }
];
