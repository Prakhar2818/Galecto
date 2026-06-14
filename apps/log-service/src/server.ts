import "dotenv/config";
import Fastify from "fastify";
import { clickhouse, initializeClickHouseSchemas } from "../../../packages/clickhouse/src/client";
import { createConsumer } from "../../../packages/kafka/src/consumer";
import { IEvent } from "../../../packages/api-types/src/index";

const app = Fastify({ logger: true });

async function start() {
  try {
    await initializeClickHouseSchemas();
    app.log.info("Initialized ClickHouse schemas");

    const { startRetentionWorker } = require("./workers/retention.worker");
    startRetentionWorker();

    await createConsumer("log-service-group", "events", async (event: IEvent) => {
      app.log.info({ traceId: event.traceId, type: event.type }, "Received event");
      
      try {
        // Extract status_code from nested SDK payloads (e.g., INGEST_LOG events)
        let statusCode = 0;
        if (event.payload?.statusCode) {
          statusCode = Number(event.payload.statusCode);
        } else if (event.payload?.payload?.attributes?.status) {
          statusCode = Number(event.payload.payload.attributes.status);
        } else if (event.payload?.attributes?.status) {
          statusCode = Number(event.payload.attributes.status);
        } else if (event.payload?.status) {
          statusCode = Number(event.payload.status);
        }

        // Extract duration_ms from nested SDK payloads
        let durationMs = 0;
        if (event.payload?.durationMs) {
          durationMs = Number(event.payload.durationMs);
        } else if (event.payload?.payload?.duration) {
          durationMs = Number(event.payload.payload.duration);
        } else if (event.payload?.duration) {
          durationMs = Number(event.payload.duration);
        }

        await clickhouse.insert({
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
              duration_ms: durationMs,
              status_code: statusCode,
              session_id: event.sessionId || "",
            }
          ],
          format: 'JSONEachRow',
        });
        app.log.info({ traceId: event.traceId, statusCode, durationMs }, "Saved event to ClickHouse");
      } catch (err) {
        app.log.error({ err, traceId: event.traceId }, "Failed to save event to ClickHouse");
      }
    });

    const port = Number(process.env.PORT) || 4001;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Log service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
