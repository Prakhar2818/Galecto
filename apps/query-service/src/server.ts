import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { traceRoutesWithPrefix } from "./routes/trace.routes";
import { logRoutes } from "./routes/log.routes";
import { ServiceMapController } from "./controllers/service-map.controller";

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors, {
      origin: "*", 
    });

    app.register(jwt, {
      secret: process.env.JWT_SECRET || "secret",
    });

    app.register(traceRoutesWithPrefix);
    app.register(logRoutes);

    const serviceMapController = new ServiceMapController();

    app.get("/api/v1/service-map", async (req, reply) => serviceMapController.getServiceDependencies(req, reply));
    app.get("/api/v1/anomaly-trends", async (req, reply) => serviceMapController.getAnomalyTrends(req, reply));
    app.get("/api/v1/slo-status", async (req, reply) => serviceMapController.getSloStatus(req, reply));

    const port = Number(process.env.PORT) || 4002;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Query service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
