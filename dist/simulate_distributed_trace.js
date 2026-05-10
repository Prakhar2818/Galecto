"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const producer_1 = require("./packages/kafka/src/producer");
const src_1 = require("./packages/types/src");
const uuid_1 = require("uuid");
require("dotenv/config");
async function simulate() {
    const traceId = (0, uuid_1.v4)();
    const tenantId = "e96bbebd-1c61-4f01-aad5-763a91f5f84d"; // Your seeded Org ID
    console.log(`🚀 Simulating Distributed Trace: ${traceId}`);
    // 1. GATEWAY SPAN
    const gatewaySpanId = (0, uuid_1.v4)();
    await (0, producer_1.sendEvent)("events", {
        eventId: (0, uuid_1.v4)(),
        traceId,
        spanId: gatewaySpanId,
        tenantId,
        type: src_1.EventType.LOG,
        service: "api-gateway",
        name: "API_REQUEST_RECEIVED",
        timestamp: Date.now(),
        payload: { path: "/api/v1/payment", method: "POST" }
    });
    // 2. AUTH-SERVICE SPAN (Child of Gateway)
    const authSpanId = (0, uuid_1.v4)();
    await (0, producer_1.sendEvent)("events", {
        eventId: (0, uuid_1.v4)(),
        traceId,
        spanId: authSpanId,
        parentSpanId: gatewaySpanId, // LINKED TO GATEWAY
        tenantId,
        type: src_1.EventType.LOG,
        service: "auth-service",
        name: "USER_VALIDATED",
        timestamp: Date.now() + 50,
        payload: { userId: "user_123", status: "success" }
    });
    // 3. BILLING-SERVICE SPAN (Child of Auth-Service)
    const billingSpanId = (0, uuid_1.v4)();
    await (0, producer_1.sendEvent)("events", {
        eventId: (0, uuid_1.v4)(),
        traceId,
        spanId: billingSpanId,
        parentSpanId: authSpanId, // LINKED TO AUTH
        tenantId,
        type: src_1.EventType.LOG,
        service: "billing-service",
        name: "PAYMENT_PROCESSED",
        timestamp: Date.now() + 150,
        payload: { amount: 1200, currency: "USD" }
    });
    console.log("✅ Multi-hop trace data sent to Kafka!");
    process.exit(0);
}
simulate();
