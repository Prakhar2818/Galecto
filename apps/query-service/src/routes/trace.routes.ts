import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TraceController } from "../controllers/trace.controller";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function traceRoutes(fastify: FastifyInstance) {
  const controller = new TraceController();

  fastify.addHook("onRequest", jwtAuthMiddleware);

  fastify.get("/", async (req, reply) => controller.listTraces(req, reply));
  fastify.get("/anomalies", async (req, reply) => controller.listAnomalies(req, reply));
  fastify.get("/metrics", async (req, reply) => controller.getPerformanceMetrics(req, reply));
  fastify.get("/:traceId", async (req, reply) => controller.getTraceDetails(req, reply));
}

export async function traceRoutesWithPrefix(fastify: FastifyInstance) {
  fastify.register(traceRoutes, { prefix: "/api/v1/traces" });
}
