import "dotenv/config";
import Fastify from "fastify";
import { clickhouse, initializeClickHouseSchemas } from "../../../packages/clickhouse/src/client";
import { createConsumer } from "../../../packages/kafka/src/consumer";
import { IEvent } from "../../../packages/types/src/index";

const app = Fastify({ logger: true });

async function start() {
  try {
    await initializeClickHouseSchemas();
    app.log.info("Initialized ClickHouse schemas");

    await createConsumer("log-service-group", "events", async (event: IEvent) => {
      app.log.info({ traceId: event.traceId, type: event.type }, "Received event");
      
      try {
        await clickhouse.insert({
          table: 'events',
          values: [
            {
              tenant_id: event.tenantId || "default",
              trace_id: event.traceId,
              span_id: event.spanId || "",
              event_name: event.name,
              service_name: event.service,
              timestamp: event.timestamp,
              payload: JSON.stringify(event.payload),
            }
          ],
          format: 'JSONEachRow',
        });
        app.log.info({ traceId: event.traceId }, "Saved event to ClickHouse");
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
