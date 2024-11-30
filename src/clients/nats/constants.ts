export const WORKER_STREAM_NAME = 'WORKER_QUEUE';
export const RESULTS_STREAM_NAME = 'RESULTS_QUEUE';

export const WORKER_CONSUMER_NAME = 'worker_consumer';
export const RESULTS_CONSUMER_NAME = 'results_consumer';

export const WORKER_TIMEOUT_SECONDS = 180; // 3 minutes
export const WORKER_MAX_DELIVERIES = 3;

export const RESULTS_TIMEOUT_SECONDS = 30; // 30 seconds
export const RESULTS_MAX_DELIVERIES = 3;

export const NATS_SERVER_URL = 'localhost:4222';

export const SHARD_SIZE = 2;
