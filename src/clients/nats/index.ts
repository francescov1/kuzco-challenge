import {
  AckPolicy,
  connect,
  DeliverPolicy,
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  ReplayPolicy
} from 'nats';
import {
  NATS_SERVER_URL,
  RESULTS_MAX_DELIVERIES,
  RESULTS_TIMEOUT_SECONDS,
  RESULTS_CONSUMER_NAME,
  RESULTS_STREAM_NAME,
  WORKER_CONSUMER_NAME,
  WORKER_MAX_DELIVERIES,
  WORKER_STREAM_NAME,
  WORKER_TIMEOUT_SECONDS
} from './constants';
import { WorkerMessageData, ResultsMessageData, SubjectIdentifiers } from './types';
import { encodeJson, parseSubject, toResultsSubject, toWorkerSubject } from './utils';

export class NatsClient {
  private connection: NatsConnection | null = null;

  private jetstreamClient: JetStreamClient | null = null;

  private jetstreamManager: JetStreamManager | null = null;

  async connect() {
    this.connection = await connect({ servers: NATS_SERVER_URL });
    this.jetstreamClient = this.connection.jetstream();
    this.jetstreamManager = await this.connection.jetstreamManager();

    console.log('Connected to NATS');
  }

  async disconnect() {
    await this.connection?.close();
    this.connection = null;
    this.jetstreamClient = null;
  }

  async initializeStreams() {
    if (!this.jetstreamManager) {
      throw new Error('Not connected to NATS');
    }

    await this.jetstreamManager.streams.add({
      name: WORKER_STREAM_NAME,
      subjects: ['worker.batches.*.shards.*']
    });

    await this.jetstreamManager.consumers.add(WORKER_STREAM_NAME, {
      durable_name: WORKER_CONSUMER_NAME,
      deliver_policy: DeliverPolicy.New,
      replay_policy: ReplayPolicy.Instant,
      ack_policy: AckPolicy.Explicit,
      ack_wait: WORKER_TIMEOUT_SECONDS * 1000 * 1000 * 1000,
      max_deliver: WORKER_MAX_DELIVERIES
    });

    await this.jetstreamManager.streams.add({
      name: RESULTS_STREAM_NAME,
      subjects: ['results.batches.*.shards.*']
    });

    await this.jetstreamManager.consumers.add(RESULTS_STREAM_NAME, {
      durable_name: RESULTS_CONSUMER_NAME,
      deliver_policy: DeliverPolicy.New,
      replay_policy: ReplayPolicy.Instant,
      ack_policy: AckPolicy.Explicit,
      ack_wait: RESULTS_TIMEOUT_SECONDS * 1000 * 1000 * 1000,
      max_deliver: RESULTS_MAX_DELIVERIES
    });

    console.log('Streams initialized successfully');
  }

  async consumeWorkerMessages(
    handler: (data: WorkerMessageData, subjectIdentifiers: SubjectIdentifiers) => Promise<void>
  ) {
    if (!this.jetstreamClient) {
      throw new Error('Not connected to NATS');
    }

    const consumer = await this.jetstreamClient.consumers.get(
      WORKER_STREAM_NAME,
      WORKER_CONSUMER_NAME
    );
    const messages = await consumer.consume();

    console.log(`Worker consumer is listening...`);

    for await (const message of messages) {
      try {
        const data: WorkerMessageData = message.json();
        const subjectIdentifiers = parseSubject(message.subject);

        console.log(`Worker consumer received message ${message.subject}`);

        await handler(data, subjectIdentifiers);

        await message.ackAck();
      } catch (err) {
        console.error(`Worker consumer error:`, err);
        message.nak();
      }
    }
  }

  async consumeResultsMessages(
    handler: (data: ResultsMessageData, subjectIdentifiers: SubjectIdentifiers) => Promise<void>
  ) {
    if (!this.jetstreamClient) {
      throw new Error('Not connected to NATS');
    }

    const consumer = await this.jetstreamClient.consumers.get(
      RESULTS_STREAM_NAME,
      RESULTS_CONSUMER_NAME
    );
    const messages = await consumer.consume();

    console.log('Results worker is listening...');

    for await (const message of messages) {
      try {
        const data: ResultsMessageData = message.json();
        const subjectIdentifiers = parseSubject(message.subject);

        console.log(`Results consumer received message ${message.subject}`);

        await handler(data, subjectIdentifiers);

        // TODO: test time out of this, if it times out, the message will be redelivered
        await message.ackAck();
      } catch (err) {
        console.error('Results worker error:', err);
        message.nak();
      }
    }
  }

  async publishResultsMessage(subjectIdentifiers: SubjectIdentifiers, data: ResultsMessageData) {
    if (!this.jetstreamClient) {
      throw new Error('Not connected to NATS');
    }

    const subject = toResultsSubject(subjectIdentifiers);

    await this.jetstreamClient.publish(subject, encodeJson(data), {
      msgID: subject
    });

    console.log(`Published results message to ${subject}`);
  }

  async publishWorkerMessage(subjectIdentifiers: SubjectIdentifiers, data: WorkerMessageData) {
    if (!this.jetstreamClient) {
      throw new Error('Not connected to NATS');
    }

    const subject = toWorkerSubject(subjectIdentifiers);

    await this.jetstreamClient.publish(subject, encodeJson(data), {
      msgID: subject
    });

    console.log(`Published worker message to ${subject}`);
  }
}
