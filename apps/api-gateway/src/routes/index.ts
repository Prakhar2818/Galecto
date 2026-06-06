import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { HealthController } from "../controllers/health.controller";
import { authMiddleware } from "../middleware/auth";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/api-types/src/index";
import { v4 as uuidv4 } from "uuid";

import { ReplayController } from "../controllers/replay.controller";
import { OtlpController } from "../controllers/otlp.controller";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function routes(fastify: FastifyInstance) {
  const controller = new HealthController();
  const replayController = new ReplayController();
  const otlpController = new OtlpController();

  fastify.get("/health", async () => {
    return controller.getHealth();
  });

  // OTLP endpoints (OpenTelemetry compatible)
  fastify.post(
    "/v1/traces",
    { preHandler: [authMiddleware] },
    async (request, reply) => otlpController.receiveTraces(request, reply)
  );

  fastify.post(
    "/v1/metrics",
    { preHandler: [authMiddleware] },
    async (request, reply) => otlpController.receiveMetrics(request, reply)
  );

  fastify.post(
    "/v1/logs",
    { preHandler: [authMiddleware] },
    async (request, reply) => otlpController.receiveLogs(request, reply)
  );

  fastify.get(
    "/api/v1/replays",
    { preHandler: [jwtAuthMiddleware] },
    async (request, reply) => {
      return replayController.listReplays(request, reply);
    }
  );

  fastify.post(
    "/api/v1/replay/:traceId",
    { preHandler: [jwtAuthMiddleware] },
    async (request, reply) => {
      return replayController.executeReplay(request, reply);
    }
  );

  fastify.post(
    "/api/v1/ingest",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const organizationId = (request as any).organizationId;
      const payload = request.body as any;

      const event: IEvent = {
        eventId: uuidv4(),
        traceId: (request as any).context.traceId,
        spanId: (request as any).context.spanId,
        tenantId: organizationId,
        type: EventType.LOG,
        service: payload.service || "unknown",
        name: "INGEST_LOG",
        timestamp: Date.now(),
        payload: payload,
      };

      await sendEvent("events", event);
      return reply.send({ success: true, traceId: event.traceId });
    }
  );
}