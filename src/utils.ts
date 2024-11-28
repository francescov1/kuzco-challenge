import { JSONCodec } from 'nats';
import { Job } from './types';
export const encodeJson = JSONCodec().encode;

export const jobToWorkerSubject = (job: Job) =>
  `worker.batches.${job.batchId}.shards.${job.shardId}`;
export const jobToResultsSubject = (job: Job) =>
  `results.batches.${job.batchId}.shards.${job.shardId}`;

export const subjectToJob = (subject: string): Job => {
  const [, , batchId, , shardId] = subject.split('.');
  return { batchId, shardId };
};
