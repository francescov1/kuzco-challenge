import { LlmRequestValidated } from './httpServer/validators/createBatch';

export interface Job {
  batchId: number;
  shardId: string;
}
