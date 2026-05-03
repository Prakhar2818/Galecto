import { FastifyInstance } from "fastify";
import { LogController } from "../controllers/log.controller";

export async function logRoutes(fastify: FastifyInstance) {
  const controller = new LogController();

  fastify.get("/api/v1/logs", async (request, reply) => {
    return controller.listLogs(request, reply);
  });
}
