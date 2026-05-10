"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const routes_1 = require("./routes");
const requestContext_1 = require("./middleware/requestContext");
const logger_1 = require("./middleware/logger");
const auth_routes_1 = require("./routes/auth.routes");
const error_middleware_1 = require("./middleware/error.middleware");
function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    app.register(cors_1.default, { origin: "*" });
    app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "secret",
    });
    app.addHook("onRequest", requestContext_1.requestContextMiddleware);
    app.addHook("preHandler", logger_1.loggingMiddleware);
    app.addHook("onResponse", logger_1.responseLoggingMiddleware);
    app.setErrorHandler(error_middleware_1.errorHandler);
    app.get("/", async () => {
        return { status: "API Gateway Online", api: "/api/v1" };
    });
    app.register(routes_1.routes);
    app.register(auth_routes_1.authRoutes);
    return app;
}
