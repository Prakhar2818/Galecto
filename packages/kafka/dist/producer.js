"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEvent = sendEvent;
const client_1 = require("./client");
const producer = client_1.kafka.producer();
async function sendEvent(topic, message) {
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
