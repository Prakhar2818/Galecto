"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const auth_routes_1 = require("./routes/auth.routes");
const project_routes_1 = require("./routes/project.routes");
const organization_routes_1 = require("./routes/organization.routes");
const notification_routes_1 = require("./routes/notification.routes");
const dashboard_routes_1 = require("./routes/dashboard.routes");
const incident_routes_1 = require("./routes/incident.routes");
const error_middleware_1 = require("./middlewares/error.middleware");
const request_context_middleware_1 = require("./middlewares/request-context.middleware");
const logger_middleware_1 = require("./middlewares/logger.middleware");
function buildApp() {
    const app = (0, fastify_1.default)();
    app.register(cors_1.default, { origin: "*" });
    app.addHook("onRequest", request_context_middleware_1.requestContextMiddleware);
    app.addHook("onRequest", logger_middleware_1.loggingMiddleware);
    app.addHook("onResponse", logger_middleware_1.responseLoggingMiddleware);
    app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "secret",
    });
    app.setErrorHandler(error_middleware_1.errorHandler);
    app.register(auth_routes_1.authRoutes, { prefix: "/auth" });
    app.register(project_routes_1.projectRoutes, { prefix: "/projects" });
    app.register(organization_routes_1.organizationRoutes, { prefix: "/organization" });
    app.register(notification_routes_1.notificationRoutes, { prefix: "/notifications" });
    app.register(dashboard_routes_1.dashboardRoutes, { prefix: "/dashboards" });
    app.register(incident_routes_1.incidentRoutes, { prefix: "/platform" });
    return app;
}
