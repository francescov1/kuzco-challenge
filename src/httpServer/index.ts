import express from 'express';
import { dbClient } from '../db';
import { publishMessages } from '../publish';
import { Batch, LlmRequest } from '../db/models';
import { eq } from 'drizzle-orm';
import { CompletedLlmRequests, createBatchValidator } from './validators/createBatch';
import { toBatchDto } from './dtos/batch';
import { getBatchParamsValidator } from './validators/getBatch';

const app = express();
app.use(express.json());

// TODO: Create dtos and validators and converters

// Route to publish messages
app.post('/batches', async (req, res) => {
  try {
    const { llmRequests } = createBatchValidator.parse(req.body);

    const batch = await publishMessages(llmRequests);
    return res.status(200).json(toBatchDto(batch, []));
  } catch (error) {
    console.error('Error publishing messages:', error);
    return res.status(500).json({ error: 'Failed to publish messages' });
  }
});

// Route to get batch information and messages
app.get('/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = getBatchParamsValidator.parse(req.params);

    const results = await dbClient.db.select().from(Batch).where(eq(Batch.id, batchId)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = results[0];

    const requests = await dbClient.db
      .select()
      .from(LlmRequest)
      .where(eq(LlmRequest.batchId, batchId));

    const completedLlmRequests: CompletedLlmRequests[] = requests.map((request) => ({
      messages: request.messages,
      model: request.model,
      status: request.status,
      error: request.error
    }));

    return res.status(200).json(toBatchDto(batch, completedLlmRequests));
  } catch (error) {
    console.error('Error fetching batch:', error);
    return res.status(500).json({ error: 'Failed to fetch batch information' });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
