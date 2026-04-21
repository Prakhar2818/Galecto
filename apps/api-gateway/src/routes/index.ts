import { FastifyInstance } from "fastify";
import { HealthController } from "../controllers/health.controller";

export async function routes(fastify: FastifyInstance) {
  const controller = new HealthController();

  fastify.get("/health", async () => {
    return controller.getHealth();
  });
}