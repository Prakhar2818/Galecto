import { kafka } from "./client";

export async function createConsumer(
  groupId: string,
  topic: string,
  handler: any,
) {
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value!.toString());
      await handler(data);
    },
  });
}
