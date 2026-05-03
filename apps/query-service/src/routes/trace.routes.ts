import { FastifyInstance } from "fastify";
import { TraceController } from "../controllers/trace.controller";

export async function traceRoutes(fastify: FastifyInstance) {
  const controller = new TraceController();

  // Get a list of traces (paginated/filtered)
  fastify.get("/", async (req, reply) => controller.listTraces(req, reply));
  fastify.get("/anomalies", async (req, reply) => controller.listAnomalies(req, reply));
  fastify.get("/metrics", async (req, reply) => controller.getPerformanceMetrics(req, reply));
  fastify.get("/:traceId", async (req, reply) => controller.getTraceDetails(req, reply));
}
