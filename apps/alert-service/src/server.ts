import "dotenv/config";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import { createConsumer } from "../../../packages/kafka/src/consumer";
import { IEvent } from "../../../packages/api-types/src/index";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

async function start() {
  try {
    await app.register(cors, { origin: "*" });
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || "secret",
    });

    await createConsumer("alert-service-group", "events", async (event: IEvent) => {
      let triggerAlert = false;
      let reason = "";

      if (event.name.includes("RESPONSE") && event.payload.statusCode >= 400) {
        triggerAlert = true;
        reason = `High Error Rate: ${event.service} returned status ${event.payload.statusCode}`;
      }

      if (event.payload.durationMs > 500) {
        triggerAlert = true;
        reason = `Latency Spike: ${event.service} request took ${event.payload.durationMs}ms`;
      }

      if (triggerAlert && event.tenantId) {
        try {
          const alert = await prisma.alert.create({
            data: {
              traceId: event.traceId,
              service: event.service,
              type: event.payload.statusCode >= 400 ? 'ERROR' : 'LATENCY',
              message: reason,
              status: 'ACTIVE',
              organizationId: event.tenantId,
            }
          });
          app.log.warn({ alertId: alert.id }, "ALERT TRIGGERED AND PERSISTED");
        } catch (err) {
          app.log.error({ err, tenantId: event.tenantId }, "Failed to persist alert");
        }
      }
    });

    app.addHook("onRequest", jwtAuthMiddleware);

    app.get("/api/v1/alerts", async (request) => {
      const user = request.user as any;
      const orgId = user?.organizationId;
      
      const alerts = await prisma.alert.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      
      return { success: true, data: alerts };
    });

    app.post("/api/v1/alerts/:id/resolve", async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const orgId = user?.organizationId;
      
      await prisma.alert.updateMany({
        where: { id, organizationId: orgId },
        data: { 
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });
      
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
