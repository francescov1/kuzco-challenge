import express from 'express';
import multer from 'multer';
import { dbClient } from '../db';
import { publishMessages } from '../publish';
import { Batch, LlmRequest } from '../db/models';
import { eq } from 'drizzle-orm';
import { parseJsonlBatchFile } from './validators/createBatch';
import { toBatchDto } from './dtos/batch';
import { getBatchParamsValidator } from './validators/getBatch';
import { toBatchResultsFileString } from './dtos/batchResults';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Route to publish messages from JSONL file
app.post('/batches', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const llmRequests = parseJsonlBatchFile(req.file.buffer);

    const batch = await publishMessages(llmRequests);
    return res.status(200).json(toBatchDto(batch));
  } catch (error) {
    console.error('Error publishing messages:', error);
    return res.status(500).json({ error: 'Failed to publish messages' });
  }
});

// Route to get batch information (without messages)
app.get('/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = getBatchParamsValidator.parse(req.params);

    const results = await dbClient.db.select().from(Batch).where(eq(Batch.id, batchId)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = results[0];
    return res.status(200).json(toBatchDto(batch));
  } catch (error) {
    console.error('Error fetching batch:', error);
    return res.status(500).json({ error: 'Failed to fetch batch information' });
  }
});

// Route to download completed messages as JSONL
app.get('/batches/:batchId/messages', async (req, res) => {
  try {
    const { batchId } = getBatchParamsValidator.parse(req.params);

    // First fetch the batch
    const batchResults = await dbClient.db
      .select()
      .from(Batch)
      .where(eq(Batch.id, batchId))
      .limit(1);

    if (!batchResults || batchResults.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = batchResults[0];
    if (!batch.completedAt) {
      return res.status(400).json({ error: 'Cannot download messages: batch is not completed' });
    }

    const llmRequests = await dbClient.db
      .select()
      .from(LlmRequest)
      .where(eq(LlmRequest.batchId, batchId));

    if (!llmRequests || llmRequests.length === 0) {
      return res.status(404).json({ error: 'No messages found for this batch' });
    }

    const jsonlContent = toBatchResultsFileString(llmRequests);

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}-messages.jsonl"`);
    return res.send(jsonlContent);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
