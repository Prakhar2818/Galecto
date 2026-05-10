import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { routes } from "./routes";
import { requestContextMiddleware } from "./middleware/requestContext";
import { loggingMiddleware, responseLoggingMiddleware } from "./middleware/logger";
import { authRoutes } from "./routes/auth.routes";
import { errorHandler } from "./middleware/error.middleware";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, { origin: "*" });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "secret",
  });

  app.addHook("onRequest", requestContextMiddleware);
  app.addHook("preHandler", loggingMiddleware);
  app.addHook("onResponse", responseLoggingMiddleware);
  app.setErrorHandler(errorHandler);

  app.get("/", async () => {
    return { status: "API Gateway Online", api: "/api/v1" };
  });

  app.register(routes);
  app.register(authRoutes)

  return app;
}
