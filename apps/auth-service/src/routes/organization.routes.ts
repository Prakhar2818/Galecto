import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { OrganizationController } from "../controllers/organization.controller";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function organizationRoutes(app: FastifyInstance) {
  const controller = new OrganizationController();

  app.addHook("onRequest", jwtAuthMiddleware);

  app.get("/settings", controller.getSettings);
  app.put("/settings", controller.updateSettings);
}