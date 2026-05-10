"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoutes = projectRoutes;
const project_controller_1 = require("../controllers/project.controller");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function projectRoutes(app) {
    const controller = new project_controller_1.ProjectController();
    app.addHook("onRequest", jwtAuthMiddleware);
    app.get("/", controller.listProjects);
    app.post("/", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.createProject);
    app.post("/:projectId/keys", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.generateKey);
    app.post("/keys/:keyId/rotate", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.rotateKey);
    app.post("/keys/:keyId/revoke", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.revokeKey);
    app.get("/keys/audit-logs", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.listKeyAuditLogs);
}
