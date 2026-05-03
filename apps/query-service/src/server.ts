import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { traceRoutes } from "./routes/trace.routes";
import { logRoutes } from "./routes/log.routes";

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors, {
      origin: "*", 
    });

    app.register(traceRoutes);
    app.register(logRoutes);

    const port = Number(process.env.PORT) || 4002;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Query service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
