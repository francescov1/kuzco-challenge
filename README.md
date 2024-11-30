TODOs remaining in order:

- move all to docker repo, bun
- setup easy startup scripts, everything init easily.
- test one req/shard, ensure this model can handle any number of requests/shards
- considerations:
  - think about storing intermediate results in NATS instead of DB, since we should consider them ephemeral until full batch is done
  - think about handling 50M requests
  - ensure at most once
  - call out any lacks of efficiency in the code
- documentation
- review docs see if anything missed https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
- think about validation llm requests cryptography

Opportunities to discuss in docs:

- error handling could be improved in various places (ie http server, retrying individual llm calls, more robust handling of entire batch failure)
  - re delivery of results messages can result in inaccurate counts of completed shards (ie if you comment out the results consumer ackack, youll get compted_shards_count > total_shards_count)
- Graceful shutdown
- use file storage when uploading jsonl for larger files
- proper logger (eg winston)

Resources

- Dedup
  - Exactly one (ackAck): https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#exactly-once-semantics
  - msgId header: https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive#message-deduplication
