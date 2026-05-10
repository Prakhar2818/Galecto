"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceRoutes = traceRoutes;
exports.traceRoutesWithPrefix = traceRoutesWithPrefix;
const trace_controller_1 = require("../controllers/trace.controller");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function traceRoutes(fastify) {
    const controller = new trace_controller_1.TraceController();
    fastify.addHook("onRequest", jwtAuthMiddleware);
    fastify.get("/", async (req, reply) => controller.listTraces(req, reply));
    fastify.get("/anomalies", async (req, reply) => controller.listAnomalies(req, reply));
    fastify.get("/metrics", async (req, reply) => controller.getPerformanceMetrics(req, reply));
    fastify.get("/:traceId", async (req, reply) => controller.getTraceDetails(req, reply));
}
async function traceRoutesWithPrefix(fastify) {
    fastify.register(traceRoutes, { prefix: "/api/v1/traces" });
}
