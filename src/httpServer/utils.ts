import { SHARD_SIZE } from '../clients/jetstream/constants';
import { LlmRequestType } from '../clients/llm/types';

interface ShardIdToLlmRequestsMap {
  [shardId: string]: LlmRequestType[];
}

export const shardLlmRequests = (llmRequests: LlmRequestType[]): ShardIdToLlmRequestsMap => {
  return llmRequests.reduce((shards: ShardIdToLlmRequestsMap, request, index) => {
    const shardId = `shard_${Math.floor(index / SHARD_SIZE)}`;
    if (!shards[shardId]) {
      shards[shardId] = [];
    }
    shards[shardId].push(request);
    return shards;
  }, {});
};
