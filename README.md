TODOs remaining in order:

- Think about more clever use of subjects & deduplication
  - Exactly one (ackAck): https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
  - msgId header: https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#message-deduplication
- move all to docker repo
- setup easy startup scripts, everything init easily.
- documentation
- unit tests
- think about validation llm requests cryptography

Opportunities to discuss in docs:

- error handling could be improved in various places (ie http server, retrying individual llm calls, more robust handling of entire batch failure)
- Graceful shutdown
- use file storage when uploading jsonl for larger files
- proper logger (eg winston)
