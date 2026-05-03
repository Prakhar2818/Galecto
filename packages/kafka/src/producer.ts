import { kafka } from "./client";

const producer = kafka.producer();

export async function sendEvent(topic: string, message: any) {
  await producer.connect();

  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
}
