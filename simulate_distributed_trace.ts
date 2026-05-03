import { sendEvent } from "./packages/kafka/src/producer";
import { EventType } from "./packages/types/src";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

async function simulate() {
  const traceId = uuidv4();
  const tenantId = "e96bbebd-1c61-4f01-aad5-763a91f5f84d"; // Your seeded Org ID

  console.log(`🚀 Simulating Distributed Trace: ${traceId}`);

  // 1. GATEWAY SPAN
  const gatewaySpanId = uuidv4();
  await sendEvent("events", {
    eventId: uuidv4(),
    traceId,
    spanId: gatewaySpanId,
    tenantId,
    type: EventType.LOG,
    service: "api-gateway",
    name: "API_REQUEST_RECEIVED",
    timestamp: Date.now(),
    payload: { path: "/api/v1/payment", method: "POST" }
  });

  // 2. AUTH-SERVICE SPAN (Child of Gateway)
  const authSpanId = uuidv4();
  await sendEvent("events", {
    eventId: uuidv4(),
    traceId,
    spanId: authSpanId,
    parentSpanId: gatewaySpanId, // LINKED TO GATEWAY
    tenantId,
    type: EventType.LOG,
    service: "auth-service",
    name: "USER_VALIDATED",
    timestamp: Date.now() + 50,
    payload: { userId: "user_123", status: "success" }
  });

  // 3. BILLING-SERVICE SPAN (Child of Auth-Service)
  const billingSpanId = uuidv4();
  await sendEvent("events", {
    eventId: uuidv4(),
    traceId,
    spanId: billingSpanId,
    parentSpanId: authSpanId, // LINKED TO AUTH
    tenantId,
    type: EventType.LOG,
    service: "billing-service",
    name: "PAYMENT_PROCESSED",
    timestamp: Date.now() + 150,
    payload: { amount: 1200, currency: "USD" }
  });

  console.log("✅ Multi-hop trace data sent to Kafka!");
  process.exit(0);
}

simulate();
