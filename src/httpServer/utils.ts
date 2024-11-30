import { SHARD_SIZE } from '../clients/nats/constants';
import { LlmRequestType } from '../clients/llm/types';

interface ShardIdToLlmRequestsMap {
  [shardId: string]: LlmRequestType[];
}

/* eslint-disable no-param-reassign */
export const shardLlmRequests = (llmRequests: LlmRequestType[]): ShardIdToLlmRequestsMap => {
  const shardIdToLlmRequestsMap = llmRequests.reduce(
    (shards: ShardIdToLlmRequestsMap, request, index) => {
      const shardId = `shard_${Math.floor(index / SHARD_SIZE)}`;
      if (!shards[shardId]) {
        shards[shardId] = [];
      }
      shards[shardId].push(request);
      return shards;
    },
    {}
  );

  return shardIdToLlmRequestsMap;
};

export const parseJsonlBatchFile = (fileBuffer: Buffer): Record<string, unknown>[] => {
  const fileContent = fileBuffer.toString('utf-8');
  return fileContent
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Record<string, unknown>);
};
