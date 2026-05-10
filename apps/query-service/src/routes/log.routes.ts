import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { LogController } from "../controllers/log.controller";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function logRoutes(fastify: FastifyInstance) {
  const controller = new LogController();

  fastify.addHook("onRequest", jwtAuthMiddleware);

  fastify.get("/api/v1/logs", async (request, reply) => {
    return controller.listLogs(request, reply);
  });
}
