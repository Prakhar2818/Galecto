import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "observability-platform",
  brokers: ["localhost:9092"],
});