"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const container_1 = require("../container");
const auth_service_1 = require("../services/auth.service");
const producer_1 = require("../../../../packages/kafka/src/producer");
const index_1 = require("../../../../packages/types/src/index");
const uuid_1 = require("uuid");
class AuthController {
    async register(req, reply) {
        const { email, password, organizationName } = req.body;
        const service = container_1.container.resolve(auth_service_1.AuthService);
        const { user, org } = await service.register(email, password, organizationName);
        const traceId = req.headers["x-trace-id"] || (0, uuid_1.v4)();
        const parentSpanId = req.headers["x-span-id"];
        const event = {
            eventId: (0, uuid_1.v4)(),
            traceId,
            spanId: (0, uuid_1.v4)(),
            parentSpanId,
            tenantId: org.id,
            type: index_1.EventType.LOG,
            service: "auth-service",
            name: "USER_REGISTERED",
            timestamp: Date.now(),
            payload: { userId: user.id, email: user.email, organizationId: org.id },
        };
        (0, producer_1.sendEvent)("events", event).catch(console.error);
        // Generate token for immediate login after signup
        const token = req.server.jwt.sign({
            id: user.id,
            role: user.role || "USER",
            organizationId: org.id,
        });
        return reply.send({ success: true, user, token });
    }
    async login(req, reply) {
        const { email, password } = req.body;
        const service = container_1.container.resolve(auth_service_1.AuthService);
        const user = await service.login(email, password);
        const token = req.server.jwt.sign({
            id: user.id,
            role: user.role || "USER",
            organizationId: user.organizationId,
        });
        const traceId = req.headers["x-trace-id"] || (0, uuid_1.v4)();
        const parentSpanId = req.headers["x-span-id"];
        const event = {
            eventId: (0, uuid_1.v4)(),
            traceId,
            spanId: (0, uuid_1.v4)(),
            parentSpanId,
            tenantId: user.organizationId,
            type: index_1.EventType.LOG,
            service: "auth-service",
            name: "USER_LOGGED_IN",
            timestamp: Date.now(),
            payload: { userId: user.id, email: user.email },
        };
        (0, producer_1.sendEvent)("events", event).catch(console.error);
        return reply.send({ success: true, token, user });
    }
}
exports.AuthController = AuthController;
