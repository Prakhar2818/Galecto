"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const trace_routes_1 = require("./routes/trace.routes");
const log_routes_1 = require("./routes/log.routes");
const service_map_controller_1 = require("./controllers/service-map.controller");
const app = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        await app.register(cors_1.default, {
            origin: "*",
        });
        app.register(jwt_1.default, {
            secret: process.env.JWT_SECRET || "secret",
        });
        app.register(trace_routes_1.traceRoutesWithPrefix);
        app.register(log_routes_1.logRoutes);
        const serviceMapController = new service_map_controller_1.ServiceMapController();
        app.get("/api/v1/service-map", async (req, reply) => serviceMapController.getServiceDependencies(req, reply));
        app.get("/api/v1/anomaly-trends", async (req, reply) => serviceMapController.getAnomalyTrends(req, reply));
        app.get("/api/v1/slo-status", async (req, reply) => serviceMapController.getSloStatus(req, reply));
        const port = Number(process.env.PORT) || 4002;
        await app.listen({ port, host: "0.0.0.0" });
        app.log.info(`Query service listening on port ${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
