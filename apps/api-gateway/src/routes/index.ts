import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { HealthController } from "../controllers/health.controller";
import { authMiddleware } from "../middleware/auth";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/api-types/src/index";
import { v4 as uuidv4 } from "uuid";

import { ReplayController } from "../controllers/replay.controller";
import { OtlpController } from "../controllers/otlp.controller";
import { SessionReplayController } from "../controllers/session-replay.controller";

const prisma = new PrismaClient();

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
  const sessionReplayController = new SessionReplayController();

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

  // Session Replay endpoints
  fastify.post(
    "/api/v1/session-replay/record",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      return sessionReplayController.record(request, reply);
    }
  );

  fastify.get(
    "/api/v1/session-replay/:sessionId",
    { preHandler: [jwtAuthMiddleware] },
    async (request, reply) => {
      return sessionReplayController.get(request, reply);
    }
  );

  fastify.get(
    "/api/v1/session-replay/by-trace/:traceId",
    { preHandler: [jwtAuthMiddleware] },
    async (request, reply) => {
      return sessionReplayController.getByTrace(request, reply);
    }
  );

  fastify.delete(
    "/api/v1/session-replay/:sessionId",
    { preHandler: [jwtAuthMiddleware] },
    async (request, reply) => {
      return sessionReplayController.delete(request, reply);
    }
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

  // Favorites endpoints
  fastify.get("/api/v1/favorites", { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.organizationId;
    const userId = user?.id;
    
    const favorites = await prisma.favorite.findMany({
      where: { userId, organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });
    
    return reply.send({ success: true, data: favorites });
  });

  fastify.post("/api/v1/favorites", { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.organizationId;
    const userId = user?.id;
    const { itemType, itemId, itemName } = request.body as any;
    
    if (!itemType || !itemId) {
      return reply.status(400).send({ error: "itemType and itemId are required" });
    }
    
    try {
      const favorite = await prisma.favorite.create({
        data: {
          userId,
          itemType,
          itemId,
          itemName: itemName || itemId,
          organizationId: orgId
        }
      });
      return reply.send({ success: true, data: favorite });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return reply.status(409).send({ error: "Item already favorited" });
      }
      throw err;
    }
  });

  fastify.delete("/api/v1/favorites/:id", { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
    const user = (request as any).user;
    const orgId = user?.organizationId;
    const userId = user?.id;
    const { id } = request.params as { id: string };
    
    await prisma.favorite.deleteMany({
      where: { id, userId, organizationId: orgId }
    });
    
    return reply.send({ success: true });
  });

  fastify.post(
    "/api/v1/ingest",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const organizationId = (request as any).organizationId;
      const payload = request.body as any;
      const sessionId = (request.headers["x-galecto-session-id"] as string) || undefined;

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
        sessionId,
      };

      await sendEvent("events", event);
      return reply.send({ success: true, traceId: event.traceId });
    }
  );
}