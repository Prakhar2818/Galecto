"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = dashboardRoutes;
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function dashboardRoutes(app) {
    const controller = new dashboard_controller_1.DashboardController();
    app.addHook("onRequest", jwtAuthMiddleware);
    // Saved Searches
    app.get("/searches", controller.listSavedSearches);
    app.post("/searches", controller.createSavedSearch);
    app.delete("/searches/:searchId", controller.deleteSavedSearch);
    // Dashboards
    app.get("/", controller.listDashboards);
    app.post("/", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER) }, controller.createDashboard);
    app.put("/:dashboardId", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN, rbac_middleware_1.Role.DEVELOPER) }, controller.updateDashboard);
    app.delete("/:dashboardId", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.deleteDashboard);
}
