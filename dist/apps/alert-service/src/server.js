"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const client_1 = require("@prisma/client");
const consumer_1 = require("../../../packages/kafka/src/consumer");
const app = (0, fastify_1.default)({ logger: true });
const prisma = new client_1.PrismaClient();
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
async function start() {
    try {
        await app.register(cors_1.default, { origin: "*" });
        await app.register(jwt_1.default, {
            secret: process.env.JWT_SECRET || "secret",
        });
        await (0, consumer_1.createConsumer)("alert-service-group", "events", async (event) => {
            let triggerAlert = false;
            let reason = "";
            if (event.name.includes("RESPONSE") && event.payload.statusCode >= 400) {
                triggerAlert = true;
                reason = `High Error Rate: ${event.service} returned status ${event.payload.statusCode}`;
            }
            if (event.payload.durationMs > 500) {
                triggerAlert = true;
                reason = `Latency Spike: ${event.service} request took ${event.payload.durationMs}ms`;
            }
            if (triggerAlert && event.tenantId) {
                try {
                    const alert = await prisma.alert.create({
                        data: {
                            traceId: event.traceId,
                            service: event.service,
                            type: event.payload.statusCode >= 400 ? 'ERROR' : 'LATENCY',
                            message: reason,
                            status: 'ACTIVE',
                            organizationId: event.tenantId,
                        }
                    });
                    app.log.warn({ alertId: alert.id }, "ALERT TRIGGERED AND PERSISTED");
                }
                catch (err) {
                    app.log.error({ err, tenantId: event.tenantId }, "Failed to persist alert");
                }
            }
        });
        app.addHook("onRequest", jwtAuthMiddleware);
        app.get("/api/v1/alerts", async (request) => {
            const user = request.user;
            const orgId = user?.organizationId;
            const alerts = await prisma.alert.findMany({
                where: { organizationId: orgId },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return { success: true, data: alerts };
        });
        app.post("/api/v1/alerts/:id/resolve", async (request, reply) => {
            const { id } = request.params;
            const user = request.user;
            const orgId = user?.organizationId;
            await prisma.alert.updateMany({
                where: { id, organizationId: orgId },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date()
                }
            });
            return { success: true };
        });
        const port = Number(process.env.PORT) || 5003;
        await app.listen({ port, host: "0.0.0.0" });
        app.log.info(`Alert service listening on port ${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
