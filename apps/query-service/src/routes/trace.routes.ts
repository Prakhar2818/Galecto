import { FastifyInstance } from "fastify";
import { TraceController } from "../controllers/trace.controller";

export async function traceRoutes(fastify: FastifyInstance) {
  const controller = new TraceController();

  // Get a list of traces (paginated/filtered)
  fastify.get("/", async (req, reply) => controller.listTraces(req, reply));

  // Get full causality graph/timeline for a specific traceId
  fastify.get("/:traceId", async (req, reply) => controller.getTraceDetails(req, reply));
}
