import { JSONCodec } from 'nats';
import { SubjectIdentifiers } from './types';

export const encodeJson = (value: unknown): Uint8Array => JSONCodec().encode(value);

export const toWorkerSubject = ({ batchId, shardId }: SubjectIdentifiers): string =>
  `worker.batches.${batchId}.shards.${shardId}`;

export const toResultsSubject = ({ batchId, shardId }: SubjectIdentifiers): string =>
  `results.batches.${batchId}.shards.${shardId}`;

export const parseSubject = (subject: string): SubjectIdentifiers => {
  const [, , batchId, , shardId] = subject.split('.');
  return { batchId: parseInt(batchId), shardId };
};
