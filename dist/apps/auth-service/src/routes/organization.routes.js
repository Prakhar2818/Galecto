"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRoutes = organizationRoutes;
const organization_controller_1 = require("../controllers/organization.controller");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function organizationRoutes(app) {
    const controller = new organization_controller_1.OrganizationController();
    app.addHook("onRequest", jwtAuthMiddleware);
    app.get("/settings", controller.getSettings);
    app.put("/settings", controller.updateSettings);
}
