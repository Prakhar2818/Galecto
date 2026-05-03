import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { traceRoutes } from "./routes/trace.routes";

const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors, {
      origin: "*", // In production, replace with your frontend URL
    });

    // Add a welcome route for the root
    app.get("/", async () => {
      return { 
        status: "Query Service Online", 
        documentation: "/api/v1/traces" 
      };
    });

    app.register(traceRoutes, { prefix: "/api/v1/traces" });

    const port = Number(process.env.PORT) || 4002;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Query service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
