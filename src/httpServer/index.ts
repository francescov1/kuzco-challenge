import express from 'express';
import multer from 'multer';
import Bluebird from 'bluebird';
import * as validators from './validators';
import * as dtos from './dtos';
import * as utils from './utils';
import { NatsClient } from '../clients';
import { dao } from '../db';

const natsClient = new NatsClient();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Create batch
app.post('/batches', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const llmRequests = validators.parseJsonlBatchFile(req.file.buffer);

    const shardIdToLlmRequestsMap = utils.shardLlmRequests(llmRequests);

    const totalShards = Object.keys(shardIdToLlmRequestsMap).length;

    const newBatch = await dao.createBatch({ totalShards });

    await Bluebird.map(
      Object.entries(shardIdToLlmRequestsMap),
      async ([shardId, llmRequestsShard]) => {
        const subjectIdentifiers = { batchId: newBatch.id, shardId };

        await natsClient.publishWorkerMessage(subjectIdentifiers, {
          llmRequests: llmRequestsShard
        });
      }
    );

    return res.status(200).json(dtos.toBatchDto(newBatch));
  } catch (error) {
    console.error('Error publishing messages:', error);
    return res.status(500).json({ error: 'Failed to publish messages' });
  }
});

// Get batch
app.get('/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = validators.batchIdParamsValidator.parse(req.params);

    const batch = await dao.getBatchById(batchId);

    return res.status(200).json(dtos.toBatchDto(batch));
  } catch (error) {
    console.error('Error fetching batch:', error);
    return res.status(500).json({ error: 'Failed to fetch batch information' });
  }
});

// Download completed messages as JSONL
app.get('/batches/:batchId/messages', async (req, res) => {
  try {
    const { batchId } = validators.batchIdParamsValidator.parse(req.params);

    const batch = await dao.getBatchById(batchId);

    if (!batch.completedAt) {
      return res.status(400).json({ error: 'Cannot download messages: batch is not completed' });
    }

    const llmResponseRecords = await dao.getLlmResponsesByBatchId(batchId);

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}-messages.jsonl"`);
    return res.send(dtos.toBatchResultsJsonlString(llmResponseRecords));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const PORT = process.env.PORT || 8080;

natsClient
  .connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to Jetstream:', error);
  });
