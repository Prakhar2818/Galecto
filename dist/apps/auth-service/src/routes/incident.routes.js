"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentRoutes = incidentRoutes;
const incident_controller_1 = require("../controllers/incident.controller");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function incidentRoutes(app) {
    const incidentCtrl = new incident_controller_1.IncidentController();
    const deployCtrl = new incident_controller_1.DeployController();
    const sloCtrl = new incident_controller_1.SloController();
    app.addHook("onRequest", jwtAuthMiddleware);
    // Incidents
    app.get("/incidents", incidentCtrl.listIncidents);
    app.get("/incidents/:incidentId", incidentCtrl.getIncident);
    app.post("/incidents/:incidentId/acknowledge", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER) }, incidentCtrl.acknowledgeIncident);
    app.post("/incidents/:incidentId/notes", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER, rbac_middleware_1.Role.OBSERVER) }, incidentCtrl.addNote);
    app.post("/incidents/:incidentId/resolve", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER) }, incidentCtrl.resolveIncident);
    // Deploy markers
    app.get("/deploys", deployCtrl.listDeployMarkers);
    app.post("/deploys", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER) }, deployCtrl.createDeployMarker);
    // SLOs
    app.get("/slos", sloCtrl.listSlos);
    app.post("/slos", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, sloCtrl.createSlo);
    app.delete("/slos/:sloId", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, sloCtrl.deleteSlo);
}
