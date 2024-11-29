import { JSONCodec } from 'nats';
import { SubjectIdentifiers } from './types';

export const encodeJson = JSONCodec().encode;

export const toWorkerSubject = ({ batchId, shardId }: SubjectIdentifiers) =>
  `worker.batches.${batchId}.shards.${shardId}`;
export const toResultsSubject = ({ batchId, shardId }: SubjectIdentifiers) =>
  `results.batches.${batchId}.shards.${shardId}`;

export const parseSubject = (subject: string): SubjectIdentifiers => {
  const [, , batchId, , shardId] = subject.split('.');
  return { batchId: parseInt(batchId), shardId };
};
