import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { NotificationController } from "../controllers/notification.controller";
import { Role, requireRole } from "../middlewares/rbac.middleware";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function notificationRoutes(app: FastifyInstance) {
  const controller = new NotificationController();

  app.addHook("onRequest", jwtAuthMiddleware);

  app.get("/", controller.listChannels);
  app.post("/", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.createChannel);
  app.put("/:channelId", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.updateChannel);
  app.delete("/:channelId", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.deleteChannel);
}