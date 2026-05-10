"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("../../../packages/clickhouse/src/client");
const consumer_1 = require("../../../packages/kafka/src/consumer");
const app = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        await (0, client_1.initializeClickHouseSchemas)();
        app.log.info("Initialized ClickHouse schemas");
        const { startRetentionWorker } = require("./workers/retention.worker");
        startRetentionWorker();
        await (0, consumer_1.createConsumer)("log-service-group", "events", async (event) => {
            app.log.info({ traceId: event.traceId, type: event.type }, "Received event");
            try {
                await client_1.clickhouse.insert({
                    table: 'events',
                    values: [
                        {
                            tenant_id: event.tenantId || "default",
                            trace_id: event.traceId,
                            span_id: event.spanId || "",
                            parent_span_id: event.parentSpanId || "",
                            event_name: event.name,
                            service_name: event.service,
                            timestamp: event.timestamp,
                            payload: JSON.stringify(event.payload),
                            duration_ms: event.payload?.durationMs || 0,
                            status_code: event.payload?.statusCode || 0,
                        }
                    ],
                    format: 'JSONEachRow',
                });
                app.log.info({ traceId: event.traceId }, "Saved event to ClickHouse");
            }
            catch (err) {
                app.log.error({ err, traceId: event.traceId }, "Failed to save event to ClickHouse");
            }
        });
        const port = Number(process.env.PORT) || 4001;
        await app.listen({ port, host: "0.0.0.0" });
        app.log.info(`Log service listening on port ${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
