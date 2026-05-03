import { FastifyInstance } from "fastify";
import { HealthController } from "../controllers/health.controller";
import { authMiddleware } from "../middleware/auth";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/types/src/index";
import { v4 as uuidv4 } from "uuid";

export async function routes(fastify: FastifyInstance) {
  const controller = new HealthController();

  fastify.get("/health", async () => {
    return controller.getHealth();
  });

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