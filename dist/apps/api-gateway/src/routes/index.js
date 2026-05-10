"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = routes;
const health_controller_1 = require("../controllers/health.controller");
const auth_1 = require("../middleware/auth");
const producer_1 = require("../../../../packages/kafka/src/producer");
const index_1 = require("../../../../packages/types/src/index");
const uuid_1 = require("uuid");
const replay_controller_1 = require("../controllers/replay.controller");
const otlp_controller_1 = require("../controllers/otlp.controller");
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function routes(fastify) {
    const controller = new health_controller_1.HealthController();
    const replayController = new replay_controller_1.ReplayController();
    const otlpController = new otlp_controller_1.OtlpController();
    fastify.get("/health", async () => {
        return controller.getHealth();
    });
    // OTLP endpoints (OpenTelemetry compatible)
    fastify.post("/v1/traces", { preHandler: [auth_1.authMiddleware] }, async (request, reply) => otlpController.receiveTraces(request, reply));
    fastify.post("/v1/metrics", { preHandler: [auth_1.authMiddleware] }, async (request, reply) => otlpController.receiveMetrics(request, reply));
    fastify.post("/v1/logs", { preHandler: [auth_1.authMiddleware] }, async (request, reply) => otlpController.receiveLogs(request, reply));
    fastify.get("/api/v1/replays", { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return replayController.listReplays(request, reply);
    });
    fastify.post("/api/v1/replay/:traceId", { preHandler: [jwtAuthMiddleware] }, async (request, reply) => {
        return replayController.executeReplay(request, reply);
    });
    fastify.post("/api/v1/ingest", { preHandler: [auth_1.authMiddleware] }, async (request, reply) => {
        const organizationId = request.organizationId;
        const payload = request.body;
        const event = {
            eventId: (0, uuid_1.v4)(),
            traceId: request.context.traceId,
            spanId: request.context.spanId,
            tenantId: organizationId,
            type: index_1.EventType.LOG,
            service: payload.service || "unknown",
            name: "INGEST_LOG",
            timestamp: Date.now(),
            payload: payload,
        };
        await (0, producer_1.sendEvent)("events", event);
        return reply.send({ success: true, traceId: event.traceId });
    });
}
