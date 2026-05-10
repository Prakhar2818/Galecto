"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConsumer = createConsumer;
const client_1 = require("./client");
async function createConsumer(groupId, topic, handler) {
    const consumer = client_1.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic });
    await consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value.toString());
            await handler(data);
        },
    });
}
