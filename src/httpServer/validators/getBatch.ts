import { z } from 'zod';

export const getBatchParamsValidator = z.object({
  batchId: z.string().transform((val) => parseInt(val))
});
