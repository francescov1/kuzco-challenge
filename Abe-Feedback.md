<h1>Francesco Take Home Feedback</h1>

<!-- table of contents -->

- [Open Questions](#open-questions)
- [Concerns](#concerns)
  - [Non-atomicity of shard status updates](#non-atomicity-of-shard-status-updates)

### Open Questions

- Why did you introduce the concept of shards? I thought they were 1-1 with inferences, but it doesn't look like it.
- Have you considered doing some math on request sizes and batch sizes to recommend good size limits for batches, etc? That's not something I specifically asked for, but would be very good information to understand how this will scale in NATS and Postgres.

### Concerns

- Lack of documentation
- Non-atomicity of shard status updates

#### Non-atomicity of shard status updates

> Here's a conversation I had with Claude regarding the `saveLlmResponses` function:

I have a submission from a potential hire that has a function like this:

Copy
export const saveLlmResponses = async ({
batchId,
shardId,
llmResponses
}: {
batchId: number;
shardId: string;
llmResponses: LlmResponse[];
}): Promise<BatchRecord> => {
const llmResponseInserts = llmResponses.map((response) => ({
batchId,
shardId,
messages: response.messages,
model: response.model,
status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
error: response.error || null
}));

// We can assume this will be set below, since the following transaction will either set it successfully or throw an error.
let updatedBatch!: BatchRecord;

// Run a transaction to save the llm requests and update the batch
await dbClient.db.transaction(async (tx) => {
// Insert all new requests
await tx.insert(LlmResponseRecord).values(llmResponseInserts);

    // Update the batch with new completed number of shards and completion time if this is the last shard
    const results = await tx
      .update(BatchRecord)
      .set({
        completedShardsCount: sql`completed_shards_count + 1`,
        completedAt: sql`CASE WHEN completed_shards_count + 1 = total_shards_count THEN NOW() ELSE completed_at END`
      })
      .where(eq(BatchRecord.id, batchId))
      .returning();

    [updatedBatch] = results;

});

console.log(
`Saved ${llmResponseInserts.length} completed llm requests and updated batch ${updatedBatch.id}`
);

return updatedBatch;
};
I am concerned about the use of + 1 considering that many of these statements could run at the same time.

---

**Claude's response:**

Your concern is valid. This code has a potential race condition that could lead to incorrect counts. The issue is that multiple concurrent transactions could read the same `completed_shards_count` value and each add 1 to it, effectively missing some increments.

Here's an example of how this could fail:

1. Shard A reads completed_shards_count = 5
2. Shard B reads completed_shards_count = 5
3. Shard A adds 1 and writes 6
4. Shard B adds 1 and writes 6
5. Result: count is 6 when it should be 7

A safer approach would be to use SQL's atomic operations. Here's how I'd modify it:

```typescript
export const saveLlmResponses = async ({
  batchId,
  shardId,
  llmResponses
}: {
  batchId: number;
  shardId: string;
  llmResponses: LlmResponse[];
}): Promise<BatchRecord> => {
  const llmResponseInserts = llmResponses.map((response) => ({
    batchId,
    shardId,
    messages: response.messages,
    model: response.model,
    status: response.error ? STATUS.ERROR : STATUS.SUCCESS,
    error: response.error || null
  }));

  let updatedBatch!: BatchRecord;

  await dbClient.db.transaction(async (tx) => {
    // Insert all new requests
    await tx.insert(LlmResponseRecord).values(llmResponseInserts);

    // Use a SELECT ... FOR UPDATE to lock the row and prevent concurrent modifications
    const [currentBatch] = await tx
      .select()
      .from(BatchRecord)
      .where(eq(BatchRecord.id, batchId))
      .for('update');

    const newCompletedCount = currentBatch.completedShardsCount + 1;
    const shouldComplete = newCompletedCount === currentBatch.totalShardsCount;

    // Update with the calculated values
    const results = await tx
      .update(BatchRecord)
      .set({
        completedShardsCount: newCompletedCount,
        completedAt: shouldComplete ? new Date() : currentBatch.completedAt
      })
      .where(eq(BatchRecord.id, batchId))
      .returning();

    [updatedBatch] = results;
  });

  console.log(
    `Saved ${llmResponseInserts.length} completed llm requests and updated batch ${updatedBatch.id}`
  );

  return updatedBatch;
};
```

Key improvements:

1. Uses `SELECT ... FOR UPDATE` to obtain a row lock
2. Reads the current count within the transaction
3. Calculates the new values based on the locked row's data
4. Updates with precise values rather than using SQL expressions

This ensures that concurrent updates will be properly serialized and counted correctly.

A potentially even better solution would be to use a unique constraint on (batchId, shardId) and count the distinct shards, eliminating the need to maintain a counter at all. Would you like me to show how that approach would work?

---

**More feedback from Abe:**

This _locking_ mechanism would put a lot of pressure on the database. We wouldn't really use Postgres to store these shards IMHO, as its less optmized for this key-value access pattern.

This is a pretty minor optimization but the purpose of me bringing it up is to highlight that non-atomic operations can lead to subtle bugs that are hard to track down and I wanted to call it out.
