import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { DashboardController } from "../controllers/dashboard.controller";
import { Role, requireRole } from "../middlewares/rbac.middleware";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function dashboardRoutes(app: FastifyInstance) {
  const controller = new DashboardController();

  app.addHook("onRequest", jwtAuthMiddleware);

  // Saved Searches
  app.get("/searches", controller.listSavedSearches);
  app.post("/searches", controller.createSavedSearch);
  app.delete("/searches/:searchId", controller.deleteSavedSearch);

  // Dashboards
  app.get("/", controller.listDashboards);
  app.post("/", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER) }, controller.createDashboard);
  app.put("/:dashboardId", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER) }, controller.updateDashboard);
  app.delete("/:dashboardId", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, controller.deleteDashboard);
}