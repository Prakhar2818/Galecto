import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { IncidentController, DeployController, SloController } from "../controllers/incident.controller";
import { Role, requireRole } from "../middlewares/rbac.middleware";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function incidentRoutes(app: FastifyInstance) {
  const incidentCtrl = new IncidentController();
  const deployCtrl = new DeployController();
  const sloCtrl = new SloController();

  app.addHook("onRequest", jwtAuthMiddleware);

  // Incidents
  app.get("/incidents", incidentCtrl.listIncidents);
  app.get("/incidents/:incidentId", incidentCtrl.getIncident);
  app.post("/incidents/:incidentId/acknowledge", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER) }, incidentCtrl.acknowledgeIncident);
  app.post("/incidents/:incidentId/notes", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.OBSERVER) }, incidentCtrl.addNote);
  app.post("/incidents/:incidentId/resolve", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER) }, incidentCtrl.resolveIncident);

  // Deploy markers
  app.get("/deploys", deployCtrl.listDeployMarkers);
  app.post("/deploys", { preHandler: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER) }, deployCtrl.createDeployMarker);

  // SLOs
  app.get("/slos", sloCtrl.listSlos);
  app.post("/slos", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, sloCtrl.createSlo);
  app.delete("/slos/:sloId", { preHandler: requireRole(Role.OWNER, Role.ADMIN) }, sloCtrl.deleteSlo);
}