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
