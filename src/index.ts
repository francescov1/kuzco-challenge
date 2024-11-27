import {
  connect,
  NatsConnection,
  StringCodec,
} from "nats";


interface SingleRequest {
    index: number;
    prompt: string;
}


const BATCH_SIZE = 1000;
const requests: SingleRequest[] = []

const connectToNats = async () => {
    const connection = await connect({ servers: "localhost" });
    console.log(`connected to ${connection.getServer()}`);
    // this promise indicates the client closed
    connection.closed().then((err) => {
      if (err) {
        console.log(`error closing: ${err}`);
      }
    });

    return connection;
}

export const worker = async () => {
  const connection = await connectToNats();

  const subscription = connection.subscribe("a-channel", { queue: "a-queue" })
  
  for await (const message of subscription) {
    // console.log("Message received: ", message);
    console.log("Num processed: ", subscription.getProcessed());
    try {
      console.log("Decoded JSON: ", message.json());
    } catch (e) {
      console.log("Error decoding JSON");
    }
    console.log("Decoded string: ", message.string());

    // respond returns true if the message had a reply subject, thus it could respond
    if (message.respond(message.data)) {
      console.log("Responded to message");
    } else {
      console.log("Could not respond to message");
    }
  }
}

async function main() {
  await connectToNats();
  await Promise.all([worker(), worker()]);
}

main();