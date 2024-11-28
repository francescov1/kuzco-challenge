export const WORKER_STREAM_NAME = 'WORKER_QUEUE';
export const RESULTS_STREAM_NAME = 'RESULTS_QUEUE';

export const WORKER_CONSUMER_NAME = 'worker_consumer';
export const RESULTS_CONSUMER_NAME = 'results_consumer';

export const NATS_SERVER_URL = 'localhost:4222';

export const SHARD_SIZE = 3;

export const STATUS = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
};

export const TEST_ERROR_PROMPT = 'TEST_ERROR';
