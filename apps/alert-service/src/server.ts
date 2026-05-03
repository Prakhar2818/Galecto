import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { createConsumer } from "../../../packages/kafka/src/consumer";
import { IEvent } from "../../../packages/types/src/index";

const app = Fastify({ logger: true });

// In-memory alert store (for demo purposes)
const alerts: any[] = [];

async function start() {
  try {
    await app.register(cors, { origin: "*" });

    // 1. Consume Kafka Events and Trigger Alerts
    await createConsumer("alert-service-group", "events", async (event: IEvent) => {
      let triggerAlert = false;
      let reason = "";

      // Rule A: Error detection
      if (event.name.includes("RESPONSE") && event.payload.statusCode >= 400) {
        triggerAlert = true;
        reason = `High Error Rate: ${event.service} returned status ${event.payload.statusCode}`;
      }

      // Rule B: Latency detection
      if (event.payload.durationMs > 500) {
        triggerAlert = true;
        reason = `Latency Spike: ${event.service} request took ${event.payload.durationMs}ms`;
      }

      if (triggerAlert) {
        const alert = {
          id: Math.random().toString(36).substr(2, 9),
          traceId: event.traceId,
          service: event.service,
          type: event.payload.statusCode >= 400 ? 'ERROR' : 'LATENCY',
          message: reason,
          timestamp: Date.now(),
          status: 'ACTIVE'
        };
        
        alerts.unshift(alert);
        app.log.warn({ alert }, "ALERT TRIGGERED");
        
        // Trim store
        if (alerts.length > 100) alerts.pop();
      }
    });

    // 2. Expose API for Frontend
    app.get("/api/v1/alerts", async () => {
      return { success: true, data: alerts };
    });

    app.post("/api/v1/alerts/:id/resolve", async (request, reply) => {
      const { id } = request.params as { id: string };
      const alert = alerts.find(a => a.id === id);
      if (alert) alert.status = 'RESOLVED';
      return { success: true };
    });

    const port = Number(process.env.PORT) || 5003;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Alert service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
