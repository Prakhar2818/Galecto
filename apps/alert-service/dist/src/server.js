"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env"), override: true });
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const client_1 = require("@prisma/client");
const consumer_1 = require("../../../packages/kafka/src/consumer");
const notifiers_1 = require("./notifiers");
const app = (0, fastify_1.default)({ logger: true });
const prisma = new client_1.PrismaClient();
async function jwtAuthMiddleware(request, reply) {
    const publicPaths = ['/api/v1/send-test-notifications', '/health'];
    if (publicPaths.some(path => request.url.startsWith(path))) {
        return;
    }
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
        app.post("/api/v1/send-test-notifications", { preHandler: [] }, async (req, reply) => {
            console.log(`[AlertService] Received request to send test notifications`);
            const notificationPayload = {
                title: `🚨 TEST NOTIFICATION: Direct Test`,
                message: "This is a direct test of the notification system - checking if Slack and Email are working!",
                severity: "HIGH",
                service: "test-service",
                eventData: {
                    test: true,
                    timestamp: Date.now(),
                    source: "direct-api-call"
                },
                timestamp: new Date()
            };
            const results = {};
            try {
                await notifiers_1.notificationService.sendNotification("SLACK", notificationPayload);
                results.slack = "sent";
                console.log(`[AlertService] SLACK notification sent`);
            }
            catch (error) {
                results.slack = `failed: ${error}`;
                console.error(`[AlertService] SLACK notification failed:`, error);
            }
            try {
                await notifiers_1.notificationService.sendNotification("EMAIL", notificationPayload);
                results.email = "sent";
                console.log(`[AlertService] EMAIL notification sent`);
            }
            catch (error) {
                results.email = `failed: ${error}`;
                console.error(`[AlertService] EMAIL notification failed:`, error);
            }
            return {
                success: true,
                data: {
                    message: "Test notifications sent",
                    results
                }
            };
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
                    const channels = await prisma.notificationChannel.findMany({
                        where: { organizationId: event.tenantId, enabled: true }
                    });
                    if (channels.length > 0) {
                        const notificationPayload = {
                            title: `Alert: ${event.service}`,
                            message: reason,
                            severity: event.payload.statusCode >= 400 ? "HIGH" : "MEDIUM",
                            service: event.service,
                            eventData: event.payload,
                            timestamp: new Date()
                        };
                        for (const channel of channels) {
                            try {
                                await notifiers_1.notificationService.sendNotification(channel.type, notificationPayload);
                                console.log(`[AlertService] Sent ${channel.type} notification for alert ${alert.id}`);
                            }
                            catch (notifError) {
                                console.error(`[AlertService] Failed to send ${channel.type} notification:`, notifError);
                            }
                        }
                    }
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
        app.post("/api/v1/test-notification", async (request, reply) => {
            const user = request.user;
            const orgId = user?.organizationId;
            const channels = await prisma.notificationChannel.findMany({
                where: { organizationId: orgId, enabled: true }
            });
            const testPayload = {
                title: "Test Alert from Galecto",
                message: "This is a test notification to verify all channels are working.",
                severity: "HIGH",
                service: "test-service",
                eventData: { test: true, timestamp: Date.now() },
                timestamp: new Date()
            };
            const results = [];
            for (const channel of channels) {
                try {
                    await notifiers_1.notificationService.sendNotification(channel.type, testPayload);
                    results.push({ channelId: channel.id, type: channel.type, status: "sent" });
                }
                catch (error) {
                    results.push({ channelId: channel.id, type: channel.type, status: "failed", error: String(error) });
                }
            }
            return { success: true, data: { testedChannels: results.length, results } };
        });
        app.post("/api/v1/trigger-test-alert", async (request, reply) => {
            const user = request.user;
            const orgId = user?.organizationId || "test-org-123";
            const testAlert = await prisma.alert.create({
                data: {
                    traceId: `test-trace-${Date.now()}`,
                    service: "api-gateway",
                    type: "ERROR",
                    message: "Test Error: This is a simulated 500 error for testing notifications",
                    status: "ACTIVE",
                    severity: "HIGH",
                    organizationId: orgId,
                }
            });
            console.log(`[AlertService] Created test alert: ${testAlert.id}`);
            const notificationPayload = {
                title: `🚨 TEST ALERT: api-gateway`,
                message: "Test Error: This is a simulated 500 error for testing notifications",
                severity: "HIGH",
                service: "api-gateway",
                eventData: {
                    statusCode: 500,
                    durationMs: 1245,
                    traceId: testAlert.traceId,
                    test: true
                },
                timestamp: new Date()
            };
            await notifiers_1.notificationService.sendNotification("SLACK", notificationPayload);
            console.log(`[AlertService] Sent SLACK notification for test alert`);
            await notifiers_1.notificationService.sendNotification("EMAIL", notificationPayload);
            console.log(`[AlertService] Sent EMAIL notification for test alert`);
            return {
                success: true,
                data: {
                    alertId: testAlert.id,
                    message: "Test alert triggered and notifications sent"
                }
            };
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
