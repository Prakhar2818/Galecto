"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRoutes = logRoutes;
const log_controller_1 = require("../controllers/log.controller");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function logRoutes(fastify) {
    const controller = new log_controller_1.LogController();
    fastify.addHook("onRequest", jwtAuthMiddleware);
    fastify.get("/api/v1/logs", async (request, reply) => {
        return controller.listLogs(request, reply);
    });
}
