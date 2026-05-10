"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = notificationRoutes;
const notification_controller_1 = require("../controllers/notification.controller");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function notificationRoutes(app) {
    const controller = new notification_controller_1.NotificationController();
    app.addHook("onRequest", jwtAuthMiddleware);
    app.get("/", controller.listChannels);
    app.post("/", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.createChannel);
    app.put("/:channelId", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.updateChannel);
    app.delete("/:channelId", { preHandler: (0, rbac_middleware_1.requireRole)(rbac_middleware_1.Role.OWNER, rbac_middleware_1.Role.ADMIN) }, controller.deleteChannel);
}
