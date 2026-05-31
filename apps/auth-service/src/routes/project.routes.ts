import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ProjectControllerV2 } from "../controllers/project.controller.v2";
import { Role, requireRole } from "../middlewares/rbac.middleware";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function projectRoutes(app: FastifyInstance) {
  const controller = new ProjectControllerV2();

  app.addHook("onRequest", jwtAuthMiddleware);

  app.get("/", controller.listProjects);
  app.post("/", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.createProject);
  app.post("/:projectId/keys", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.generateKey);
  app.post("/keys/:keyId/rotate", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.rotateKey);
  app.post("/keys/:keyId/revoke", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.revokeKey);
  app.get("/keys/audit-logs", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.listKeyAuditLogs);
}
